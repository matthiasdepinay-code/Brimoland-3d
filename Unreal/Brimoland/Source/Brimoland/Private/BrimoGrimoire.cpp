#include "BrimoGrimoire.h"

#include "HAL/IConsoleManager.h"
#include "Misc/Paths.h"
#include "brimo/pont.h"

DEFINE_LOG_CATEGORY_STATIC(LogBrimo, Log, All);

// ---------- les conversions : FString (Unreal) ⇄ std::string en UTF-8 (BrimoCore) ----------
namespace
{
	std::string VersStd(const FString& S) { return std::string(TCHAR_TO_UTF8(*S)); }
	FString VersUnreal(const std::string& S) { return FString(UTF8_TO_TCHAR(S.c_str())); }

	TArray<FString> Liste(const std::vector<std::string>& L)
	{
		TArray<FString> R;
		for (const std::string& S : L) R.Add(VersUnreal(S));
		return R;
	}

	brimo::SceauPlat VersPlat(const FBrimoSceau& S)
	{
		brimo::SceauPlat P;
		P.nom = VersStd(S.Nom); P.taille = VersStd(S.Taille);
		P.core = VersStd(S.Essence); P.core2 = VersStd(S.Essence2); P.core3 = VersStd(S.Essence3); P.shape = VersStd(S.Forme);
		P.trigger = VersStd(S.Declencheur); P.trigger2 = VersStd(S.Declencheur2); P.lien2 = VersStd(S.Lien2);
		P.filtre = VersStd(S.Filtre); P.cible = VersStd(S.Cible); P.encre = VersStd(S.Encre);
		for (int32 i = 0; i < brimo::NMODS; i++) P.mods[i] = S.Mods.IsValidIndex(i) ? VersStd(S.Mods[i]) : std::string();
		P.delai = S.Delai; P.periode = S.Periode; P.dimL = S.DimL; P.dimH = S.DimH;
		return P;
	}

	FBrimoSceau DepuisPlat(const brimo::SceauPlat& P)
	{
		FBrimoSceau S;
		S.Nom = VersUnreal(P.nom); S.Taille = VersUnreal(P.taille);
		S.Essence = VersUnreal(P.core); S.Essence2 = VersUnreal(P.core2); S.Essence3 = VersUnreal(P.core3); S.Forme = VersUnreal(P.shape);
		S.Declencheur = VersUnreal(P.trigger); S.Declencheur2 = VersUnreal(P.trigger2); S.Lien2 = VersUnreal(P.lien2);
		S.Filtre = VersUnreal(P.filtre); S.Cible = VersUnreal(P.cible); S.Encre = VersUnreal(P.encre);
		S.Mods.SetNum(brimo::NMODS);
		for (int32 i = 0; i < brimo::NMODS; i++) S.Mods[i] = VersUnreal(P.mods[i]);
		S.Delai = P.delai; S.Periode = P.periode; S.DimL = P.dimL; S.DimH = P.dimH;
		return S;
	}

	// le sceau tel que BrimoCore le veut : déplié, puis remis en ordre
	brimo::Sceau Prepare(const brimo::Grimoire& G, const FBrimoSceau& S) { return G.normaliser(brimo::deplier(VersPlat(S))); }

	// l'essai : feu, fusionné à la gravité, en zone, avec Puissance, au contact
	FString CalculerEssai(const brimo::Grimoire& G)
	{
		brimo::SceauPlat P;
		P.core = "feu"; P.core2 = "gravite"; P.shape = "zone"; P.mods[0] = "puissance"; P.trigger = "contact";
		const brimo::Sceau S = G.normaliser(brimo::deplier(P));
		const brimo::Lancement L = G.lancement(S);
		return FString::Printf(TEXT("« %s », %d d'encre, fusion %s"), *VersUnreal(G.nom(S)), G.cout(S), L.combo ? *VersUnreal(*L.combo) : TEXT("aucune"));
	}

