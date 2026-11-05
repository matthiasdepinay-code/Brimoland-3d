// Les structures de la magie, côté Unreal : un sceau, ce qu'il coûte, ce qu'il lance. Elles reflètent brimo::SceauPlat
// et les résultats de BrimoCore (Core/include/brimo/magie.h), pour les Blueprints, l'interface et les sauvegardes.
// Les identifiants sont ceux du jeu 2D : "feu", "projectile", "puissance", "contact"... ; une case vide vaut "".
#pragma once

#include "CoreMinimal.h"
#include "BrimoTypes.generated.h"

/** Un sceau : l'essence au centre, la forme et les essences fusionnées sur le premier anneau, les modificateurs sur le second, les déclencheurs, le filtre et la cible aux pointes. */
USTRUCT(BlueprintType)
struct BRIMOLAND_API FBrimoSceau
{
	GENERATED_BODY()

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Brimo|Sceau") FString Nom;
	/** "petit", "moyen" ou "grand" */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Brimo|Sceau") FString Taille = TEXT("moyen");
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Brimo|Sceau") FString Essence;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Brimo|Sceau") FString Essence2;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Brimo|Sceau") FString Essence3;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Brimo|Sceau") FString Forme;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Brimo|Sceau") FString Declencheur;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Brimo|Sceau") FString Declencheur2;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Brimo|Sceau") FString Lien2;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Brimo|Sceau") FString Filtre;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Brimo|Sceau") FString Cible;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Brimo|Sceau") FString Encre;
	/** Les cinq cases du second anneau : un modificateur, "" (rien), ou le JSON d'un sous-sceau (il commence par « { »). */
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Brimo|Sceau") TArray<FString> Mods;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Brimo|Sceau") double Delai = 2.0;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Brimo|Sceau") double Periode = 2.0;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Brimo|Sceau") double DimL = 1.0;
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Brimo|Sceau") double DimH = 1.0;

	FBrimoSceau() { Mods.SetNum(5); }
};

/** Une ligne du coût détaillé (l'essence, la forme, chaque modificateur, la taille...). */
USTRUCT(BlueprintType)
struct BRIMOLAND_API FBrimoPartCout
{
	GENERATED_BODY()
	UPROPERTY(BlueprintReadOnly, Category = "Brimo|Sceau") FString Cle;
	UPROPERTY(BlueprintReadOnly, Category = "Brimo|Sceau") FString Nom;
	UPROPERTY(BlueprintReadOnly, Category = "Brimo|Sceau") double Valeur = 0.0;
	/** la valeur est un pourcentage (la taille) plutôt que de l'encre */
	UPROPERTY(BlueprintReadOnly, Category = "Brimo|Sceau") bool Pourcent = false;
};

/** Un glyphe qui ne sert à rien, et pourquoi (la relecture du sceau). */
USTRUCT(BlueprintType)
struct BRIMOLAND_API FBrimoInutile
{
	GENERATED_BODY()
	/** la case : "core2", "mods.1", "trigger2"... */
	UPROPERTY(BlueprintReadOnly, Category = "Brimo|Sceau") FString Case;
	UPROPERTY(BlueprintReadOnly, Category = "Brimo|Sceau") FString Raison;
};

/** L'élan d'un sceau lancé sur soi : l'essence du centre, teintée des autres. */
USTRUCT(BlueprintType)
struct BRIMOLAND_API FBrimoElan
{
	GENERATED_BODY()
	UPROPERTY(BlueprintReadOnly, Category = "Brimo|Lancement") FString Essence;
	UPROPERTY(BlueprintReadOnly, Category = "Brimo|Lancement") bool Immediat = false;
	UPROPERTY(BlueprintReadOnly, Category = "Brimo|Lancement") bool Maintenu = false;
	UPROPERTY(BlueprintReadOnly, Category = "Brimo|Lancement") TArray<FString> Teintes;
	UPROPERTY(BlueprintReadOnly, Category = "Brimo|Lancement") int32 Avance = 0;
};

/** Ce que le moteur prépare au lancement d'un sceau. */
USTRUCT(BlueprintType)
struct BRIMOLAND_API FBrimoLancement
{
	GENERATED_BODY()
	/** les effets, après inversion */
	UPROPERTY(BlueprintReadOnly, Category = "Brimo|Lancement") TArray<FString> Effets;
	/** les effets, avant inversion */
	UPROPERTY(BlueprintReadOnly, Category = "Brimo|Lancement") TArray<FString> EffetsDeBase;
	UPROPERTY(BlueprintReadOnly, Category = "Brimo|Lancement") bool InversionGenerale = false;
	UPROPERTY(BlueprintReadOnly, Category = "Brimo|Lancement") bool Expire = false;
	/** un sceau bancal : le moteur tire au sort ce qui lui arrive */
	UPROPERTY(BlueprintReadOnly, Category = "Brimo|Lancement") bool Bancal = false;
	/** la clé de la fusion ("feu|gravite"), ou "" */
	UPROPERTY(BlueprintReadOnly, Category = "Brimo|Lancement") FString Fusion;
	UPROPERTY(BlueprintReadOnly, Category = "Brimo|Lancement") FString Declencheur;
	UPROPERTY(BlueprintReadOnly, Category = "Brimo|Lancement") FString Filtre;
	UPROPERTY(BlueprintReadOnly, Category = "Brimo|Lancement") FString Cible;
	UPROPERTY(BlueprintReadOnly, Category = "Brimo|Lancement") double Repetition = 0.0;
	UPROPERTY(BlueprintReadOnly, Category = "Brimo|Lancement") double Delai = 2.0;
	UPROPERTY(BlueprintReadOnly, Category = "Brimo|Lancement") double Puissance = 1.0;
	UPROPERTY(BlueprintReadOnly, Category = "Brimo|Lancement") double Portee = 1.0;
	UPROPERTY(BlueprintReadOnly, Category = "Brimo|Lancement") double Taille = 1.0;
	UPROPERTY(BlueprintReadOnly, Category = "Brimo|Lancement") double Duree = 1.0;
	/** lancé sur soi : un élan */
	UPROPERTY(BlueprintReadOnly, Category = "Brimo|Lancement") bool AUnElan = false;
	UPROPERTY(BlueprintReadOnly, Category = "Brimo|Lancement") FBrimoElan Elan;
};

/** Ce qu'on sait d'une fusion. */
USTRUCT(BlueprintType)
struct BRIMOLAND_API FBrimoFusion
{
	GENERATED_BODY()
	UPROPERTY(BlueprintReadOnly, Category = "Brimo|Fusion") FString Nom;
	UPROPERTY(BlueprintReadOnly, Category = "Brimo|Fusion") FString Description;
	UPROPERTY(BlueprintReadOnly, Category = "Brimo|Fusion") FString Indice;
	/** une fusion à trois essences */
	UPROPERTY(BlueprintReadOnly, Category = "Brimo|Fusion") bool Trio = false;
};
