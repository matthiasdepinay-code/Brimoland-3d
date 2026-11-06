# Le rendu à l'encre dans Unreal : la recette

Le rendu « dessiné » de la maquette tient dans **un seul nœud Custom**, posé dans un matériau de post-process : [`BrimoEncre.hlsl`](BrimoEncre.hlsl).
Ce fichier a déjà été compilé et testé hors d'Unreal : le banc d'essai (`outils/shaders/`) le fait tourner sur la scène de la maquette. Le résultat est quasi identique au rendu d'origine : environ 1 / 255 d'écart moyen, avec un seuil d'échec qui attrape une ombre faussée.

> **Le plus simple : le script.** Les étapes 2 à 5 sont faites par un script de l'éditeur. Les étapes 1, 6 et 7 aussi, si tu lances le Jardin d'essai.
> Dans l'Output Log, passe le champ de commande en **Python**, puis tape : `import brimo_encre; brimo_encre.monter()`.
> Pour tout faire d'un coup (l'import des assets, le Jardin d'essai, l'encre) : `import brimo_tout; brimo_tout.lancer()`.
> La suite de cette page décrit la même chose à la main. Elle sert à comprendre, ou si le script s'arrête sur une erreur.

Compte une heure la première fois à la main. À chaque étape, il y a une vérification : si elle ne passe pas, arrête-toi et envoie-moi une capture.

---

## 1. Les réglages du projet

*Edit → Project Settings*, puis :

| Où | Réglage | Valeur | Pourquoi |
| --- | --- | --- | --- |
| Engine → Rendering → Postprocessing | **Custom Depth-Stencil Pass** | **Enabled with Stencil** | le pochoir : l'épaisseur du trait choisie par objet |
| Engine → Rendering → Default Settings | Auto Exposure | décoché | l'éclairement doit rester stable |
| Engine → Rendering → Default Settings | Bloom, Motion Blur, Lens Flares | décochés | le dessin n'a ni halo ni flou |
| Engine → Rendering → Global Illumination | Dynamic Global Illumination Method | **None** (Lumen plus tard, faible) | Lumen adoucit trop les ombres |
| Engine → Rendering → Reflections | Reflection Method | **None** | pas de reflets brillants |
| Engine → Rendering → Default Settings | Anti-Aliasing Method | TSR (par défaut), avec **Screen Percentage à 100** | le nœud lit les images de la scène à pleine taille |

Unreal demande de redémarrer l'éditeur : accepte.

**Vérification :** au redémarrage, la scène paraît plus dure et plus plate. C'est normal.

## 2. La texture du papier

1. Glisse [`Art/Textures/T_Papier.png`](../../Art/Textures/T_Papier.png) dans le *Content Browser*, dans `Content/Brimo/Rendu/`.
2. Ouvre-la. Décoche **sRGB**. Le nœud travaille sur les couleurs telles qu'on les lit (`#efe3c4`), pas sur des couleurs linéaires.
3. Mets *Compression Settings* sur **UserInterface2D (RGBA)**, pour qu'elle ne bave pas. Laisse *Address X / Y* sur **Wrap** : la texture se répète sans couture.

## 3. La collection de paramètres

Clic droit → *Materials → Material Parameter Collection*. Nomme-la `MPC_Brimo` et ajoute un *Scalar Parameter* **Nuit**, qui vaut 0.
Le jeu la fera varier de 0 (jour) à 1 (nuit), et tout le rendu suivra.

## 4. Le matériau `M_Encre`

1. Clic droit → *Material*. Nomme-le `M_Encre` et ouvre-le.
2. Dans *Details* :
   - **Material Domain : Post Process** ;
   - **Blendable Location : Replacing the Tonemapper**. Le nœud fait lui-même la couleur finale ; le tonemapper d'Unreal changerait les couleurs du jeu 2D.
3. Ajoute un nœud **Custom** :
   - *Output Type* : **CMOT Float 3** ;
   - *Description* : `BrimoEncre` ;
   - *Code* : tout le contenu de [`BrimoEncre.hlsl`](BrimoEncre.hlsl), copié-collé tel quel.
4. Dans *Inputs*, ajoute ces entrées **dans n'importe quel ordre, avec exactement ces noms**. Pour chacune, crée le nœud indiqué et branche-le.

