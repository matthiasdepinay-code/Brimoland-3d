# La maquette de la DA

Un petit Jardin en 3D, rendu à l'encre sur parchemin, pour juger le style **avant** Unreal (étape 0.4 du journal de bord).

**L'ouvrir** : `dist/maquette-da.html`, un seul fichier, à ouvrir dans un navigateur récent (Chrome, Firefox, Edge).

- ZQSD ou flèches : marcher · glisser : tourner la caméra · molette : approcher · clic ou E : tracer un sceau
- Les réglages, en bas à droite : **Encre** (rendu brut ou encre, pour comparer), **Contours**, **Hachures**, **Papier**, **Tremblement**, **12 images/s**, **Nuit**, **Visite** (la caméra tourne seule)

Captures : [`docs/captures/`](../docs/captures/).

## Ce qu'on y juge

| Ingrédient | Comment c'est fait ici | Ce qu'on fera dans Unreal |
| --- | --- | --- |
| Ombres en aplats | trois tons par matière (lumière, demi-teinte, ombre tirant vers le violet sépia), ombres portées | un matériau à ombrage personnalisé, ou un post-process qui ramène l'éclairage à trois bandes |
| Contours à l'encre | une passe d'écran : sauts de profondeur et de normale ; épaisseur choisie par objet (plus épaisse sur les personnages), plus fine au loin | un matériau de post-process (profondeur, normales, *Custom Depth/Stencil* pour l'épaisseur par objet) |
| Le trait qui bout | les échantillons du contour sont décalés d'un bruit qui change 10 fois par seconde | le même bruit, dans le post-process |
| Hachures | des traits croisés en espace écran, dans les vraies ombres seulement ; rien sur ce qui luit | idem, dans le post-process |
| Le papier | le parchemin du jeu 2D (`U.paper`), sous une couleur posée en lavis (le papier transparaît, comme les couleurs à 70 % du jeu 2D) | une texture de papier en surimpression |
| La brume de papier | au loin, le monde se dissout dans la page ; ce qui luit perce | un brouillard de hauteur/distance couleur parchemin |
| Les visages | ils ne reçoivent pas l'ombre de leur chapeau, pour rester lisibles | un réglage par matériau |
| La nuit | l'encre mange la page depuis les bords ; fenêtres et feu luisent | vignettage et étalonnage de nuit |
| Les sceaux | dessinés par le jeu 2D lui-même (`Seal.draw`, `Seal.drawTrace`) : au sol, et tracés dans l'air anneau par anneau | des décalques dont la texture est dessinée de la même façon |
| L'animation | à 12 images par seconde, comme dessinée à la main | la même cadence, sur les personnages |

Les personnages (l'apprenti(e), Gribouille, Grum) et le décor sont des **formes simples** aux bonnes proportions : on juge ici le rendu, pas les modèles.

## Le code

```
src/encre.js        le rendu : le matériau à trois tons (trois images à la fois) et la passe d'encre
src/monde.js        le Jardin : terrain en lavis, Atelier, arbres, rochers, mare, feu de camp, île volante, nuages
src/personnages.js  l'apprenti(e), Gribouille (un seul grand œil, au milieu), Grum
src/sceau.js        les sceaux du jeu 2D, posés en 3D
src/main.js         la caméra en troisième personne, la marche, les compagnons, les réglages
page.html           la page et ses réglages
2d/                 les scripts de dessin du jeu 2D (copiés par outils/depuis-le-jeu-2d.js)
construire.js       assemble tout en un seul fichier : dist/maquette-da.html
```

Reconstruire : `npm install` puis `npm run construire` (three.js 0.170 et esbuild 0.24, versions figées).