	// dans la console : brimo.essai (marche aussi dans l'éditeur, hors partie : il charge ses propres données)
	FAutoConsoleCommand GCommandeEssai(
		TEXT("brimo.essai"),
		TEXT("Brimoland : charge la magie (Core/donnees/brimo.json) et calcule un sceau d'exemple."),
		FConsoleCommandDelegate::CreateLambda([]()
		{
			std::unique_ptr<brimo::Grimoire> G;
			std::string Err;
			const FString Chemin = UBrimoGrimoire::CheminDonnees();
			if (!brimo::chargerGrimoire(VersStd(Chemin), G, Err))
			{
				UE_LOG(LogBrimo, Error, TEXT("brimo.essai : impossible de charger %s : %s"), *Chemin, *VersUnreal(Err));
				return;
			}
			UE_LOG(LogBrimo, Display, TEXT("brimo.essai : %d essences chargées depuis %s"), (int32)G->donnees().essences.size(), *Chemin);
			UE_LOG(LogBrimo, Display, TEXT("brimo.essai : %s"), *CalculerEssai(*G));
		}));
}

// ---------- le sous-système ----------
FString UBrimoGrimoire::CheminDonnees()
{
	// le projet est dans Unreal/Brimoland/ ; les données, dans Core/donnees/, à la racine du dépôt
	return FPaths::ConvertRelativePathToFull(FPaths::Combine(FPaths::ProjectDir(), TEXT("../../Core/donnees/brimo.json")));
}

void UBrimoGrimoire::Initialize(FSubsystemCollectionBase& Collection)
{
	Super::Initialize(Collection);
	std::string Err;
	const FString Chemin = CheminDonnees();
	if (brimo::chargerGrimoire(VersStd(Chemin), Livre, Err))
	{
		Erreur.Empty();
		UE_LOG(LogBrimo, Log, TEXT("Grimoire : %d essences chargées depuis %s"), (int32)Livre->donnees().essences.size(), *Chemin);
	}
	else
	{
		Erreur = VersUnreal(Err);
		UE_LOG(LogBrimo, Error, TEXT("Grimoire : impossible de charger %s : %s"), *Chemin, *Erreur);
	}
}

void UBrimoGrimoire::Deinitialize()
{
	Livre.reset();
	Super::Deinitialize();
}

TArray<FString> UBrimoGrimoire::Essences() const { return Livre ? Liste(Livre->donnees().essences) : TArray<FString>(); }

FString UBrimoGrimoire::NomDe(const FString& Id) const { return Livre ? VersUnreal(brimo::nomGlyphe(Livre->donnees(), VersStd(Id))) : FString(); }

FLinearColor UBrimoGrimoire::CouleurDe(const FString& Id) const
{
	const std::string Hex = Livre ? brimo::couleurEssence(Livre->donnees(), VersStd(Id)) : std::string();
	return Hex.empty() ? FLinearColor::White : FLinearColor(FColor::FromHex(VersUnreal(Hex)));
}

FBrimoSceau UBrimoGrimoire::Creer(const FString& Taille) const
{
	return Livre ? DepuisPlat(brimo::aplatir(Livre->normaliser(Livre->creer(VersStd(Taille))))) : FBrimoSceau();
}

FBrimoSceau UBrimoGrimoire::Normaliser(const FBrimoSceau& Sceau) const { return Livre ? DepuisPlat(brimo::aplatir(Prepare(*Livre, Sceau))) : Sceau; }

int32 UBrimoGrimoire::Cout(const FBrimoSceau& Sceau) const { return Livre ? Livre->cout(Prepare(*Livre, Sceau)) : 0; }

TArray<FBrimoPartCout> UBrimoGrimoire::CoutDetail(const FBrimoSceau& Sceau) const
{
	TArray<FBrimoPartCout> R;
	if (!Livre) return R;
	for (const brimo::PartCout& P : Livre->coutDetail(Prepare(*Livre, Sceau)))
	{
		FBrimoPartCout& L = R.AddDefaulted_GetRef();
		L.Cle = VersUnreal(P.cle); L.Nom = VersUnreal(P.nom); L.Valeur = P.v; L.Pourcent = P.pct;
	}
	return R;
}

FString UBrimoGrimoire::Nom(const FBrimoSceau& Sceau) const { return Livre ? VersUnreal(Livre->nom(Prepare(*Livre, Sceau))) : FString(); }

