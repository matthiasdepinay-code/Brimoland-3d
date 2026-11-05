# Brimoland 3D

L'Atelier des Sceaux en 3D, sous Unreal Engine : un bac à sable de magie en monde ouvert, dessiné à l'encre sur du parchemin. On compose ses sorts en cercles, comme dans le jeu 2D.

- Le jeu 2D, qui reste le labo des règles : [matthiasdepinay-code/Jjk2](https://github.com/matthiasdepinay-code/Jjk2)
- Le document de projet (DA, monde, magie, élans, architecture, jalons) : [docs/PROJET.md](docs/PROJET.md)
- Le journal de bord (les étapes une par une, les décisions, le carnet) : [Journal de bord — Brimoland 3D](https://claude.ai/artifact/KRqmKT5r7uW1WPxd7DHL1K)
- La liste des assets de la première zone et leur cahier des charges : [Assets du Jardin — cahier des charges](https://claude.ai/artifact/WmauJYKvrmNiisvzjPFPWH)

## Où en est-on

| | |
|---|---|
| Document de projet | ✔ |
| **BrimoCore** : la magie en C++ pur, identique au jeu 2D (33 221 vérifications de parité) | ✔ |
| **Maquette de la DA** : un petit Jardin en 3D rendu à l'encre sur parchemin, dans le navigateur ([maquette/](maquette/LISEZMOI.md), [captures](docs/captures/)) | ✔ validée |
| **Le rendu à l'encre pour Unreal** : un nœud Custom et sa recette pas à pas, vérifiés dans la maquette ([Unreal/Rendu/](Unreal/Rendu/RECETTE.md), [capture](docs/captures/e7-encre-unreal.jpg)) | ✔ |
| **Assets du Jardin** : la liste et le cahier des charges ; les gabarits, la palette et les planches de référence ([Art/](Art/)) | en cours |
| **Projet Unreal** : le squelette (module C++, BrimoCore branché, sous-système Grimoire), prêt à ouvrir ([Unreal/Brimoland/](Unreal/Brimoland/LISEZMOI.md)) | ✔, à compiler sur le PC |
| **Installer le PC** : Unreal 5.8, Visual Studio 2026, Git LFS, Blender, pas à pas ([docs/INSTALLER-LE-PC.md](docs/INSTALLER-LE-PC.md)) | prêt |

## BrimoCore

La magie de L'Atelier des Sceaux en C++17, sans Unreal ni aucune dépendance : le modèle du sceau (coût, paramètres, aspects, liaisons, équilibre, taille, tracé, sort en deux temps, relecture, nom), les fusions, le lancement et l'élan. Le projet Unreal le compilera avec lui.

```sh
cmake -S Core -B build
cmake --build build
ctest --test-dir build --output-on-failure
```

```cpp
#include "brimo/magie.h"
using namespace brimo;

Grimoire G(Donnees::charger("Core/donnees/brimo.json"));
Sceau s = G.creer("moyen");
s.core = "feu"; s.core2 = "gravite"; s.shape = "zone"; s.mods[0] = Mod("puissance");
G.cout(s);                      // 15
G.nom(s);                       // "Zone de petit soleil puissance"
G.parametres(s).ess["gravite"]; // la Puissance posée juste sous la Gravité ne sert qu'elle
G.lancement(s).combo;           // "feu|gravite"
```

### La parité avec le jeu 2D

`outils/depuis-le-jeu-2d.js` charge le jeu 2D (par défaut `../Jjk2`), exporte ses données dans `Core/donnees/brimo.json`, et lui fait calculer 1 500 sceaux tirés au hasard (`Core/tests/vecteurs.json`). Le test `parite` vérifie que BrimoCore donne exactement les mêmes réponses.

Quand une règle change dans le jeu 2D :

```sh
node outils/depuis-le-jeu-2d.js ../Jjk2
cmake --build build && ctest --test-dir build --output-on-failure
```

Le test dit alors ce qu'il faut reporter dans `Core/src/`.

## Rangement

```
Core/       BrimoCore (include/, src/, donnees/, tests/)
maquette/   la maquette de la DA (three.js), en un seul fichier : maquette/dist/maquette-da.html
Art/        les assets : Source/ (.blend), Export/ (.fbx), Textures/ (T_Palette...), Reference/ (gabarits .glb, planches)
outils/     export depuis le jeu 2D, palette, papier, planches ; shaders/ : le banc d'essai du nœud d'encre
docs/       le document de projet, l'installation du PC, les captures
Unreal/     Rendu/ : le rendu à l'encre (BrimoEncre.hlsl, RECETTE.md) ; Brimoland/ : le projet Unreal
```