| Entrée | Ce qu'on y branche | Valeur de départ |
| --- | --- | --- |
| `UVv` | *Screen Position*, sortie **ViewportUV** | |
| `Temps` | *Time* | |
| `Papier` | *Texture Object Parameter* « Papier » | `T_Papier` |
| `Mode` | *Scalar Parameter* « Mode » | 0 |
| `PleinSoleil` | *Scalar Parameter* « PleinSoleil » | 1 (on le règle à l'étape 6) |
| `Ambiance` | *Scalar Parameter* « Ambiance » | 0,1 |
| `SeuilLueur` | *Scalar Parameter* « SeuilLueur » | 1,25 |
| `Traits` | *Scalar Parameter* « Traits » | 1 |
| `HachuresOn` | *Scalar Parameter* « Hachures » | 1 |
| `PapierOn` | *Scalar Parameter* « PapierVisible » | 1 |
| `TrembleOn` | *Scalar Parameter* « Tremble » | 1 |
| `Nuit` | *Collection Parameter* : `MPC_Brimo`, **Nuit** | |
| `Brume` | *Scalar Parameter* « Brume » (en mètres) | 95 |
| `CielLoin` | *Scalar Parameter* « CielLoin » (en mètres) | 2000 |
| `SortieLineaire` | *Scalar Parameter* « SortieLineaire » | 0 (on le vérifie à l'étape 6) |
| `Dessin` | *Scalar Parameter* « Dessin » | 0,65 : la force des effets dessinés (hachures, tremblement, papier, vignettage) ; 1 = la première maquette |
| `CouleurPapier` | *Vector Parameter* « CouleurPapier » | R 0,937 · G 0,890 · B 0,769 |
| `CouleurEncre` | *Vector Parameter* « CouleurEncre » | R 0,122 · G 0,102 · B 0,086 |
| `CouleurCiel` | *Vector Parameter* « CouleurCiel » | R 0,541 · G 0,561 · B 0,690 |
| `CouleurSoleil` | *Vector Parameter* « CouleurSoleil » | R 1 · G 1 · B 1 |
| `Amorce` | la somme de six nœuds *SceneTexture* (voir ci-dessous) | |

> **Les couleurs** : tape les trois nombres R, G et B dans les champs du paramètre, **pas** le code hexadécimal. Le sélecteur de couleur d'Unreal convertirait `#efe3c4` en linéaire, et le papier sortirait trop sombre.

> **L'amorce** : le code lit six images de la scène par leur numéro (`SceneTextureLookup`). Unreal ne les fournit au matériau que si des nœuds *SceneTexture* les demandent. Ajoute donc six nœuds **SceneTexture**, réglés sur **PostProcessInput0**, **SceneDepth**, **BaseColor**, **WorldNormal**, **CustomDepth** et **CustomStencil**. Additionne leurs sorties *Color* avec des nœuds *Add*, et branche le total sur `Amorce`. Le code ne lit jamais cette entrée : elle sert seulement à faire fournir les six images.

5. Branche la sortie du nœud Custom sur **Emissive Color** du matériau. Clique sur *Apply* (ou *Save*).
6. Clic droit sur `M_Encre` → *Create Material Instance* : `MI_Encre`. C'est lui qu'on règle, sans recompiler.

**Vérification :** le matériau compile sans erreur (la fenêtre *Stats*, en bas, est vide de rouge). En cas d'erreur, voir §8.

## 5. Le poser sur la carte

1. Ajoute un **Post Process Volume** à la carte. Coche **Infinite Extent (Unbound)**.
2. Dans *Post Process Materials* : + → *Asset reference* → `MI_Encre`, avec un poids de 1.
3. Dans le même volume :
   - *Exposure* : *Metering Mode* **Manual**, *Exposure Compensation* 0 (ou *Min* et *Max EV100* égaux) ;
   - *Bloom* : *Intensity* 0 ;
   - *Image Effects* : *Vignette Intensity* 0 (le nœud fait son propre vignettage).
4. Retire l'*Exponential Height Fog* de la carte, ou mets sa densité à 0 : la brume de papier la remplace.

**Vérification :** l'image devient du papier, avec des traits d'encre. Les couleurs sont sans doute fausses : on les règle à l'étape suivante.

## 6. Les deux réglages qui dépendent de ta scène

**a. La sortie (SortieLineaire).** Mets `PapierVisible` à 0 et regarde le ciel : il doit être exactement le papier, `#efe3c4`. Fais une capture et vérifie la couleur à la pipette.

- S'il est **plus clair, délavé** : passe `SortieLineaire` à 1.
- S'il est juste : laisse 0.

Remets `PapierVisible` à 1.

**b. L'éclairement (PleinSoleil et Ambiance).** Mets `Mode` à **1** : l'image montre l'éclairement en gris.

1. Monte `PleinSoleil` jusqu'à ce que les faces en plein soleil soient **tout juste blanches**, et que les faces un peu de biais restent grises.
2. Règle `Ambiance` pour que les ombres soient **presque noires**.

Puis `Mode` à **2** : tu dois voir **trois gris francs** (ombre, demi-teinte, lumière).

Remets `Mode` à 0.

**Vérification :** les ombres ont pris leur ton violet sépia, et des hachures apparaissent dans les ombres profondes.

## 7. Les matériaux et le pochoir des objets

**Les matériaux des objets** (Default Lit) :

- *Base Color* : la couleur de la palette.
- *Specular* 0, *Roughness* 1, *Metallic* 0. Pas de reflet : l'éclairement se lit alors proprement.
- **Ce qui luit** (feu, vitres, sceaux, lanternes) garde sa couleur en *Base Color* et ajoute un *Emissive* plus vif (la même couleur × 3).

**Le pochoir** choisit l'épaisseur du trait, objet par objet. Sur le composant, dans *Rendering* :

1. coche **Render CustomDepth Pass** ;
2. mets **CustomDepth Stencil Value** à la valeur de la table ci-dessous.

Les objets sans pochoir prennent le trait par défaut, 0,6. Il n'y a rien à faire pour eux.

| Pochoir | Trait | Pour |
| --- | --- | --- |
| 0 (rien) | 0,6 | tout le reste |
| 1 | aucun | l'herbe, les fleurs (sinon ce sont des épines noires) |
| 8 | 0,35 | le terrain (le Landscape a la même case) |
| 11 | 0,5 | les colombages, les petits détails |
| 15 | 0,7 | les rochers, les pierres du feu |
| 17 | 0,8 | les arbres, les buissons, les objets |
| 19 | 0,9 | les murs de l'Atelier |
| 21 | 1,0 | les personnages, les bêtes, le toit |
| + 128 | (le même trait) | ce qui luit : pas d'ombre, pas de hachures, il perce la brume. Par exemple, 145 = un objet au trait 0,8 qui luit. |

La règle : pochoir = 1 + trait × 20, plus 128 s'il luit.

**Le visage des personnages** ne doit pas recevoir l'ombre du chapeau. Pour l'instant, donne au matériau du visage le pochoir + 128 : il garde sa couleur pleine. Un matériau dédié viendra plus tard.

**Vérification :** `Mode` à **3** montre le pochoir. Le rouge est l'épaisseur du trait : les personnages sont plus rouges que le décor. Le vert marque ce qui luit.

## 8. Si ça ne marche pas

| Ce que tu vois | Ce que c'est | Ce qu'on fait |
| --- | --- | --- |
| Erreur `SceneTextureLookup` : identifiant inconnu | il manque l'amorce | les six nœuds *SceneTexture* branchés sur `Amorce` (§4) |
| Erreur sur `GetDefaultSceneTextureUV`, `View.BufferSizeAndInvSize` ou `Parameters.SvPosition` | une version d'Unreal qui nomme autrement ces choses | envoie-moi le message exact : seules les dernières lignes du fichier changent |
| Erreur sur `struct FBrimoEncre` | le compilateur refuse la structure dans le nœud | envoie-moi le message : je passe les fonctions dans un fichier `.ush` |
| `Mode` 3 tout noir, même sur les personnages | le pochoir n'est pas actif | §1 : *Custom Depth-Stencil Pass*, **Enabled with Stencil** ; §7 : la case *Render CustomDepth Pass* |
| Les contours sont décalés des objets | la *Screen Percentage* n'est pas à 100 | §1 |
| Tout est blanc, ou tout est hachuré | l'éclairement n'est pas réglé | §6 b, avec `Mode` 1 |
| Le papier fait des bandes ou des coutures | la texture est mal importée | §2 : sRGB décoché, *Wrap* |

**Les vues de réglage** (`Mode`), à m'envoyer en capture quand quelque chose cloche :

| Mode | Ce qu'on voit |
| --- | --- |
| 0 | le rendu |
| 1 | l'éclairement (blanc : plein soleil) |
| 2 | les trois tons |
| 3 | le pochoir (rouge : épaisseur du trait ; vert : luit) |
| 4 | ce qui luit |
| 5 | les contours seuls |
| 6 | la profondeur (noir : au-delà de la brume) |

---

## Comment c'est vérifié, ici

- `node outils/shaders/compiler.js` compile le nœud avec glslang (HLSL → SPIR-V), puis le traduit en GLSL avec SPIRV-Cross.
- `node outils/shaders/verifier.js` rend la scène de la maquette deux fois. La première fois par la maquette ; la seconde « comme Unreal » : les matériaux écrivent la couleur de base, la scène éclairée, la normale, le pochoir et la profondeur, et le nœud traduit fait l'encre. Puis il compare les deux images, de jour, de loin et de nuit.
- Le nœud fidèle reste sous 1,1 / 255 d'écart moyen, avec moins de 3 % de pixels touchés : les vitres, qui ne luisent qu'à moitié dans la maquette, et quelques pixels de bord. Une ombre volontairement faussée en touche plus de 7 % : le banc échoue alors.
- Une seule retouche est faite pour le banc : glslang ne compile pas les méthodes d'une structure déclarée dans une fonction, alors le banc la sort à la portée globale, sans changer son code. Dans Unreal, elle reste dans le nœud : c'est la façon habituelle d'écrire des fonctions dans un nœud Custom.
- Ce qui ne peut se vérifier qu'à l'écran : les noms propres à Unreal (les dernières lignes du fichier et les numéros des images de la scène), et le réglage de l'étape 6.
