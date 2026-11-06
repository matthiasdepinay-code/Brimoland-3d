# -*- coding: utf-8 -*-
"""Tout Brimoland en une commande : l'import des assets, le Jardin d'essai, le rendu à l'encre.

Dans l'éditeur : Output Log, choisir « Python » à gauche du champ, puis taper :   import brimo_tout; brimo_tout.lancer()
(ou : Tools → Execute Python Script → Unreal/Brimoland/Content/Python/brimo_tout.py)
Sans fenêtre :   UnrealEditor-Cmd.exe <Brimoland.uproject> -run=pythonscript -script=brimo_tout.py   (outils/unreal/j1.ps1 le fait)

Pour remonter le Jardin et l'encre sans refaire l'import (un quart d'heure) : brimo_tout.lancer(importer=False),
ou, sans fenêtre, la variable d'environnement BRIMO_SANS_IMPORT=1 (ou l'argument --sans-import).
"""
import importlib
import os
import sys
import traceback

import unreal

import brimo_plan, brimo_outils, brimo_encre, brimo_import, brimo_jardin


def lancer(importer=True):
    for m in (brimo_plan, brimo_outils, brimo_encre, brimo_import, brimo_jardin):
        importlib.reload(m)     # pour qu'une version corrigée des scripts serve sans redémarrer l'éditeur
    brimo_outils.essai_magie()  # le module C++ répond-il ? (LogBrimo : brimo.essai...)
    etape = 'import'
    try:
        if importer:
            brimo_import.tout()
        else:
            brimo_outils.dire("import sauté : on garde les assets déjà importés dans " + brimo_plan.CONTENU)
        etape = 'Jardin et encre'
        brimo_jardin.monter()
    except Exception:
        unreal.log_error('[Brimo] ÉCHEC pendant : %s\n%s' % (etape, traceback.format_exc()))
        raise
    brimo_outils.dire('J1 : tout est monté (%s, Jardin, encre).' % ('import' if importer else 'sans import'))


if __name__ == '__main__':
    lancer(importer=not (os.environ.get('BRIMO_SANS_IMPORT') == '1' or '--sans-import' in sys.argv))
