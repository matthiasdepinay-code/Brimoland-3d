#include "brimo/magie.h"

namespace brimo {
namespace {
int entier(const Json& j) { return (int)j.nombre(); }
template <class F>
void pourChaque(const Json& o, F f) { for (const auto& [k, v] : o.objet()) f(k, v); }
}  // namespace

Donnees Donnees::depuisJson(const Json& j) {
  Donnees D;
  D.source = j["source"].texte();
  for (const auto& e : j["essences"].liste()) D.essences.push_back(e.texte());
  pourChaque(j["cores"], [&](const std::string& k, const Json& v) { D.cores[k] = { v["nom"].texte(), v["couleur"].texte(), v["desc"].texte(), entier(v["cout"]), v["interne"].bou() }; });
  pourChaque(j["pseudo"], [&](const std::string& k, const Json& v) { D.pseudo[k] = { v["nom"].texte(), "", v["couleur"].texte(), 0 }; });
  pourChaque(j["inverse"], [&](const std::string& k, const Json& v) { D.inverse[k] = v.texte(); });
  pourChaque(j["mods"], [&](const std::string& k, const Json& v) { D.mods[k] = { v["nom"].texte(), v["desc"].texte(), entier(v["cout"]), v["aspect"].texte(), v["devient"].texte(), v["langue"].texte() }; });
  auto glyphes = [&](const Json& o, std::map<Id, Glyphe>& m) { pourChaque(o, [&](const std::string& k, const Json& v) { m[k] = { v["nom"].texte(), v["desc"].texte(), v["couleur"].texte(), entier(v["cout"]) }; }); };
  glyphes(j["shapes"], D.shapes); glyphes(j["triggers"], D.triggers); glyphes(j["filtres"], D.filtres); glyphes(j["cibles"], D.cibles);
  pourChaque(j["tailles"], [&](const std::string& k, const Json& v) { D.tailles[k] = { v["nom"].texte(), v["desc"].texte(), entier(v["slots"]), v["coutMul"].nombre(1), v["coutAdd"].nombre(0), v["geste"].nombre(0.2) }; });
  pourChaque(j["dims"], [&](const std::string& k, const Json& v) { D.dims[k] = { v["l"].texte(), v["h"].texte() }; });
  for (const auto& x : j["dimVals"].liste()) D.dimVals.push_back(x.nombre());
  pourChaque(j["matiere"], [&](const std::string& k, const Json& v) { D.matiere[k] = v.texte(); });
  pourChaque(j["langages"], [&](const std::string& k, const Json& v) { Langage L{ v["glyphe"].texte(), v["nom"].texte(), v["de"].texte(), {} }; for (const auto& p : v["paliers"].liste()) L.paliers.push_back(p.texte()); D.langages[k] = L; });
  auto fusions = [&](const Json& o, std::map<std::string, Fusion>& m) { pourChaque(o, [&](const std::string& k, const Json& v) { m[k] = { v["nom"].texte(), v["desc"].texte(), v["indice"].texte() }; }); };
  fusions(j["combos"], D.combos); fusions(j["trios"], D.trios); fusions(j["genres"], D.genres);
  for (const auto& a : j["aspects"].liste()) D.aspects.push_back(a.texte());
  pourChaque(j["migration"], [&](const std::string& k, const Json& v) { D.migration[k] = { v[0].texte(), v[1].texte() }; });
  pourChaque(j["migrMods"], [&](const std::string& k, const Json& v) { D.migrMods[k] = v.texte(); });
  pourChaque(j["elans"], [&](const std::string& k, const Json& v) { D.elans[k] = { v["imm"].texte(), v["tenu"].texte() }; });
  pourChaque(j["teintes"], [&](const std::string& k, const Json& v) { D.teintes[k] = v.texte(); });
  pourChaque(j["modAngles"], [&](const std::string& k, const Json& v) { for (const auto& a : v.liste()) D.modAngles[k].push_back(a.nombre()); });
  return D;
}

Donnees Donnees::charger(const std::string& chemin) { return depuisJson(Json::lireFichier(chemin)); }

}  // namespace brimo
