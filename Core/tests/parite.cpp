// Tests de parité : le cœur C++ doit répondre exactement comme le jeu 2D.
// Les vecteurs (tests/vecteurs.json) sont calculés par le jeu 2D lui-même (outils/depuis-le-jeu-2d.js) :
// 1 500 sceaux tirés au hasard, avec leur coût, leurs paramètres, leur fusion, leur taille, leur tracé, leur relecture...
#include <cmath>
#include <cstdio>
#include <map>
#include <string>

#include "brimo/magie.h"

using namespace brimo;

namespace {

std::map<std::string, int> echecs;
std::map<std::string, int> vus;
int exemples = 0;

// deux JSON égaux ? (nombres à 2e-6 près ; un champ absent vaut null)
bool egal(const Json& a, const Json& b, std::string& ou, const std::string& chemin = "") {
  if (a.nul() && b.nul()) return true;
  if (a.estNombre() && b.estNombre()) { const double x = a.nombre(), y = b.nombre(); if (std::fabs(x - y) <= 2e-6 * std::max(1.0, std::fabs(y))) return true; ou = chemin; return false; }
  if (a.type() != b.type()) { ou = chemin; return false; }
  switch (a.type()) {
    case Json::Type::Bool: if (a.bou() == b.bou()) return true; ou = chemin; return false;
    case Json::Type::Texte: if (a.texte() == b.texte()) return true; ou = chemin; return false;
    case Json::Type::Liste:
      if (a.taille() != b.taille()) { ou = chemin + " (longueur)"; return false; }
      for (size_t i = 0; i < a.taille(); i++) if (!egal(a[i], b[i], ou, chemin + "[" + std::to_string(i) + "]")) return false;
      return true;
    case Json::Type::Objet: {
      for (const auto& [k, v] : a.objet()) if (!egal(v, b[k], ou, chemin + "." + k)) return false;
      for (const auto& [k, v] : b.objet()) if (!a.a(k) && !egal(Json(), v, ou, chemin + "." + k)) return false;
      return true;
    }
    default: return true;
  }
}
void verifier(const std::string& quoi, const Json& obtenu, const Json& attendu, int n) {
  vus[quoi]++;
  std::string ou;
  if (egal(obtenu, attendu, ou)) return;
  if (echecs[quoi]++ < 3 && exemples++ < 30) std::printf("  ✗ cas %d, %s%s\n      obtenu  : %.300s\n      attendu : %.300s\n", n, quoi.c_str(), ou.c_str(), obtenu.ecrire().c_str(), attendu.ecrire().c_str());
}

Json L(const std::vector<std::string>& v) { Json j = Json(Json::Liste{}); for (const auto& x : v) j.pousser(x); return j; }
Json opt(const std::optional<std::string>& o) { return o ? Json(*o) : Json(); }
Json txt(const std::string& s) { return s.empty() ? Json() : Json(s); }

Json enJson(const Parametres& p) {
  Json j;
  j["power"] = p.power; j["range"] = p.range; j["duration"] = p.duration; j["size"] = p.size; j["bounces"] = p.bounces; j["persist"] = p.persist; j["speed"] = p.speed;
  j["extra"] = p.extra; j["inverse"] = p.inverse; j["echo"] = p.echo; j["teleguide"] = p.teleguide; j["orbite"] = p.orbite; j["canalise"] = p.canalise; j["traj"] = txt(p.traj);
  j["percant"] = p.percant; j["gerbe"] = p.gerbe; j["matiere"] = p.matiere; j["rafale"] = p.rafale; j["dimL"] = p.dimL; j["dimH"] = p.dimH;
  Json ess = Json(Json::Objet{}); for (const auto& [e, q] : p.ess) { Json o; o["n"] = q.n; o["pk"] = q.pk; ess[e] = o; } j["ess"] = ess;
  j["invEss"] = L(p.invEss);
  Json li = Json(Json::Objet{}); for (const auto& [i, k] : p.liaisons) li[std::to_string(i)] = k; j["liaisons"] = li;
  Json lg = Json(Json::Objet{}); for (const auto& [e, n] : p.lg) lg[e] = n; j["lg"] = lg;
  Json asp = Json(Json::Objet{}); for (const auto& [e, v] : p.asp) { Json l = Json(Json::Liste{}); for (const auto& A : v) { Json o; o["id"] = A.id; o["devient"] = A.devient; o["n"] = A.n; l.pousser(o); } asp[e] = l; } j["asp"] = asp;
  return j;
}
Json enJson(const Lancement& r) {
  Json j; j["effets"] = L(r.effets); j["effetsBase"] = L(r.effetsBase); j["gInv"] = r.gInv; j["combo"] = opt(r.combo); j["trig"] = r.trig;
  j["repeat"] = r.repeat; j["expire"] = r.expire; j["delai"] = r.delai; j["filtre"] = txt(r.filtre); j["cible"] = r.cible; j["bancal"] = r.bancal;
  j["power"] = r.power; j["range"] = r.range; j["size"] = r.size; j["duration"] = r.duration;
  Json lg = Json(Json::Objet{}); for (const auto& [e, n] : r.lg) lg[e] = n; j["lg"] = lg;
  if (r.elan) { Json e; e["essence"] = txt(r.elan->essence); e["immediat"] = r.elan->immediat; e["maintenu"] = r.elan->maintenu; e["teintes"] = L(r.elan->teintes); e["avance"] = r.elan->avance; j["elan"] = e; }
  else j["elan"] = Json();
  return j;
}

}  // namespace