bool UBrimoGrimoire::EstValide(const FBrimoSceau& Sceau, FString& Raison) const
{
	if (!Livre) { Raison = Erreur; return false; }
	const brimo::Etat E = Livre->etat(Prepare(*Livre, Sceau));
	Raison = VersUnreal(E.raison);
	return E.ok;
}

TArray<FBrimoInutile> UBrimoGrimoire::Inutiles(const FBrimoSceau& Sceau) const
{
	TArray<FBrimoInutile> R;
	if (!Livre) return R;
	for (const brimo::Inutile& I : Livre->inutiles(Prepare(*Livre, Sceau)))
	{
		FBrimoInutile& L = R.AddDefaulted_GetRef();
		L.Case = VersUnreal(I.sid); L.Raison = VersUnreal(I.raison);
	}
	return R;
}

double UBrimoGrimoire::Geste(const FBrimoSceau& Sceau) const { return Livre ? Livre->geste(Prepare(*Livre, Sceau)) : 0.0; }

int32 UBrimoGrimoire::NombreDeCases(const FBrimoSceau& Sceau) const { return Livre ? Livre->nbSlots(Prepare(*Livre, Sceau)) : 0; }

FString UBrimoGrimoire::TailleMinimale(const FBrimoSceau& Sceau) const { return Livre ? VersUnreal(Livre->tailleMin(Prepare(*Livre, Sceau))) : FString(); }

FBrimoLancement UBrimoGrimoire::Lancer(const FBrimoSceau& Sceau, double Charge) const
{
	FBrimoLancement R;
	if (!Livre) return R;
	const brimo::Lancement L = Livre->lancement(Prepare(*Livre, Sceau), Charge);
	R.Effets = Liste(L.effets); R.EffetsDeBase = Liste(L.effetsBase);
	R.InversionGenerale = L.gInv; R.Expire = L.expire; R.Bancal = L.bancal;
	R.Fusion = L.combo ? VersUnreal(*L.combo) : FString();
	R.Declencheur = VersUnreal(L.trig); R.Filtre = VersUnreal(L.filtre); R.Cible = VersUnreal(L.cible);
	R.Repetition = L.repeat; R.Delai = L.delai; R.Puissance = L.power; R.Portee = L.range; R.Taille = L.size; R.Duree = L.duration;
	R.AUnElan = L.elan.has_value();
	if (L.elan)
	{
		R.Elan.Essence = VersUnreal(L.elan->essence); R.Elan.Immediat = L.elan->immediat; R.Elan.Maintenu = L.elan->maintenu;
		R.Elan.Teintes = Liste(L.elan->teintes); R.Elan.Avance = L.elan->avance;
	}
	return R;
}

FString UBrimoGrimoire::CleDeFusion(const TArray<FString>& Effets) const
{
	if (!Livre) return FString();
	std::vector<brimo::Id> E;
	for (const FString& S : Effets) E.push_back(VersStd(S));
	const std::optional<std::string> Cle = Livre->comboCle(E);
	return Cle ? VersUnreal(*Cle) : FString();
}

bool UBrimoGrimoire::InfosFusion(const FString& Cle, FBrimoFusion& Infos) const
{
	if (!Livre) return false;
	const std::optional<brimo::FusionInfo> I = Livre->comboInfo(VersStd(Cle));
	if (!I) return false;
	Infos.Nom = VersUnreal(I->nom); Infos.Description = VersUnreal(I->desc); Infos.Indice = VersUnreal(I->indice); Infos.Trio = I->trio;
	return true;
}

FString UBrimoGrimoire::VersJson(const FBrimoSceau& Sceau) const { return VersUnreal(brimo::sceauVersJson(VersPlat(Sceau))); }

bool UBrimoGrimoire::DepuisJson(const FString& Json, FBrimoSceau& Sceau) const
{
	brimo::SceauPlat P;
	std::string Err;
	if (!brimo::sceauDepuisJson(VersStd(Json), P, Err))
	{
		UE_LOG(LogBrimo, Warning, TEXT("Sceau illisible : %s"), *VersUnreal(Err));
		return false;
	}
	Sceau = DepuisPlat(P);
	return true;
}

FString UBrimoGrimoire::Essai() const { return Livre ? CalculerEssai(*Livre) : Erreur; }
