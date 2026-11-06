// ============================================================================================================
//  BrimoEncre : le rendu « dessiné » de Brimoland, l'encre sur parchemin, en UN nœud Custom d'Unreal.
//  C'est la traduction de la passe d'encre de la maquette (maquette/src/encre.js), vérifiée dans la maquette
//  elle-même : outils/shaders/ compile ce fichier tel quel et le fait tourner sur la scène de la maquette.
//
//  Où le coller : un matériau de post-process (Material Domain : Post Process ; Blendable Location :
//  Replacing the Tonemapper), un nœud Custom, Output Type : CMOT Float 3, et tout ce fichier dans « Code ».
//  Les entrées du nœud (nom exact, puis ce qu'on y branche) : voir Unreal/Rendu/RECETTE.md.
//
//  Ce que fait le nœud, dans l'ordre :
//   1. les aplats : l'éclairement (la couleur de la scène divisée par sa couleur de base) ramené à trois tons
//      par matière : lumière, demi-teinte, ombre tirant vers le violet sépia ;
//   2. les contours : sauts de profondeur et de normale, épaisseur choisie par objet (le « pochoir »,
//      Custom Stencil), plus fine au loin ; le trait tremble, et ce tremblement change 10 fois par seconde ;
//   3. les hachures, dans les vraies ombres seulement, jamais sur ce qui luit ;
//   4. le papier (T_Papier), sous une couleur posée en lavis ; la brume de papier au loin ;
//   5. le vignettage, et la nuit qui mange la page depuis les bords.
//
//  Les calculs se font sur les couleurs « telles qu'on les lit » (les codes #rrggbb du cahier des charges),
//  comme dans le jeu 2D et la maquette : la couleur de base d'Unreal (linéaire) est d'abord remise dans cet
//  espace. Le pochoir (Custom Stencil) : 0 = objet sans pochoir (trait 0,6) ; 1 à 21 = trait de 0 à 1 par pas
//  de 0,05 (1 : aucun trait, 8 : 0,35, 13 : 0,6, 21 : 1,0) ; + 128 = l'objet luit.
// ============================================================================================================

// les images de la scène, par leur numéro dans Unreal (ESceneTextureId)
#define BRIMO_SCENE       14   // PostProcessInput0 : la scène éclairée, linéaire, avant le tonemapper
#define BRIMO_PROFONDEUR   1   // SceneDepth : en centimètres
#define BRIMO_BASE         5   // BaseColor : la couleur de base (linéaire)
#define BRIMO_NORMALE      8   // WorldNormal
#define BRIMO_PROF_PERSO  13   // CustomDepth
#define BRIMO_POCHOIR     25   // CustomStencil

struct FBrimoEncre
{
	// réglé par la dernière ligne du nœud
	float2 px;        // la taille d'un pixel, en UV des images de la scène
	float  echelle;   // 1 en 1080p, 2 en 4K : les hachures et le trait gardent leur taille à l'écran
	float  graine;    // le tremblement du trait : change 10 fois par seconde
	// les réglages (les entrées du nœud)
	float  mode, pleinSoleil, ambiance, seuilLueur, traits, hachuresOn, papierOn, trembleOn, nuit, brume, cielLoin, sortieLineaire;
	float  dessin;    // la force des effets dessinés : hachures, tremblement, papier, vignettage (1 : la maquette d'origine ; 0,65 validé)
	float3 cPapier, cEncre, cCiel, cSoleil;

	// ---------- l'adaptateur : les seules lignes qui parlent à Unreal ----------
	float4 Lire(float2 uv, int id) { return SceneTextureLookup(uv, id, false); }
	float  Prof(float2 uv)    { return Lire(uv, BRIMO_PROFONDEUR).r * 0.01; }            // en mètres
	float3 Normale(float2 uv) { return normalize(Lire(uv, BRIMO_NORMALE).xyz); }
	// le pochoir : (épaisseur du trait, luit). Le Custom Stencil ne vaut que si l'objet du pochoir est bien celui qu'on voit.
	float2 Pochoir(float2 uv)
	{
		float d = Lire(uv, BRIMO_PROFONDEUR).r;
		if (d * 0.01 > cielLoin) return float2(0.0, 0.0);                                    // le ciel : pas de trait
		float s = round(Lire(uv, BRIMO_POCHOIR).r), cd = Lire(uv, BRIMO_PROF_PERSO).r;
		if (s < 0.5 || abs(cd - d) > max(2.0, d * 0.003)) return float2(0.6, 0.0);          // pas de pochoir ici : le trait par défaut
		float luit = s >= 128.0 ? 1.0 : 0.0;
		return float2(saturate((s - luit * 128.0 - 1.0) / 20.0), luit);
	}

