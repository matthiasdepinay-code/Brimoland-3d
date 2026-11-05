# Brimoland 3D — document de projet

L'Atelier des Sceaux devient un monde ouvert en 3D, sous Unreal Engine, sans rien perdre de son âme : un bac à sable de magie où l'on compose ses sorts en cercles, dessiné à l'encre sur du parchemin.

Ce document sert de boussole. Il dit ce que l'on garde du jeu 2D, comment chaque morceau passe en 3D, comment le code est rangé, et dans quel ordre avancer. Il évoluera avec le projet.

---

## 1. Ce que l'on garde, ce qui change

| | Jeu 2D (Jjk2) | Brimoland 3D |
|---|---|---|
| Vue | de côté | troisième personne, monde ouvert |
| DA | encre sur parchemin, dessin vectoriel | encre sur parchemin, modèles 3D au rendu dessiné |
| La magie | cercles, glyphes, fusions, élans | **identique** : mêmes règles, mêmes données (BrimoCore) |
| La matière | une grille de cellules (sable, eau, feu, chaleur...) | une « chimie » d'états sur les objets, et de la vraie matière là où il le faut |
| Le monde | une bande de régions | un continent de régions, l'Atelier au centre |
| Mascottes | Gribouille et Grum, dessinés | Gribouille et Grum en 3D dessinée, mêmes humeurs, mêmes gaffes |

La règle d'or : **la magie ne se réinvente pas**. Le cœur des règles (coût, puissance, aspects, liaisons, équilibre, fusions, élans) est porté en C++ et vérifié contre le jeu 2D (voir §8). Le jeu 2D reste le **labo** : on y essaie une mécanique en une soirée, et l'on ne la porte en 3D que si elle est bonne.

---

## 2. La direction artistique en 3D

L'objectif : qu'une capture d'écran de Brimoland 3D ressemble à une page du grimoire qu'on aurait mise en volume.

### 2.1 Le rendu « dessiné »
- **Ombres en aplats** : deux ou trois tons par matière (lumière, demi-teinte, ombre), pas de dégradé réaliste. Les couleurs viennent de la palette du jeu 2D (parchemin `#efe3c4`, encre `#1f1a16`, sépia, et les couleurs des essences).
- **Contours à l'encre** : un post-process détecte les bords (profondeur + normales). Le trait s'épaissit sur les silhouettes et s'affine dans les plis. Il **tremble légèrement**, comme les traits de `U.inkLine` du jeu 2D, et ce tremblement se renouvelle 8 à 12 fois par seconde : le trait « bout », comme dans un dessin animé à la main.
- **Hachures** dans les ombres profondes : des traits croisés en espace écran, plus serrés quand c'est plus sombre (comme les zones hachurées de la roche dans le jeu 2D).
- **Le papier partout** : un grain de parchemin en surimpression sur toute l'image, des bords d'écran assombris (vignettage), quelques taches. La nuit, l'encre « mange » la page depuis les bords.
- **Le ciel est du papier** : nuages tracés au trait (des cercles d'encre, comme en 2D), soleil et lune dessinés.
- **Lumière** : un soleil, une lumière d'ambiance douce, pas de reflets brillants. Les lumières magiques (lanterne, lucioles, feu) restent des halos de couleur, comme `FX.glow`.

Pistes techniques sous Unreal :
1. *Pour démarrer* : un matériau de post-process qui ramène l'éclairage à quelques bandes, trace les contours et pose le papier. Rapide à mettre en place, fonctionne sur tout le monde.
2. *Ensuite* : des matériaux dédiés (ombrage personnalisé) pour les personnages, et la profondeur personnalisée (*Custom Depth / Stencil*) pour choisir l'épaisseur du trait par objet (plus épais sur les personnages, plus fin sur l'herbe).
3. Lumen (l'éclairage global) est à garder faible, voire coupé : il adoucit trop les ombres.

### 2.2 Les modèles
- **Low-poly, silhouettes fortes**, proportions du jeu 2D (grosses têtes, chapeaux immenses).
- **Textures peintes à plat** : pas de matières réalistes ; quelques hachures peintes dans la texture même.
- **Animation « à la main »** : en option, les personnages s'animent à 12 images par seconde (pas d'interpolation), ce qui donne ce petit côté saccadé du dessin animé.
- **Expressions dessinées** : les visages sont des textures qu'on échange (yeux, bouche), pas des déformations 3D. On garde ainsi les vingt humeurs de Gribouille et de Grum telles quelles.

