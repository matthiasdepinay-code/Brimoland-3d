# -*- coding: utf-8 -*-
"""L'import des assets du Jardin (Art/Export, Art/Textures) dans /Game/Brimo, en une fois.

  1. les textures : la palette (filtrage au plus proche), les visages, les sols ;
  2. les matériaux : M_Palette (Default Lit, sans reflet), M_Visage (masqué), et leurs instances :
     MI_Palette, MI_Palette_Luit (ce qui luit : braises, vitres, runes...), MI_Visage_Apprenti, MI_Visage_Grib, MI_Grum_Yeux ;
  3. les maillages fixes (SM_), avec leurs collisions UCX_ et leurs points SOCKET_ ; les pièces mobiles restent à part ;
  4. les personnages et les bêtes (SK_), puis les tenues sur le squelette du personnage de base ;
  5. les animations (A_), une fois par squelette (les copies par tenue sont inutiles) ;
  6. chaque matériau livré est remplacé par l'instance qui lui correspond (brimo_plan.instance_pour).

Dans l'éditeur : Output Log → Python → import brimo_import; brimo_import.tout()
Compte un bon quart d'heure. Le bilan s'affiche à la fin dans l'Output Log (lignes [Brimo]).
"""
import os

import unreal

import brimo_plan
from brimo_outils import AT, EAL, MEL, charger, creer, dire, avertir, importer, importeur_fbx_classique, sauver, depot, fichier_present

TEXTURES = brimo_plan.CONTENU + '/Textures'
MATERIAUX = brimo_plan.CONTENU + '/Materiaux'


# ---------- 1. les textures ----------
def textures():
    for t in brimo_plan.textures(depot()):
        importer(t['fichier'], TEXTURES, t['nom'])
        a = charger(TEXTURES + '/' + t['nom'])
        if not a:
            avertir('texture non importée : ' + t['nom'])
            continue
        a.set_editor_property('srgb', t['srgb'])
        if t['au_plus_proche']:
            a.set_editor_property('filter', unreal.TextureFilter.TF_NEAREST)        # une case de la palette = une couleur nette
            a.set_editor_property('mip_gen_settings', unreal.TextureMipGenSettings.TMGS_NO_MIPMAPS)
            a.set_editor_property('compression_settings', unreal.TextureCompressionSettings.TC_EDITOR_ICON)
        sauver(a)
    dire('textures importées dans ' + TEXTURES)


# ---------- 2. les matériaux ----------
def _parametre_texture(mat, nom, tex, x, y):
    n = MEL.create_material_expression(mat, unreal.MaterialExpressionTextureSampleParameter2D, x, y)
    n.set_editor_property('parameter_name', nom)
    n.set_editor_property('texture', tex)
    return n

def _base(nom, masque):
    """Un matériau Default Lit sans reflet : couleur de la texture, Specular 0, Roughness 1, et une lueur réglable (Emissive = couleur × Lueur)."""
    mat = creer(nom, MATERIAUX, unreal.Material, unreal.MaterialFactoryNew())
    MEL.delete_all_material_expressions(mat)
    mat.set_editor_property('two_sided', True)
    if masque:
        mat.set_editor_property('blend_mode', unreal.BlendMode.BLEND_MASKED)
    tex = charger(TEXTURES + ('/T_Apprenti_Visage' if masque else '/T_Palette'))
    couleur = _parametre_texture(mat, 'Couleur', tex, -700, 0)
    MEL.connect_material_property(couleur, 'RGB', unreal.MaterialProperty.MP_BASE_COLOR)
    if masque:
        MEL.connect_material_property(couleur, 'A', unreal.MaterialProperty.MP_OPACITY_MASK)
    for prop, v, y in ((unreal.MaterialProperty.MP_SPECULAR, 0.0, 200), (unreal.MaterialProperty.MP_ROUGHNESS, 1.0, 300)):
        c = MEL.create_material_expression(mat, unreal.MaterialExpressionConstant, -300, y)
        c.set_editor_property('r', v)
        MEL.connect_material_property(c, '', prop)
    lueur = MEL.create_material_expression(mat, unreal.MaterialExpressionScalarParameter, -500, 420)
    lueur.set_editor_property('parameter_name', 'Lueur')
    lueur.set_editor_property('default_value', 0.0)
    mul = MEL.create_material_expression(mat, unreal.MaterialExpressionMultiply, -300, 420)
    MEL.connect_material_expressions(couleur, 'RGB', mul, 'A')
    MEL.connect_material_expressions(lueur, '', mul, 'B')
    MEL.connect_material_property(mul, '', unreal.MaterialProperty.MP_EMISSIVE_COLOR)
    MEL.recompile_material(mat)
    sauver(mat)
    return mat

def _instance(nom, parent, texture=None, lueur=0.0):
    mi = creer(nom, MATERIAUX, unreal.MaterialInstanceConstant, unreal.MaterialInstanceConstantFactoryNew())
    MEL.set_material_instance_parent(mi, parent)
    if texture:
        MEL.set_material_instance_texture_parameter_value(mi, 'Couleur', charger(TEXTURES + '/' + texture))
    MEL.set_material_instance_scalar_parameter_value(mi, 'Lueur', lueur)
    sauver(mi)
    return mi

