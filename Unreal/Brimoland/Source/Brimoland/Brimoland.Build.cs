using System.IO;
using UnrealBuildTool;

// Le module de jeu de Brimoland. Il compile BrimoCore (la magie, Core/ à la racine du dépôt) avec lui :
// Private/BrimoCoreSources.cpp inclut ses sources. Les fichiers de Core/ ne sont donc jamais recopiés ;
// une règle changée dans Core/ est aussitôt dans le jeu.
public class Brimoland : ModuleRules
{
	public Brimoland(ReadOnlyTargetRules Target) : base(Target)
	{
		// BrimoCore est du C++ pur : pas d'en-tête précompilé ni de compilation « unity », pour que les macros d'Unreal
		// (PI, check...) n'entrent pas dans ses sources. Son lecteur JSON lève des exceptions (le pont, brimo/pont.h, les attrape).
		PCHUsage = PCHUsageMode.NoPCHs;
		bUseUnity = false;
		bEnableExceptions = true;

		string Racine = Path.GetFullPath(Path.Combine(ModuleDirectory, "..", "..", "..", ".."));
		PublicIncludePaths.Add(Path.Combine(Racine, "Core", "include"));
		PrivateIncludePaths.Add(Path.Combine(Racine, "Core", "src"));

		PublicDependencyModuleNames.AddRange(new string[] { "Core", "CoreUObject", "Engine", "InputCore", "EnhancedInput" });
	}
}
