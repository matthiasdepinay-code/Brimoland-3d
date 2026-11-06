# -*- coding: utf-8 -*-
"""Le Jardin d'essai : un niveau neuf, /Game/Brimo/Cartes/L_Jardin_Essai, monté avec les assets importés.

  - le blockout du terrain et l'implantation proposés par la livraison (Art/Export/Terrain) ;
  - l'apprenti(e), Gribouille et Grum devant l'Atelier, qui jouent leur animation d'attente ;
  - une quarantaine d'arbres, des rochers, des buissons, de l'herbe et des fleurs, posés sur la carte de hauteur ;
  - le soleil, une lumière de ciel faible, un départ de joueur ;
  - le pochoir de chaque objet (l'épaisseur du trait, RECETTE.md §7) ;
  - le rendu à l'encre (brimo_encre.monter).

À lancer après brimo_import.tout(). Dans l'éditeur : Output Log → Python → import brimo_jardin; brimo_jardin.monter()
On peut le relancer : les acteurs qu'il avait posés (étiquette « BrimoJardin ») sont retirés, puis reposés.
"""
import math

import unreal

import brimo_encre
import brimo_plan
from brimo_outils import acteurs, charger, dire, avertir, depot, etiquetes, ouvrir_carte, poser, sauver_carte

CARTE = brimo_plan.CONTENU + '/Cartes/L_Jardin_Essai'
ETIQUETTE = 'BrimoJardin'   # chaque acteur posé par ce script porte cette étiquette
ATTENTE = {'SK_Apprenti': 'A_Apprenti_Attente', 'SK_Gribouille': 'A_Grib_Attente', 'SK_Grum': 'A_Grum_Attente', 'SK_EntRonce': 'A_EntRonce_Attente', 'SK_Mannequin': None}


def _composant(acteur):
    for classe in (unreal.SkeletalMeshComponent, unreal.StaticMeshComponent):
        c = acteur.get_component_by_class(classe)
        if c:
            return c
    return None


def monter():
    if not ouvrir_carte(CARTE):
        vieux = etiquetes(ETIQUETTE)
        if vieux:
            acteurs().destroy_actors(vieux)
        dire('le niveau %s existait : %d acteurs du montage précédent retirés, on remonte' % (CARTE, len(vieux)))
    # la lumière : un soleil bas, assez de ciel pour déboucher les ombres, pas plus
    soleil = poser(unreal.DirectionalLight, unreal.Vector(0, 0, 3000), unreal.Rotator(roll=0, pitch=-42, yaw=-35), ETIQUETTE)
    if not soleil:
        raise RuntimeError('impossible de poser un acteur dans %s : le niveau est-il ouvert ?' % CARTE)
    soleil.set_actor_label('Soleil')
    ciel = poser(unreal.SkyLight, unreal.Vector(0, 0, 3000), etiquette=ETIQUETTE)
    ciel.get_component_by_class(unreal.SkyLightComponent).set_editor_property('intensity', 0.35)
    poser(unreal.SkyAtmosphere, unreal.Vector(0, 0, 0), etiquette=ETIQUETTE)
    # les assets
    manquants, n = set(), 0
    for p in brimo_plan.jardin(depot()):
        chemin = brimo_plan.destination(p['famille']) + '/' + p['nom']
        asset = charger(chemin)
        if not asset:
            manquants.add(p['nom'])
            continue
        x, y, z = brimo_plan.vers_unreal(p['x'], p['y'], p['z'])
        a = poser(asset, unreal.Vector(x, y, z), unreal.Rotator(roll=0, pitch=0, yaw=-p['yaw']), ETIQUETTE)
        if not a:
            manquants.add(p['nom'])
            continue
        c = _composant(a)
        if c and p['pochoir']:
            c.set_editor_property('render_custom_depth', True)
            c.set_editor_property('custom_depth_stencil_value', p['pochoir'])
        anim = ATTENTE.get(p['nom'])
        if anim and isinstance(c, unreal.SkeletalMeshComponent):
            seq = charger(brimo_plan.destination(p['famille']) + '/Animations/' + anim)
            if seq:
                c.override_animation_data(seq, True, True, 0.0, 1.0)
        n += 1
    # le joueur arrive sur le chemin, face à l'Atelier
    x, y, z = brimo_plan.vers_unreal(0, -14, 1.2)
    poser(unreal.PlayerStart, unreal.Vector(x, y, z), unreal.Rotator(roll=0, pitch=0, yaw=-90), ETIQUETTE)
    dire('%d assets posés dans %s' % (n, CARTE))
    if manquants:
        avertir('absents (pas encore importés ?) : ' + ', '.join(sorted(manquants)))
    brimo_encre.monter()
    sauver_carte()
    dire('le Jardin d\'essai est prêt : appuie sur Play, ou promène-toi dans la vue.')


if __name__ == '__main__':
    monter()
