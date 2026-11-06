# -*- coding: utf-8 -*-
"""Tout Brimoland en une commande : l'import des assets, le Jardin d'essai, le rendu à l'encre.

Dans l'éditeur : Output Log, choisir « Python » à gauche du champ, puis taper :   import brimo_tout; brimo_tout.lancer()
(ou : Tools → Execute Python Script → Unreal/Brimoland/Content/Python/brimo_tout.py)
"""
import importlib

import brimo_plan, brimo_outils, brimo_encre, brimo_import, brimo_jardin


def lancer():
    for m in (brimo_plan, brimo_outils, brimo_encre, brimo_import, brimo_jardin):
        importlib.reload(m)     # pour qu'une version corrigée des scripts serve sans redémarrer l'éditeur
    brimo_import.tout()
    brimo_jardin.monter()


if __name__ == '__main__':
    lancer()
