# -*- coding: utf-8 -*-
"""Les petits outils communs aux scripts de Brimoland dans l'éditeur Unreal (Python de l'éditeur, plugin Python Editor Script)."""
import os

import unreal

import brimo_plan

AT = unreal.AssetToolsHelpers.get_asset_tools()
EAL = unreal.EditorAssetLibrary
MEL = unreal.MaterialEditingLibrary


def dire(texte):
    unreal.log('[Brimo] ' + texte)


def avertir(texte):
    unreal.log_warning('[Brimo] ' + texte)


def depot():
    """La racine du dépôt Brimoland-3d (le projet est dans Unreal/Brimoland/)."""
    return brimo_plan.racine_depot(unreal.Paths.convert_relative_path_to_full(unreal.Paths.project_dir()))


def charger(chemin):
    return unreal.load_asset(chemin) if EAL.does_asset_exist(chemin) else None


def creer(nom, dossier, classe, fabrique):
    """Un asset neuf ; s'il existe déjà, on le garde (les scripts peuvent être relancés)."""
    existant = charger(dossier + '/' + nom)
    if existant:
        return existant
    return AT.create_asset(nom, dossier, classe, fabrique)


def importer(fichier, dossier, nom=None, options=None):
    """Importe un fichier (image, FBX) ; rend la liste des chemins créés."""
    t = unreal.AssetImportTask()
    t.set_editor_property('filename', fichier)
    t.set_editor_property('destination_path', dossier)
    if nom:
        t.set_editor_property('destination_name', nom)
    t.set_editor_property('automated', True)
    t.set_editor_property('save', True)
    t.set_editor_property('replace_existing', True)
    if options is not None:
        t.set_editor_property('options', options)
    AT.import_asset_tasks([t])
    return list(t.get_editor_property('imported_object_paths') or [])


def importeur_fbx_classique():
    """Les options d'import FBX (FbxImportUI) ne valent que pour l'importeur FBX classique : on coupe Interchange pour le FBX."""
    for cvar in ('Interchange.FeatureFlags.Import.FBX false', 'Interchange.FeatureFlags.Import.FBX.ToLevel false'):
        unreal.SystemLibrary.execute_console_command(None, cvar)


def sauver(*assets):
    for a in assets:
        if a:
            EAL.save_loaded_asset(a)


def acteurs():
    return unreal.get_editor_subsystem(unreal.EditorActorSubsystem)


def poser(classe_ou_asset, position, rotation=unreal.Rotator(0, 0, 0)):
    sub = acteurs()
    if isinstance(classe_ou_asset, unreal.Object) and not isinstance(classe_ou_asset, unreal.Class):
        return sub.spawn_actor_from_object(classe_ou_asset, position, rotation)
    return sub.spawn_actor_from_class(classe_ou_asset, position, rotation)


def fichier_present(f):
    if not os.path.exists(f):
        avertir('absent : ' + f)
        return False
    return True
