// ---------- Le pont vers le moteur (Unreal) ----------
// Ce que le module Unreal utilise de BrimoCore, sous une forme simple à recopier champ par champ dans des structures
// Unreal (FBrimoSceau...), et sans aucune exception qui s'échappe : le reste d'Unreal est compilé sans.
#pragma once
#include <array>
#include <memory>
#include <string>

#include "brimo/magie.h"

namespace brimo {

// un sceau « à plat » : que des textes et des nombres
struct SceauPlat {
  std::string nom, taille = "moyen", core, core2, core3, shape, trigger, trigger2, lien2, filtre, cible, encre;
  // les cinq cases du second anneau : un modificateur, "" (rien), ou le JSON d'un sous-sceau (il commence par « { »)
  std::array<std::string, NMODS> mods;
  double delai = 2, periode = 2, dimL = 1, dimH = 1;
};

SceauPlat aplatir(const Sceau& s);
Sceau deplier(const SceauPlat& p);  // un sous-sceau au JSON mal formé laisse sa case vide

// le JSON d'un sceau, dans la forme du jeu 2D (pour les sauvegardes, et pour importer les sceaux du jeu 2D)
std::string sceauVersJson(const SceauPlat& p);
bool sceauDepuisJson(const std::string& texte, SceauPlat& p, std::string& erreur);

// charger les données (Core/donnees/brimo.json) et en faire un grimoire ; rend false et dit pourquoi en cas d'échec
bool chargerGrimoire(const std::string& chemin, std::unique_ptr<Grimoire>& g, std::string& erreur);

// le nom d'un glyphe, quel que soit son anneau (essence, forme, modificateur, déclencheur, filtre, cible, taille) ; "" si inconnu
std::string nomGlyphe(const Donnees& d, const Id& id);
std::string couleurEssence(const Donnees& d, const Id& id);  // "#rrggbb", ou "" si inconnue

}  // namespace brimo
