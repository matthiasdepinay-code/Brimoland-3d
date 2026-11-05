// ---------- BrimoCore : la magie de L'Atelier des Sceaux, en C++ pur ----------
// Le même modèle que le jeu 2D (js/seal.js, js/data.js) : un sceau se compose en cercles. Au centre, l'essence ;
// sur le premier anneau, la forme (et les essences fusionnées) ; sur le second, les modificateurs ; aux pointes,
// les déclencheurs, le filtre et la cible. Ce cœur ne connaît ni Unreal ni l'écran : il dit ce que vaut un sceau
// (coût, puissance, fusion, taille, tracé...) et le moteur en fait des sorts. Les tests de parité vérifient qu'il
// répond exactement comme le jeu 2D.
#pragma once
#include <array>
#include <map>
#include <memory>
#include <optional>
#include <string>
#include <utility>
#include <vector>

#include "brimo/json.h"

namespace brimo {

using Id = std::string;  // un identifiant de glyphe ("feu", "projectile", "puissance"...) ; vide = rien

// ---------- les données (exportées du jeu 2D : Core/donnees/brimo.json) ----------
struct Essence { std::string nom, couleur, desc; int cout = 0; bool interne = false; };
struct Modificateur { std::string nom, desc; int cout = 0; Id aspect, devient, langue; };
struct Glyphe { std::string nom, desc, couleur; int cout = 0; };  // forme, déclencheur, filtre, cible
struct Taille { std::string nom, desc; int slots = 3; double coutMul = 1, coutAdd = 0, geste = 0.2; };
struct Fusion { std::string nom, desc, indice; };
struct Langage { Id glyphe; std::string nom, de; std::vector<std::string> paliers; };
struct ElanTexte { std::string immediat, maintenu; };

struct Donnees {
  std::string source;
  std::vector<Id> essences;               // les 14 essences jouables, dans l'ordre de la palette
  std::map<Id, Essence> cores;            // toutes les essences (y compris les anciennes, devenues aspects)
  std::map<Id, Glyphe> pseudo;            // effets dérivés (par Inverser) : creuser, fanaison...
  std::map<Id, Id> inverse;               // ce que devient un effet inversé
  std::map<Id, Modificateur> mods;
  std::map<Id, Glyphe> shapes, triggers, filtres, cibles;
  std::map<Id, Taille> tailles;           // petit, moyen, grand
  std::map<Id, std::pair<std::string, std::string>> dims;  // forme -> (nom de la largeur, nom de la hauteur ou "")
  std::vector<double> dimVals;
  std::map<Id, std::string> matiere;      // effet -> matière solide (Matière)
  std::map<Id, Langage> langages;
  std::map<std::string, Fusion> combos, trios, genres;
  std::vector<Id> aspects;                // les aspects d'origine, dans l'ordre
  std::map<Id, std::pair<Id, Id>> migration;  // ancienne essence -> (essence, aspect)
  std::map<Id, Id> migrMods;              // ancien modificateur -> nouveau ("" = disparu)
  std::map<Id, ElanTexte> elans;
  std::map<Id, std::string> teintes;
  std::map<Id, std::vector<double>> modAngles;  // taille -> angles des cases du second anneau (degrés)

