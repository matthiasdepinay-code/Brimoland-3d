# -*- coding: utf-8 -*-
"""Teste les scripts Python de l'éditeur (Unreal/Brimoland/Content/Python) hors d'Unreal.

  1. le plan (brimo_plan), sur les vrais fichiers du dépôt : ce qui sera importé, sur quels squelettes, où ce sera posé,
     et les entrées du nœud d'encre, comparées à celles qu'utilise Unreal/Rendu/BrimoEncre.hlsl ;
  2. les scripts eux-mêmes (brimo_import, brimo_jardin, brimo_encre, brimo_tout), déroulés jusqu'au bout contre un faux
     module « unreal » : cela attrape les erreurs de Python (une variable mal nommée, un appel oublié), pas celles de l'API
     d'Unreal, qui ne se vérifient que dans l'éditeur.

    python3 outils/unreal/tester_scripts.py
"""
import os
import re
import sys
import types

ICI = os.path.dirname(os.path.abspath(__file__))
DEPOT = os.path.abspath(os.path.join(ICI, '..', '..'))
SCRIPTS = os.path.join(DEPOT, 'Unreal', 'Brimoland', 'Content', 'Python')
sys.path.insert(0, SCRIPTS)
echecs = []

def attendre(ok, quoi):
    print(('  ok   ' if ok else '  ÉCHEC ') + quoi)
    if not ok:
        echecs.append(quoi)

# ---------- 1. le plan ----------
import brimo_plan as P
print('le plan')
plan = P.inventaire(DEPOT)
n_fbx = sum(len([f for f in os.listdir(os.path.join(DEPOT, 'Art', 'Export', fam)) if f.endswith('.fbx')]) for fam in P.FAMILLES)
total = sum(len(plan[k]) for k in ('fixes', 'squelettes', 'tenues', 'animations', 'ignorees'))
attendre(total == n_fbx, '%d FBX dans Art/Export, tous classés (%d)' % (n_fbx, total))
bases = {p['nom'] for p in plan['squelettes']}
attendre(bases == set(P.ANIMATIONS.values()), 'les %d personnages et bêtes de base : %s' % (len(bases), ', '.join(sorted(bases))))
attendre(all(p['squelette_de'] in bases for p in plan['tenues']) and len(plan['tenues']) == 9, '9 tenues, chacune sur le squelette de son personnage')
attendre(all(p['squelette_de'] in bases for p in plan['animations']), '%d animations, toutes sur un squelette importé' % len(plan['animations']))
attendre(all(P.COPIE_DE_TENUE.search(n) for n in plan['ignorees']), '%d copies d\'animations par tenue laissées de côté' % len(plan['ignorees']))
par_sq = {}
for a in plan['animations']:
    par_sq[a['squelette_de']] = par_sq.get(a['squelette_de'], 0) + 1
attendre(par_sq.get('SK_Apprenti') == 23 and par_sq.get('SK_Gribouille') == 14 and par_sq.get('SK_Grum') == 10, 'apprenti(e) 23, Gribouille 14, Grum 10 animations')
tex = P.textures(DEPOT)
attendre({'T_Palette', 'T_Apprenti_Visage', 'T_Grib_Visage', 'T_Grum_Yeux'} <= {t['nom'] for t in tex}, '%d textures, dont la palette et les visages' % len(tex))
mobiles = [p['nom'] for p in plan['fixes'] if P.pieces_mobiles(p['fichier'])]
attendre(len(mobiles) > 0, 'pièces mobiles gardées à part dans : ' + ', '.join(mobiles))
attendre(P.instance_pour('Braise_e8842a') == 'MI_Palette_Luit' and P.instance_pour('Pierre_a8977a') == 'MI_Palette'
         and P.instance_pour('Visage_Atlas.001', 'SK_Gribouille') == 'MI_Visage_Grib' and P.instance_pour('Visage_Atlas', 'SK_Apprenti') == 'MI_Visage_Apprenti'
         and P.instance_pour('Yeux_Atlas.003') == 'MI_Grum_Yeux' and P.instance_pour('Feuillage_5f8f3e') == 'MI_Palette', 'chaque matériau livré trouve son instance')
