# Les gabarits (C1)

Les formes de la maquette de la DA, à la bonne échelle (1 unité = 1 m) et aux bonnes couleurs.
Ce ne sont pas des modèles : des **blocs de référence**, pour modéliser par-dessus.

**Dans Blender** : Fichier → Importer → glTF 2.0, puis choisir le fichier. Ils arrivent debout sur le sol, tournés vers −Y
(la vue de face, pavé 1), comme le veut le cahier des charges. `Gabarit_Ensemble.glb` les range côte à côte pour comparer les tailles.

| Gabarit | Hauteur | Largeur (X) | Profondeur (Y dans Blender) |
| --- | --- | --- | --- |
| Apprenti | 2.4 m | 1.24 m | 1.16 m |
| Gribouille | 1.7 m | 1.24 m | 1.21 m |
| Grum | 1.45 m | 1.48 m | 0.77 m |
| Atelier | 8.11 m | 8.36 m | 8.32 m |
| Arbre Feuillu | 6.51 m | 4.47 m | 4.27 m |
| Sapin | 7.19 m | 4.71 m | 4.71 m |
| Rocher | 2.21 m | 3.02 m | 3.06 m |

Les matériaux portent le code de leur couleur (`M_4A6B3A` : le vert mousse de la cape) : ce sont celles du cahier des charges.

Régénérer : `cd maquette && node gabarits/exporter.js`.