  static Donnees depuisJson(const Json& j);
  static Donnees charger(const std::string& chemin);
};

// ---------- un sceau ----------
struct Sceau;
struct Mod {
  Id id;                          // un modificateur...
  std::unique_ptr<Sceau> sous;    // ...ou un sous-sceau (lancé là où le premier éclate)
  Mod() = default;
  Mod(Id i) : id(std::move(i)) {}
  Mod(const Mod& o);
  Mod& operator=(const Mod& o);
  Mod(Mod&&) noexcept = default;
  Mod& operator=(Mod&&) noexcept = default;
  bool vide() const { return id.empty() && !sous; }
  bool estSous() const { return (bool)sous; }
  explicit operator bool() const { return !vide(); }
};
constexpr int NMODS = 5;

struct Sceau {
  std::string nom;
  Id taille = "moyen", core, core2, core3, shape, trigger, trigger2, lien2, filtre, cible, encre;
  std::array<Mod, NMODS> mods;
  double delai = 2, periode = 2, dimL = 1, dimH = 1;
  // le champ d'une case par son nom ("core", "core2", "shape", "trigger"...)
  const Id& champ(const std::string& k) const;
  Id& champ(const std::string& k);
  static Sceau depuisJson(const Json& j);  // depuis la forme du jeu 2D (mods : texte, null, ou { sub: ... })
  Json versJson() const;
};

// ---------- ce que l'on calcule ----------
struct Aspect { Id id, devient; int n = 1; };
struct PartEssence { int n = 0; double pk = 1; };
struct Parametres {
  double power = 1, range = 1, duration = 1, size = 1, speed = 1, dimL = 1, dimH = 1;
  int bounces = 0, persist = 0, extra = 0, echo = 0, gerbe = 0, rafale = 0;
  bool inverse = false, teleguide = false, orbite = false, canalise = false, percant = false, matiere = false;
  Id traj;                                       // boomerang, spirale, zigzag, rasesol, cloche, ou rien
  std::map<Id, PartEssence> ess;                 // Puissance liée à une seule essence (posée juste sous elle)
  std::vector<Id> invEss;                        // Inverser lié à une seule essence
  std::map<int, Id> liaisons;                    // case du second anneau -> "core2" / "core3"
  std::map<Id, int> lg;                          // glyphes de langage par élément (1 ou 2)
  std::map<Id, std::vector<Aspect>> asp;         // aspects par essence
};
struct Equilibre { std::string etat = "neutre"; double d = 0; int n = 0; };  // neutre, equilibre, bancal
struct PartCout { std::string cle, nom; double v = 0; bool pct = false; };
struct Anneau { std::vector<std::string> cases; double de = 0, a = 0; };
struct Inutile { std::string sid, raison; };
struct Etat { bool ok = false; std::string raison; };
struct FusionInfo { std::string nom, desc, indice; bool trio = false; Id genre, effet; };
struct Recette { Id taille, core, core2, core3; std::vector<Id> mods; };
// l'élan d'un sceau lancé sur soi : l'essence du centre, teintée des autres
struct Elan { Id essence; bool immediat = false, maintenu = false; std::vector<Id> teintes; int avance = 0; };
// ce que le moteur prépare au lancement (le hasard d'un sceau bancal reste au moteur : voir bancal)
struct Lancement {
  std::vector<Id> effets, effetsBase;  // après inversion / avant
  bool gInv = false, expire = false, bancal = false;
  std::optional<std::string> combo;
  Id trig, filtre, cible;
  double repeat = 0, delai = 2, power = 1, range = 1, size = 1, duration = 1;
  std::map<Id, int> lg;
  std::optional<Elan> elan;
};

// ---------- le grimoire : toutes les règles ----------
class Grimoire {
public:
  explicit Grimoire(Donnees d) : D(std::move(d)) {}
  const Donnees& donnees() const { return D; }

  Sceau creer(const Id& taille = "moyen") const;
  Sceau normaliser(const Sceau& s) const;        // Seal.clone : migrations, cases hors taille, valeurs par défaut

  const Taille& taille(const Sceau& s) const;
  int nbSlots(const Sceau& s, int slotsMoyen = 3) const;
  std::vector<Id> declencheurs(const Sceau& s) const;
  int profondeur(const Sceau& s) const;
  std::vector<const Sceau*> sousSceaux(const Sceau& s) const;

  int cout(const Sceau& s) const;
  double coutCase(const Sceau& s, const std::string& sid) const;
  std::vector<PartCout> coutDetail(const Sceau& s) const;

  std::map<Id, std::vector<Aspect>> aspects(const Sceau& s) const;
  std::vector<Id> effets(const Sceau& s) const;
  std::vector<Id> effetsDe(const Sceau& s, const std::string& k) const;
  std::map<Id, int> langues(const Sceau& s) const;
  std::map<int, Id> liaisons(const Sceau& s) const;
  Parametres parametres(const Sceau& s) const;
  Equilibre equilibre(const Sceau& s) const;

  int tailleBesoin(const Sceau& s, int slotsMoyen = 3) const;
  Id tailleMin(const Sceau& s, const std::vector<Id>& tailles = {"petit", "moyen", "grand"}, int slotsMoyen = 3) const;
  int nGlyphes(const Sceau& s) const;
  double geste(const Sceau& s) const;            // le temps de tracé, en secondes

  bool enDeuxTemps(const Sceau& s) const;
  std::pair<Sceau, Sceau> scinder(const Sceau& s) const;
  std::vector<Anneau> anneaux(const Sceau& s) const;
  std::optional<Sceau> partiel(const Sceau& s, double prog) const;  // lâché en plein tracé

  std::vector<Inutile> inutiles(const Sceau& s) const;
  Etat etat(const Sceau& s) const;
  std::string nom(const Sceau& s) const;

  // fusions
  std::optional<std::string> comboCle(const std::vector<Id>& effets) const;
  std::optional<FusionInfo> comboInfo(const std::string& cle) const;
  std::optional<Recette> recette(const std::string& cle) const;

  // le lancement, et l'élan sur soi
  Lancement lancement(const Sceau& s, double charge = 0) const;

  // la fusion est-elle connue du joueur ? (par défaut : oui ; le jeu branche sa progression ici)
  bool (*comboConnu)(const std::string&) = nullptr;

private:
  Donnees D;
};

// petits outils de texte (UTF-8, accents français)
std::string minuscules(const std::string& s);
std::string minusculePremiere(const std::string& s);

}  // namespace brimo
