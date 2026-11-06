# -*- coding: utf-8 -*-
"""Le plan de montage de Brimoland dans Unreal : quoi importer, où, sur quel squelette, et où le poser.

Ce module n'utilise PAS Unreal (pas de « import unreal ») : il ne fait que lire le dépôt (Art/Export, Art/Textures,
la carte de hauteur du Jardin) et décider. Les scripts brimo_import.py, brimo_jardin.py et brimo_encre.py exécutent
ce plan dans l'éditeur. Il est testé hors d'Unreal par outils/unreal/tester_plan.py (et la CI).
"""
import math
import os
import random
import re
import struct

# ---------- les chemins ----------
def racine_depot(dossier_projet):
    """Le projet est dans Unreal/Brimoland/ : la racine du dépôt est deux dossiers plus haut."""
    return os.path.abspath(os.path.join(dossier_projet, '..', '..'))

FAMILLES = ('Personnages', 'Batiments', 'Objets', 'Nature', 'Betes', 'Terrain')
CONTENU = '/Game/Brimo'

def destination(famille):
    return CONTENU + '/' + famille

# ---------- les squelettes partagés et les animations ----------
# les tenues ont exactement le même squelette que le personnage de base (vérifié sur la livraison V1) :
# un seul squelette par famille, et un seul jeu d'animations
SQUELETTE_PARTAGE = {
    'SK_Gribouille_Alchimiste': 'SK_Gribouille', 'SK_Gribouille_Arcaniste': 'SK_Gribouille',
    'SK_Gribouille_Ceruleen': 'SK_Gribouille', 'SK_Gribouille_Explorateur': 'SK_Gribouille',
    'SK_Grum_Cristallin': 'SK_Grum', 'SK_Grum_Forestier': 'SK_Grum', 'SK_Grum_Forgeron': 'SK_Grum', 'SK_Grum_Runique': 'SK_Grum',
    'SK_Corbeau_Maitre': 'SK_Corbeau',
}
# le préfixe d'une animation (A_<Prefixe>_<Clip>) et le personnage dont elle anime le squelette
ANIMATIONS = {
    'Apprenti': 'SK_Apprenti', 'Giga': 'SK_GigaGribouille', 'Grib': 'SK_Gribouille', 'Grum': 'SK_Grum',
    'EntRonce': 'SK_EntRonce', 'Limace': 'SK_Limace', 'Grenouille': 'SK_Grenouille', 'Corbeau': 'SK_Corbeau',
    'Poisson': 'SK_Poisson', 'Mannequin': 'SK_Mannequin',
}
# une animation recopiée pour une tenue (A_Grib_Attente_Gribouille_Alchimiste) : inutile avec le squelette partagé
# (le clip, puis le personnage et la tenue : A_<Prefixe>_<Clip>_<Personnage>_<Tenue>)
COPIE_DE_TENUE = re.compile(r'^A_[A-Za-z]+_[A-Za-z]+_(Gribouille|Grum|Corbeau)_[A-Z][A-Za-z]+$')

def _fbx(dossier):
    return sorted(f[:-4] for f in os.listdir(dossier) if f.endswith('.fbx')) if os.path.isdir(dossier) else []

def inventaire(depot):
    """Ce qu'il faut importer, dans l'ordre : les maillages fixes, les squelettes de base, les tenues, les animations."""
    export = os.path.join(depot, 'Art', 'Export')
    plan = {'fixes': [], 'squelettes': [], 'tenues': [], 'animations': [], 'ignorees': []}
    for fam in FAMILLES:
        d = os.path.join(export, fam)
        for nom in _fbx(d):
            fichier = os.path.join(d, nom + '.fbx')
            if nom.startswith('SM_'):
                plan['fixes'].append({'nom': nom, 'fichier': fichier, 'famille': fam, 'destination': destination(fam)})
            elif nom.startswith('SK_'):
                cle = 'tenues' if nom in SQUELETTE_PARTAGE else 'squelettes'
                plan[cle].append({'nom': nom, 'fichier': fichier, 'famille': fam, 'destination': destination(fam), 'squelette_de': SQUELETTE_PARTAGE.get(nom)})
            elif nom.startswith('A_'):
                m = re.match(r'A_([A-Za-z]+)_', nom)
                if COPIE_DE_TENUE.search(nom) or not m or m.group(1) not in ANIMATIONS:
                    plan['ignorees'].append(nom)
                    continue
                plan['animations'].append({'nom': nom, 'fichier': fichier, 'famille': fam, 'destination': destination(fam) + '/Animations', 'squelette_de': ANIMATIONS[m.group(1)]})
    return plan

