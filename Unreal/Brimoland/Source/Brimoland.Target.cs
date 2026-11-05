using UnrealBuildTool;
using System.Collections.Generic;

public class BrimolandTarget : TargetRules
{
	public BrimolandTarget(TargetInfo Target) : base(Target)
	{
		Type = TargetType.Game;
		DefaultBuildSettings = BuildSettingsVersion.Latest;
		IncludeOrderVersion = EngineIncludeOrderVersion.Latest;
		ExtraModuleNames.Add("Brimoland");
	}
}
