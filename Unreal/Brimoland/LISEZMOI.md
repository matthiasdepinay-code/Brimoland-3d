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
```

## Ce qui est vérifié ici, sans Unreal

- **BrimoCore compilé comme Unreal le compile.** `BrimoCoreSources.cpp` est compilé tel quel par la CI, sous Linux et sous Windows : un seul fichier, en C++20, sans RTTI. Il passe toute la parité avec le jeu 2D (33 221 vérifications).
- **Le pont entre Unreal et BrimoCore** (`brimo/pont.h`). Il est testé sur les 1 500 sceaux de parité, dont 120 sous-sceaux. Aplatir un sceau puis le déplier ne perd rien ; son JSON fait l'aller-retour ; un fichier de données manquant renvoie un message clair plutôt qu'une exception.
- **Ce qui ne peut se vérifier que sur le PC** : la compilation par Unreal lui-même (UnrealHeaderTool et UnrealBuildTool), et le comportement dans l'éditeur.

## Le jalon J1, sur le PC

1. Fais d'abord [l'installation du PC](../../docs/INSTALLER-LE-PC.md).
2. Double-clique sur `Brimoland.uproject`. Unreal annonce que des modules manquent et propose de les compiler : **Oui**. Compte quelques minutes.
   - En cas d'échec, clic droit sur `Brimoland.uproject` → *Generate Visual Studio project files*. Ouvre `Brimoland.sln`, compile *Development Editor*, et envoie-moi la fenêtre *Sortie*.
3. L'éditeur s'ouvre, sur une carte vide.
4. Ouvre la console (la touche **²**, ou *Window → Output Log*, champ *Cmd*) et tape `brimo.essai`. Tu dois lire :
   ```
   brimo.essai : 14 essences chargées depuis …/Core/donnees/brimo.json
   brimo.essai : « Zone de petit soleil puissance (au contact) », 16 d'encre, fusion feu|gravite
   ```
   C'est la magie du jeu 2D qui répond dans Unreal.
5. Pour avoir de quoi se promener : *Content Browser → Add → Add Feature or Content Pack → Third Person*.
6. Ensuite, le rendu à l'encre : [la recette](../Rendu/RECETTE.md).

## Dans un Blueprint

*Get Game Instance* → *Get Subsystem* (**Brimo Grimoire**), puis les fonctions de la catégorie **Brimo** :

- *Creer*, *Cout*, *Nom*, *Est Valide*, *Inutiles*, *Geste* ;
- *Lancer*, qui donne effets, fusion, puissance, portée et élan ;
- *Cle De Fusion*, *Infos Fusion* ;
- *Vers Json* et *Depuis Json*, pour les sauvegardes et pour importer un sceau du jeu 2D ;
- *Essai*.

Un sceau (*Brimo Sceau*) se remplit avec les identifiants du jeu 2D : `feu`, `zone`, `puissance`, `contact`...
