# Installer le PC pour Brimoland 3D

L'étape 0.7 du journal de bord. Tout ce qu'il faut pour ouvrir le projet Unreal le jour où le PC est là, dans l'ordre.
Chaque étape finit par une **vérification** : si elle ne passe pas, arrête-toi et envoie-moi une capture.

Versions vérifiées le 5 novembre 2026 sur la documentation d'Epic (*Setting Up Visual Studio for Unreal Engine*, version 5.8) :

| Logiciel | Version | Note |
| --- | --- | --- |
| Unreal Engine | **5.8** | la dernière version stable ; la 5.9 est annoncée, sans date |
| Visual Studio | **2026** (18.0 ou plus), Community | Epic le conseille pour la 5.8 ; Visual Studio 2022 (17.14 ou plus) marche aussi |
| Outils C++ (MSVC) | 14.50 (14.38 au minimum) | installés avec Visual Studio |
| SDK Windows | 10.0.26100 ou plus récent (10.0.22621 au minimum) | idem |
| .NET | 10.0 | idem, avec Visual Studio 2026 |
| Git et Git LFS | les dernières | |
| Blender | la dernière stable | pour les modèles |

Compte une demi-journée, surtout des téléchargements (une centaine de gigaoctets en tout).

---

## 0. Le PC

- Windows 10 ou 11, en 64 bits.
- Une carte graphique compatible DirectX 12, avec 8 Go de mémoire vidéo ou plus, et ses **pilotes à jour** (site de NVIDIA, d'AMD ou d'Intel).
- 32 Go de mémoire vive conseillés (16 au minimum), un processeur à 6 cœurs ou plus.
- Un SSD avec **150 Go libres** : Unreal en prend environ 60, le projet et ses caches grossissent ensuite.

**Vérification :** *Paramètres → Système → Informations système* donne Windows 64 bits ; le Gestionnaire des tâches, onglet *Performance*, montre la carte graphique et la mémoire.

## 1. Visual Studio

1. Télécharge **Visual Studio 2026 Community** sur [visualstudio.microsoft.com](https://visualstudio.microsoft.com/) (gratuit), et lance l'installateur.
2. Dans l'onglet **Charges de travail** (*Workloads*), coche :
   - **Développement Desktop en C++** (*Desktop development with C++*) ;
   - **Développement .NET Desktop** (*.NET desktop development*) ;
   - **Développement .NET Multi-platform App UI** (*.NET Multi-platform App UI development*) ;
   - **Développement de jeux en C++** (*Game development with C++*).
3. À droite, dans le détail de **Développement de jeux en C++**, coche :
   - **Outils de profilage C++** (*C++ profiling tools*) ;
   - **C++ AddressSanitizer** ;
   - le **SDK Windows 11** le plus récent (10.0.26100 ou plus) ;
   - **Programme d'installation d'Unreal Engine** (*Unreal Engine installer*).
4. Installe, puis redémarre le PC.

**Vérification :** ouvre Visual Studio, *Aide → À propos de Microsoft Visual Studio* : la version commence par **18**.

## 2. Unreal Engine 5.8

1. Installe l'**Epic Games Launcher** ([unrealengine.com](https://www.unrealengine.com/)) et connecte-toi (un compte Epic gratuit).
2. Onglet **Unreal Engine → Bibliothèque**, clique sur **+** à côté de *Versions du moteur*, choisis **5.8**, puis **Options** :
   - coche **Contenu de démarrage**, **Modèles et packs de fonctionnalités** et **Code source du moteur** (il sert à comprendre les erreurs) ;
   - décoche les plateformes autres que Windows (Android, iOS, Linux) et les *Symboles de débogage de l'éditeur*, qui pèsent des dizaines de gigaoctets.
3. Installe. C'est long.

**Vérification, la plus importante :** lance Unreal 5.8.

1. *Jeux → Troisième personne*, choisis **C++** (et non Blueprint), nomme le projet `Essai` et crée-le.
2. Unreal compile le code, puis ouvre la carte : tu peux te promener avec le mannequin.

Ça prouve que Visual Studio et Unreal se parlent. Ferme ensuite l'éditeur ; le dossier `Essai` peut être supprimé.

## 3. Git, Git LFS et le dépôt

1. Installe **Git pour Windows** ([git-scm.com](https://git-scm.com/)) ; Git LFS est dedans. Garde les options par défaut.
2. Ouvre un terminal (*PowerShell*) et tape une seule fois :
   ```
   git lfs install
   ```
3. Installe **GitHub Desktop** ([desktop.github.com](https://desktop.github.com/)) et connecte-toi avec ton compte GitHub.
4. *File → Clone repository* → `matthiasdepinay-code/Brimoland-3d`, dans un **chemin court, sans espaces ni accents**, par exemple `C:\Brimo\Brimoland-3d`. Unreal n'aime pas les chemins longs.

**Vérification :** ouvre `Art\Reference\Planches\Planche_Gribouille.png` : c'est bien une image de 5 Mo. Si c'est un petit fichier texte de quelques lignes, Git LFS n'a pas récupéré les fichiers : dans le dossier du dépôt, tape `git lfs pull`.

## 4. Blender

Télécharge la dernière version stable sur [blender.org](https://www.blender.org/) et installe-la.

**Vérification :** *Fichier → Importer → glTF 2.0* → `Art\Reference\Gabarits\Gabarit_Apprenti.glb`. L'apprenti(e) mesure 2,40 m avec son chapeau, et regarde vers −Y (pavé numérique 1 : on le voit de face).

## 5. BrimoCore sous Windows (facultatif, cinq minutes)

La magie du jeu, compilée et testée sur ton PC : c'est la preuve que le compilateur est prêt.

1. Menu Démarrer → **Developer PowerShell for VS 2026**.
2. Dans le dossier du dépôt :
   ```
   cmake -S Core -B build
   cmake --build build --config Release
   ctest --test-dir build -C Release --output-on-failure
   ```

**Vérification :** `100% tests passed`.

## 6. Deux réglages qui font gagner du temps

- **L'antivirus.** Windows Defender scanne chaque fichier compilé, ce qui ralentit beaucoup la compilation. Dans *Sécurité Windows → Protection contre les virus → Gérer les paramètres → Exclusions*, ajoute le dossier `C:\Brimo`.
- **Unreal sur le SSD**, avec le dépôt : les chargements et la compilation des shaders en dépendent.

---

## Ensuite

Quand tout est vert, dis-le moi : on passe au **jalon J1**.

1. On ouvre le projet `Unreal\Brimoland\Brimoland.uproject`. Unreal propose de compiler les modules : **Oui**.
2. Dans la console, on tape `brimo.essai` : BrimoCore répond.
3. Dans l'Output Log, en mode **Python** : `import brimo_tout; brimo_tout.lancer()`. Ça importe les assets, monte le Jardin d'essai et pose le rendu à l'encre ([le détail](../Unreal/Brimoland/LISEZMOI.md)).
4. On règle l'encre avec tes yeux ([la recette](../Unreal/Rendu/RECETTE.md), §6), puis **Play**.
