// Un petit JSON, sans dépendance : de quoi lire les données de la magie et écrire les sauvegardes.
// (Dans Unreal, on peut aussi passer par FJsonSerializer ; le cœur, lui, reste autonome.)
#pragma once
#include <map>
#include <memory>
#include <string>
#include <vector>

namespace brimo {

class Json {
public:
  enum class Type { Nul, Bool, Nombre, Texte, Liste, Objet };
  using Liste = std::vector<Json>;
  using Objet = std::map<std::string, Json>;

  Json() = default;
  Json(std::nullptr_t) {}
  Json(bool b) : type_(Type::Bool), b_(b) {}
  Json(double n) : type_(Type::Nombre), n_(n) {}
  Json(int n) : type_(Type::Nombre), n_(n) {}
  Json(const char* s) : type_(Type::Texte), s_(s) {}
  Json(std::string s) : type_(Type::Texte), s_(std::move(s)) {}
  Json(Liste l) : type_(Type::Liste), l_(std::make_shared<Liste>(std::move(l))) {}
  Json(Objet o) : type_(Type::Objet), o_(std::make_shared<Objet>(std::move(o))) {}

  static Json lire(const std::string& texte);          // lève std::runtime_error si le texte est mal formé
  static Json lireFichier(const std::string& chemin);
  std::string ecrire() const;                           // compact

  Type type() const { return type_; }
  bool nul() const { return type_ == Type::Nul; }
  bool estBool() const { return type_ == Type::Bool; }
  bool estNombre() const { return type_ == Type::Nombre; }
  bool estTexte() const { return type_ == Type::Texte; }
  bool estListe() const { return type_ == Type::Liste; }
  bool estObjet() const { return type_ == Type::Objet; }

  bool bou(bool defaut = false) const { return type_ == Type::Bool ? b_ : defaut; }
  double nombre(double defaut = 0) const { return type_ == Type::Nombre ? n_ : defaut; }
  const std::string& texte() const;                     // "" si ce n'est pas un texte
  const Liste& liste() const;                           // vide si ce n'est pas une liste
  const Objet& objet() const;                           // vide si ce n'est pas un objet

  // accès : un champ absent (ou un indice hors liste) rend un Json nul
  const Json& operator[](const std::string& cle) const;
  const Json& operator[](size_t i) const;
  bool a(const std::string& cle) const;
  size_t taille() const;

  // construction
  Json& operator[](const std::string& cle);             // crée l'objet et le champ au besoin
  void pousser(Json v);                                 // crée la liste au besoin

private:
  Type type_ = Type::Nul;
  bool b_ = false;
  double n_ = 0;
  std::string s_;
  std::shared_ptr<Liste> l_;
  std::shared_ptr<Objet> o_;
};

}  // namespace brimo
