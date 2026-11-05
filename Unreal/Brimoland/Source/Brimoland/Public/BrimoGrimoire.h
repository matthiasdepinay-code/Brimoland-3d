// Le grimoire : toutes les règles de la magie, pour le jeu et les Blueprints.
// Un sous-système de l'instance de jeu : il existe une fois par partie, et charge au démarrage les données de la magie
// (Core/donnees/brimo.json, exportées du jeu 2D). Chaque fonction passe par BrimoCore, qui répond exactement comme
// le jeu 2D (les tests de parité, dans Core/tests/, le vérifient).
//
// Dans un Blueprint : Get Game Instance → Get Subsystem (Brimo Grimoire), puis les fonctions de la catégorie « Brimo ».
// Dans la console (touche ²) : brimo.essai
#pragma once

#include <memory>

#include "CoreMinimal.h"
#include "Subsystems/GameInstanceSubsystem.h"
#include "BrimoTypes.h"
#include "brimo/magie.h"
#include "BrimoGrimoire.generated.h"

UCLASS()
class BRIMOLAND_API UBrimoGrimoire : public UGameInstanceSubsystem
{
	GENERATED_BODY()

public:
	virtual void Initialize(FSubsystemCollectionBase& Collection) override;
	virtual void Deinitialize() override;

	/** Les données de la magie sont-elles chargées ? Sinon, Erreur dit pourquoi. */
	UFUNCTION(BlueprintPure, Category = "Brimo|Grimoire") bool EstPret() const { return Livre != nullptr; }
	UPROPERTY(BlueprintReadOnly, Category = "Brimo|Grimoire") FString Erreur;

	// ---------- les glyphes ----------
	/** Les quatorze essences jouables, dans l'ordre de la palette. */
	UFUNCTION(BlueprintPure, Category = "Brimo|Glyphes") TArray<FString> Essences() const;
	/** Le nom d'un glyphe (« Feu », « Projectile », « Puissance »...), quel que soit son anneau ; "" s'il est inconnu. */
	UFUNCTION(BlueprintPure, Category = "Brimo|Glyphes") FString NomDe(const FString& Id) const;
	/** La couleur d'une essence (celle du jeu 2D). */
	UFUNCTION(BlueprintPure, Category = "Brimo|Glyphes") FLinearColor CouleurDe(const FString& Id) const;

	// ---------- un sceau ----------
	/** Un sceau vide, de la taille voulue : "petit", "moyen" ou "grand". */
	UFUNCTION(BlueprintPure, Category = "Brimo|Sceau") FBrimoSceau Creer(const FString& Taille = TEXT("moyen")) const;
	/** Le sceau remis en ordre : anciennes essences et anciens modificateurs, cases hors de la taille, valeurs par défaut. */
	UFUNCTION(BlueprintPure, Category = "Brimo|Sceau") FBrimoSceau Normaliser(const FBrimoSceau& Sceau) const;
	/** Le coût, en encre. */
	UFUNCTION(BlueprintPure, Category = "Brimo|Sceau") int32 Cout(const FBrimoSceau& Sceau) const;
	UFUNCTION(BlueprintPure, Category = "Brimo|Sceau") TArray<FBrimoPartCout> CoutDetail(const FBrimoSceau& Sceau) const;
	/** Le nom que le jeu donne au sceau (« Zone de petit soleil puissance (au contact) »). */
	UFUNCTION(BlueprintPure, Category = "Brimo|Sceau") FString Nom(const FBrimoSceau& Sceau) const;
	/** Le sceau peut-il être lancé ? Sinon, Raison dit pourquoi. */
	UFUNCTION(BlueprintPure, Category = "Brimo|Sceau") bool EstValide(const FBrimoSceau& Sceau, FString& Raison) const;
	/** La relecture : les glyphes qui ne servent à rien, et pourquoi. */
	UFUNCTION(BlueprintPure, Category = "Brimo|Sceau") TArray<FBrimoInutile> Inutiles(const FBrimoSceau& Sceau) const;
	/** Le temps de tracé, en secondes. */
	UFUNCTION(BlueprintPure, Category = "Brimo|Sceau") double Geste(const FBrimoSceau& Sceau) const;
	/** Le nombre de cases du second anneau, pour cette taille. */
	UFUNCTION(BlueprintPure, Category = "Brimo|Sceau") int32 NombreDeCases(const FBrimoSceau& Sceau) const;
	/** La plus petite taille où tous les glyphes du sceau tiennent. */
	UFUNCTION(BlueprintPure, Category = "Brimo|Sceau") FString TailleMinimale(const FBrimoSceau& Sceau) const;

	// ---------- le lancement et les fusions ----------
	/** Ce que le moteur prépare au lancement (Charge : de 0 à 1, le temps qu'on a tenu le clic). */
	UFUNCTION(BlueprintCallable, Category = "Brimo|Lancement") FBrimoLancement Lancer(const FBrimoSceau& Sceau, double Charge = 0.0) const;
	/** La clé de la fusion de ces effets (« feu|gravite »), ou "" s'ils ne fusionnent pas. */
	UFUNCTION(BlueprintPure, Category = "Brimo|Fusion") FString CleDeFusion(const TArray<FString>& Effets) const;
	UFUNCTION(BlueprintPure, Category = "Brimo|Fusion") bool InfosFusion(const FString& Cle, FBrimoFusion& Infos) const;

	// ---------- les sauvegardes et le jeu 2D ----------
	/** Le sceau en JSON, dans la forme du jeu 2D. */
	UFUNCTION(BlueprintPure, Category = "Brimo|Sceau") FString VersJson(const FBrimoSceau& Sceau) const;
	/** Un sceau lu depuis son JSON (une sauvegarde, ou un sceau copié du jeu 2D). */
	UFUNCTION(BlueprintCallable, Category = "Brimo|Sceau") bool DepuisJson(const FString& Json, FBrimoSceau& Sceau) const;

	/** L'essai du jalon J1 : un sceau d'exemple, calculé par BrimoCore. */
	UFUNCTION(BlueprintCallable, Category = "Brimo|Grimoire") FString Essai() const;

	/** Où sont les données de la magie : Core/donnees/brimo.json, à la racine du dépôt. */
	static FString CheminDonnees();

	/** Le grimoire de BrimoCore lui-même, pour le code C++ du jeu. */
	const brimo::Grimoire* Regles() const { return Livre.get(); }

private:
	std::unique_ptr<brimo::Grimoire> Livre;  // les règles de BrimoCore
};
