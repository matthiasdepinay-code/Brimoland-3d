using UnrealBuildTool;
using System.Collections.Generic;

public class BrimolandEditorTarget : TargetRules
{
	public BrimolandEditorTarget(TargetInfo Target) : base(Target)
	{
		Type = TargetType.Editor;
		DefaultBuildSettings = BuildSettingsVersion.Latest;
		IncludeOrderVersion = EngineIncludeOrderVersion.Latest;
		ExtraModuleNames.Add("Brimoland");
	}
}
