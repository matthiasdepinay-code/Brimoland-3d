// ---------- Le rendu « dessiné » : l'encre sur parchemin, en 3D ----------
// Deux étapes, comme on le fera dans Unreal :
//  1. la scène est peinte en aplats (trois tons par matière, ombres portées) dans trois images à la fois :
//     la couleur, les normales (+ l'épaisseur de trait voulue par objet), et l'ombre (pour les hachures) ;
//  2. une passe d'écran trace l'encre : contours (sauts de profondeur et de normale), hachures dans les ombres,
//     papier du jeu 2D, brume de papier au loin, vignettage ; le trait « bout » 10 fois par seconde.
import * as THREE from 'three';

export const PALETTE = {
  papier: new THREE.Color('#efe3c4'), encre: new THREE.Color('#1f1a16'), sepia: new THREE.Color('#6b4f2a'),
};

// ---------- 1. le matériau de la scène ----------
export const VERT = /* glsl */ `
#include <common>
#include <skinning_pars_vertex>
uniform mat4 lumiereMatrice;
out vec3 vNormalW; out vec3 vNormalV; out vec4 vPosL; out vec3 vCouleur; out vec2 vUv;
void main() {
#ifdef USE_INSTANCING
  mat4 im = modelMatrix * instanceMatrix;
#else
  mat4 im = modelMatrix;
#endif
  // les modèles à squelette (les personnages livrés) : la pose de l'os, sur la position et la normale
  vec3 objectNormal = normal;
#include <skinbase_vertex>
#include <skinnormal_vertex>
  vec3 transformed = position;
#include <skinning_vertex>
  vec4 pw = im * vec4(transformed, 1.0);
  vNormalW = normalize(mat3(im) * objectNormal);
  vUv = uv;
  vNormalV = normalize(mat3(viewMatrix) * vNormalW);
  vPosL = lumiereMatrice * pw;
  vCouleur = vec3(1.0);
#ifdef USE_COLOR
  vCouleur *= color;
#endif
#ifdef USE_INSTANCING_COLOR
  vCouleur *= instanceColor;
#endif
  gl_Position = projectionMatrix * viewMatrix * pw;
}`;

export const FRAG = /* glsl */ `
precision highp float;
uniform vec3 albedo; uniform vec3 soleilDir; uniform vec3 soleilCouleur; uniform vec3 ciel;
uniform sampler2D ombreTex; uniform float poidsTrait; uniform float emissif; uniform float opacite; uniform float recoitOmbre;
uniform sampler2D carte; uniform float aCarte;   // une texture de couleur (la palette T_Palette, un visage), lue telle quelle
in vec3 vNormalW; in vec3 vNormalV; in vec4 vPosL; in vec3 vCouleur; in vec2 vUv;
layout(location = 0) out vec4 oCouleur;
layout(location = 1) out vec4 oNormale;
layout(location = 2) out vec4 oOmbre;
float ombrePortee() {
  vec3 p = vPosL.xyz / vPosL.w * 0.5 + 0.5;
  if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0 || p.z > 1.0) return 1.0;
  vec2 t = 1.0 / vec2(textureSize(ombreTex, 0)); float s = 0.0;
  for (int i = -1; i <= 1; i++) for (int j = -1; j <= 1; j++) s += p.z - 0.0012 > texture(ombreTex, p.xy + vec2(i, j) * t).r ? 0.0 : 1.0;
  return s / 9.0;
}
void main() {
  vec3 N = normalize(vNormalW); vec3 Nv = normalize(vNormalV);
  if (!gl_FrontFacing) { N = -N; Nv = -Nv; }
  vec3 base = albedo * vCouleur;
  vec4 tx = aCarte > 0.5 ? texture(carte, vUv) : vec4(1.0);  // un visage peint sur la tête a de la transparence
  base *= tx.rgb;
  float alpha = opacite * tx.a; if (alpha < 0.02) discard;
  float lum = max(dot(N, normalize(soleilDir)), 0.0) * mix(1.0, ombrePortee(), recoitOmbre);  // un visage ne reçoit pas l'ombre de son chapeau
  // trois tons : lumière, demi-teinte, ombre (avec un rien de flou pour ne pas crénerer)
  float b = 0.5 * smoothstep(0.14, 0.2, lum) + 0.5 * smoothstep(0.52, 0.58, lum);
  vec3 ombreTon = base * vec3(0.68, 0.64, 0.7) + ciel * 0.04;       // l'ombre tire un peu vers le violet sépia
  vec3 demiTon = base * vec3(0.84, 0.8, 0.82);
  vec3 c = b < 0.5 ? mix(ombreTon, demiTon, b * 2.0) : mix(demiTon, base, b * 2.0 - 1.0);
  c *= mix(vec3(1.0), soleilCouleur, 0.35);
  c = mix(c, base, emissif);
  oCouleur = vec4(c, alpha);
  oNormale = vec4(Nv * 0.5 + 0.5, poidsTrait);
  oOmbre = vec4(mix(b, 1.0, emissif), emissif, 0.0, 1.0);
}`;

