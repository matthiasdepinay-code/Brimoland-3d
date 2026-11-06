# Le projet Unreal de Brimoland

Le squelette du projet, prêt à ouvrir avec **Unreal Engine 5.8**. Il ne contient pas encore de carte ni d'assets : ce n'est que le code.

```
Brimoland.uproject            le projet
Config/DefaultEngine.ini      les réglages de rendu du dessin (pochoir, pas d'exposition auto, pas de Lumen pour commencer)
Source/Brimoland/
  Brimoland.Build.cs          le module de jeu ; il compile BrimoCore (../../Core) avec lui
  Public/BrimoTypes.h         les structures de la magie pour les Blueprints : FBrimoSceau, FBrimoLancement...
  Public/BrimoGrimoire.h      le sous-système Grimoire : toutes les règles, pour le jeu et les Blueprints
  Private/BrimoGrimoire.cpp   ... et ses conversions vers BrimoCore (via Core/include/brimo/pont.h)
  Private/BrimoCoreSources.cpp  les sources de BrimoCore, incluses telles quelles (jamais recopiées)
Content/Python/                 les scripts de l'éditeur : tout monter d'un coup (voir plus bas)
  brimo_tout.py                 l'import des assets, le Jardin d'essai et le rendu à l'encre, dans l'ordre
  brimo_import.py               textures, matériaux (M_Palette, M_Visage), maillages, squelettes partagés, animations
  brimo_jardin.py               le niveau L_Jardin_Essai : blockout, implantation, trio, nature, soleil, pochoirs
  brimo_encre.py                le rendu à l'encre (T_Papier, MPC_Brimo, M_Encre, MI_Encre, le Post Process Volume)
  brimo_plan.py                 le plan (quoi, où, sur quel squelette) : pur Python, testé hors d'Unreal
```

## Ce qui est vérifié ici, sans Unreal

- **BrimoCore compilé comme Unreal le compile.** `BrimoCoreSources.cpp` est compilé tel quel par la CI, sous Linux et sous Windows : un seul fichier, en C++20, sans RTTI. Il passe toute la parité avec le jeu 2D (33 221 vérifications).
- **Le pont entre Unreal et BrimoCore** (`brimo/pont.h`). Il est testé sur les 1 500 sceaux de parité, dont 120 sous-sceaux. Aplatir un sceau puis le déplier ne perd rien ; son JSON fait l'aller-retour ; un fichier de données manquant renvoie un message clair plutôt qu'une exception.
- **Les scripts de l'éditeur** : le plan est testé sur les vrais fichiers. Les 325 FBX sont tous classés, chaque animation a son squelette, et les 241 objets du Jardin tiennent sur le terrain. Le déroulé complet est essayé contre un faux module `unreal`.
- **Ce qui ne peut se vérifier que sur le PC** : la compilation par Unreal lui-même (UnrealHeaderTool et UnrealBuildTool), les noms exacts de l'API Python d'Unreal, et le comportement dans l'éditeur.

## Le jalon J1, sur le PC

1. Fais d'abord [l'installation du PC](../../docs/INSTALLER-LE-PC.md).

> **Les étapes 2 à 5 d'une traite, sans ouvrir l'éditeur.** À la racine du dépôt, l'éditeur fermé, dans PowerShell :
> ```
> powershell -ExecutionPolicy Bypass -File outils\unreal\j1.ps1
> ```
> Il vérifie Git LFS (et lance `git lfs pull` s'il le faut), compile le module, lance `brimo_tout.py` sans fenêtre (`UnrealEditor-Cmd -run=pythonscript`), dont `brimo.essai`, puis le banc des scripts. Il trouve Unreal sous `C:\Unreal` (sinon : `-Moteur <le dossier qui contient Engine>`).
> Tout est écrit dans `Unreal\Brimoland\Saved\J1\` : envoie-moi `resume.txt`. Après une correction des scripts, `-SansImport -SansCompilation` remonte le Jardin et l'encre en quelques minutes.

2. Double-clique sur `Brimoland.uproject`. Unreal annonce que des modules manquent et propose de les compiler : **Oui**. Compte quelques minutes.
   - En cas d'échec, clic droit sur `Brimoland.uproject` → *Generate Visual Studio project files*. Ouvre `Brimoland.sln`, compile *Development Editor*, et envoie-moi la fenêtre *Sortie*.
3. L'éditeur s'ouvre, sur une carte vide.
4. Ouvre la console (la touche **²**, ou *Window → Output Log*, champ *Cmd*) et tape `brimo.essai`. Tu dois lire :
   ```
   brimo.essai : 14 essences chargées depuis …/Core/donnees/brimo.json
   brimo.essai : « Zone de petit soleil puissance (au contact) », 16 d'encre, fusion feu|gravite
   ```
   C'est la magie du jeu 2D qui répond dans Unreal.
5. **Tout monter d'un coup.** Dans l'Output Log, passe le champ de commande de *Cmd* à **Python**, puis tape :
   ```
   import brimo_tout; brimo_tout.lancer()
   ```
   Compte un quart d'heure. Les lignes `[Brimo]` de l'Output Log disent ce qui est fait :
   - les textures, les matériaux, 119 maillages fixes, 10 personnages et bêtes, 9 tenues, 84 animations ;
   - puis le niveau `/Game/Brimo/Cartes/L_Jardin_Essai`, avec le rendu à l'encre.
   Envoie-moi ces lignes, surtout s'il y a des avertissements ou des échecs.
   On peut relancer autant qu'on veut : les acteurs que le script avait posés dans le Jardin sont retirés, puis reposés. Pour remonter le Jardin et l'encre sans refaire l'import : `brimo_tout.lancer(importer=False)`.
6. **Régler l'encre** : [la recette](../Rendu/RECETTE.md), §6. Ce sont deux réglages, à faire avec tes yeux.
7. Appuie sur **Play** : tu es sur le chemin, face à l'Atelier.

Les scripts sont testés ici contre un faux Unreal (`outils/unreal/tester_scripts.py`). Ça vérifie le plan et le déroulé, pas les noms de l'API d'Unreal. Si une ligne s'arrête sur une erreur, envoie-moi le message : je corrige le script, et `brimo_tout.lancer()` recharge les scripts corrigés sans redémarrer l'éditeur.

## Dans un Blueprint

*Get Game Instance* → *Get Subsystem* (**Brimo Grimoire**), puis les fonctions de la catégorie **Brimo** :

- *Creer*, *Cout*, *Nom*, *Est Valide*, *Inutiles*, *Geste* ;
- *Lancer*, qui donne effets, fusion, puissance, portée et élan ;
- *Cle De Fusion*, *Infos Fusion* ;
- *Vers Json* et *Depuis Json*, pour les sauvegardes et pour importer un sceau du jeu 2D ;
- *Essai*.

Un sceau (*Brimo Sceau*) se remplit avec les identifiants du jeu 2D : `feu`, `zone`, `puissance`, `contact`...
