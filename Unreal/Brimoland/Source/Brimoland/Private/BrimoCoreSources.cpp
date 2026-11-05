// BrimoCore, compilé avec le module de jeu : toutes ses sources (Core/src/, à la racine du dépôt) en un seul fichier.
// Elles sont incluses telles quelles, sans aucun en-tête d'Unreal : Brimoland.Build.cs coupe l'en-tête précompilé
// et la compilation « unity » d'Unreal pour ce module, afin que ses macros (PI, check...) ne s'en mêlent pas.
// Le même fichier est compilé et testé hors d'Unreal (Core/CMakeLists.txt : brimo_unreal, en C++20, sans RTTI),
// et doit y passer toute la parité avec le jeu 2D.

// les textes de la magie sont en UTF-8 (« Gravité ») : si le compilateur lisait les sources autrement, tout serait faux
static_assert(sizeof(u8"é") == 3 && sizeof("é") == 3, "BrimoCore doit être compilé en UTF-8 (option /utf-8 de MSVC)");

#include "json.cpp"
#include "donnees.cpp"
#include "sceau.cpp"
#include "pont.cpp"