// les uniformes partagés par tous les matériaux de la scène (le soleil, l'ombre portée)
export const commun = {
  lumiereMatrice: { value: new THREE.Matrix4() }, soleilDir: { value: new THREE.Vector3(0.5, 0.8, 0.3) },
  soleilCouleur: { value: new THREE.Color(1, 1, 1) }, ciel: { value: new THREE.Color('#8a8fb0') }, ombreTex: { value: null },
};

// un matériau « à l'encre » : une couleur, une épaisseur de trait (0 = pas de contour), émissif ou non
export function materiau(couleur, o = {}) {
  const m = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3, vertexShader: VERT, fragmentShader: FRAG, vertexColors: !!o.couleursSommets,
    side: o.deuxFaces ? THREE.DoubleSide : THREE.FrontSide, transparent: !!o.transparent, depthWrite: o.transparent ? false : true,
    uniforms: Object.assign({}, commun, {
      albedo: { value: new THREE.Color(couleur) }, poidsTrait: { value: o.trait == null ? 0.6 : o.trait },
      emissif: { value: o.emissif || 0 }, opacite: { value: o.opacite == null ? 1 : o.opacite }, recoitOmbre: { value: o.ombrePortee === false ? 0 : 1 },
      carte: { value: o.carte || null }, aCarte: { value: o.carte ? 1 : 0 },
    }),
  });
  return m;
}