# ---------- les textures ----------
def textures(depot):
    t = os.path.join(depot, 'Art', 'Textures')
    liste = [
        {'nom': 'T_Palette', 'fichier': os.path.join(t, 'T_Palette.png'), 'srgb': True, 'au_plus_proche': True},
        {'nom': 'T_Apprenti_Visage', 'fichier': os.path.join(t, 'T_Apprenti_Visage.png'), 'srgb': True, 'au_plus_proche': False},
        {'nom': 'T_Grib_Visage', 'fichier': os.path.join(t, 'T_Grib_Visage.png'), 'srgb': True, 'au_plus_proche': False},
        {'nom': 'T_Grum_Yeux', 'fichier': os.path.join(t, 'T_Grum_Yeux.png'), 'srgb': True, 'au_plus_proche': False},
    ]
    for f in sorted(os.listdir(t)) if os.path.isdir(t) else []:
        if f.startswith('T_Sol_') and f.endswith('.png'):
            liste.append({'nom': f[:-4], 'fichier': os.path.join(t, f), 'srgb': 'Masque' not in f, 'au_plus_proche': False})
    return [x for x in liste if os.path.exists(x['fichier'])]

# ---------- les matériaux : de quelle instance chaque matériau livré prend la place ----------
LUIT = re.compile(r'braise|flamme|vitre|pointe|yeux|lueur|rune|cristaux', re.I)

def instance_pour(nom_materiau, nom_asset=''):
    """Le nom de l'instance de matériau Unreal qui remplace un matériau livré (« Pierre_a8977a », « Visage_Atlas »...)."""
    n = nom_materiau or ''
    if re.search(r'visage', n, re.I):
        return 'MI_Visage_Grib' if 'Grib' in nom_asset else 'MI_Visage_Apprenti'
    if re.search(r'yeux_atlas', n, re.I):
        return 'MI_Grum_Yeux'
    if LUIT.search(n):
        return 'MI_Palette_Luit'
    return 'MI_Palette'

def pieces_mobiles(fichier):
    """Le FBX a-t-il des pièces mobiles à garder à part (un couvercle, un manche : « _Mobile_01 ») ? Alors on ne fusionne pas."""
    with open(fichier, 'rb') as f:
        return b'_Mobile_' in f.read()

# ---------- le pochoir : l'épaisseur du trait par objet (Unreal/Rendu/RECETTE.md, §7) ----------
def pochoir(famille, nom):
    if re.search(r'Herbe|Fleur', nom):
        return 1                     # pas de trait
    if famille == 'Terrain':
        return 8                     # 0,35
    if famille in ('Personnages', 'Betes') or nom in ('SK_Mannequin',):
        return 21                    # 1,0
    if nom.startswith('SM_Atelier'):
        return 19                    # 0,9
    if re.search(r'Rocher|Pierre', nom):
        return 15                    # 0,7
    return 17                        # 0,8 : arbres, buissons, objets

# ---------- le Jardin d'essai ----------
class CarteHauteur:
    """La carte de hauteur du blockout (Art/Export/Terrain/Jardin_253.r16) : hauteur en mètres en (x, y) Blender."""
    def __init__(self, fichier, resolution=253, etendue=250.0):
        b = open(fichier, 'rb').read()
        self.n, self.etendue = resolution, etendue
        self.v = struct.unpack('<%dH' % (resolution * resolution), b[:resolution * resolution * 2])

    def hauteur(self, x, y):
        n = self.n
        fx = (x + self.etendue / 2) / self.etendue * (n - 1)
        fy = (y + self.etendue / 2) / self.etendue * (n - 1)
        fx, fy = min(max(fx, 0.0), n - 1.001), min(max(fy, 0.0), n - 1.001)
        i, j = int(fx), int(fy)
        u, w = fx - i, fy - j
        h = lambda a, b: (self.v[b * n + a] - 32768) / 128.0
        return (h(i, j) * (1 - u) + h(i + 1, j) * u) * (1 - w) + (h(i, j + 1) * (1 - u) + h(i + 1, j + 1) * u) * w

# les noms courts de l'implantation proposée par la livraison -> le nom du maillage
def nom_asset(court, famille):
    prefixe = 'SK_' if famille in ('Betes',) or court in ('Mannequin',) else 'SM_'
    return prefixe + court