carte = P.CarteHauteur(os.path.join(DEPOT, 'Art', 'Export', 'Terrain', 'Jardin_253.r16'))
attendre(abs(carte.hauteur(0, 0)) < 0.05, 'la carte de hauteur : 0 m sous l\'Atelier')
j = P.jardin(DEPOT)
noms = {p['nom'] for p in plan['fixes'] + plan['squelettes'] + plan['tenues']}
absents = sorted({p['nom'] for p in j} - noms)
attendre(not absents, '%d placements dans le Jardin, tous sur des assets importés%s' % (len(j), (' — absents : ' + ', '.join(absents)) if absents else ''))
attendre(all(abs(p['x']) <= 125 and abs(p['y']) <= 125 for p in j), 'tout le Jardin tient sur le terrain de 250 m')
attendre(P.pochoir('Personnages', 'SK_Apprenti') == 21 and P.pochoir('Nature', 'SM_Herbe_01') == 1 and P.pochoir('Terrain', 'SM_Jardin_Blockout') == 8, 'les pochoirs de la recette')
# les entrées du nœud d'encre : exactement celles que le code lit
code = open(os.path.join(DEPOT, 'Unreal', 'Rendu', 'BrimoEncre.hlsl'), encoding='utf-8').read()
fin = code[code.index('FBrimoEncre E;'):]
lues = set(re.findall(r'\b([A-Z][A-Za-z]+)\b', fin)) - {'FBrimoEncre', 'E', 'View', 'Parameters', 'GetDefaultSceneTextureUV', 'BRIMO_SCENE', 'PapierSampler', 'Rendre', 'SvPosition', 'BufferSizeAndInvSize', 'ViewSizeAndInvSize'}
declarees = {n for n, g, _ in P.ENTREES_ENCRE if g != 'amorce'}
attendre(lues == declarees, 'les entrées du nœud d\'encre = celles que lit BrimoEncre.hlsl (%d)' % len(declarees) + ('' if lues == declarees else ' — écart : %s / %s' % (sorted(lues - declarees), sorted(declarees - lues))))

# ---------- 2. les scripts, contre un faux Unreal ----------
print('les scripts, contre un faux module « unreal »')
appels = []

class _Meta(type):
    def __getattr__(cls, nom):
        def appel(*a, **k):       # une fonction de classe (unreal.SystemLibrary.execute_console_command...) : on note son nom et ses textes
            appels.append(nom)
            appels.extend(x for x in a if isinstance(x, str))
            return Faux()
        return appel

class Faux(metaclass=_Meta):
    def __init__(self, *a, **k):
        pass
    def __getattr__(self, nom):
        def appel(*a, **k):
            appels.append(nom)
            return Faux()
        return appel
    def __call__(self, *a, **k):
        return Faux()
    def __iter__(self):
        return iter([])
    def __bool__(self):
        return True
    def __str__(self):
        return 'faux'

faux = types.ModuleType('unreal')
_classes = {}
monde = {'carte_existe': True, 'sans_level_editor': False}   # le Jardin existe-t-il déjà ? LevelEditorSubsystem manque-t-il (ligne de commande) ?

class EditorAssetLibrary(Faux):
    @staticmethod
    def does_asset_exist(chemin):
        return monde['carte_existe'] if chemin.endswith('/Cartes/L_Jardin_Essai') else True

def _attribut(nom):
    if nom == 'EditorAssetLibrary':
        return EditorAssetLibrary
    if nom == 'LevelEditorSubsystem' and monde['sans_level_editor']:
        raise AttributeError(nom)
    if nom == 'Paths':
        return types.SimpleNamespace(project_dir=lambda: os.path.join(DEPOT, 'Unreal', 'Brimoland') + os.sep, convert_relative_path_to_full=lambda p: p)
    if nom in ('log', 'log_warning', 'log_error'):
        return lambda t: appels.append(t)
    if nom[0].isupper():
        return _classes.setdefault(nom, type(nom, (Faux,), {}))
    return lambda *a, **k: Faux()
faux.__getattr__ = _attribut
sys.modules['unreal'] = faux
try:
    import brimo_tout
    brimo_tout.lancer()
    attendre(True, 'brimo_tout.lancer() se déroule jusqu\'au bout (import, Jardin, encre)')
except Exception as e:
    import traceback
    traceback.print_exc()
    attendre(False, 'brimo_tout.lancer() : %s: %s' % (type(e).__name__, e))
attendre(any('rendu à l\'encre est monté' in str(a) for a in appels), 'le rendu à l\'encre est monté à la fin')
attendre(any('assets posés' in str(a) for a in appels), 'le Jardin est posé')
attendre('brimo.essai' in appels, 'la magie du module C++ est essayée d\'abord (brimo.essai)')
attendre('load_level' in appels and any('J1 : tout est monté (import, Jardin, encre)' in str(a) for a in appels), 'le Jardin existant est rouvert, et le bilan final est écrit')

# la relance, comme en ligne de commande (UnrealEditor-Cmd -run=pythonscript) : sans import, sans LevelEditorSubsystem, niveau neuf
del appels[:]
monde.update(carte_existe=False, sans_level_editor=True)
try:
    brimo_tout.lancer(importer=False)
    attendre(True, 'brimo_tout.lancer(importer=False) se déroule jusqu\'au bout, sans LevelEditorSubsystem')
except Exception as e:
    import traceback
    traceback.print_exc()
    attendre(False, 'brimo_tout.lancer(importer=False) : %s: %s' % (type(e).__name__, e))
attendre(not any('importés :' in str(a) for a in appels) and any('import sauté' in str(a) for a in appels), 'l\'import est bien sauté')
attendre('new_blank_map' in appels and 'save_map' in appels and 'save_current_level' in appels and 'load_level' not in appels,
         'le niveau neuf passe par EditorLoadingAndSavingUtils (créé, enregistré)')

print('\n%s' % ('tout est bon' if not echecs else '%d ÉCHEC(S)' % len(echecs)))
sys.exit(1 if echecs else 0)
