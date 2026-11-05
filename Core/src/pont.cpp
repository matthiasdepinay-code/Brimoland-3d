#include "brimo/pont.h"

#include <exception>

namespace brimo {

SceauPlat aplatir(const Sceau& s) {
  SceauPlat p;
  p.nom = s.nom; p.taille = s.taille; p.core = s.core; p.core2 = s.core2; p.core3 = s.core3; p.shape = s.shape;
  p.trigger = s.trigger; p.trigger2 = s.trigger2; p.lien2 = s.lien2; p.filtre = s.filtre; p.cible = s.cible; p.encre = s.encre;
  for (int i = 0; i < NMODS; i++) p.mods[i] = s.mods[i].sous ? s.mods[i].sous->versJson().ecrire() : s.mods[i].id;
  p.delai = s.delai; p.periode = s.periode; p.dimL = s.dimL; p.dimH = s.dimH;
  return p;
}

Sceau deplier(const SceauPlat& p) {
  Sceau s;
  s.nom = p.nom; s.taille = p.taille; s.core = p.core; s.core2 = p.core2; s.core3 = p.core3; s.shape = p.shape;
  s.trigger = p.trigger; s.trigger2 = p.trigger2; s.lien2 = p.lien2; s.filtre = p.filtre; s.cible = p.cible; s.encre = p.encre;
  for (int i = 0; i < NMODS; i++) {
    const std::string& m = p.mods[i];
    if (!m.empty() && m[0] == '{') {
      try { s.mods[i].sous = std::make_unique<Sceau>(Sceau::depuisJson(Json::lire(m))); } catch (const std::exception&) { /* la case reste vide */ }
    } else s.mods[i].id = m;
  }
  s.delai = p.delai; s.periode = p.periode; s.dimL = p.dimL; s.dimH = p.dimH;
  return s;
}

std::string sceauVersJson(const SceauPlat& p) { return deplier(p).versJson().ecrire(); }

bool sceauDepuisJson(const std::string& texte, SceauPlat& p, std::string& erreur) {
  try { p = aplatir(Sceau::depuisJson(Json::lire(texte))); return true; }
  catch (const std::exception& e) { erreur = e.what(); return false; }
}

bool chargerGrimoire(const std::string& chemin, std::unique_ptr<Grimoire>& g, std::string& erreur) {
  try {
    Donnees d = Donnees::charger(chemin);
    if (d.essences.empty()) { erreur = "aucune essence dans " + chemin; return false; }
    g = std::make_unique<Grimoire>(std::move(d));
    return true;
  } catch (const std::exception& e) { erreur = e.what(); return false; }
}

std::string nomGlyphe(const Donnees& d, const Id& id) {
  if (auto it = d.cores.find(id); it != d.cores.end()) return it->second.nom;
  for (const auto* m : {&d.shapes, &d.triggers, &d.filtres, &d.cibles, &d.pseudo}) if (auto it = m->find(id); it != m->end()) return it->second.nom;
  if (auto it = d.mods.find(id); it != d.mods.end()) return it->second.nom;
  if (auto it = d.tailles.find(id); it != d.tailles.end()) return it->second.nom;
  return "";
}

std::string couleurEssence(const Donnees& d, const Id& id) {
  if (auto it = d.cores.find(id); it != d.cores.end()) return it->second.couleur;
  return "";
}

}  // namespace brimo