def materiaux():
    palette, visage = _base('M_Palette', False), _base('M_Visage', True)
    instances = {
        'MI_Palette': _instance('MI_Palette', palette),
        'MI_Palette_Luit': _instance('MI_Palette_Luit', palette, lueur=3.0),
        'MI_Visage_Apprenti': _instance('MI_Visage_Apprenti', visage, 'T_Apprenti_Visage'),
        'MI_Visage_Grib': _instance('MI_Visage_Grib', visage, 'T_Grib_Visage'),
        'MI_Grum_Yeux': _instance('MI_Grum_Yeux', visage, 'T_Grum_Yeux', lueur=2.0),
    }
    dire('matériaux créés dans ' + MATERIAUX)
    return instances


# ---------- 3 à 5. les maillages, les squelettes, les animations ----------
def _options(genre, squelette=None, fusionner=True):
    o = unreal.FbxImportUI()
    o.set_editor_property('automated_import_should_detect_type', False)
    o.set_editor_property('import_materials', False)
    o.set_editor_property('import_textures', False)
    if genre == 'fixe':
        o.set_editor_property('mesh_type_to_import', unreal.FBXImportType.FBXIT_STATIC_MESH)
        o.set_editor_property('import_mesh', True)
        o.set_editor_property('import_animations', False)
        sm = o.get_editor_property('static_mesh_import_data')
        sm.set_editor_property('combine_meshes', fusionner)
        sm.set_editor_property('auto_generate_collision', False)     # les collisions UCX_ sont fournies
        sm.set_editor_property('generate_lightmap_u_vs', True)
    elif genre == 'squelette':
        o.set_editor_property('mesh_type_to_import', unreal.FBXImportType.FBXIT_SKELETAL_MESH)
        o.set_editor_property('import_as_skeletal', True)
        o.set_editor_property('import_mesh', True)
        o.set_editor_property('import_animations', False)
        o.set_editor_property('create_physics_asset', True)
        if squelette:
            o.set_editor_property('skeleton', squelette)
        o.get_editor_property('skeletal_mesh_import_data').set_editor_property('import_morph_targets', True)
    elif genre == 'animation':
        o.set_editor_property('mesh_type_to_import', unreal.FBXImportType.FBXIT_ANIMATION)
        o.set_editor_property('import_as_skeletal', True)
        o.set_editor_property('import_mesh', False)
        o.set_editor_property('import_animations', True)
        o.set_editor_property('skeleton', squelette)
        o.get_editor_property('anim_sequence_import_data').set_editor_property('animation_length', unreal.FBXAnimationLengthImportType.FBXALIT_EXPORTED_TIME)
    return o

def _squelette_de(nom_sk, famille):
    """Le squelette créé à l'import de SK_<Nom> : /Game/Brimo/<Famille>/SK_<Nom>_Skeleton."""
    return charger(brimo_plan.destination(famille) + '/' + nom_sk + '_Skeleton')

def _remplacer_materiaux(chemin, instances, nom_asset):
    a = charger(chemin)
    if isinstance(a, unreal.StaticMesh):
        for i, m in enumerate(a.get_editor_property('static_materials')):
            a.set_material(i, instances[brimo_plan.instance_pour(str(m.get_editor_property('material_slot_name')), nom_asset)])
        sauver(a)
    elif isinstance(a, unreal.SkeletalMesh):
        nouveaux = []
        for m in a.get_editor_property('materials'):
            slot = m.get_editor_property('material_slot_name')
            nouveaux.append(unreal.SkeletalMaterial(material_interface=instances[brimo_plan.instance_pour(str(slot), nom_asset)], material_slot_name=slot))
        a.set_editor_property('materials', nouveaux)
        sauver(a)

def maillages(instances):
    plan = brimo_plan.inventaire(depot())
    importeur_fbx_classique()
    bilan = {'fixes': 0, 'squelettes': 0, 'tenues': 0, 'animations': 0, 'echecs': []}
    familles = {}
    for p in plan['fixes']:
        if not fichier_present(p['fichier']):
            continue
        crees = importer(p['fichier'], p['destination'], options=_options('fixe', fusionner=not brimo_plan.pieces_mobiles(p['fichier'])))
        if not crees:
            bilan['echecs'].append(p['nom'])
            continue
        for c in crees:
            _remplacer_materiaux(c, instances, p['nom'])
        bilan['fixes'] += 1
    for cle in ('squelettes', 'tenues'):
        for p in plan[cle]:
            familles[p['nom']] = p['famille']
            sq = _squelette_de(p['squelette_de'], familles.get(p['squelette_de'], p['famille'])) if p['squelette_de'] else None
            crees = importer(p['fichier'], p['destination'], options=_options('squelette', squelette=sq))
            if not crees:
                bilan['echecs'].append(p['nom'])
                continue
            for c in crees:
                _remplacer_materiaux(c, instances, p['nom'])
            bilan[cle] += 1
    for p in plan['animations']:
        sq = _squelette_de(p['squelette_de'], familles.get(p['squelette_de'], p['famille']))
        if not sq:
            bilan['echecs'].append(p['nom'] + ' (pas de squelette ' + p['squelette_de'] + ')')
            continue
        if importer(p['fichier'], p['destination'], options=_options('animation', squelette=sq)):
            bilan['animations'] += 1
        else:
            bilan['echecs'].append(p['nom'])
    dire('importés : %(fixes)d maillages fixes, %(squelettes)d personnages et bêtes, %(tenues)d tenues, %(animations)d animations' % bilan)
    dire('%d copies d\'animations par tenue laissées de côté (le squelette est partagé)' % len(plan['ignorees']))
    if bilan['echecs']:
        avertir('%d échecs : %s' % (len(bilan['echecs']), ', '.join(bilan['echecs'][:30])))
    return bilan


def tout():
    textures()
    instances = materiaux()
    return maillages(instances)


if __name__ == '__main__':
    tout()
