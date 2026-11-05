# Les planches (C4)

Gribouille, Grum et l'apprenti(e), **dessinés par le code du jeu 2D lui-même** (`js/mascottes.js` et `js/perso.js`), sur le parchemin du jeu.
Ce sont les références pour modéliser : silhouettes, proportions, couleurs, et toutes les expressions qu'il faudra peindre dans les textures de visage.

| Planche | Ce qu'on y trouve |
| --- | --- |
| `Planche_Gribouille.png` | les 15 expressions, 12 poses, les 5 tenues, et Giga Gribouille (la transformation, la forme amplifiée, la frappe) |
| `Planche_Grum.png` | les 10 expressions (les yeux), 10 poses (dont le gâteau et la pioche), les 5 tenues |
| `Planche_Apprenti.png` | 6 poses, les 7 chapeaux, 6 coiffures, 5 objets tenus, 5 écharpes, 5 peaux, 6 capes |

Le jeu 2D les dessine **de profil, tournés vers la droite** : pour la face et le dos, suis les gabarits (`../Gabarits/`) et le cahier des charges.

Régénérer : `node outils/depuis-le-jeu-2d.js` (copie les scripts du jeu 2D), puis `node outils/planches.js`.