### 2.3 Les personnages
- **Gribouille** : une goutte d'encre noire à **un seul grand œil blanc, au milieu du visage**, une queue en spirale, un immense chapeau magenta rapiécé avec l'étiquette « G ». Cinq tenues (classique, arcaniste, alchimiste, explorateur, céruléen).
- **Grum** : un golem de pierre ocre coiffé de mousse, une visière sombre et deux yeux dorés, une rune sur le poing. Cinq tenues (classique, runique, forgeron, forestier, cristallin).
- **L'apprenti(e)** : personnalisable comme en 2D (chapeaux, capes, accessoires, nom).
- **Les bêtes** : limaces, follets, golems, grenouilles, corbeaux, salamandres, poissons, chauves-souris, escargots, tortues, lapins ; les 14 familiers (Salamandre de braise, Ondine, Petit golem, Sylphe, Pousse, Luciole, Oiseau-tonnerre, Petite lune, Chouette du temps, Renard des failles, Chat d'ombre, Ouroboros, Pie grise, Chenille) ; les quatre gardiens.

Avant de modéliser, il faudra des **planches de personnages** (face, profil, dos, à la même échelle). Ta planche « Brimoland – Les Aventures de Gribouille & Grum » est le point de départ.

### 2.4 Les effets de magie
- Faits avec Niagara (le système de particules d'Unreal), mais **dessinés** : flammes, gouttes, étincelles, feuilles et fumée sont des petits dessins à l'encre (comme les particules `flamme`, `goutte`, `spark` du jeu 2D), pas des effets réalistes.
- Le **sceau se trace dans l'air**, anneau par anneau, devant la main (comme `Seal.drawTrace`) ; au sol, une zone est un cercle d'encre qui se dessine (décalque animé).
- Chaque essence garde sa couleur (Feu `#d9622b`, Eau `#3b6fb6`, Vent `#3f9c9b`, Terre `#8a6b2f`...).

### 2.5 L'interface
- La **table des sceaux**, le grimoire, la barre, le chaudron : mêmes dessins, mêmes gestes (glisser-déposer, cases en pointillés, clavier), refaits dans l'interface d'Unreal (UMG).
- Le cercle se dessine comme en 2D (même géométrie : `MOD_ANGLES`, `layout`), et les glyphes deviennent des images vectorielles.

---

## 3. Le monde

Un continent ouvert, chargé par morceaux (*World Partition*), avec **l'Atelier au centre** : c'est le labo du jeu 2D (table des sceaux, chaudron, miroir des tenues, grimoire).

Les régions reprennent celles du jeu 2D :

| Région | Ce qu'on y trouve | Gardien |
|---|---|---|
| Le Jardin | autour de l'Atelier, la prairie, le terrain d'essai | — |
| La Prairie / La Forêt | bois, vignes, ruches, les premières bêtes | l'Ent-ronce |
| Le Lac / La Rivière | l'eau, la glace l'hiver, les poissons | — |
| Les Collines / La Montagne / La Gorge | la roche, les grottes, le vent | le Grand Cerf |
| Le Volcan / La Plaine de cendres | la lave, la chaleur, le métal | le Golem de magma |
| La Clairière | les fées, la lumière, la vie | — |
| Le Marais / Les Ruines | l'acide, la boue, l'ancien temps | l'Automate des ruines |
| Le Désert | le sable, le vent, les mirages | — |
| Les îles volantes | quatre îles dans le ciel, à atteindre par les élans | — |

On y retrouve aussi les saisons, la météo (pluie, orage, neige), le jour et la nuit, les pages déchirées du grimoire, les coffres, les stèles et les énigmes de fusion.

Pour la végétation et les rochers, on génère par règles (PCG d'Unreal), puis on retouche à la main.

---

## 4. La matière en 3D

C'est le plus gros défi. La grille du jeu 2D (chaque grain de sable, chaque goutte) coûte bien trop cher sur un grand monde en 3D. On garde **ce qu'elle permet**, par d'autres moyens.

### 4.1 Une chimie d'états
Chaque objet et chaque surface a des **états** qui se propagent, comme dans Zelda: Breath of the Wild :
- *en feu* (l'herbe, le bois, l'huile s'embrasent et propagent), *mouillé* (éteint, conduit la foudre), *gelé*, *électrisé* (court dans l'eau et le métal), *rongé par l'acide*, *couvert de mousse*...
- Une **grille grossière** (un mètre) autour du joueur garde la chaleur et l'humidité, comme `Sim.tempAt`.
- Les réactions du jeu 2D se recopient en règles : le feu fond la glace, la lave et l'eau donnent de la pierre noire, la foudre embrase l'huile...

### 4.2 De la vraie matière, là où ça compte
- **Le terrain se creuse et se lève** dans des zones de voxels (des cubes de terre), là où la Terre agit : creuser en taupe, lever un pilier, ouvrir un canyon. Un plugin de voxels existe pour Unreal, ou un système maison par blocs.
- **Les murs, piliers et ponts** créés par les sorts sont des formes générées à la volée, qui peuvent s'effondrer (la physique d'Unreal, Chaos) : la terre retombe en tas, la pierre tient.
- **L'eau** : lacs et rivières en volumes d'eau ; l'eau créée par un sort coule en petites nappes qui s'écoulent et s'évaporent.
- **Le temps** : chaque objet d'Unreal peut avoir son propre rythme (*Custom Time Dilation*). Une bulle de temps ralentit ou accélère tout ce qui y entre, comme en 2D.
- **La gravité orientée** : un champ qui change la pesanteur de ce qui s'y trouve ; marcher aux murs et au plafond pour l'apprenti(e).
- **Le vent** : des champs de force qui poussent les objets, la fumée, les feuilles.

---

## 5. La magie

### 5.1 Le cercle, inchangé
Les règles et les données sont celles du jeu 2D, portées dans **BrimoCore** (§8) :
- l'essence au centre, la forme et les fusions sur le premier anneau, les modificateurs sur le second, déclencheurs, filtre et cible aux pointes ;
- la taille qui s'ajuste (petit, moyen, grand), le coût détaillé, les glyphes qui ne servent à rien ;
- la position qui compte (Puissance juste sous une essence), l'équilibre (bancal ou équilibré), le second déclencheur relié à une essence (sort en deux temps) ;
- le tracé qui dure selon les glyphes, et le sort lâché en plein tracé ;
- 14 essences, 51 modificateurs (dont les aspects et les glyphes de langage), 15 formes, 8 déclencheurs, 61 fusions, 8 trios, les familles (Faille, Élémentaire, Absorption, Chimère).

### 5.2 Les formes en 3D

| Forme | En 3D |
|---|---|
| Projectile, Chaîne | une bille d'encre qui file (et rebondit de cible en cible) |
| Sur soi | l'élan de l'essence (§6) |
| Zone | une sphère posée là où l'on vise, son cercle d'encre au sol |
| Aura | autour de soi, elle suit |
| Mur, Colonne | une plaque dressée, un pilier : leurs dimensions se règlent (largeur, hauteur) |
| Trait | un rayon jusqu'au premier obstacle |
| Pluie | un nuage qui pleut l'effet |
| Vague | roule au sol et emporte tout |
| Totem, Sur objet | posé, il agit autour de lui |
| Prise | saisir la matière (l'eau d'un lac, un rocher, une bête) et la lancer |
| Bouclier | un arc tourné vers la visée |
| Invocation | le familier de l'essence |

### 5.3 Les fusions
Chaque fusion devient un phénomène Niagara qui **prend la forme du sceau** (une colonne de petit soleil, un mur de tornade...) : petit soleil, geyser, banquise, météore, arc-en-ciel praticable, îlot flottant, raz-de-marée, étoile, ouragan, volcan, jardin suspendu...

---

## 6. Les élans en 3D

Les élans du jeu 2D se prêtent très bien à la troisième personne :

| Essence | Élan | Maintenu |
|---|---|---|
| Feu | une gerbe de flammes te propulse vers la visée | voler sur ses flammes |
| Eau | un jet d'eau (très vite dans l'eau) | surfer sur un jet |
| Vent | une bourrasque, puis le vol plané (comme un parapente) | voler dans le vent |
| Terre | un pilier sous les pieds ; en l'air, s'abattre en onde de choc | creuser en taupe |
| Vie | une liane-grappin vers le mur visé | se balancer à la liane, se régénérer |
| Lumière | filer en rayon jusqu'au mur | devenir lumière, intouchable |
| Foudre | un éclair à travers les ennemis | une tempête d'éclairs, de bond en bond |
| Gravité | marcher aux murs et au plafond, voler, l'enclume | léviter vers la visée |
| Temps | la hâte | le monde ralenti autour de soi |
| Espace | la téléportation, même derrière un mur ; l'échange avec une bête | viser où paraître, lâcher |
| Esprit | entrer dans la bête visée, ou lancer son esprit | sortir de son corps : la caméra suit l'esprit à travers les murs |
| Transmutation | sable fin : traverser la roche | rester sable fin |
| Contre-sort | arrêt net, suspension, miroir qui renvoie les tirs | rester suspendu(e) sous le miroir |
| Métamorphose | une forme animale | la garder tant qu'on tient |

Le cercle façonne l'élan exactement comme en 2D : Puissance, Portée, Durée, Taille, Rafale (des élans d'avance), Téléguidé, une seconde essence qui teinte le mouvement, une cible qui le dirige. BrimoCore calcule déjà l'élan d'un sceau (`Grimoire::lancement(...).elan`).