	// ---------- les outils ----------
	float  Lum(float3 c) { return dot(c, float3(0.2126, 0.7152, 0.0722)); }
	float3 VersSrgb(float3 c)     { c = max(c, 0.0); return lerp(c * 12.92, 1.055 * pow(c, 1.0 / 2.4) - 0.055, step(0.0031308, c)); }
	float3 VersLineaire(float3 c) { c = max(c, 0.0); return lerp(c / 12.92, pow((c + 0.055) / 1.055, 2.4), step(0.04045, c)); }
	float  Hash(float2 p) { p = frac(p * float2(123.34, 456.21)); p += dot(p, p + 45.32); return frac(p.x * p.y); }
	float  Bruit(float2 p)
	{
		float2 i = floor(p), f = frac(p); f = f * f * (3.0 - 2.0 * f);
		return lerp(lerp(Hash(i), Hash(i + float2(1, 0)), f.x), lerp(Hash(i + float2(0, 1)), Hash(i + float2(1, 1)), f.x), f.y);
	}
	// une famille de hachures : des traits parallèles, un peu tremblés, d'épaisseur ep (en pixels)
	float Hachure(float2 p, float ang, float pas, float ep)
	{
		float2 d = float2(cos(ang), sin(ang)); float v = dot(p, d) + (Bruit(p * 0.04 + graine) - 0.5) * 2.5;
		float f = abs(frac(v / pas) - 0.5) * pas; return 1.0 - smoothstep(ep * 0.5, ep * 0.5 + 0.9, f);
	}

