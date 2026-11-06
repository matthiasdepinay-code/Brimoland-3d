# -*- coding: utf-8 -*-
"""Le rendu à l'encre, monté automatiquement : ce script fait les étapes 2 à 5 de Unreal/Rendu/RECETTE.md.

  - /Game/Brimo/Rendu/T_Papier      le papier raccordé (sRGB coupé, Wrap, sans compression qui bave)
  - /Game/Brimo/Rendu/MPC_Brimo     la collection de paramètres (Nuit)
  - /Game/Brimo/Rendu/M_Encre       le matériau de post-process : le nœud Custom (Unreal/Rendu/BrimoEncre.hlsl), ses entrées, l'amorce
  - /Game/Brimo/Rendu/MI_Encre      son instance, qu'on règle sans recompiler
  - un Post Process Volume infini dans le niveau ouvert, avec MI_Encre, l'exposition manuelle, sans bloom ni vignettage

Dans l'éditeur : Output Log → Python → import brimo_encre; brimo_encre.monter()
(ou : Tools → Execute Python Script → ce fichier). On peut le relancer : il refait le matériau et ne double pas le volume.
"""
import os

import unreal

import brimo_plan
from brimo_outils import AT, EAL, MEL, charger, creer, dire, avertir, importer, sauver, depot, poser

DOSSIER = brimo_plan.CONTENU + '/Rendu'
ETIQUETTE = 'BrimoEncre'   # le Post Process Volume posé par ce script porte cette étiquette


def papier():
    f = os.path.join(depot(), 'Art', 'Textures', 'T_Papier.png')
    importer(f, DOSSIER, 'T_Papier')
    t = charger(DOSSIER + '/T_Papier')
    t.set_editor_property('srgb', False)                                              # les couleurs telles qu'on les lit
    t.set_editor_property('compression_settings', unreal.TextureCompressionSettings.TC_EDITOR_ICON)  # UserInterface2D (RGBA)
    t.set_editor_property('address_x', unreal.TextureAddress.TA_WRAP)
    t.set_editor_property('address_y', unreal.TextureAddress.TA_WRAP)
    sauver(t)
    return t


def collection():
    mpc = creer('MPC_Brimo', DOSSIER, unreal.MaterialParameterCollection, unreal.MaterialParameterCollectionFactoryNew())
    p = unreal.CollectionScalarParameter()
    p.set_editor_property('parameter_name', 'Nuit')
    p.set_editor_property('default_value', 0.0)
    mpc.set_editor_property('scalar_parameters', [p])
    sauver(mpc)
    return mpc