---

## 7. Gribouille, Grum, et le monde vivant

- **Compagnons** : ils suivent, sautent, lévitent, reviennent d'un pouf d'encre quand ils sont trop loin, lisent puis s'endorment quand on ne fait rien.
- **Gribouille** lance ses petits sorts : réussis, gaffes (chute, fumée, fleurs) ou géniaux. Il devient rarement **Giga Gribouille**, un colosse d'encre violette, puis s'endort épuisé.
- **Grum** protège, frappe, aide à creuser, et adore le gâteau au miel.
- Leurs humeurs passent par les textures de visage (§2.2) et des bulles dessinées au-dessus d'eux.
- Côté technique, leurs comportements se décrivent dans les arbres d'états d'Unreal (*StateTree*), en reprenant la logique de `js/mascottes.js`.

---

## 8. L'architecture du code

```
Brimoland3D/
├── Core/                     BrimoCore : la magie en C++17 pur, sans Unreal  ← fait
│   ├── include/brimo/        magie.h (données, sceau, grimoire), json.h
│   ├── src/                  le port de js/seal.js et des fusions de js/data.js
│   ├── donnees/brimo.json    les données exportées du jeu 2D
│   └── tests/                vecteurs.json (réponses du jeu 2D) et parite.cpp
├── outils/
│   ├── depuis-le-jeu-2d.js   exporte les données et recalcule les vecteurs depuis le jeu 2D
│   └── shaders/              le banc d'essai du nœud d'encre : compilé, puis comparé à la maquette
├── Unreal/
│   └── Rendu/                le rendu à l'encre : BrimoEncre.hlsl (un nœud Custom) et RECETTE.md  ← fait
│                             (le projet Unreal viendra à côté, quand le PC sera là)
└── docs/PROJET.md            ce document
```

