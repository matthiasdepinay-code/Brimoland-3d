// Tests du pont vers Unreal (brimo/pont.h) : aplatir puis déplier un sceau ne perd rien, sous-sceaux compris ;
// le JSON fait l'aller-retour ; le chargement dit pourquoi il échoue au lieu de lever une exception.
#include <cstdio>
#include <string>

#include "brimo/pont.h"

using namespace brimo;

namespace {
int echecs = 0;
void attendre(bool ok, const std::string& quoi) { if (!ok) { echecs++; if (echecs <= 20) std::printf("  ÉCHEC : %s\n", quoi.c_str()); } }
}  // namespace

int main(int argc, char** argv) {
  const std::string racine = argc > 1 ? argv[1] : ".";
  std::unique_ptr<Grimoire> G; std::string erreur;

  // le chargement : un mauvais chemin dit pourquoi, le bon donne un grimoire
  attendre(!chargerGrimoire(racine + "/donnees/absent.json", G, erreur) && !erreur.empty() && !G, "un chemin absent doit échouer avec un message");
  erreur.clear();
  attendre(chargerGrimoire(racine + "/donnees/brimo.json", G, erreur) && G && erreur.empty(), "le chargement de brimo.json : " + erreur);
  if (!G) { std::printf("pont : impossible de charger les données\n"); return 1; }
  const Donnees& D = G->donnees();

  // l'aller-retour, sur les 1 500 sceaux des vecteurs de parité
  const Json V = Json::lireFichier(racine + "/tests/vecteurs.json");
  int n = 0, sous = 0;
  for (const auto& c : V["cas"].liste()) {
    const Sceau s = G->normaliser(Sceau::depuisJson(c["brut"]));
    const std::string attendu = s.versJson().ecrire();
    const SceauPlat p = aplatir(s);
    for (const auto& m : p.mods) if (!m.empty() && m[0] == '{') sous++;
    attendre(deplier(p).versJson().ecrire() == attendu, "aplatir puis déplier le sceau " + std::to_string(n));
    SceauPlat q; std::string e;
    attendre(sceauDepuisJson(sceauVersJson(p), q, e) && deplier(q).versJson().ecrire() == attendu, "le JSON du sceau " + std::to_string(n) + " " + e);
    attendre(G->cout(G->normaliser(deplier(p))) == (int)c["cout"].nombre(), "le coût après le pont, sceau " + std::to_string(n));
    n++;
  }
  attendre(n >= 1000, "au moins 1 000 sceaux");
  attendre(sous > 0, "des sous-sceaux parmi les vecteurs");

  // un sous-sceau mal formé laisse sa case vide ; un JSON mal formé dit pourquoi
  { SceauPlat p; p.core = "feu"; p.mods[0] = "{pas du json"; p.mods[1] = "puissance"; const Sceau s = deplier(p);
    attendre(s.mods[0].vide() && s.mods[1].id == "puissance", "un sous-sceau mal formé"); }
  { SceauPlat p; std::string e; attendre(!sceauDepuisJson("{\"core\": ", p, e) && !e.empty(), "un JSON mal formé doit échouer avec un message"); }

  // les noms et les couleurs
  attendre(!nomGlyphe(D, "feu").empty() && !nomGlyphe(D, "projectile").empty() && !nomGlyphe(D, "puissance").empty() && !nomGlyphe(D, "contact").empty(), "les noms des glyphes");
  attendre(nomGlyphe(D, "pas-un-glyphe").empty(), "un glyphe inconnu n'a pas de nom");
  attendre(couleurEssence(D, "feu").size() == 7 && couleurEssence(D, "feu")[0] == '#', "la couleur du feu");

  // l'exemple du jalon J1 : ce que le PC doit afficher avec la commande brimo.essai
  { SceauPlat p; p.core = "feu"; p.core2 = "gravite"; p.shape = "zone"; p.mods[0] = "puissance"; p.trigger = "contact";
    const Sceau s = G->normaliser(deplier(p)); const auto L = G->lancement(s);
    std::printf("exemple : « %s », %d d'encre, fusion %s\n", G->nom(s).c_str(), G->cout(s), L.combo ? L.combo->c_str() : "aucune"); }

  std::printf("pont : %d sceaux (%d sous-sceaux), %s\n", n, sous, echecs ? "ÉCHECS" : "tout est identique");
  return echecs ? 1 : 0;
}
