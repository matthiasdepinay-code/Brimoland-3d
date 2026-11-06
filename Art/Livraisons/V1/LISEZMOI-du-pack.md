# Brimoland / Bromland — Assets du Jardin, V1

Première passe 3D créée le 6 novembre 2026 à partir du cahier des charges fourni, des gabarits C1, des planches C4 et de la palette originale du dépôt Brimoland-3d.

## Ouvrir le pack

- `Galerie.html` : vues d'ensemble et inventaire filtrable.
- `Scenes_Apercu.blend` : scènes de présentation ; choisir Personnages, Atelier, Kit_Nature, Objets, Mobilier, Tenues ou Betes dans la liste des scènes.
- `Art/Source/` : 138 fichiers Blender éditables, classés par famille.
- `Art/Export/` : 138 modèles FBX et GLB, plus 187 fichiers FBX d'animation avec squelette seul.
- `Art/Textures/` : palette, visages, sols, 117 glyphes, 3 sceaux, 11 planches d'effets, 7 humeurs, 6 composants d'interface, police IM Fell English et licence.
- `Art/Reference/` : gabarits et planches d'origine, conservés pour comparaison.

Les sources sont enregistrées avec Blender 5.2.1, disponible sur ce PC. Les images utilisées par chaque modèle sont incorporées au fichier Blender. Les FBX disposent aussi de leurs images dans les sous-dossiers `.fbm`. Les GLB incorporent les images.

## Contenu et niveau de finition

138 modèles et variantes : 35 personnages, 21 batiments, 34 objets, 38 nature, 8 betes, 2 terrain.

- A1, A1a, A1b : apprenti, 33 os, 23 clips dont attente, marche et les trois phases du tracé.
- A1c : six chapeaux, six coiffures, quatre écharpes et cinq objets tenus.
- A2/A2b, A4/A4b : Gribouille et Grum, chacun en cinq tenues, avec leurs animations ; chapeau de Gribouille et mousse de Grum également exportés séparément.
- A3, A5–A9 : Giga Gribouille, limace, grenouille, deux corbeaux, poisson, Ent-ronce et projectiles.
- B1–B6 : extérieur et intérieur de l'Atelier, porte, enseigne, vitre, table, chaudron, miroir et mobilier.
- O1–O14 : objets interactifs, variantes, fioles, plantes et morceaux cassés.
- N1–N12 : kit nature, nuages et île volante.
- T1 : relief et chemin en blockout de 250 × 250 m, heightmap 253 × 253, valeurs d'import et implantation proposée.
- T2 : cinq couches de sol en PNG 512 × 512 et masque commun raccordé.
- T3 : surface et matériau de prévisualisation de la mare.

Les modèles, le skinning et les animations constituent une première passe procédurale à valider et à retoucher artistiquement. L'intérieur, les trophées et le perchoir restent volontairement au stade de blockout. Les accessoires sont des pièces de montage ; certaines ont donc leur origine au point d'attache, et non au sol. La graine et le puits ont une vigne/plante à part.

Les glyphes, sceaux, humeurs, yeux de Grum et bouches de Gribouille ont été exportés depuis le code 2D du dépôt. Les sceaux C6 sont trois compositions proposées avec ce moteur de dessin ; l'enseigne et la stèle des modèles portent encore une gravure géométrique de travail. Les effets C7 ont été adaptés du module FX, avec des compléments dessinés ; les composants C9 sont une proposition d'interface.

## Import et montage

1. Importer les FBX depuis `Art/Export/`, puis les textures utiles.
2. Les parties statiques principales portent le nom `SM_<Asset>` dans le FBX. Les collisions simples portent le préfixe `UCX_` correspondant.
3. Les pièces mobiles d'un même objet sont séparées et gardent leur pivot : fichiers de porte séparés, couvercles et manches de levier nommés `_Mobile_01` dans les FBX concernés. Les états fermé/ouvert/scellé sont aussi fournis séparément. Assembler ces pièces dans le Blueprint de l'objet.
4. Un squelette `Armature` par personnage, sans os de feuille ajoutés. Importer les animations `A_*.fbx` sur le squelette correspondant. Les tenues partagent la structure du personnage ; leur retargeting/partage de squelette reste à contrôler dans Unreal.
5. Le corps de l'apprenti est réglé autour de 1,60 m, pour environ 2,40 m avec le chapeau. Les sources regardent vers −Y dans Blender. Vérifier la rotation du composant dans le Blueprint selon les conventions du projet.
6. Les couleurs utilisent les UV de la palette originale à 137 cases. Les visages ont un atlas à part : apprenti 4 × 2 cases, Gribouille 4 × 4 (15 utilisées), Grum 4 × 2. Déplacer les UV vers la case choisie ou piloter ce décalage dans le matériau du jeu. Les formes clés de paupière/gonflement/gorge sont disponibles dans les sources et exports concernés ; leur pilotage reste à brancher.
7. Animations à 24 images/s avec poses toutes les deux images et interpolation constante dans Blender. Les GLB utilisent l'interpolation STEP. Conserver le rendu saccadé voulu dans les réglages de lecture Unreal, sans interpolation supplémentaire.
8. Les effets sont des planches de 8 × 8 cases de 128 px, à 12 images/s : lire de gauche à droite, puis de haut en bas. Paramètres dans `Art/Textures/Effets/Flipbooks.json`.

Les noms `SOCKET_...` repèrent les points d'attache dans les sources/exports. Le montage des sockets du squelette et des effets dans Unreal n'est pas automatisé.

## Contrôles effectués

- 138 sources rouvertes et vérifiées : UV, poids normalisés, squelette et géométrie présente.
- Les plafonds de triangles renseignés sont respectés. Les budgets sont des plafonds, pas une raison d'ajouter des polygones : plusieurs modèles sont en dessous de la plage indicative.
- 138 modèles FBX réimportés dans Blender, plus cinq clips prioritaires de l'apprenti ; échelle et squelettes contrôlés.
- Les GLB ont été vérifiés pour ne contenir que l'asset attendu et pour conserver les animations par clip.
- Sept vues d'ensemble rendues et inspectées. Les aperçus utilisent un éclairage et des contours Blender ; le post-traitement d'encre Unreal du dépôt n'est pas appliqué.

L'import dans Unreal, les collisions en jeu, les déformations dans toutes les poses et la validation artistique finale restent à faire. Les matériaux UE, les reflets du miroir, le rendu de rive, les systèmes de nage/flottabilité, les réactions à la magie, la destruction, le terrain volumétrique et les Blueprints de gameplay ne sont pas créés par ce pack de modèles. Aucun fichier `.uasset` n'est fourni.

Les inventaires et rapports JSON détaillent les fichiers et les vérifications. Le dépôt d'origine n'a reçu aucun commit ni push.