### 8.1 BrimoCore
- Le **modèle du sceau** et toutes ses règles : normalisation et migrations, coût et coût détaillé, paramètres, aspects, effets, langages, liaisons, équilibre, taille juste, tracé et sort partiel, sort en deux temps, relecture (glyphes inutiles et leurs raisons), nom automatique.
- Les **fusions** : clé, informations (y compris les familles), recette en glyphes.
- Le **lancement** : effets après inversion, fusion, déclencheur principal, répétition, filtre, cible, sceau bancal, et l'**élan** sur soi.
- **Parité** : `outils/depuis-le-jeu-2d.js` fait calculer au jeu 2D lui-même 1 500 sceaux tirés au hasard ; `Core/tests/parite` vérifie que le C++ donne exactement les mêmes réponses (33 221 vérifications). Le jour où une règle change dans le jeu 2D, on relance l'outil, et le test dit ce qu'il faut reporter.
- Aucune dépendance : il compile avec n'importe quel compilateur C++17 (GCC, Clang, MSVC). La CI GitHub le vérifie sous Linux et sous Windows.

### 8.2 Le module Unreal (à venir)
- Le projet `Unreal/Brimoland` (C++, modèle « troisième personne »), avec un module de jeu qui **compile BrimoCore avec lui** (les sources de `Core/` ajoutées au module).
- Un sous-système de jeu (`UBrimoGrimoire`, un *GameInstanceSubsystem*) qui charge `brimo.json` et expose aux Blueprints : coût, nom, relecture, lancement, élan.
- Des structures Unreal (`FBrimoSceau`...) qui reflètent le sceau, pour l'interface et les sauvegardes.
- Le gameplay en C++ : l'apprenti(e) (`ACharacter`), les composants d'élan, les sorts (projectiles, zones, murs...), les phénomènes, la chimie.
- Les plugins d'Unreal : Enhanced Input (commandes), Niagara (effets), StateTree (comportements), World Partition et PCG (monde).
- Gros fichiers (modèles, textures, cartes) dans **Git LFS** (`.gitattributes` est prêt).

