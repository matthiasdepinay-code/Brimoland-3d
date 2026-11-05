#include "brimo/json.h"

#include <cmath>
#include <cstdio>
#include <fstream>
#include <sstream>
#include <stdexcept>

namespace brimo {
namespace {

const Json NUL;
const std::string VIDE;
const Json::Liste LISTE_VIDE;
const Json::Objet OBJET_VIDE;

struct Lecteur {
  const std::string& t;
  size_t i = 0;
  explicit Lecteur(const std::string& s) : t(s) {}

  [[noreturn]] void erreur(const char* quoi) const {
    throw std::runtime_error(std::string("JSON : ") + quoi + " (position " + std::to_string(i) + ")");
  }
  void blancs() { while (i < t.size() && (t[i] == ' ' || t[i] == '\n' || t[i] == '\r' || t[i] == '\t')) i++; }
  bool mot(const char* m) {
    size_t n = 0; while (m[n]) n++;
    if (t.compare(i, n, m) == 0) { i += n; return true; }
    return false;
  }
  static void utf8(std::string& o, unsigned cp) {
    if (cp < 0x80) o += char(cp);
    else if (cp < 0x800) { o += char(0xC0 | (cp >> 6)); o += char(0x80 | (cp & 0x3F)); }
    else if (cp < 0x10000) { o += char(0xE0 | (cp >> 12)); o += char(0x80 | ((cp >> 6) & 0x3F)); o += char(0x80 | (cp & 0x3F)); }
    else { o += char(0xF0 | (cp >> 18)); o += char(0x80 | ((cp >> 12) & 0x3F)); o += char(0x80 | ((cp >> 6) & 0x3F)); o += char(0x80 | (cp & 0x3F)); }
  }
  unsigned hex4() {
    if (i + 4 > t.size()) erreur("\\u incomplet");
    unsigned v = 0;
    for (int k = 0; k < 4; k++) {
      char c = t[i++]; v <<= 4;
      if (c >= '0' && c <= '9') v |= c - '0'; else if (c >= 'a' && c <= 'f') v |= c - 'a' + 10; else if (c >= 'A' && c <= 'F') v |= c - 'A' + 10; else erreur("\\u invalide");
    }
    return v;
  }
  std::string chaine() {
    if (t[i] != '"') erreur("guillemet attendu");
    i++; std::string o;
    while (i < t.size() && t[i] != '"') {
      char c = t[i++];
      if (c != '\\') { o += c; continue; }
      if (i >= t.size()) erreur("échappement incomplet");
      char e = t[i++];
      switch (e) {
        case '"': o += '"'; break; case '\\': o += '\\'; break; case '/': o += '/'; break;
        case 'b': o += '\b'; break; case 'f': o += '\f'; break; case 'n': o += '\n'; break; case 'r': o += '\r'; break; case 't': o += '\t'; break;
        case 'u': { unsigned cp = hex4(); if (cp >= 0xD800 && cp < 0xDC00 && i + 6 <= t.size() && t[i] == '\\' && t[i + 1] == 'u') { i += 2; unsigned lo = hex4(); cp = 0x10000 + ((cp - 0xD800) << 10) + (lo - 0xDC00); } utf8(o, cp); break; }
        default: erreur("échappement inconnu");
      }
    }
    if (i >= t.size()) erreur("chaîne non fermée");
    i++;
    return o;
  }
  Json valeur() {
    blancs();
    if (i >= t.size()) erreur("valeur attendue");
    char c = t[i];
    if (c == '{') {
      i++; Json::Objet o; blancs();
      if (i < t.size() && t[i] == '}') { i++; return Json(std::move(o)); }
      for (;;) {
        blancs(); std::string k = chaine(); blancs();
        if (i >= t.size() || t[i] != ':') erreur("deux-points attendu");
        i++; o[k] = valeur(); blancs();
        if (i < t.size() && t[i] == ',') { i++; continue; }
        if (i < t.size() && t[i] == '}') { i++; break; }
        erreur("virgule ou accolade attendue");
      }
      return Json(std::move(o));
    }
    if (c == '[') {
      i++; Json::Liste l; blancs();
      if (i < t.size() && t[i] == ']') { i++; return Json(std::move(l)); }
      for (;;) {
        l.push_back(valeur()); blancs();
        if (i < t.size() && t[i] == ',') { i++; continue; }
        if (i < t.size() && t[i] == ']') { i++; break; }
        erreur("virgule ou crochet attendu");
      }
      return Json(std::move(l));
    }
    if (c == '"') return Json(chaine());
    if (mot("true")) return Json(true);
    if (mot("false")) return Json(false);
    if (mot("null")) return Json();
    size_t d = i;
    if (t[i] == '-') i++;
    while (i < t.size() && ((t[i] >= '0' && t[i] <= '9') || t[i] == '.' || t[i] == 'e' || t[i] == 'E' || t[i] == '+' || t[i] == '-')) i++;
    if (d == i) erreur("valeur inconnue");
    return Json(std::stod(t.substr(d, i - d)));
  }
};

void ecrireChaine(std::string& o, const std::string& s) {
  o += '"';
  for (unsigned char c : s) {
    if (c == '"') o += "\\\""; else if (c == '\\') o += "\\\\"; else if (c == '\n') o += "\\n"; else if (c == '\r') o += "\\r"; else if (c == '\t') o += "\\t";
    else if (c < 0x20) { char b[8]; std::snprintf(b, sizeof b, "\\u%04x", c); o += b; }
    else o += char(c);
  }
  o += '"';
}

void ecrireValeur(std::string& o, const Json& v) {
  switch (v.type()) {
    case Json::Type::Nul: o += "null"; break;
    case Json::Type::Bool: o += v.bou() ? "true" : "false"; break;
    case Json::Type::Nombre: {
      double n = v.nombre();
      if (std::isfinite(n) && n == std::floor(n) && std::fabs(n) < 1e15) o += std::to_string((long long)n);
      else { char b[32]; std::snprintf(b, sizeof b, "%.17g", n); o += b; }
      break;
    }
    case Json::Type::Texte: ecrireChaine(o, v.texte()); break;
    case Json::Type::Liste: { o += '['; bool p = true; for (const auto& x : v.liste()) { if (!p) o += ','; p = false; ecrireValeur(o, x); } o += ']'; break; }
    case Json::Type::Objet: { o += '{'; bool p = true; for (const auto& [k, x] : v.objet()) { if (!p) o += ','; p = false; ecrireChaine(o, k); o += ':'; ecrireValeur(o, x); } o += '}'; break; }
  }
}

}  // namespace

Json Json::lire(const std::string& texte) {
  Lecteur L(texte);
  Json v = L.valeur();
  L.blancs();
  if (L.i != texte.size()) L.erreur("texte en trop après la valeur");
  return v;
}

Json Json::lireFichier(const std::string& chemin) {
  std::ifstream f(chemin, std::ios::binary);
  if (!f) throw std::runtime_error("JSON : impossible d'ouvrir " + chemin);
  std::stringstream ss; ss << f.rdbuf();
  return lire(ss.str());
}

std::string Json::ecrire() const { std::string o; ecrireValeur(o, *this); return o; }

const std::string& Json::texte() const { return type_ == Type::Texte ? s_ : VIDE; }
const Json::Liste& Json::liste() const { return type_ == Type::Liste ? *l_ : LISTE_VIDE; }
const Json::Objet& Json::objet() const { return type_ == Type::Objet ? *o_ : OBJET_VIDE; }

const Json& Json::operator[](const std::string& cle) const {
  if (type_ != Type::Objet) return NUL;
  auto it = o_->find(cle);
  return it == o_->end() ? NUL : it->second;
}
const Json& Json::operator[](size_t i) const { return type_ == Type::Liste && i < l_->size() ? (*l_)[i] : NUL; }
bool Json::a(const std::string& cle) const { return type_ == Type::Objet && o_->count(cle); }
size_t Json::taille() const { return type_ == Type::Liste ? l_->size() : type_ == Type::Objet ? o_->size() : 0; }

Json& Json::operator[](const std::string& cle) {
  if (type_ != Type::Objet) { *this = Json(Objet{}); }
  else if (o_.use_count() > 1) o_ = std::make_shared<Objet>(*o_);  // copie à l'écriture
  return (*o_)[cle];
}
void Json::pousser(Json v) {
  if (type_ != Type::Liste) { *this = Json(Liste{}); }
  else if (l_.use_count() > 1) l_ = std::make_shared<Liste>(*l_);
  l_->push_back(std::move(v));
}

}  // namespace brimo
