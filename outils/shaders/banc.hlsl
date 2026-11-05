// ---------- Le banc d'essai de BrimoEncre : le nœud Custom d'Unreal, hors d'Unreal ----------
// Ce fichier joue le rôle d'Unreal autour du nœud : il fournit SceneTextureLookup, View, Parameters et les entrées
// du nœud, puis inclut Unreal/Rendu/BrimoEncre.hlsl TEL QUEL comme corps de la fonction.
// outils/shaders/verifier.js le compile (glslang : HLSL → SPIR-V), le traduit en GLSL (SPIRV-Cross) et le fait tourner
// sur la scène de la maquette, dont les matériaux écrivent alors les mêmes images qu'Unreal.

// les images de la scène (écrites par la maquette en « mode Unreal ») :
//   tBase    : la couleur de base, linéaire (rgb)
//   tScene   : la scène éclairée, linéaire (rgb)
//   tNormale : la normale du monde (xyz, de -1 à 1), le Custom Stencil (a, de 0 à 255)
//   tProf    : la profondeur de la scène et la Custom Depth, en centimètres (r, g)
Texture2D tBase : register(t0);
Texture2D tScene : register(t1);
Texture2D tNormale : register(t2);
Texture2D tProf : register(t3);
Texture2D tPapier : register(t4);
SamplerState sPoint : register(s0);
SamplerState sPapier : register(s1);

// les réglages du banc : la taille de la vue, puis les entrées du nœud
cbuffer Banc : register(b0)
{
	float4 B[7];
};

struct FBancView { float4 BufferSizeAndInvSize; float4 ViewSizeAndInvSize; };
static FBancView View;
struct FMaterialPixelParameters { float4 SvPosition; };

float4 SceneTextureLookup(float2 uv, int id, bool filtre)
{
	if (id == 14) return float4(tScene.SampleLevel(sPoint, uv, 0).rgb, 1.0);
	// là où rien n'est dessiné (le ciel, ou pas de Custom Depth), Unreal donne une profondeur immense
	if (id == 1)  { float d = tProf.SampleLevel(sPoint, uv, 0).r; return (d > 0.0 ? d : 1e8).xxxx; }
	if (id == 13) { float d = tProf.SampleLevel(sPoint, uv, 0).g; return (d > 0.0 ? d : 1e8).xxxx; }
	if (id == 5)  return float4(tBase.SampleLevel(sPoint, uv, 0).rgb, 1.0);
	if (id == 8)  return float4(tNormale.SampleLevel(sPoint, uv, 0).xyz, 1.0);
	if (id == 25) return tNormale.SampleLevel(sPoint, uv, 0).aaaa;
	return float4(0.0, 0.0, 0.0, 0.0);
}
float2 GetDefaultSceneTextureUV(FMaterialPixelParameters P, int id) { return P.SvPosition.xy * View.BufferSizeAndInvSize.zw; }

// le nœud Custom : ses entrées portent les noms qu'elles auront dans Unreal
float3 NoeudCustom(FMaterialPixelParameters Parameters, float2 UVv, float Temps, Texture2D Papier, SamplerState PapierSampler,
	float Mode, float PleinSoleil, float Ambiance, float SeuilLueur, float Traits, float HachuresOn, float PapierOn, float TrembleOn,
	float Nuit, float Brume, float CielLoin, float SortieLineaire, float3 CouleurPapier, float3 CouleurEncre, float3 CouleurCiel, float3 CouleurSoleil)
{
#include "../../Unreal/Rendu/BrimoEncre.hlsl"
}

float4 main(float4 pos : SV_Position) : SV_Target
{
	View.BufferSizeAndInvSize = float4(B[0].xy, 1.0 / B[0].xy);
	View.ViewSizeAndInvSize = View.BufferSizeAndInvSize;
	FMaterialPixelParameters P; P.SvPosition = pos;
	float2 uvv = pos.xy * View.BufferSizeAndInvSize.zw;
	float3 c = NoeudCustom(P, uvv, B[0].z, tPapier, sPapier,
		B[1].x, B[1].y, B[1].z, B[1].w, B[2].x, B[2].y, B[2].z, B[2].w,
		B[3].x, B[3].y, B[3].z, B[3].w, B[4].xyz, B[5].xyz, B[6].xyz, float3(B[4].w, B[5].w, B[6].w));
	return float4(c, 1.0);
}