int main(int argc, char** argv) {
  const std::string racine = argc > 1 ? argv[1] : ".";
  Grimoire G(Donnees::charger(racine + "/donnees/brimo.json"));
  const Json V = Json::lireFichier(racine + "/tests/vecteurs.json");
  std::printf("Parité avec %s\n", V["source"].texte().c_str());
  const auto& cas = V["cas"].liste();
  for (size_t n = 0; n < cas.size(); n++) {
    const Json& c = cas[n];
    const Sceau s = G.normaliser(Sceau::depuisJson(c["brut"]));
    const int k = (int)n;
    verifier("normaliser", s.versJson(), c["normal"], k);
    verifier("cout", Json(G.cout(s)), c["cout"], k);
    { Json d = Json(Json::Liste{}); for (const auto& q : G.coutDetail(s)) { Json l = Json(Json::Liste{}); l.pousser(q.cle); l.pousser(q.v); l.pousser(q.pct); d.pousser(l); } verifier("coutDetail", d, c["detail"], k); }
    verifier("parametres", enJson(G.parametres(s)), c["params"], k);
    const auto ef = G.effets(s);
    verifier("effets", L(ef), c["effets"], k);
    const auto cle = G.comboCle(ef);
    verifier("comboCle", opt(cle), c["combo"], k);
    { auto I = cle ? G.comboInfo(*cle) : std::nullopt; verifier("comboNom", I ? Json(I->nom) : Json(), c["comboNom"], k); }
    { const auto E = G.equilibre(s); Json e; e["etat"] = E.etat; e["d"] = E.d; e["n"] = E.n; verifier("equilibre", e, c["equilibre"], k); }
    std::vector<Id> tailles; for (const auto& t : c["tailles"].liste()) tailles.push_back(t.texte());
    const int slots = (int)c["slots"].nombre();
    verifier("tailleMin", Json(G.tailleMin(s, tailles, slots)), c["tailleMin"], k);
    verifier("tailleBesoin", Json(G.tailleBesoin(s, slots)), c["tailleBesoin"], k);
    verifier("geste", Json(G.geste(s)), c["geste"], k);
    verifier("nGlyphes", Json(G.nGlyphes(s)), c["nGlyphes"], k);
    verifier("declencheurs", L(G.declencheurs(s)), c["triggers"], k);
    verifier("nbSlots", Json(G.nbSlots(s, slots)), c["nbSlots"], k);
    verifier("enDeuxTemps", Json(G.enDeuxTemps(s)), c["deuxTemps"], k);
    if (G.enDeuxTemps(s)) { auto [A, B] = G.scinder(s); Json p = Json(Json::Liste{}); p.pousser(A.versJson()); p.pousser(B.versJson()); verifier("scinder", p, c["scinde"], k); }
    { Json a = Json(Json::Liste{}); for (const auto& q : G.anneaux(s)) { Json o; o["cases"] = L(q.cases); o["de"] = q.de; o["a"] = q.a; a.pousser(o); } verifier("anneaux", a, c["anneaux"], k); }
    { auto p = G.partiel(s, c["prog"].nombre()); verifier("partiel", p ? p->versJson() : Json(), c["partiel"], k); }
    { Json u = Json(Json::Liste{}); for (const auto& q : G.inutiles(s)) { Json o; o["sid"] = q.sid; o["raison"] = q.raison; u.pousser(o); } verifier("inutiles", u, c["inutiles"], k); }
    { const auto E = G.etat(s); Json e; e["ok"] = E.ok; e["raison"] = E.raison; verifier("etat", e, c["etat"], k); }
    verifier("nom", Json(G.nom(s)), c["nom"], k);
    verifier("profondeur", Json(G.profondeur(s)), c["profondeur"], k);
    verifier("lancement", enJson(G.lancement(s, c["charge"].nombre())), c["lancement"], k);
  }
  int nr = 0;
  for (const auto& r : V["recettes"].liste()) {
    const std::string cle = r["cle"].texte();
    auto R = G.recette(cle);
    Json j; if (R) { j["taille"] = R->taille; j["core"] = R->core; j["core2"] = txt(R->core2); j["core3"] = txt(R->core3); j["mods"] = L(R->mods); }
    verifier("recette", R ? j : Json(), r["recette"], nr);
    auto I = G.comboInfo(cle); Json i;
    if (I) { i["nom"] = I->nom; i["desc"] = I->desc; i["indice"] = I->indice; if (I->trio) i["trio"] = true; if (!I->genre.empty()) { i["genre"] = I->genre; i["effet"] = I->effet; } }
    verifier("comboInfo", I ? i : Json(), r["info"], nr);
    nr++;
  }
  int total = 0, rates = 0;
  for (const auto& [q, n] : vus) { total += n; rates += echecs[q]; std::printf("  %s %-13s %4d / %d\n", echecs[q] ? "✗" : "✓", q.c_str(), n - echecs[q], n); }
  std::printf("Bilan : %d / %d vérifications identiques au jeu 2D (%zu sceaux, %d recettes)\n", total - rates, total, cas.size(), nr);
  return rates ? 1 : 0;
}