def materiau(tex, mpc):
    code = open(os.path.join(depot(), 'Unreal', 'Rendu', 'BrimoEncre.hlsl'), encoding='utf-8').read()
    mat = creer('M_Encre', DOSSIER, unreal.Material, unreal.MaterialFactoryNew())
    MEL.delete_all_material_expressions(mat)
    mat.set_editor_property('material_domain', unreal.MaterialDomain.MD_POST_PROCESS)
    mat.set_editor_property('blendable_location', unreal.BlendableLocation.BL_REPLACING_TONEMAPPER)

    noeud = MEL.create_material_expression(mat, unreal.MaterialExpressionCustom, 0, 0)
    noeud.set_editor_property('code', code)
    noeud.set_editor_property('description', 'BrimoEncre')
    noeud.set_editor_property('output_type', unreal.CustomMaterialOutputType.CMOT_FLOAT3)
    entrees = []
    for nom, _, _ in brimo_plan.ENTREES_ENCRE:
        e = unreal.CustomInput()
        e.set_editor_property('input_name', nom)
        entrees.append(e)
    noeud.set_editor_property('inputs', entrees)

    y = -900
    def ici():
        nonlocal y
        y += 90
        return y
    for nom, genre, valeur in brimo_plan.ENTREES_ENCRE:
        if genre == 'uv':
            n = MEL.create_material_expression(mat, unreal.MaterialExpressionScreenPosition, -600, ici())
            MEL.connect_material_expressions(n, 'ViewportUV', noeud, nom)
        elif genre == 'temps':
            n = MEL.create_material_expression(mat, unreal.MaterialExpressionTime, -600, ici())
            MEL.connect_material_expressions(n, '', noeud, nom)
        elif genre == 'papier':
            n = MEL.create_material_expression(mat, unreal.MaterialExpressionTextureObjectParameter, -600, ici())
            n.set_editor_property('parameter_name', 'Papier')
            n.set_editor_property('texture', tex)
            MEL.connect_material_expressions(n, '', noeud, nom)
        elif genre == 'scalaire':
            n = MEL.create_material_expression(mat, unreal.MaterialExpressionScalarParameter, -600, ici())
            n.set_editor_property('parameter_name', nom)
            n.set_editor_property('default_value', valeur)
            MEL.connect_material_expressions(n, '', noeud, nom)
        elif genre == 'vecteur':
            n = MEL.create_material_expression(mat, unreal.MaterialExpressionVectorParameter, -600, ici())
            n.set_editor_property('parameter_name', nom)
            n.set_editor_property('default_value', unreal.LinearColor(valeur[0], valeur[1], valeur[2], 1.0))  # tels quels : pas de conversion sRGB
            MEL.connect_material_expressions(n, '', noeud, nom)
        elif genre == 'nuit':
            n = MEL.create_material_expression(mat, unreal.MaterialExpressionCollectionParameter, -600, ici())
            n.set_editor_property('collection', mpc)
            n.set_editor_property('parameter_name', 'Nuit')
            MEL.connect_material_expressions(n, '', noeud, nom)
        elif genre == 'amorce':
            # six nœuds SceneTexture, sommés : le code ne lit pas cette entrée, elle fait seulement fournir les six images
            somme = None
            for k, ident in enumerate(brimo_plan.AMORCE):
                st = MEL.create_material_expression(mat, unreal.MaterialExpressionSceneTexture, -900, ici())
                st.set_editor_property('scene_texture_id', getattr(unreal.SceneTextureId, 'PPI_' + _snake(ident)))
                if somme is None:
                    somme = st
                    continue
                add = MEL.create_material_expression(mat, unreal.MaterialExpressionAdd, -750, y)
                MEL.connect_material_expressions(somme, 'Color' if k == 1 else '', add, 'A')
                MEL.connect_material_expressions(st, 'Color', add, 'B')
                somme = add
            MEL.connect_material_expressions(somme, '', noeud, nom)
    MEL.connect_material_property(noeud, '', unreal.MaterialProperty.MP_EMISSIVE_COLOR)
    MEL.recompile_material(mat)
    sauver(mat)
    mi = creer('MI_Encre', DOSSIER, unreal.MaterialInstanceConstant, unreal.MaterialInstanceConstantFactoryNew())
    MEL.set_material_instance_parent(mi, mat)
    sauver(mi)
    return mat, mi


def _snake(ident):
    """« PostProcessInput0 » -> « POST_PROCESS_INPUT0 » : le nom de l'énumération SceneTextureId en Python."""
    out = ''
    for i, c in enumerate(ident):
        if c.isupper() and i and not ident[i - 1].isupper():
            out += '_'
        out += c.upper()
    return out


def volume(mi):
    """Un Post Process Volume infini avec MI_Encre ; s'il a déjà été posé par ce script, on le réutilise."""
    sub = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
    v = None
    for a in sub.get_all_level_actors():
        if isinstance(a, unreal.PostProcessVolume) and ETIQUETTE in [str(t) for t in a.tags]:
            v = a
    if v is None:
        v = poser(unreal.PostProcessVolume, unreal.Vector(0, 0, 0))
        v.set_editor_property('tags', [unreal.Name(ETIQUETTE)])
        v.set_actor_label('PPV_Encre')
    v.set_editor_property('unbound', True)
    s = v.get_editor_property('settings')
    s.set_editor_property('weighted_blendables', unreal.WeightedBlendables(array=[unreal.WeightedBlendable(weight=1.0, object=mi)]))
    for prop, val in (('auto_exposure_method', unreal.AutoExposureMethod.AEM_MANUAL), ('auto_exposure_bias', 0.0),
                      ('bloom_intensity', 0.0), ('vignette_intensity', 0.0)):
        try:
            s.set_editor_property('override_' + prop, True)
            s.set_editor_property(prop, val)
        except Exception as e:  # un nom de réglage changé d'une version à l'autre : on le dit, on continue
            avertir('réglage %s : %s' % (prop, e))
    v.set_editor_property('settings', s)
    return v


def monter():
    tex = papier()
    mpc = collection()
    mat, mi = materiau(tex, mpc)
    volume(mi)
    dire('le rendu à l\'encre est monté : %s, et un Post Process Volume « PPV_Encre » dans le niveau.' % mi.get_path_name())
    dire('à régler maintenant : RECETTE.md §6 (SortieLineaire, puis PleinSoleil et Ambiance avec Mode = 1).')
    return mi


if __name__ == '__main__':
    monter()
