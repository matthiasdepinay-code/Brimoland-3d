# Les livraisons

Pose ici une archive d'assets telle quelle (`.zip` ou `.7z`, dans Git LFS), par exemple `Bromland_Assets_V1.zip`, puis *Commit* et *Push* dans GitHub Desktop.
Claude la décompresse, vérifie chaque asset (échelle, orientation, noms, triangles, squelette), le range dans `Art/Source/` et `Art/Export/`, et le pose dans la maquette avec le rendu à l'encre.

| Livraison | Reçue | Contenu | Contrôle |
| --- | --- | --- | --- |
| [V1](V1/) | 6 nov. 2026 | 138 modèles, 187 animations, textures | [le rapport](V1/RAPPORT.md) |

Contrôler une livraison : `node outils/assets/mesurer.js <dossier Art> <rapport.json>`, puis `node outils/assets/apercu.js <dossier Art> <dossier des images>`.
