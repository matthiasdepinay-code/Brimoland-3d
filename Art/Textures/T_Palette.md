# T_Palette (C2)

L'atlas de palette : **137 couleurs**, une case de 16 × 16 px chacune, sur une image de 256 × 256.
Ce sont les couleurs du cahier des charges, famille par famille. Les cases grises au bout sont libres.

**Dans Blender** : un seul matériau (`MI_Palette` dans Unreal) avec `T_Palette.png` en couleur de base, **interpolation « Closest »**.
Pour peindre une zone : sélectionne ses faces, dans l'éditeur UV réduis-les à un point (échelle 0) et pose-le au centre de sa case.
Les UV ci-dessous sont celles du centre de chaque case (V compté du bas, comme dans Blender).

| Case | Couleur | U | V | Usage |
| --- | --- | --- | --- | --- |
| | **Encre et papier** | | | |
| 0 (col. 0, lig. 0) | `#1f1a16` | 0.03125 | 0.96875 | encre |
| 1 (col. 1, lig. 0) | `#efe3c4` | 0.09375 | 0.96875 | papier |
| 2 (col. 2, lig. 0) | `#6b4f2a` | 0.15625 | 0.96875 | sépia ; Apprenti(e) : cheveux : châtain |
| 3 (col. 3, lig. 0) | `#f4efe6` | 0.21875 | 0.96875 | blanc des yeux |
| | **Apprenti(e) : peaux** | | | |
| 4 (col. 4, lig. 0) | `#f3dcc0` | 0.28125 | 0.96875 | peau 1 |
| 5 (col. 5, lig. 0) | `#e8c39e` | 0.34375 | 0.96875 | peau 2 |
| 6 (col. 6, lig. 0) | `#c99a6e` | 0.40625 | 0.96875 | peau 3 |
| 7 (col. 7, lig. 0) | `#9c6b45` | 0.46875 | 0.96875 | peau 4 |
| 8 (col. 8, lig. 0) | `#6e4a30` | 0.53125 | 0.96875 | peau 5 |
| | **Apprenti(e) : cheveux** | | | |
| 9 (col. 9, lig. 0) | `#2a2521` | 0.59375 | 0.96875 | noir ; Apprenti(e) : étoffes : charbon |
| 10 (col. 10, lig. 0) | `#a3782e` | 0.65625 | 0.96875 | noisette ; Apprenti(e) : étoffes : ocre |
| 11 (col. 11, lig. 0) | `#d8b060` | 0.71875 | 0.96875 | blond |
| 12 (col. 12, lig. 0) | `#9a4a3a` | 0.78125 | 0.96875 | roux ; Apprenti(e) : étoffes : brique |
| 13 (col. 13, lig. 0) | `#e8e0d0` | 0.84375 | 0.96875 | blanc |
| 14 (col. 14, lig. 0) | `#5a6b8a` | 0.90625 | 0.96875 | bleu |
| 15 (col. 15, lig. 0) | `#c45a8a` | 0.96875 | 0.96875 | rose |
| | **Apprenti(e) : étoffes** | | | |
| 16 (col. 0, lig. 1) | `#6b3f73` | 0.03125 | 0.90625 | prune |
| 17 (col. 1, lig. 1) | `#2f4a7a` | 0.09375 | 0.90625 | nuit |
| 18 (col. 2, lig. 1) | `#4a6b3a` | 0.15625 | 0.90625 | vert mousse (cape par défaut) |
| 19 (col. 3, lig. 1) | `#3f7a7a` | 0.21875 | 0.90625 | sarcelle |
| 20 (col. 4, lig. 1) | `#c4a35a` | 0.28125 | 0.90625 | moutarde |
| 21 (col. 5, lig. 1) | `#8a3a5a` | 0.34375 | 0.90625 | framboise |
| 22 (col. 6, lig. 1) | `#e8dcc0` | 0.40625 | 0.90625 | lin |
| | **Apprenti(e) : écharpes, ceinture, baguette** | | | |
| 23 (col. 7, lig. 1) | `#9a3a2a` | 0.46875 | 0.90625 | écharpe rouge |
| 24 (col. 8, lig. 1) | `#3a5a8a` | 0.53125 | 0.90625 | écharpe bleue |
| 25 (col. 9, lig. 1) | `#8d6a3c` | 0.59375 | 0.90625 | ceinture, bois clair |
| 26 (col. 10, lig. 1) | `#7a5634` | 0.65625 | 0.90625 | baguette, tronc |
| 27 (col. 11, lig. 1) | `#f0d070` | 0.71875 | 0.90625 | étoile de la baguette, flamme |
| | **Gribouille** | | | |
| 28 (col. 12, lig. 1) | `#1f1a22` | 0.78125 | 0.90625 | corps |
| 29 (col. 13, lig. 1) | `#3d3348` | 0.84375 | 0.90625 | reflet du corps |
| 30 (col. 14, lig. 1) | `#a8307e` | 0.90625 | 0.90625 | chapeau classique |
| 31 (col. 15, lig. 1) | `#6e1d55` | 0.96875 | 0.90625 | ombre du chapeau |
| 32 (col. 0, lig. 2) | `#4e1440` | 0.03125 | 0.84375 | dessous du bord |
| 33 (col. 1, lig. 2) | `#e8d4a8` | 0.09375 | 0.84375 | pièces cousues |
| 34 (col. 2, lig. 2) | `#e8d8b0` | 0.15625 | 0.84375 | étiquette |
| 35 (col. 3, lig. 2) | `#6b3a2a` | 0.21875 | 0.84375 | le G |
| 36 (col. 4, lig. 2) | `#2c4290` | 0.28125 | 0.84375 | arcaniste : chapeau |
| 37 (col. 5, lig. 2) | `#1b2a60` | 0.34375 | 0.84375 | arcaniste : ombre |
| 38 (col. 6, lig. 2) | `#131d44` | 0.40625 | 0.84375 | arcaniste : dessous |
| 39 (col. 7, lig. 2) | `#e8c858` | 0.46875 | 0.84375 | arcaniste : étoiles |
| 40 (col. 8, lig. 2) | `#d8b040` | 0.53125 | 0.84375 | arcaniste : bande |
| 41 (col. 9, lig. 2) | `#9a6230` | 0.59375 | 0.84375 | alchimiste : chapeau |
| 42 (col. 10, lig. 2) | `#6a4020` | 0.65625 | 0.84375 | alchimiste : ombre |
| 43 (col. 11, lig. 2) | `#4a2c16` | 0.71875 | 0.84375 | alchimiste : dessous |
| 44 (col. 12, lig. 2) | `#d8843a` | 0.78125 | 0.84375 | alchimiste : pièces |
| 45 (col. 13, lig. 2) | `#6ac46a` | 0.84375 | 0.84375 | alchimiste : fiole |
| 46 (col. 14, lig. 2) | `#a8d8e8` | 0.90625 | 0.84375 | alchimiste : verres des lunettes |
| 47 (col. 15, lig. 2) | `#7a5a20` | 0.96875 | 0.84375 | alchimiste : monture |
| 48 (col. 0, lig. 3) | `#66733e` | 0.03125 | 0.78125 | explorateur : chapeau |
| 49 (col. 1, lig. 3) | `#454f28` | 0.09375 | 0.78125 | explorateur : ombre |
| 50 (col. 2, lig. 3) | `#30381a` | 0.15625 | 0.78125 | explorateur : dessous |
| 51 (col. 3, lig. 3) | `#b8502a` | 0.21875 | 0.78125 | explorateur : plume |
| 52 (col. 4, lig. 3) | `#8a5a2a` | 0.28125 | 0.78125 | explorateur : sac |
| 53 (col. 5, lig. 3) | `#2f7fc0` | 0.34375 | 0.78125 | céruléen : corps |
| 54 (col. 6, lig. 3) | `#8fd0f4` | 0.40625 | 0.78125 | céruléen : reflet |
| 55 (col. 7, lig. 3) | `#7ccfee` | 0.46875 | 0.78125 | céruléen : chapeau |
| 56 (col. 8, lig. 3) | `#3f97c8` | 0.53125 | 0.78125 | céruléen : ombre |
| 57 (col. 9, lig. 3) | `#2a6f9e` | 0.59375 | 0.78125 | céruléen : dessous |
| 58 (col. 10, lig. 3) | `#ffffff` | 0.65625 | 0.78125 | céruléen : étoiles |
| 59 (col. 11, lig. 3) | `#9fe0ff` | 0.71875 | 0.78125 | céruléen : lueur |
| 60 (col. 12, lig. 3) | `#8ec8ec` | 0.78125 | 0.78125 | goutte de sueur |
| | **Giga Gribouille** | | | |
| 61 (col. 13, lig. 3) | `#2a1838` | 0.84375 | 0.78125 | corps |
| 62 (col. 14, lig. 3) | `#6a2c98` | 0.90625 | 0.78125 | reflets |
| 63 (col. 15, lig. 3) | `#9a40d0` | 0.96875 | 0.78125 | lueur |
| 64 (col. 0, lig. 4) | `#fff6ff` | 0.03125 | 0.71875 | œil |
| | **Grum** | | | |
| 65 (col. 1, lig. 4) | `#c8925a` | 0.09375 | 0.71875 | pierre |
| 66 (col. 2, lig. 4) | `#9a6a3a` | 0.15625 | 0.71875 | ombre de la pierre |
| 67 (col. 3, lig. 4) | `#6e4a2a` | 0.21875 | 0.71875 | joints |
| 68 (col. 4, lig. 4) | `#b8c43a` | 0.28125 | 0.71875 | mousse |
| 69 (col. 5, lig. 4) | `#7d8a24` | 0.34375 | 0.71875 | dessous de la mousse |
| 70 (col. 6, lig. 4) | `#ffd23a` | 0.40625 | 0.71875 | yeux |
| 71 (col. 7, lig. 4) | `#f4ead0` | 0.46875 | 0.71875 | rune |
| 72 (col. 8, lig. 4) | `#2a1e14` | 0.53125 | 0.71875 | visière |
| 73 (col. 9, lig. 4) | `#93a0ad` | 0.59375 | 0.71875 | runique : pierre |
| 74 (col. 10, lig. 4) | `#6b7682` | 0.65625 | 0.71875 | runique : ombre |
| 75 (col. 11, lig. 4) | `#4a525c` | 0.71875 | 0.71875 | runique : joints |
| 76 (col. 12, lig. 4) | `#5f7a5a` | 0.78125 | 0.71875 | runique : mousse |
| 77 (col. 13, lig. 4) | `#3f523c` | 0.84375 | 0.71875 | runique : dessous |
| 78 (col. 14, lig. 4) | `#7ae8f6` | 0.90625 | 0.71875 | runique : yeux et runes |
| 79 (col. 15, lig. 4) | `#74747c` | 0.96875 | 0.71875 | forgeron : pierre |
| 80 (col. 0, lig. 5) | `#55555c` | 0.03125 | 0.65625 | forgeron : ombre |
| 81 (col. 1, lig. 5) | `#38383e` | 0.09375 | 0.65625 | forgeron : joints |
| 82 (col. 2, lig. 5) | `#ffa040` | 0.15625 | 0.65625 | forgeron : yeux |
| 83 (col. 3, lig. 5) | `#ffc070` | 0.21875 | 0.65625 | forgeron : rune |
| 84 (col. 4, lig. 5) | `#4a4a52` | 0.28125 | 0.65625 | forgeron : cerclage |
| 85 (col. 5, lig. 5) | `#9a9aa4` | 0.34375 | 0.65625 | forgeron : rivets |
| 86 (col. 6, lig. 5) | `#5a5a62` | 0.40625 | 0.65625 | forgeron : casque |
| 87 (col. 7, lig. 5) | `#b08850` | 0.46875 | 0.65625 | forestier : pierre |
| 88 (col. 8, lig. 5) | `#86643a` | 0.53125 | 0.65625 | forestier : ombre |
| 89 (col. 9, lig. 5) | `#5e4426` | 0.59375 | 0.65625 | forestier : joints |
| 90 (col. 10, lig. 5) | `#6aa83a` | 0.65625 | 0.65625 | forestier : mousse |
| 91 (col. 11, lig. 5) | `#3f7a24` | 0.71875 | 0.65625 | forestier : dessous, lierre |
| 92 (col. 12, lig. 5) | `#ffe060` | 0.78125 | 0.65625 | forestier : yeux |
| 93 (col. 13, lig. 5) | `#e88ab0` | 0.84375 | 0.65625 | forestier : fleurs |
| 94 (col. 14, lig. 5) | `#f8e070` | 0.90625 | 0.65625 | cœur des fleurs |
| 95 (col. 15, lig. 5) | `#a8949e` | 0.96875 | 0.65625 | cristallin : pierre |
| 96 (col. 0, lig. 6) | `#7e6a76` | 0.03125 | 0.59375 | cristallin : ombre |
| 97 (col. 1, lig. 6) | `#5a4854` | 0.09375 | 0.59375 | cristallin : joints |
| 98 (col. 2, lig. 6) | `#f0d8ff` | 0.15625 | 0.59375 | cristallin : yeux |
| 99 (col. 3, lig. 6) | `#e8c8ff` | 0.21875 | 0.59375 | cristallin : rune |
| 100 (col. 4, lig. 6) | `#b48ae8` | 0.28125 | 0.59375 | cristallin : cristaux |
| | **Gâteau et pioche** | | | |
| 101 (col. 5, lig. 6) | `#f0d8a0` | 0.34375 | 0.59375 | génoise |
| 102 (col. 6, lig. 6) | `#f3b6c8` | 0.40625 | 0.59375 | glaçage |
| 103 (col. 7, lig. 6) | `#c0392b` | 0.46875 | 0.59375 | cerise, baies, champignon |
| 104 (col. 8, lig. 6) | `#7a5530` | 0.53125 | 0.59375 | manche de la pioche |
| 105 (col. 9, lig. 6) | `#8a8a92` | 0.59375 | 0.59375 | fer de la pioche |
| | **L'Atelier** | | | |
| 106 (col. 10, lig. 6) | `#d6c49a` | 0.65625 | 0.59375 | torchis |
| 107 (col. 11, lig. 6) | `#6b4a2a` | 0.71875 | 0.59375 | colombages, porte |
| 108 (col. 12, lig. 6) | `#f0c860` | 0.78125 | 0.59375 | vitres allumées |
| | **Objets** | | | |
| 109 (col. 13, lig. 6) | `#3b6fb6` | 0.84375 | 0.59375 | fiole d'eau |
| 110 (col. 14, lig. 6) | `#c45a5a` | 0.90625 | 0.59375 | potion de soin |
| 111 (col. 15, lig. 6) | `#3f9c9b` | 0.96875 | 0.59375 | élixir de saut |
| 112 (col. 0, lig. 7) | `#d9622b` | 0.03125 | 0.53125 | fiole de flamme |
| 113 (col. 1, lig. 7) | `#d8a63a` | 0.09375 | 0.53125 | potion de vision |
| 114 (col. 2, lig. 7) | `#d8a03a` | 0.15625 | 0.53125 | miel |
| 115 (col. 3, lig. 7) | `#e8842a` | 0.21875 | 0.53125 | feu |
| | **Nature** | | | |
| 116 (col. 4, lig. 7) | `#78a24a` | 0.28125 | 0.53125 | herbe, feuillage 4 |
| 117 (col. 5, lig. 7) | `#6a9a45` | 0.34375 | 0.53125 | herbe sombre, feuillage 2 |
| 118 (col. 6, lig. 7) | `#8fb05a` | 0.40625 | 0.53125 | herbe claire, mousse |
| 119 (col. 7, lig. 7) | `#5f8f3e` | 0.46875 | 0.53125 | feuillage 1 |
| 120 (col. 8, lig. 7) | `#4f7f35` | 0.53125 | 0.53125 | feuillage 3, sapin, vigne |
| 121 (col. 9, lig. 7) | `#a8977a` | 0.59375 | 0.53125 | pierre, rochers |
| 122 (col. 10, lig. 7) | `#d65a8a` | 0.65625 | 0.53125 | fleur rose |
| 123 (col. 11, lig. 7) | `#e8c040` | 0.71875 | 0.53125 | fleur jaune |
| 124 (col. 12, lig. 7) | `#b070e0` | 0.78125 | 0.53125 | fleur violette |
| 125 (col. 13, lig. 7) | `#f7f0de` | 0.84375 | 0.53125 | nuages |
| | **Terrain et eau** | | | |
| 126 (col. 14, lig. 7) | `#a3844f` | 0.90625 | 0.53125 | terre |
| 127 (col. 15, lig. 7) | `#b89a64` | 0.96875 | 0.53125 | chemin |
| 128 (col. 0, lig. 8) | `#d9c48a` | 0.03125 | 0.46875 | sable |
| 129 (col. 1, lig. 8) | `#9dbcd8` | 0.09375 | 0.46875 | eau de la mare |
| | **Bêtes et gardien** | | | |
| 130 (col. 2, lig. 8) | `#5c8f3e` | 0.15625 | 0.46875 | grenouille, couronne de l'Ent |
| 131 (col. 3, lig. 8) | `#8fb8d8` | 0.21875 | 0.46875 | poisson d'argent |
| 132 (col. 4, lig. 8) | `#5a4022` | 0.28125 | 0.46875 | Ent : tronc |
| 133 (col. 5, lig. 8) | `#3e2c1c` | 0.34375 | 0.46875 | Ent : tronc sombre |
| 134 (col. 6, lig. 8) | `#4a7a34` | 0.40625 | 0.46875 | Ent : feuilles sombres |
| 135 (col. 7, lig. 8) | `#9a2a2a` | 0.46875 | 0.46875 | Ent : baies |
| 136 (col. 8, lig. 8) | `#e0b050` | 0.53125 | 0.46875 | Ent : regard d'ambre |

Régénérer : `node outils/palette.js`.