def jardin(depot, graine=7):
    """Les placements du Jardin d'essai : [{'nom', 'famille', 'x', 'y', 'z', 'yaw', 'pochoir'}], en mètres, repère de Blender.
    Le blockout et l'implantation proposés par la livraison, le trio devant l'Atelier, des arbres, des rochers, de l'herbe."""
    import json
    terrain = os.path.join(depot, 'Art', 'Export', 'Terrain')
    carte = CarteHauteur(os.path.join(terrain, 'Jardin_253.r16'))
    poses = [{'nom': 'SM_Jardin_Blockout', 'famille': 'Terrain', 'x': 0, 'y': 0, 'z': 0, 'yaw': 0}]
    for p in json.load(open(os.path.join(terrain, 'Implantation_Proposee.json'), encoding='utf-8')):
        x, y, z = p['position_m']
        poses.append({'nom': nom_asset(p['asset'], p['famille']), 'famille': p['famille'], 'x': x, 'y': y, 'z': z, 'yaw': 0})
    # le trio, devant la porte (la façade regarde vers -Y), tourné vers le chemin
    for nom, x, y in (('SK_Apprenti', 0.0, -6.0), ('SK_Gribouille', 1.6, -5.4), ('SK_Grum', -1.6, -5.2)):
        poses.append({'nom': nom, 'famille': 'Personnages', 'x': x, 'y': y, 'z': carte.hauteur(x, y), 'yaw': 0})
    # la nature, semée loin du chemin (x proche de 0, de y = 0 à -60), de l'Atelier et de la mare
    rnd = random.Random(graine)
    mare = (18.0, -23.0, 7.5)
    def libre(x, y, marge):
        if (x - mare[0]) ** 2 + (y - mare[1]) ** 2 < (mare[2] + marge) ** 2:
            return False
        if x * x + y * y < (9 + marge) ** 2:
            return False
        if abs(x) < 6 + marge and -70 < y < 2:
            return False
        return True
    def semer(noms, n, r_min, r_max, marge, famille='Nature'):
        k = essais = 0
        while k < n and essais < n * 60:
            essais += 1
            a, r = rnd.random() * 6.2832, r_min + rnd.random() * (r_max - r_min)
            x, y = math.cos(a) * r, math.sin(a) * r - 25
            if not libre(x, y, marge) or abs(x) > 115 or abs(y) > 115:
                continue
            poses.append({'nom': noms[k % len(noms)], 'famille': famille, 'x': round(x, 2), 'y': round(y, 2), 'z': round(carte.hauteur(x, y), 3), 'yaw': round(rnd.random() * 360, 1)})
            k += 1
    semer(['SM_Arbre_Feuillu_01', 'SM_Arbre_Feuillu_02', 'SM_Sapin_01', 'SM_Arbre_Feuillu_03', 'SM_Sapin_02'], 40, 18, 75, 3)
    semer(['SM_Rocher_01', 'SM_Rocher_03', 'SM_Rocher_05', 'SM_Rocher_Fissure', 'SM_Rocher_02'], 16, 10, 60, 1.5)
    semer(['SM_Buisson_01', 'SM_Buisson_02', 'SM_Buisson_03', 'SM_Souche', 'SM_Champignon_01'], 24, 8, 45, 1)
    semer(['SM_Herbe_01', 'SM_Herbe_02', 'SM_Herbe_03', 'SM_Fleur_01', 'SM_Fleur_02', 'SM_Fleur_03', 'SM_Fleur_04'], 140, 6, 40, 0.2)
    for p in poses:
        p['pochoir'] = pochoir(p['famille'], p['nom'])
    return poses

def vers_unreal(x, y, z):
    """Un point du repère de Blender (mètres) dans celui d'Unreal (centimètres) : l'import FBX inverse l'axe Y."""
    return (x * 100.0, -y * 100.0, z * 100.0)

# ---------- le nœud d'encre : ses entrées, dans l'ordre de la recette ----------
ENTREES_ENCRE = [
    # (nom, genre, valeur de départ) ; genre : 'uv', 'temps', 'papier', 'scalaire', 'vecteur', 'nuit', 'amorce'
    ('UVv', 'uv', None), ('Temps', 'temps', None), ('Papier', 'papier', None),
    ('Mode', 'scalaire', 0.0), ('PleinSoleil', 'scalaire', 1.0), ('Ambiance', 'scalaire', 0.1), ('SeuilLueur', 'scalaire', 1.25),
    ('Traits', 'scalaire', 1.0), ('HachuresOn', 'scalaire', 1.0), ('PapierOn', 'scalaire', 1.0), ('TrembleOn', 'scalaire', 1.0),
    ('Nuit', 'nuit', None), ('Brume', 'scalaire', 95.0), ('CielLoin', 'scalaire', 2000.0), ('SortieLineaire', 'scalaire', 0.0),
    ('Dessin', 'scalaire', 0.65),
    ('CouleurPapier', 'vecteur', (0.937, 0.890, 0.769)), ('CouleurEncre', 'vecteur', (0.122, 0.102, 0.086)),
    ('CouleurCiel', 'vecteur', (0.541, 0.561, 0.690)), ('CouleurSoleil', 'vecteur', (1.0, 1.0, 1.0)),
    ('Amorce', 'amorce', None),
]
# les six images de la scène que le code lit : des nœuds SceneTexture les demandent, sommés dans « Amorce »
AMORCE = ['PostProcessInput0', 'SceneDepth', 'BaseColor', 'WorldNormal', 'CustomDepth', 'CustomStencil']
