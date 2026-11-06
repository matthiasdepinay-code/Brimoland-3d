# Livraison V1 des assets du Jardin : le contrôle

Reçue le 6 novembre 2026, en trois archives (`Bromland_Assets_V1_partie_0X_sur_03.zip`). Elle contient 948 fichiers :
- 138 modèles, en `.blend`, `.fbx` et `.glb` ;
- 187 animations ;
- les textures : palette, visages, sols, glyphes, sceaux, effets, humeurs, interface et police.

Les modèles sont rangés dans `Art/Source`, `Art/Export` et `Art/Textures`. Le reste du pack est ici : sa notice (`LISEZMOI-du-pack.md`), sa galerie, son inventaire, ses rapports et ses aperçus Blender.

Le pack se présente lui-même comme une **première passe procédurale**, à valider et à retoucher artistiquement. Ce contrôle refait les mesures de façon indépendante. Ses outils sont dans le dépôt : `outils/assets/mesurer.js` et `outils/assets/apercu.js`.

## Les mesures, contre le cahier des charges

Chaque `.glb` a été chargé par three.js, et chaque `.fbx` lu dans son en-tête. Le détail est dans `mesures.json`.

| | Mesuré | Cahier |
| --- | --- | --- |
| L'apprenti(e) | 2,41 m, 5 892 triangles, 33 os, 23 animations | 2,40 m avec le chapeau, 6 000 à 9 000 triangles, une trentaine d'os |
| Gribouille (×5 tenues) | 1,71 m, 3 592 à 4 270 triangles, 19 os, 14 animations | 1,70 m, 3 000 à 5 000 triangles, une vingtaine d'os |
| Giga Gribouille | 4,51 m × 3,78 m, 7 276 triangles, 4 animations | 4,50 m × 3,50 m, 6 000 à 8 000 triangles |
| Grum (×5 tenues) | 1,48 m (1,80 m pour le Cristallin, avec ses cristaux), 9 os, 10 animations | 1,45 m, une douzaine d'os |
| L'Ent-ronce | 4,95 m × 2,96 m, 3 564 triangles, 30 os, 9 animations | 5 m × 3 m, 8 000 à 12 000 triangles |
| L'Atelier | 8,15 × 7,58 m au sol avec le débord du toit, 9,01 m avec la cheminée | 7 × 6 m de murs, 9 m à la cheminée |

- **Les fondamentaux :**
  - tous les visages regardent vers l'avant (−Y dans Blender) ;
  - toutes les animations sont en interpolation « en escalier » (pose tenue), comme demandé ;
  - tous les budgets de triangles sont respectés (143 464 triangles en tout) ;
  - tous les noms ont leur préfixe (`SM_`, `SK_`, `A_`, `T_`), sans accent ni espace.
- **Les FBX (325) :** en centimètres (UnitScaleFactor 100), axe Z vers le haut. C'est ce qu'Unreal attend. Les 187 fichiers d'animation ne contiennent aucun maillage, seulement le squelette.

**12 remarques, toutes mineures :**

- Les arbres et les plantes s'enfoncent de 2 à 3 cm dans le sol ; c'est voulu, pour les racines. Le plancher de l'intérieur de l'Atelier est à −0,20 m (son épaisseur). Rien à corriger.
- `SM_Arbre_Feuillu_03` fait 7 m de large (cahier : 4 à 6 m).
- `SM_Puits` fait 2,27 m de large (cahier : 1,6 m) : le treuil dépasse-t-il ?
- `SM_Stele` fait 1,12 m de large (cahier : 0,8 m) : est-ce le socle ?
- `SK_Grum_Cristallin` fait 1,80 m avec ses cristaux : c'est normal.

## À l'encre, dans le Jardin

Les vrais modèles ont été posés dans le Jardin de la maquette, avec le rendu à l'encre. C'est le même rendu que le nœud d'Unreal, dont la fidélité est vérifiée par `outils/shaders/verifier.js`. Les vues sont dans `Encre/` :

| | |
| --- | --- |
| ![](Encre/1-le-trio.jpg) | ![](Encre/6-de-pres.jpg) |
| ![](Encre/2-le-jardin.jpg) | ![](Encre/3-le-gardien.jpg) |
| ![](Encre/4-la-nuit.jpg) | ![](Encre/5-les-tenues.jpg) |

Les modèles prennent très bien l'encre. Les silhouettes sont franches et les contours tombent sur les bonnes arêtes. Les trois tons et les hachures se placent dans les ombres, et la palette est respectée.

## Les retouches

**Techniques (petites, rien de bloquant) :**

1. **Ce qui luit n'est pas marqué émissif dans les fichiers** : les braises du feu de camp, l'étoile de la baguette, les yeux de l'Ent-ronce, les runes (Grum, le coffre scellé, la stèle, le grimoire, l'enseigne), les cristaux du Cristallin, les vitres (de l'Atelier et des lanternes). Seuls les yeux de Grum le sont. Dans Unreal, la lueur viendra du matériau ou du pochoir + 128 : il suffit de garder ces noms de matériaux.
2. **L'assemblage de l'Atelier** : la porte a sa position (dans les notes de l'inventaire), mais pas les vitres ni l'enseigne. Il faudrait des points `SOCKET_Vitre_01`, `SOCKET_Vitre_02` et `SOCKET_Enseigne` dans `SM_Atelier`.

**Artistiques (à juger à l'œil, en regardant les planches) :**

3. **Gribouille** : son corps est un œuf droit ; la fiche le voulait penché en avant. Sa petite bouche ne se voit pas sur les captures. Sa queue en volute est à vérifier de profil.
4. **L'Ent-ronce** marche sur trois racines ; la fiche en demandait quatre. Il a de la marge en triangles (3 564 sur 8 000 à 12 000) pour plus de ronces et de nœuds.
5. **Grum** est un tonneau de pierres plutôt qu'un dôme. Ça marche bien tel quel.

**Ce qui reste à faire, comme le dit le pack :** l'import dans Unreal, les matériaux, les collisions en jeu, les déformations dans toutes les poses, le branchement des formes clés (paupières, gonflement, gorge) et la validation artistique.