// un décalque (le sceau dessiné par le jeu 2D, posé au sol ou tracé dans l'air) : sa texture, sans ombrage
const FRAG_DECALQUE = /* glsl */ `
precision highp float;
uniform sampler2D carte; uniform float opacite;
in vec2 vUv; in vec3 vNormalV;
layout(location = 0) out vec4 oCouleur;
layout(location = 1) out vec4 oNormale;
layout(location = 2) out vec4 oOmbre;
void main() {
  vec4 t = texture(carte, vUv); float a = t.a * opacite; if (a < 0.02) discard;
  oCouleur = vec4(t.rgb, a); oNormale = vec4(normalize(vNormalV) * 0.5 + 0.5, 0.0); oOmbre = vec4(1.0, 1.0, 0.0, a);
}`;
const VERT_DECALQUE = /* glsl */ `out vec2 vUv; out vec3 vNormalV; void main() { vUv = uv; vNormalV = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
export function materiauDecalque(texture, opacite = 1) {
  return new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: VERT_DECALQUE, fragmentShader: FRAG_DECALQUE, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { carte: { value: texture }, opacite: { value: opacite } } });
}

// ---------- 2. la passe d'encre ----------
const FRAG_ENCRE = /* glsl */ `
precision highp float;
uniform sampler2D tCouleur, tNormale, tOmbre, tProf, tPapier;
uniform vec2 taille; uniform float graine, near, far, echelle;
uniform float encre, traits, hachures, papierOn, tremble, nuit, brume, dessin;   // dessin : la force des effets dessinés (1 : la maquette d'origine)
uniform vec3 cPapier, cEncre;
in vec2 vUv; out vec4 o;
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float bruit(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
float profLin(vec2 uv) { float z = texture(tProf, uv).r; return near * far / (far - z * (far - near)); }
// une famille de hachures : des traits parallèles, un peu tremblés, d'épaisseur ep (en pixels)
float hachure(vec2 p, float ang, float pas, float ep) {
  vec2 d = vec2(cos(ang), sin(ang)); float v = dot(p, d) + (bruit(p * 0.04 + graine) - 0.5) * 2.5;
  float f = abs(fract(v / pas) - 0.5) * pas; return 1.0 - smoothstep(ep * 0.5, ep * 0.5 + 0.9, f);
}
void main() {
  vec3 peinture = texture(tCouleur, vUv).rgb;
  if (encre < 0.5) { o = vec4(peinture, 1.0); return; }
  vec2 px = 1.0 / taille, fc = gl_FragCoord.xy / echelle;
  // le trait tremble : les échantillons sont décalés d'un bruit qui change 10 fois par seconde
  vec2 w = tremble > 0.5 ? (vec2(bruit(fc / 7.0 + graine), bruit(fc / 7.0 + graine + 31.7)) - 0.5) * 2.4 * dessin * px * echelle : vec2(0.0);
  vec2 uvT = vUv + w;
  vec4 nc = texture(tNormale, uvT); vec3 n0 = nc.xyz * 2.0 - 1.0; float poids = nc.a;
  float d0 = profLin(uvT), ciel0 = step(0.9999, texture(tProf, uvT).r);
  float epais = mix(0.9, 2.1, poids) * mix(0.85, 1.0, dessin) * clamp(28.0 / d0, 0.55, 1.35) * echelle;
  float bord = 0.0;
  for (int k = 0; k < 8; k++) {
    float a = float(k) * 0.785398; vec2 off = vec2(cos(a), sin(a)) * epais * px;
    float d = profLin(uvT + off); vec4 nn = texture(tNormale, uvT + off);
    float pp = max(poids, nn.a);
    if (pp > 0.01) {
      bord = max(bord, smoothstep(0.03, 0.065, abs(d - d0) / min(d, d0)) * step(0.01, pp));
      bord = max(bord, smoothstep(0.32, 0.55, 1.0 - dot(nn.xyz * 2.0 - 1.0, n0)) * 0.85 * step(0.01, min(poids, nn.a)));
    }
  }
  bord *= traits;
  vec4 om = texture(tOmbre, vUv); float s = om.r, lueur = om.g, h = 0.0;
  // le papier du jeu 2D, qui tient la peinture comme une aquarelle
  vec3 papier = papierOn > 0.5 ? texture(tPapier, fc / 1024.0).rgb : cPapier;
  float grain = papierOn > 0.5 ? 1.0 - 0.06 * dessin + 0.12 * dessin * bruit(fc * 0.7) : 1.0;
  float couvre = mix(0.92, 0.74 + 0.14 * bruit(fc * 0.018 + 5.0), dessin);   // un lavis : la couleur couvre le papier aux trois quarts, inégalement (moins de papier si dessin < 1)
  vec3 c = ciel0 > 0.5 ? papier : mix(papier, peinture * (papier / cPapier), lueur > 0.5 ? 0.95 : couvre) * grain;
  // les hachures, dans l'ombre seulement (pas sur ce qui luit)
  if (ciel0 < 0.5 && hachures > 0.5) {
    float tache = smoothstep(0.25, 0.75, bruit(fc * 0.012 + 3.0));
    h = max(h, hachure(fc, 0.785, 6.0, 0.9) * smoothstep(0.4, 0.15, s) * (0.5 + 0.5 * tache));
    h = max(h, hachure(fc, -0.785, 6.0, 0.8) * smoothstep(0.08, 0.0, s) * 0.55 * tache);
    h *= (1.0 - lueur);
  }
  // le monde se dissout dans la page au loin
  float loin = ciel0 > 0.5 ? 1.0 : smoothstep(brume * 0.45, brume, d0) * (1.0 - lueur * 0.85);  // ce qui luit perce la brume
  c = mix(c, papier, loin * (1.0 - ciel0));
  float encreLa = clamp(bord + h * 0.42 * dessin, 0.0, 1.0) * (1.0 - loin * 0.85);
  c = mix(c, cEncre, encreLa);
  // la nuit : l'encre mange la page depuis les bords
  float r = length((vUv - 0.5) * vec2(taille.x / taille.y, 1.0));
  float vign = smoothstep(0.45, 1.05, r);
  c = mix(c, c * vec3(0.74, 0.64, 0.5), vign * 0.55 * dessin);
  c = mix(c, c * vec3(0.32, 0.34, 0.5) + vec3(0.02, 0.02, 0.05), nuit * (0.7 + 0.3 * vign));
  c = mix(c, cEncre, nuit * smoothstep(0.55, 1.15, r) * 0.85);
  o = vec4(c, 1.0);
}`;

export class Encre {
  constructor(renderer) {
    this.renderer = renderer;
    this.reglages = { encre: true, traits: true, hachures: true, papier: true, tremble: true, nuit: 0, brume: 95, dessin: 0.65 };  // dessin : 0,65 validé le 6 nov. (1 : plus dessiné)
    this.scene2 = new THREE.Scene(); this.cam2 = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const papier = U.paper(1024, 1024, 7);
    this.texPapier = new THREE.CanvasTexture(papier); this.texPapier.wrapS = this.texPapier.wrapT = THREE.RepeatWrapping; this.texPapier.colorSpace = THREE.NoColorSpace;
    this.post = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, depthTest: false, depthWrite: false,
      vertexShader: /* glsl */ `out vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`, fragmentShader: FRAG_ENCRE,
      uniforms: { tCouleur: { value: null }, tNormale: { value: null }, tOmbre: { value: null }, tProf: { value: null }, tPapier: { value: this.texPapier },
        taille: { value: new THREE.Vector2(1, 1) }, graine: { value: 0 }, near: { value: 0.1 }, far: { value: 400 }, echelle: { value: 1 },
        encre: { value: 1 }, traits: { value: 1 }, hachures: { value: 1 }, papierOn: { value: 1 }, tremble: { value: 1 }, nuit: { value: 0 }, brume: { value: 140 }, dessin: { value: 0.65 },
        cPapier: { value: PALETTE.papier.clone() }, cEncre: { value: PALETTE.encre.clone() } } });
    this.scene2.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.post));
    // l'ombre portée : une carte de profondeur vue du soleil
    this.rtOmbre = new THREE.WebGLRenderTarget(2048, 2048, { depthTexture: new THREE.DepthTexture(2048, 2048) });
    this.camOmbre = new THREE.OrthographicCamera(-45, 45, 45, -45, 1, 220); this.camOmbre.layers.set(0); // le calque 1 : ce qui ne fait pas d'ombre
    this.matOmbre = new THREE.MeshBasicMaterial({ colorWrite: false });
    commun.ombreTex.value = this.rtOmbre.depthTexture;
    this.rt = null;
  }
  taille(w, h, ratio) {
    const W = Math.round(w * ratio), H = Math.round(h * ratio);
    if (this.rt) this.rt.dispose();
    this.rt = new THREE.WebGLRenderTarget(W, H, { count: 3, type: THREE.HalfFloatType, depthTexture: new THREE.DepthTexture(W, H) });
    const u = this.post.uniforms;
    u.tCouleur.value = this.rt.textures[0]; u.tNormale.value = this.rt.textures[1]; u.tOmbre.value = this.rt.textures[2]; u.tProf.value = this.rt.depthTexture;
    u.taille.value.set(W, H); u.echelle.value = ratio;
  }
  soleil(dir, centre) {
    commun.soleilDir.value.copy(dir).normalize();
    this.camOmbre.position.copy(centre).addScaledVector(commun.soleilDir.value, 110); this.camOmbre.lookAt(centre); this.camOmbre.updateMatrixWorld(); this.camOmbre.updateProjectionMatrix();
    commun.lumiereMatrice.value.multiplyMatrices(this.camOmbre.projectionMatrix, this.camOmbre.matrixWorldInverse);
  }
  rendre(scene, camera, t) {
    const R = this.renderer, u = this.post.uniforms, g = this.reglages;
    // l'ombre portée
    scene.overrideMaterial = this.matOmbre; R.setRenderTarget(this.rtOmbre); R.clear(); R.render(scene, this.camOmbre); scene.overrideMaterial = null;
    // la peinture, en trois images
    R.setRenderTarget(this.rt); R.setClearColor(PALETTE.papier, 1); R.clear(); R.render(scene, camera);
    // l'encre
    u.near.value = camera.near; u.far.value = camera.far; u.graine.value = g.tremble ? Math.floor(t * 10) * 13.7 % 97 : 0;
    u.encre.value = g.encre ? 1 : 0; u.traits.value = g.traits ? 1 : 0; u.hachures.value = g.hachures ? 1 : 0; u.papierOn.value = g.papier ? 1 : 0; u.tremble.value = g.tremble ? 1 : 0;
    u.nuit.value = g.nuit; u.brume.value = g.brume; u.dessin.value = g.dessin;
    R.setRenderTarget(null); R.render(this.scene2, this.cam2);
  }
}