	// ---------- le rendu ----------
	// uv : la position dans les images de la scène ; pos : le pixel à l'écran ; uvv : la position dans la vue (0 à 1) ; taille : la vue, en pixels
	float3 Rendre(float2 uv, float2 pos, float2 uvv, float2 taille, Texture2D Papier, SamplerState PapierSampler)
	{
		float2 fc = pos / echelle;
		// 1. les aplats : trois tons par matière
		float3 baseL = Lire(uv, BRIMO_BASE).rgb, base = VersSrgb(baseL);
		float  ratio = Lum(Lire(uv, BRIMO_SCENE).rgb) / max(Lum(baseL), 0.002);
		float  lum = saturate((ratio - ambiance) / max(pleinSoleil - ambiance, 0.001));
		float  lueur = max(Pochoir(uv).y, saturate((ratio / pleinSoleil - seuilLueur) * 4.0)); // marqué au pochoir, ou plus vif que le plein soleil
		float  b = 0.5 * smoothstep(0.14, 0.2, lum) + 0.5 * smoothstep(0.52, 0.58, lum);
		float3 ombreTon = base * float3(0.68, 0.64, 0.7) + cCiel * 0.04;   // l'ombre tire un peu vers le violet sépia
		float3 demiTon = base * float3(0.84, 0.8, 0.82);
		float3 peinture = b < 0.5 ? lerp(ombreTon, demiTon, b * 2.0) : lerp(demiTon, base, b * 2.0 - 1.0);
		peinture *= lerp(float3(1.0, 1.0, 1.0), cSoleil, 0.35);
		peinture = lerp(peinture, base, lueur);
		float s = lerp(b, 1.0, lueur);

		// 2. les contours : le trait tremble, les échantillons sont décalés d'un bruit qui change 10 fois par seconde
		float2 w = trembleOn > 0.5 ? (float2(Bruit(fc / 7.0 + graine), Bruit(fc / 7.0 + graine + 31.7)) - 0.5) * 2.4 * dessin * px * echelle : float2(0.0, 0.0);
		float2 uvT = uv + w;
		float3 n0 = Normale(uvT); float poids = Pochoir(uvT).x;
		float  d0 = Prof(uvT), ciel0 = step(cielLoin, d0);
		float  epais = lerp(0.9, 2.1, poids) * lerp(0.85, 1.0, dessin) * clamp(28.0 / d0, 0.55, 1.35) * echelle;
		float  bord = 0.0;
		for (int k = 0; k < 8; k++)
		{
			float a = float(k) * 0.785398; float2 o = float2(cos(a), sin(a)) * epais * px;
			float d = Prof(uvT + o); float3 nn = Normale(uvT + o); float pk = Pochoir(uvT + o).x;
			float pp = max(poids, pk);
			if (pp > 0.01)
			{
				bord = max(bord, smoothstep(0.03, 0.065, abs(d - d0) / min(d, d0)) * step(0.01, pp));
				bord = max(bord, smoothstep(0.32, 0.55, 1.0 - dot(nn, n0)) * 0.85 * step(0.01, min(poids, pk)));
			}
		}
		bord *= traits;

		// 3 et 4. le papier du jeu 2D, qui tient la peinture comme une aquarelle ; les hachures dans l'ombre
		float3 papier = papierOn > 0.5 ? Papier.SampleLevel(PapierSampler, fc / 1024.0, 0).rgb : cPapier;
		float  grain = papierOn > 0.5 ? 1.0 - 0.06 * dessin + 0.12 * dessin * Bruit(fc * 0.7) : 1.0;
		float  couvre = lerp(0.92, 0.74 + 0.14 * Bruit(fc * 0.018 + 5.0), dessin);   // un lavis : la couleur couvre le papier aux trois quarts, inégalement (moins de papier si dessin < 1)
		float3 c = ciel0 > 0.5 ? papier : lerp(papier, peinture * (papier / cPapier), lueur > 0.5 ? 0.95 : couvre) * grain;
		float  h = 0.0;
		if (ciel0 < 0.5 && hachuresOn > 0.5)
		{
			float tache = smoothstep(0.25, 0.75, Bruit(fc * 0.012 + 3.0));
			h = max(h, Hachure(fc, 0.785, 6.0, 0.9) * smoothstep(0.4, 0.15, s) * (0.5 + 0.5 * tache));
			h = max(h, Hachure(fc, -0.785, 6.0, 0.8) * smoothstep(0.08, 0.0, s) * 0.55 * tache);
			h *= (1.0 - lueur);
		}
		// le monde se dissout dans la page au loin ; ce qui luit perce la brume
		float loin = ciel0 > 0.5 ? 1.0 : smoothstep(brume * 0.45, brume, d0) * (1.0 - lueur * 0.85);
		c = lerp(c, papier, loin * (1.0 - ciel0));
		float encreLa = saturate(bord + h * 0.42 * dessin) * (1.0 - loin * 0.85);
		c = lerp(c, cEncre, encreLa);

		// 5. le vignettage ; la nuit, l'encre mange la page depuis les bords
		float r = length((uvv - 0.5) * float2(taille.x / taille.y, 1.0));
		float vign = smoothstep(0.45, 1.05, r);
		c = lerp(c, c * float3(0.74, 0.64, 0.5), vign * 0.55 * dessin);
		c = lerp(c, c * float3(0.32, 0.34, 0.5) + float3(0.02, 0.02, 0.05), nuit * (0.7 + 0.3 * vign));
		c = lerp(c, cEncre, nuit * smoothstep(0.55, 1.15, r) * 0.85);

		// les vues de réglage (Mode) : 1 l'éclairement, 2 les trois tons, 3 le pochoir, 4 ce qui luit, 5 les contours, 6 la profondeur
		if (mode > 0.5)
		{
			float3 v = mode < 1.5 ? lum.xxx : mode < 2.5 ? b.xxx : mode < 3.5 ? float3(poids, Pochoir(uv).y, 0.0) : mode < 4.5 ? lueur.xxx
			         : mode < 5.5 ? (1.0 - bord).xxx : (1.0 - saturate(d0 / brume)).xxx;
			c = v;
		}
		return sortieLineaire > 0.5 ? VersLineaire(c) : c;
	}
};

FBrimoEncre E;
E.px = View.BufferSizeAndInvSize.zw;
E.echelle = max(1.0, View.ViewSizeAndInvSize.y / 1080.0);
E.graine = TrembleOn > 0.5 ? fmod(floor(Temps * 10.0) * 13.7, 97.0) : 0.0;
E.mode = Mode; E.pleinSoleil = PleinSoleil; E.ambiance = Ambiance; E.seuilLueur = SeuilLueur;
E.traits = Traits; E.hachuresOn = HachuresOn; E.papierOn = PapierOn; E.trembleOn = TrembleOn;
E.nuit = Nuit; E.brume = Brume; E.cielLoin = CielLoin; E.sortieLineaire = SortieLineaire; E.dessin = Dessin;
E.cPapier = CouleurPapier; E.cEncre = CouleurEncre; E.cCiel = CouleurCiel; E.cSoleil = CouleurSoleil;
return E.Rendre(GetDefaultSceneTextureUV(Parameters, BRIMO_SCENE), Parameters.SvPosition.xy, UVv, View.ViewSizeAndInvSize.xy, Papier, PapierSampler);
