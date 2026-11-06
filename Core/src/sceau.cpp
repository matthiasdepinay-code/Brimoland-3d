// Le modèle du sceau : port fidèle de js/seal.js (jeu 2D). Chaque fonction garde le nom de son modèle en commentaire.
#include <algorithm>
#include <cmath>
#include <set>

#include "brimo/magie.h"

namespace brimo {
namespace {

const Id VIDE_ID;
const double DEMI_TOUR = 3.141592653589793;  // π (pas « PI » : Unreal en fait une macro)
// Math.round de JavaScript (les demis vont vers +∞)
double jsRound(double x) { return std::floor(x + 0.5); }
template <class T>
bool contient(const std::vector<T>& v, const T& x) { return std::find(v.begin(), v.end(), x) != v.end(); }
std::string joindre(const std::vector<std::string>& v, const std::string& sep) { std::string o; for (size_t i = 0; i < v.size(); i++) { if (i) o += sep; o += v[i]; } return o; }

const std::vector<Id> LIABLES = {"puissance", "inverser"};
const std::vector<Id> PROJ = {"projectile", "chaine"};
const std::map<Id, std::vector<Id>> SEULEMENT = {
  {"rebond", PROJ}, {"teleguide", {"projectile", "chaine", "soi"}}, {"orbite", PROJ}, {"percant", PROJ}, {"boomerang", PROJ}, {"spirale", PROJ},
  {"zigzag", PROJ}, {"rasesol", PROJ}, {"cloche", {"projectile"}}, {"vitesse", {"projectile", "chaine", "vague"}},
  {"rafale", {"projectile", "chaine", "trait", "soi"}}, {"double", {"projectile", "chaine", "zone", "mur", "trait", "invocation", "soi"}},
};
const std::map<Id, std::vector<Id>> JAMAIS = {{"canalise", {"projectile", "soi", "chaine", "prise"}}, {"portee", {"aura"}}};
const std::vector<Id> SOI_PORTEE = {"foudre", "lumiere", "portail", "vie", "esprit", "gravite"};
const std::vector<Id> SOI_CIBLE = {"feu", "eau", "vent", "terre", "vie", "lumiere", "foudre", "portail", "esprit", "gravite"};
const std::vector<Id> ORDRE_TAILLES = {"petit", "moyen", "grand"};

double ecartAngle(double a, double b) { return std::fabs(std::fmod(std::fmod(a - b, 360.0) + 540.0, 360.0) - 180.0); }
bool commenceParVoyelle(const std::string& n, bool aussiMajuscules) {
  if (n.empty()) return false;
  unsigned char c = n[0];
  if (std::string("aeiouh").find(char(c)) != std::string::npos) return true;
  if (aussiMajuscules && std::string("AEIOUH").find(char(c)) != std::string::npos) return true;
  if (c == 0xC3 && n.size() > 1) { unsigned char d = n[1]; if (d == 0xA9 || d == 0xA8 || d == 0xAA) return true; if (aussiMajuscules && (d == 0x89 || d == 0x88 || d == 0x8A)) return true; }
  return false;
}

}  // namespace

// ---------- texte ----------
std::string minuscules(const std::string& s) {
  std::string o = s;
  for (size_t i = 0; i < o.size(); i++) {
    unsigned char c = o[i];
    if (c >= 'A' && c <= 'Z') o[i] = char(c + 32);
    else if (c == 0xC3 && i + 1 < o.size()) { unsigned char d = o[i + 1]; if (d >= 0x80 && d <= 0x9E && d != 0x97) o[i + 1] = char(d + 0x20); i++; }
    else if (c == 0xC5 && i + 1 < o.size()) { if ((unsigned char)o[i + 1] == 0x92) o[i + 1] = '\x93'; i++; }  // Œ -> œ
  }
  return o;
}
std::string minusculePremiere(const std::string& s) {
  if (s.empty()) return s;
  size_t n = ((unsigned char)s[0] < 0x80) ? 1 : ((unsigned char)s[0] < 0xE0 ? 2 : (unsigned char)s[0] < 0xF0 ? 3 : 4);
  return minuscules(s.substr(0, n)) + s.substr(n);
}

// ---------- Mod, Sceau ----------
Mod::Mod(const Mod& o) : id(o.id), sous(o.sous ? std::make_unique<Sceau>(*o.sous) : nullptr) {}
Mod& Mod::operator=(const Mod& o) { if (this != &o) { id = o.id; sous = o.sous ? std::make_unique<Sceau>(*o.sous) : nullptr; } return *this; }

const Id& Sceau::champ(const std::string& k) const {
  static const std::map<std::string, Id Sceau::*> CHAMPS = {
    {"core", &Sceau::core}, {"core2", &Sceau::core2}, {"core3", &Sceau::core3}, {"shape", &Sceau::shape}, {"trigger", &Sceau::trigger}, {"trigger2", &Sceau::trigger2},
    {"lien2", &Sceau::lien2}, {"filtre", &Sceau::filtre}, {"cible", &Sceau::cible}, {"encre", &Sceau::encre}, {"taille", &Sceau::taille},
  };
  auto it = CHAMPS.find(k);
  return it != CHAMPS.end() ? this->*(it->second) : VIDE_ID;
}
Id& Sceau::champ(const std::string& k) { return const_cast<Id&>(static_cast<const Sceau&>(*this).champ(k)); }

Sceau Sceau::depuisJson(const Json& j) {
  Sceau s;
  s.nom = j["nom"].texte(); s.taille = j["taille"].texte();
  for (const char* k : {"core", "core2", "core3", "shape", "trigger", "trigger2", "lien2", "filtre", "cible", "encre"}) s.champ(k) = j[k].texte();
  const auto& L = j["mods"].liste();
  for (size_t i = 0; i < L.size() && i < (size_t)NMODS; i++) {
    if (L[i].estTexte()) s.mods[i].id = L[i].texte();
    else if (L[i].estObjet() && L[i].a("sub")) s.mods[i].sous = std::make_unique<Sceau>(depuisJson(L[i]["sub"]));
  }
  s.delai = j["delai"].nombre(0); s.periode = j["periode"].nombre(0); s.dimL = j["dimL"].nombre(0); s.dimH = j["dimH"].nombre(0);
  return s;
}
Json Sceau::versJson() const {
  Json j; j["nom"] = nom; j["taille"] = taille;
  for (const char* k : {"core", "core2", "core3", "shape", "trigger", "trigger2", "lien2", "filtre", "cible", "encre"}) j[k] = champ(k).empty() ? Json() : Json(champ(k));
  Json m = Json(Json::Liste{});
  for (const auto& q : mods) { if (q.sous) { Json o; o["sub"] = q.sous->versJson(); m.pousser(o); } else m.pousser(q.id.empty() ? Json() : Json(q.id)); }
  j["mods"] = m; j["delai"] = delai; j["periode"] = periode; j["dimL"] = dimL; j["dimH"] = dimH;
  return j;
}

// ---------- création, normalisation (Seal.create, Seal.clone) ----------
Sceau Grimoire::creer(const Id& t) const { Sceau s; s.taille = t; return s; }

Sceau Grimoire::normaliser(const Sceau& s) const {
  Sceau r;
  for (int i = 0; i < NMODS; i++) {
    const Mod& m = s.mods[i];
    if (m.sous) r.mods[i].sous = std::make_unique<Sceau>(normaliser(*m.sous));
    else if (!m.id.empty()) { auto mm = D.migrMods.find(m.id); if (mm != D.migrMods.end()) r.mods[i].id = mm->second; else if (D.mods.count(m.id)) r.mods[i].id = m.id; }
  }
  // anciennes essences devenues aspects : l'essence mère au centre, l'aspect sur l'anneau
  Sceau tmp; tmp.taille = s.taille.empty() ? "moyen" : s.taille;
  const int nb = nbSlots(tmp, 3);
  auto migrer = [&](const Id& c) -> Id {
    if (c.empty()) return c;
    auto it = D.migration.find(c); if (it == D.migration.end()) return c;
    bool deja = false; for (const auto& q : r.mods) if (!q.sous && q.id == it->second.second) deja = true;
    if (!deja) { int i = -1; for (int k = 0; k < NMODS; k++) if (r.mods[k].vide() && k < nb) { i = k; break; } if (i < 0) i = 0; r.mods[i] = Mod(it->second.second); }
    return it->second.first;
  };
  const Id core = migrer(s.core), core2 = migrer(s.core2), core3 = migrer(s.core3);
  r.nom = s.nom; r.taille = s.taille.empty() ? "moyen" : s.taille; r.core = core; r.core2 = core2;
  r.core3 = s.taille == "grand" ? core3 : ""; r.shape = s.shape; r.trigger = s.trigger; r.trigger2 = s.trigger2;
  r.lien2 = s.taille == "grand" ? s.lien2 : ""; r.filtre = s.filtre; r.cible = s.cible;
  r.delai = s.delai ? s.delai : 2; r.periode = s.periode ? s.periode : 2; r.encre = s.encre; r.dimL = s.dimL ? s.dimL : 1; r.dimH = s.dimH ? s.dimH : 1;
  return r;
}

// ---------- la base ----------
const Taille& Grimoire::taille(const Sceau& s) const { auto it = D.tailles.find(s.taille.empty() ? "moyen" : s.taille); return it != D.tailles.end() ? it->second : D.tailles.at("moyen"); }
int Grimoire::nbSlots(const Sceau& s, int slotsMoyen) const { const Id t = s.taille.empty() ? "moyen" : s.taille; return t == "petit" ? 1 : t == "grand" ? 5 : std::min(3, slotsMoyen); }
std::vector<Id> Grimoire::declencheurs(const Sceau& s) const { std::vector<Id> o; if (!s.trigger.empty()) o.push_back(s.trigger); if (s.taille == "grand" && !s.trigger2.empty()) o.push_back(s.trigger2); return o; }
std::vector<const Sceau*> Grimoire::sousSceaux(const Sceau& s) const { std::vector<const Sceau*> o; for (const auto& m : s.mods) if (m.sous) o.push_back(m.sous.get()); return o; }
int Grimoire::profondeur(const Sceau& s) const { int d = 0; for (auto* q : sousSceaux(s)) d = std::max(d, 1 + profondeur(*q)); return d; }

// ---------- le coût (Seal.cost, coutCase, coutDetail) ----------
int Grimoire::cout(const Sceau& s) const {
  auto cc = [&](const Id& c) { auto it = D.cores.find(c); return it != D.cores.end() ? it->second.cout : 0; };
  double c = 0;
  if (!s.core.empty()) c += cc(s.core);
  if (!s.core2.empty()) c += cc(s.core2) + 2;
  if (!s.core3.empty() && s.taille == "grand") c += cc(s.core3) + 3;
  if (!s.shape.empty() && D.shapes.count(s.shape)) c += D.shapes.at(s.shape).cout;
  for (const auto& m : s.mods) { if (m.vide()) continue; if (m.sous) c += cout(*m.sous); else if (D.mods.count(m.id)) c += D.mods.at(m.id).cout; }
  for (const auto& t : declencheurs(s)) if (D.triggers.count(t)) c += D.triggers.at(t).cout;
  if (!s.filtre.empty() && s.taille != "petit" && D.filtres.count(s.filtre)) c += D.filtres.at(s.filtre).cout;
  if (!s.cible.empty() && s.taille != "petit" && D.cibles.count(s.cible)) c += D.cibles.at(s.cible).cout;
  const Taille& T = taille(s);
  // la surface de la forme se paie : un grand mur coûte plus qu'un petit
  if (s.taille != "petit" && D.dims.count(s.shape)) { double A = (s.dimL ? s.dimL : 1) * (!D.dims.at(s.shape).second.empty() ? (s.dimH ? s.dimH : 1) : 1); c += std::max(-2.0, jsRound((std::sqrt(A) - 1) * 3)); }
  int nMods = 0; for (const auto& m : s.mods) if (!m.vide()) nMods++;
  const bool eq = nMods >= 2 && equilibre(s).etat == "equilibre";
  return (int)std::max(s.core.empty() ? 0.0 : 1.0, jsRound(c * T.coutMul * (eq ? 0.9 : 1) + T.coutAdd));
}

double Grimoire::coutCase(const Sceau& s, const std::string& sid) const {
  const double mul = taille(s).coutMul; auto m = [&](double v) { return v * mul; };
  auto cc = [&](const Id& c) { auto it = D.cores.find(c); return it != D.cores.end() ? it->second.cout : 0; };
  if (sid == "core") return s.core.empty() ? 0 : m(cc(s.core));
  if (sid == "core2") return !s.core2.empty() && s.taille != "petit" ? m(cc(s.core2) + 2) : 0;
  if (sid == "core3") return !s.core3.empty() && s.taille == "grand" ? m(cc(s.core3) + 3) : 0;
  if (sid == "shape") return !s.shape.empty() && D.shapes.count(s.shape) ? m(D.shapes.at(s.shape).cout) : 0;
  if (sid == "trigger") return !s.trigger.empty() && D.triggers.count(s.trigger) ? m(D.triggers.at(s.trigger).cout) : 0;
  if (sid == "trigger2") return !s.trigger2.empty() && s.taille == "grand" && D.triggers.count(s.trigger2) ? m(D.triggers.at(s.trigger2).cout) : 0;
  if (sid == "filtre") return !s.filtre.empty() && s.taille != "petit" && D.filtres.count(s.filtre) ? m(D.filtres.at(s.filtre).cout) : 0;
  if (sid == "cible") return !s.cible.empty() && s.taille != "petit" && D.cibles.count(s.cible) ? m(D.cibles.at(s.cible).cout) : 0;
  if (sid.rfind("mod", 0) == 0) { const Mod& q = s.mods[std::stoi(sid.substr(3))]; if (q.vide()) return 0; return m(q.sous ? cout(*q.sous) : (D.mods.count(q.id) ? D.mods.at(q.id).cout : 0)); }
  return 0;
}

std::vector<PartCout> Grimoire::coutDetail(const Sceau& s) const {
  const Taille& T = taille(s); const double m = T.coutMul;
  double sur = 0;
  if (s.taille != "petit" && D.dims.count(s.shape)) sur = std::max(-2.0, jsRound((std::sqrt((s.dimL ? s.dimL : 1) * (!D.dims.at(s.shape).second.empty() ? (s.dimH ? s.dimH : 1) : 1)) - 1) * 3));
  auto somme = [&](std::initializer_list<const char*> ids) { double a = 0; for (auto k : ids) a += coutCase(s, k); return a; };
  std::vector<PartCout> tout = {
    {"centre", "Centre", coutCase(s, "core")}, {"fusion", "Fusion", somme({"core2", "core3"})}, {"forme", "Forme", coutCase(s, "shape") + sur * m},
    {"mods", "Second anneau", somme({"mod0", "mod1", "mod2", "mod3", "mod4"})}, {"pointes", "Pointes", somme({"trigger", "trigger2", "filtre", "cible"})},
  };
  std::vector<PartCout> parts; for (auto& q : tout) if (q.v != 0) parts.push_back(q);
  if (T.coutAdd) parts.push_back({"taille", T.nom + " sceau", T.coutAdd});
  if (equilibre(s).etat == "equilibre") parts.push_back({"equilibre", "Équilibré", -10, true});
  return parts;
}

// ---------- aspects, effets, langages (aspects, effets, effetsDe, langues) ----------
std::map<Id, std::vector<Aspect>> Grimoire::aspects(const Sceau& s) const {
  std::map<Id, std::vector<Aspect>> o;
  for (const auto& m : s.mods) {
    if (m.sous || m.id.empty()) continue;
    auto it = D.mods.find(m.id); if (it == D.mods.end() || it->second.devient.empty()) continue;
    auto& L = o[it->second.aspect];
    auto q = std::find_if(L.begin(), L.end(), [&](const Aspect& x) { return x.id == m.id; });
    if (q != L.end()) q->n = std::min(2, q->n + 1); else L.push_back({m.id, it->second.devient, 1});
  }
  return o;
}
std::vector<Id> Grimoire::effets(const Sceau& s) const {
  auto a = aspects(s);
  std::vector<Id> cores; if (!s.core.empty()) cores.push_back(s.core);
  if (!s.core2.empty() && s.taille != "petit") cores.push_back(s.core2);
  if (!s.core3.empty() && s.taille == "grand") cores.push_back(s.core3);
  std::vector<Id> out;
  for (size_t k = 0; k < cores.size(); k++) {
    const Id& c = cores[k]; size_t dernier = 0; for (size_t q = 0; q < cores.size(); q++) if (cores[q] == c) dernier = q;
    auto it = a.find(c);
    if (it != a.end() && k == dernier) for (const auto& A : it->second) out.push_back(A.devient); else out.push_back(c);
  }
  return out;
}
std::vector<Id> Grimoire::effetsDe(const Sceau& s, const std::string& k) const {
  const Id& c = s.champ(k); if (c.empty()) return {};
  auto a = aspects(s); auto it = a.find(c);
  if (it == a.end()) return {c};
  std::vector<Id> o; for (const auto& A : it->second) o.push_back(A.devient); return o;
}
std::map<Id, int> Grimoire::langues(const Sceau& s) const {
  std::map<Id, int> o;
  for (const auto& [el, L] : D.langages) { int k = 0; for (const auto& m : s.mods) if (!m.sous && m.id == L.glyphe) k++; if (k) o[el] = std::min(2, k); }
  return o;
}

// ---------- la géométrie compte (liaisons, equilibre) ----------
std::map<int, Id> Grimoire::liaisons(const Sceau& s) const {
  const Id t = s.taille.empty() ? "moyen" : s.taille; std::map<int, Id> out; if (t == "petit") return out;
  auto it = D.modAngles.find(t); const auto& ang = it != D.modAngles.end() ? it->second : D.modAngles.at("moyen");
  const int nb = nbSlots(s, NMODS);
  for (size_t i = 0; i < ang.size() && i < (size_t)NMODS; i++) {
    const Mod& m = s.mods[i]; if (m.vide() || m.sous || !contient(LIABLES, m.id) || (int)i >= nb) continue;
    for (const char* k : {"core2", "core3"}) {
      if (s.champ(k).empty() || (std::string(k) == "core3" && t != "grand")) continue;
      if (ecartAngle(ang[i], std::string(k) == "core2" ? 90 : 180) <= 25) out[(int)i] = k;
    }
  }
  return out;
}
Equilibre Grimoire::equilibre(const Sceau& s) const {
  auto it = D.modAngles.find(s.taille.empty() ? "moyen" : s.taille); const auto& ang = it != D.modAngles.end() ? it->second : D.modAngles.at("moyen");
  const int nb = nbSlots(s, NMODS); double x = 0, y = 0; int n = 0;
  for (int i = 0; i < NMODS; i++) { if (s.mods[i].vide() || i >= nb || i >= (int)ang.size()) continue; const double a = ang[i] * DEMI_TOUR / 180; x += std::cos(a); y += std::sin(a); n++; }
  if (n < 2) return {"neutre", 0, n};
  const double d = std::hypot(x, y) / n;
  return {d <= 0.15 ? "equilibre" : d >= 0.75 ? "bancal" : "neutre", d, n};
}

// ---------- les paramètres (Seal.params) ----------
Parametres Grimoire::parametres(const Sceau& s) const {
  const auto L = liaisons(s);
  auto n = [&](const char* m) { int k = 0; for (int i = 0; i < NMODS; i++) if (!s.mods[i].sous && s.mods[i].id == m && !L.count(i)) k++; return k; };
  Parametres P;
  // Puissance ou Inverser posés juste sous une essence fusionnée ne servent qu'elle
  for (const auto& [i, k] : L) {
    const Id& m = s.mods[i].id;
    for (const auto& e : effetsDe(s, k)) { if (m == "puissance") P.ess[e].n++; if (m == "inverser" && !contient(P.invEss, e)) P.invEss.push_back(e); }
  }
  const double pg = 1 + 0.6 * n("puissance");
  for (auto& [e, q] : P.ess) q.pk = (pg + 0.6 * q.n) / pg;
  P.liaisons = L;
  P.power = 1 + 0.6 * n("puissance"); P.range = 1 + 0.5 * n("portee"); P.duration = 1 + 0.8 * n("duree");
  P.size = (1 + 0.5 * n("taille")) * std::pow(0.55, n("reduire"));
  P.bounces = n("rebond") * 2; P.persist = n("persistance"); P.speed = 1 + 0.4 * n("vitesse"); P.extra = n("double");
  P.inverse = n("inverser") > 0; P.echo = n("echo") * 2; P.teleguide = n("teleguide") > 0; P.orbite = n("orbite") > 0; P.canalise = n("canalise") > 0;
  P.lg = langues(s); P.asp = aspects(s);
  P.traj = n("boomerang") ? "boomerang" : n("spirale") ? "spirale" : n("zigzag") ? "zigzag" : n("rasesol") ? "rasesol" : n("cloche") ? "cloche" : "";
  P.percant = n("percant") > 0; P.gerbe = n("gerbe"); P.matiere = n("matiere") > 0; P.rafale = n("rafale");
  P.dimL = s.taille == "petit" ? 1 : (s.dimL ? s.dimL : 1); P.dimH = s.taille == "petit" ? 1 : (s.dimH ? s.dimH : 1);
  return P;
}

// ---------- la taille qui s'ajuste, le tracé (tailleBesoin, tailleMin, nGlyphes, geste) ----------
int Grimoire::tailleBesoin(const Sceau& s, int slotsMoyen) const {
  int b = 0; const int nm = std::min(3, slotsMoyen);
  bool apres1 = false, apresNm = false; for (int i = 0; i < NMODS; i++) if (!s.mods[i].vide()) { if (i >= 1) apres1 = true; if (i >= nm) apresNm = true; }
  if (!s.core2.empty() || !s.filtre.empty() || !s.cible.empty() || (s.dimL ? s.dimL : 1) != 1 || (s.dimH ? s.dimH : 1) != 1 || apres1) b = 1;
  if (!s.core3.empty() || !s.trigger2.empty() || !s.lien2.empty() || apresNm) b = 2;
  return b;
}
Id Grimoire::tailleMin(const Sceau& s, const std::vector<Id>& tailles, int slotsMoyen) const {
  const int b = tailleBesoin(s, slotsMoyen);
  for (int k = b; k < 3; k++) if (contient(tailles, ORDRE_TAILLES[k])) return ORDRE_TAILLES[k];
  for (int k = 2; k >= 0; k--) if (contient(tailles, ORDRE_TAILLES[k])) return ORDRE_TAILLES[k];
  return "moyen";
}
int Grimoire::nGlyphes(const Sceau& s) const {
  int n = 0; for (const char* k : {"core", "shape", "trigger", "core2", "core3", "filtre", "cible", "trigger2"}) if (!s.champ(k).empty()) n++;
  for (const auto& m : s.mods) if (!m.vide()) n++;
  return n;
}
double Grimoire::geste(const Sceau& s) const {
  const double ref = s.taille == "petit" ? 3 : s.taille == "grand" ? 7 : 4;
  return taille(s).geste * std::clamp(nGlyphes(s) / ref, 0.6, 1.6) * (equilibre(s).etat == "equilibre" ? 0.85 : 1);
}

// ---------- le sort en deux temps (enDeuxTemps, scinder) ----------
bool Grimoire::enDeuxTemps(const Sceau& s) const {
  int n = (!s.core.empty()) + (!s.core2.empty()) + (!s.core3.empty());
  return s.taille == "grand" && !s.trigger2.empty() && !s.lien2.empty() && !s.champ(s.lien2).empty() && n >= 2;
}
std::pair<Sceau, Sceau> Grimoire::scinder(const Sceau& s) const {
  const Id k = s.lien2, e = s.champ(k); const auto L = liaisons(s);
  auto aspectDe = [&](const Mod& m) -> Id { if (m.sous || m.id.empty()) return ""; auto it = D.mods.find(m.id); return it != D.mods.end() ? it->second.aspect : ""; };
  // A garde les autres essences, B part seule avec le second déclencheur
  std::vector<std::string> reste; for (const char* q : {"core", "core2", "core3"}) if (q != k && !s.champ(q).empty()) reste.push_back(q);
  std::map<std::string, std::string> cle; for (size_t j = 0; j < reste.size(); j++) cle[reste[j]] = j == 0 ? "core" : "core2";
  std::vector<Mod> pourB; std::array<Mod, NMODS> modsA; std::vector<std::pair<Mod, int>> aPlacer;
  for (int i = 0; i < NMODS; i++) {
    const Mod& m = s.mods[i]; if (m.vide()) continue;
    const Id aspect = aspectDe(m); const bool lie = L.count(i) > 0; const Id Li = lie ? L.at(i) : "";
    if ((!aspect.empty() && aspect == e) || (lie && Li == k)) { pourB.push_back(m); continue; }
    if (aspect.empty() && !lie && !m.sous) pourB.push_back(m);
    // lié à une autre essence : il la suit à sa nouvelle place (sous la seconde essence : 90°)
    if (lie) { if (cle.count(Li) && cle[Li] == "core2" && modsA[0].vide()) modsA[0] = m; else aPlacer.push_back({m, -1}); }
    else aPlacer.push_back({m, i});
  }
  std::stable_sort(aPlacer.begin(), aPlacer.end(), [](const auto& x, const auto& y) { return (x.second >= 0) && !(y.second >= 0); });
  for (const auto& pr : aPlacer) {
    const Mod& m = pr.first; const int i = pr.second;
    auto libre = [&](int q) { return modsA[q].vide() && !(q == 0 && reste.size() > 1 && !m.sous && contient(LIABLES, m.id)); };
    int j = -1;
    if (i >= 0 && libre(i)) j = i; else for (int q : {1, 2, 4, 3, 0}) if (libre(q)) { j = q; break; }
    if (j >= 0) modsA[j] = m;
  }
  Sceau B = s; B.nom = ""; B.taille = "moyen"; B.core = e; B.core2 = ""; B.core3 = ""; B.trigger = s.trigger2; B.trigger2 = ""; B.lien2 = "";
  for (int i = 0; i < NMODS; i++) B.mods[i] = i < 3 && i < (int)pourB.size() ? pourB[i] : Mod();
  Sceau A = s; A.nom = ""; A.core = reste.size() > 0 ? s.champ(reste[0]) : ""; A.core2 = reste.size() > 1 ? s.champ(reste[1]) : ""; A.core3 = ""; A.trigger2 = ""; A.lien2 = ""; A.mods = modsA;
  return {normaliser(A), normaliser(B)};
}

// ---------- le tracé, anneau par anneau (anneaux, partiel) ----------
std::vector<Anneau> Grimoire::anneaux(const Sceau& s) const {
  std::vector<std::vector<std::string>> r(4);
  if (!s.core.empty()) r[0].push_back("core");
  for (const char* k : {"shape", "core2", "core3"}) if (!s.champ(k).empty()) r[1].push_back(k);
  for (int i = 0; i < NMODS; i++) if (!s.mods[i].vide()) r[2].push_back("mod" + std::to_string(i));
  for (const char* k : {"trigger", "trigger2", "filtre", "cible"}) if (!s.champ(k).empty()) r[3].push_back(k);
  double n = 0; for (auto& q : r) n += std::max<size_t>(1, q.size());
  std::vector<Anneau> out; double acc = 0;
  for (auto& q : r) { const double de = acc / n; acc += std::max<size_t>(1, q.size()); out.push_back({q, de, acc / n}); }
  return out;
}
std::optional<Sceau> Grimoire::partiel(const Sceau& s, double prog) const {
  if (prog >= 1) return s;
  int fini = 0; for (const auto& q : anneaux(s)) if (prog >= q.a - 1e-6) fini++;
  // sans sa forme, rien ne peut partir
  if (fini < 2) return std::nullopt;
  Sceau c = normaliser(s);
  if (fini < 3) for (auto& m : c.mods) m = Mod();
  if (fini < 4) { c.trigger = ""; c.trigger2 = ""; c.filtre = ""; c.cible = ""; c.lien2 = ""; }
  return c;
}

// ---------- la relecture : ce qui ne sert à rien ici (inutiles), l'état, le nom ----------
std::vector<Inutile> Grimoire::inutiles(const Sceau& s) const {
  std::vector<Inutile> out; const Id& sh = s.shape; const int nb = nbSlots(s, NMODS);
  auto nomF = [&](const Id& id) { auto it = D.shapes.find(id); return it != D.shapes.end() ? it->second.nom : id; };
  auto nomC = [&](const Id& id) { auto it = D.cores.find(id); return it != D.cores.end() ? it->second.nom : id; };
  auto deCore = [&](const Id& c) { const std::string n = nomC(c); const bool voy = !n.empty() && (std::string("AEIOU").find(n[0]) != std::string::npos || n.rfind("\xC3\x89", 0) == 0);
    return (voy ? std::string("de l'") : contient<Id>({"feu", "vent", "temps", "contre", "portail", "esprit"}, c) ? std::string("du ") : std::string("de la ")) + n; };
  std::vector<Id> cores; if (!s.core.empty()) cores.push_back(s.core); if (s.taille != "petit" && !s.core2.empty()) cores.push_back(s.core2); if (s.taille == "grand" && !s.core3.empty()) cores.push_back(s.core3);
  const auto ef = effets(s);
  for (int i = 0; i < NMODS; i++) {
    const Mod& q = s.mods[i]; if (q.vide() || q.sous || i >= nb) continue;
    auto it = D.mods.find(q.id); if (it == D.mods.end()) continue; const Modificateur& Dm = it->second;
    const std::string sid = "mod" + std::to_string(i);
    auto seul = SEULEMENT.find(q.id); auto jam = JAMAIS.find(q.id);
    if (!sh.empty() && seul != SEULEMENT.end() && !contient(seul->second, sh)) { std::vector<std::string> n; for (auto& f : seul->second) n.push_back(nomF(f)); out.push_back({sid, Dm.nom + " ne sert qu'aux formes " + joindre(n, ", ") + "."}); }
    else if (!sh.empty() && jam != JAMAIS.end() && contient(jam->second, sh)) out.push_back({sid, Dm.nom + " ne fait rien sous la forme " + nomF(sh) + "."});
    else if (sh == "soi" && q.id == "portee" && !contient(SOI_PORTEE, s.core)) out.push_back({sid, "Sur soi, la Portée ne change rien à l'élan " + deCore(s.core) + "."});
    else if (sh == "soi" && q.id == "teleguide" && !contient<Id>({"foudre", "vie", "terre"}, s.core)) out.push_back({sid, "Sur soi, Téléguidé ne courbe qu'un élan en course (Foudre, Vie, Terre qui s'abat)."});
    else if (!Dm.aspect.empty() && !contient(cores, Dm.aspect)) out.push_back({sid, Dm.nom + " est un aspect de l'essence " + nomC(Dm.aspect) + ", absente de ce sceau."});
    else if (!Dm.langue.empty() && !contient(ef, Dm.langue)) { auto L = D.langages.find(Dm.langue); out.push_back({sid, Dm.nom + " est un mot " + (L != D.langages.end() && !L->second.de.empty() ? L->second.de : Dm.langue) + ", absent de ce sceau."}); }
    else if (q.id == "matiere" && !ef.empty() && std::none_of(ef.begin(), ef.end(), [&](const Id& e) { return D.matiere.count(e) && !D.matiere.at(e).empty(); })) out.push_back({sid, "Matière : aucun effet de ce sceau n'a de matière à rendre solide."});
  }
  if (s.taille != "petit" && !s.core2.empty() && s.core2 == s.core) out.push_back({"core2", "Deux fois la même essence : elles ne fusionnent pas."});
  if (s.taille == "grand" && !s.core3.empty() && (s.core3 == s.core || s.core3 == s.core2)) out.push_back({"core3", "Cette essence est déjà dans le sceau."});
  if (s.taille == "grand" && !s.trigger2.empty() && s.trigger2 == s.trigger) out.push_back({"trigger2", "Le même déclencheur, deux fois."});
  if (s.taille != "petit" && !s.filtre.empty() && !sh.empty()) {
    bool piege = false; for (const auto& t : declencheurs(s)) if (t == "contact" || t == "proximite") piege = true;
    if (!(contient(PROJ, sh) || (sh == "zone" && piege))) out.push_back({"filtre", "Un filtre ne sert qu'aux projectiles, ou à une zone posée en piège (Au contact, À proximité)."});
  }
  if (s.taille != "petit" && !s.cible.empty() && (sh == "aura" || (sh == "soi" && !contient(SOI_CIBLE, s.core))))
    out.push_back({"cible", sh == "aura" ? "En aura, le sort ne vise rien : la cible ne sert pas." : "Sur soi, cette essence ne vise rien : la cible ne sert pas."});
  return out;
}

Etat Grimoire::etat(const Sceau& s) const {
  if (s.core.empty()) return {false, "Pas de glyphe d'effet : ce sceau ne fera qu'un pétard de fumée."};
  if (s.shape.empty()) return {false, "Pas de forme : l'effet se répandra mollement autour de toi."};
  return {true, s.trigger.empty() ? "Pas de déclencheur : l'effet sera immédiat." : ""};
}

std::string Grimoire::nom(const Sceau& s) const {
  if (!s.nom.empty()) return s.nom;
  if (s.core.empty()) return "Pétard";
  auto nomC = [&](const Id& id) { auto it = D.cores.find(id); return it != D.cores.end() ? it->second.nom : id; };
  std::string n;
  { const auto ef = effets(s);
    if (ef.size() >= 2) { auto k = comboCle(ef); if (k) { auto I = comboInfo(*k); if (I && (!comboConnu || comboConnu(*k))) n = I->nom; } } }
  if (n.empty()) n = !s.core2.empty() ? nomC(s.core) + "-" + minuscules(nomC(s.core2)) + (!s.core3.empty() && s.taille == "grand" ? "-" + minuscules(nomC(s.core3)) : "") : nomC(s.core);
  if (!s.shape.empty() && D.shapes.count(s.shape)) n = D.shapes.at(s.shape).nom + (commenceParVoyelle(n, true) ? " d'" : " de ") + minuscules(n);
  std::vector<std::string> ms;
  for (const auto& m : s.mods) { if (m.vide()) continue; if (m.sous) ms.push_back("« " + nom(*m.sous) + " »"); else ms.push_back(minuscules(D.mods.count(m.id) ? D.mods.at(m.id).nom : m.id)); }
  if (!ms.empty()) n += " " + joindre(ms, ", ");
  std::vector<std::string> tr; for (const auto& t : declencheurs(s)) if (t != "immediat") tr.push_back(minuscules(D.triggers.count(t) ? D.triggers.at(t).nom : t));
  if (!tr.empty()) n += " (" + joindre(tr, ", ") + ")";
  if (s.taille == "petit") n = "Petit " + minusculePremiere(n); else if (s.taille == "grand") n = "Grand " + minusculePremiere(n);
  return n;
}

// ---------- les fusions (DATA.comboCle, comboInfo, recetteCombo) ----------
std::optional<std::string> Grimoire::comboCle(const std::vector<Id>& effets) const {
  std::vector<Id> u; for (const auto& e : effets) if (!contient(u, e)) u.push_back(e);
  if (u.size() < 2) return std::nullopt;
  auto cle = [](std::vector<Id> v) { std::sort(v.begin(), v.end()); return joindre(v, "|"); };
  if (u.size() >= 3) for (size_t i = 0; i < u.size(); i++) for (size_t j = i + 1; j < u.size(); j++) for (size_t k = j + 1; k < u.size(); k++) { const auto t = cle({u[i], u[j], u[k]}); if (D.trios.count(t)) return t; }
  std::optional<std::string> fam;
  for (size_t i = 0; i < u.size(); i++) for (size_t j = i + 1; j < u.size(); j++) { const auto k = cle({u[i], u[j]}); if (D.combos.count(k)) return k; if (!fam && comboInfo(k)) fam = k; }
  return fam;
}
std::optional<FusionInfo> Grimoire::comboInfo(const std::string& k) const {
  if (auto it = D.combos.find(k); it != D.combos.end()) return FusionInfo{it->second.nom, it->second.desc, it->second.indice, false, "", ""};
  if (auto it = D.trios.find(k); it != D.trios.end()) return FusionInfo{it->second.nom, it->second.desc, it->second.indice, true, "", ""};
  const auto bar = k.find('|'); if (bar == std::string::npos) return std::nullopt;
  const std::string a = k.substr(0, bar), reste = k.substr(bar + 1), b = reste.substr(0, reste.find('|'));
  const bool ga = D.genres.count(a), gb = D.genres.count(b);
  const std::string g = ga && !gb ? a : gb && !ga ? b : ""; if (g.empty()) return std::nullopt;
  const std::string x = g == a ? b : a; const Fusion& G = D.genres.at(g);
  std::string n = x; if (auto c = D.cores.find(x); c != D.cores.end()) n = c->second.nom; else if (auto p = D.pseudo.find(x); p != D.pseudo.end()) n = p->second.nom;
  n = minuscules(n);
  return FusionInfo{G.nom + " " + (commenceParVoyelle(n, false) ? "d'" : "de ") + n, G.desc, G.indice, false, g, x};
}
std::optional<Recette> Grimoire::recette(const std::string& cle) const {
  struct Part { Id core, mod; };
  std::vector<Part> parts; size_t d = 0;
  for (;;) {
    const size_t f = cle.find('|', d); const std::string e = cle.substr(d, f == std::string::npos ? std::string::npos : f - d);
    std::optional<Part> p;
    if (auto c = D.cores.find(e); c != D.cores.end() && !c->second.interne) p = Part{e, ""};
    else for (const auto& a : D.aspects) { auto m = D.mods.find(a); if (m != D.mods.end() && m->second.devient == e) { p = Part{m->second.aspect, a}; break; } }
    if (!p) return std::nullopt;
    parts.push_back(*p);
    if (f == std::string::npos) break;
    d = f + 1;
  }
  if (parts.size() > 3) return std::nullopt;
  // l'aspect se pose sur la dernière occurrence de son essence : on la met en second
  std::stable_sort(parts.begin(), parts.end(), [](const Part& x, const Part& y) { return x.mod.empty() && !y.mod.empty(); });
  Recette r{parts.size() > 2 ? "grand" : "moyen", parts[0].core, parts.size() > 1 ? parts[1].core : "", parts.size() > 2 ? parts[2].core : "", {}};
  for (const auto& p : parts) if (!p.mod.empty()) r.mods.push_back(p.mod);
  return r;
}

// ---------- le lancement (makeSpec), et l'élan sur soi (js/elans.js) ----------
Lancement Grimoire::lancement(const Sceau& s, double charge) const {
  Parametres prm = parametres(s);
  if (charge > 0) { prm.power *= 1 + 0.8 * charge; prm.range *= 1 + 0.5 * charge; prm.size *= 1 + 0.4 * charge; prm.duration *= 1 + 0.3 * charge; }
  std::vector<Id> cores = effets(s);
  for (const auto& [e, L] : prm.asp) for (const auto& A : L) if (A.n > 1) { prm.lg[A.devient] = 2; prm.power *= 1.3; }
  Lancement r; r.effetsBase = cores;
  auto inv = [&](const Id& c) { auto it = D.inverse.find(c); return it != D.inverse.end() && !it->second.empty() ? it->second : c; };
  if (prm.inverse) { r.gInv = contient<Id>(cores, "gravite"); for (auto& c : cores) if (c != "gravite") c = inv(c); }
  else if (!prm.invEss.empty()) { for (auto& c : cores) if (contient(prm.invEss, c) && c != "gravite") c = inv(c); if (contient<Id>(prm.invEss, "gravite")) r.gInv = true; }
  if (prm.lg.count("gravite") && prm.lg.at("gravite") && contient<Id>(cores, "gravite")) { const int g = prm.lg.at("gravite"); prm.size *= 1 + 0.3 * g; prm.power *= 1 + 0.4 * g; }
  if (!prm.inverse && prm.invEss.empty()) r.combo = comboCle(r.effetsBase);
  const auto trs = declencheurs(s); const bool proj = s.shape == "projectile" || s.shape == "chaine";
  for (const auto& t : trs) if (contient<Id>({"tenu", "immediat", "contact", "retarde", "commande", "proximite"}, t)) { r.trig = t; break; }
  if (r.trig.empty()) r.trig = contient<Id>(trs, "repetition") && proj ? "contact" : "immediat";
  const bool big = s.taille != "petit";
  r.repeat = contient<Id>(trs, "repetition") ? (s.periode ? s.periode : 2) : 0; r.expire = contient<Id>(trs, "expiration"); r.delai = s.delai ? s.delai : 2;
  r.filtre = big ? s.filtre : ""; r.cible = big ? (s.cible.empty() ? "souris" : s.cible) : "souris";
  r.bancal = equilibre(s).etat == "bancal";
  r.power = prm.power; r.range = prm.range; r.size = prm.size; r.duration = prm.duration; r.lg = prm.lg; r.effets = cores;
  if (s.shape == "soi") {
    static const std::vector<Id> IMM = {"feu", "eau", "vent", "terre", "vie", "lumiere", "foudre", "portail", "esprit", "transmutation", "contre"};
    static const std::vector<Id> TENIR = {"feu", "eau", "vent", "terre", "vie", "lumiere", "foudre", "portail", "esprit", "transmutation", "contre", "gravite", "temps", "metamorphose"};
    Elan E; E.essence = cores.empty() ? "" : cores[0]; E.immediat = contient(IMM, E.essence); E.maintenu = r.trig == "tenu" && contient(TENIR, E.essence);
    for (size_t i = 1; i < cores.size(); i++) if (cores[i] != E.essence && !contient(E.teintes, cores[i])) E.teintes.push_back(cores[i]);
    E.avance = (prm.rafale ? (prm.rafale > 1 ? 4 : 2) : 0) + prm.extra;
    r.elan = E;
  }
  return r;
}

}  // namespace brimo