---

## 9. Les jalons

On avance par **tranche verticale** : une petite partie du jeu, complète et belle, avant d'élargir.

| Jalon | Contenu | Où |
|---|---|---|
| **J0** | ce document ; BrimoCore et sa parité avec le jeu 2D | ici, sans le PC ✔ |
| J0 bis | une maquette de la DA (rendu encre et papier en 3D) jouable dans le navigateur, pour valider le style avant Unreal ; les shaders d'encre prêts à recopier dans Unreal | ici, sans le PC ✔ |
| **J1** | installer Unreal et Visual Studio ; créer le projet C++ ; brancher BrimoCore ; le post-process d'encre sur la carte d'exemple | sur le PC |
| **J2** | la table des sceaux en jeu ; Feu, Eau, Terre, Vent en projectile, zone et sur soi ; le tracé visible | PC |
| **J3** | les élans de ces quatre essences, la caméra, une île de test | PC |
| **J4** | Le Jardin : terrain, Atelier, végétation, chimie du feu et de l'eau, quelques bêtes | PC |
| **J5** | Gribouille et Grum : modèles, expressions, compagnons | PC + modélisation |
| **J6** | les fusions, le premier gardien (l'Ent-ronce), la sauvegarde | PC |
| ensuite | les régions une à une, les autres essences, les familiers, les gardiens | PC |

---

## 10. Ce qu'il faudra sur le PC

- Windows 10 ou 11, une carte graphique récente (DirectX 12), 32 Go de mémoire conseillés, un SSD avec 150 Go libres au moins.
- **Unreal Engine** (la dernière version 5.x stable), depuis l'Epic Games Launcher.
- **Visual Studio 2022** (Community suffit) avec la charge de travail « Développement de jeux en C++ » et le SDK Windows.
- **Git** et **Git LFS**.
- **Blender** (gratuit) pour les modèles, si tu modélises toi-même.

Je ne peux pas lancer Unreal ici : sur le PC, la boucle sera « j'écris, tu compiles et testes, tu me racontes ou tu m'envoies une capture, je corrige ». Tout ce qui peut se vérifier sans Unreal (la magie, les données, les shaders en maquette) est vérifié ici d'abord, pour que cette boucle soit courte.

---

## 11. Les risques, et comment les tenir

- **Un monde ouvert, c'est immense.** D'où la tranche verticale : une région belle et complète avant les autres.
- **La matière en 3D coûte cher.** D'où la chimie d'états, avec de la vraie matière seulement là où le jeu en a besoin.
- **Modéliser et animer prend du temps.** Commencer par des formes simples (des blocs aux bonnes proportions) avec le rendu encre : le style porte déjà beaucoup.
- **Deux jeux à tenir.** Le jeu 2D reste le labo des règles ; BrimoCore et sa parité garantissent que les deux disent la même chose.
