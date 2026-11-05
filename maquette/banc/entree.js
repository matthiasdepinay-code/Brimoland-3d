// ---------- Le banc d'essai du nœud d'encre d'Unreal, dans la maquette ----------
// La même scène est rendue deux fois :
//  A. par la maquette, comme d'habitude (encre.js) ;
//  B. « comme Unreal » : les matériaux écrivent les images qu'Unreal donne à un post-process (couleur de base linéaire,
//     scène éclairée linéaire, normale du monde, Custom Stencil, profondeur et Custom Depth en cm), puis le nœud Custom
//     Unreal/Rendu/BrimoEncre.hlsl, compilé et traduit en GLSL par outils/shaders/compiler.js, fait l'encre.
// outils/shaders/verifier.js compare les deux images.
import * as THREE from 'three';
import { Encre, VERT, FRAG, PALETTE } from '../src/encre.js';
import { creerMonde, hauteur } from '../src/monde.js';
import { apprenti, gribouille, grum } from '../src/personnages.js';
import { SCEAU, sceauAuSol } from '../src/sceau.js';

THREE.ColorManagement.enabled = false;

// l'éclairage tel qu'Unreal le rendrait : une ambiance, le plein soleil, et ce qui luit (plus vif que le soleil)
const PLEIN_SOLEIL = 3.0, AMBIANCE = 0.3;

// le matériau de la scène, en « mode Unreal » : le même calcul d'éclairement que la maquette, d'autres sorties
const VERT_U = VERT.replace('out vec3 vCouleur;', 'out vec3 vCouleur; out float vProf;').replace('gl_Position = projectionMatrix * viewMatrix * pw;', 'vProf = -(viewMatrix * pw).z;\n  gl_Position = projectionMatrix * viewMatrix * pw;');
const coupe = FRAG.indexOf('  // trois tons');
if (coupe < 0 || !VERT_U.includes('vProf =')) throw new Error('les shaders de la maquette ont changé : revoir banc/entree.js');
const FRAG_U = FRAG.slice(0, coupe)
  .replace('layout(location = 0) out vec4 oCouleur;\nlayout(location = 1) out vec4 oNormale;\nlayout(location = 2) out vec4 oOmbre;',
    'layout(location = 0) out vec4 oBase;\nlayout(location = 1) out vec4 oScene;\nlayout(location = 2) out vec4 oNormale;\nlayout(location = 3) out vec4 oProf;\nuniform float pleinSoleil, ambiance;\nin float vProf;\n' +
    'vec3 lin(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }')
  + `  vec3 baseL = lin(base);
  float E = ambiance + (pleinSoleil - ambiance) * lum;
  vec3 sceneL = baseL * E + baseL * emissif * pleinSoleil * 2.0;     // ce qui luit ajoute sa lumière, comme un Emissive
  // le pochoir : un objet au trait 0,6 n'en a pas (le trait par défaut) ; les autres l'ont, par pas de 0,05 ; + 128 s'il luit
  float pochoir = abs(poidsTrait - 0.6) < 0.001 ? 0.0 : floor(poidsTrait * 20.0 + 0.5) + 1.0;
  if (emissif >= 0.3) pochoir = (pochoir < 0.5 ? 13.0 : pochoir) + 128.0;
  oBase = vec4(baseL, 1.0);
  oScene = vec4(sceneL, 1.0);
  oNormale = vec4(N, pochoir);
  oProf = vec4(vProf * 100.0, pochoir > 0.5 ? vProf * 100.0 : 0.0, 0.0, 1.0);
}`;
// un décalque (le sceau au sol) : comme un Deferred Decal d'Unreal, il ne touche que la couleur de base et la scène (il luit)
const FRAG_DECALQUE_U = `
precision highp float;
uniform sampler2D carte; uniform float opacite; uniform float pleinSoleil;
in vec2 vUv;
layout(location = 0) out vec4 oBase;
layout(location = 1) out vec4 oScene;
layout(location = 2) out vec4 oNormale;
layout(location = 3) out vec4 oProf;
vec3 lin(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
void main() {
  vec4 t = texture(carte, vUv); float a = t.a * opacite; if (a < 0.02) discard;
  vec3 b = lin(t.rgb);
  oBase = vec4(b, a); oScene = vec4(b * pleinSoleil * 3.0, a);
  oNormale = vec4(0.0); oProf = vec4(0.0);   // alpha 0 : la normale, le pochoir et la profondeur restent ceux du sol
}`;
const VERT_DECALQUE_U = `out vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

function versUnreal(scene) {
  const avant = new Map(), communs = { pleinSoleil: { value: PLEIN_SOLEIL }, ambiance: { value: AMBIANCE } };
  scene.traverse((o) => {
    if (!o.isMesh || !o.material || !o.material.uniforms) return;
    const m = o.material, u = m.uniforms;
    let n;
    if (u.poidsTrait) n = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: VERT_U, fragmentShader: FRAG_U, vertexColors: m.vertexColors, side: m.side, transparent: m.transparent, depthWrite: m.depthWrite, uniforms: Object.assign({}, u, communs) });
    else if (u.carte) n = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, vertexShader: VERT_DECALQUE_U, fragmentShader: FRAG_DECALQUE_U, transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: Object.assign({}, u, communs) });
    else return;
    avant.set(o, m); o.material = n;
  });
  return () => { for (const [o, m] of avant) o.material = m; };
}

// la scène de la maquette, posée comme au lancement
function scene(W, H) {
  const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace; renderer.setPixelRatio(1); renderer.setSize(W, H);
  document.body.appendChild(renderer.domElement);
  const sc = new THREE.Scene(), camera = new THREE.PerspectiveCamera(48, W / H, 0.1, 400); camera.layers.enable(1);
  const sansOmbre = (o) => o.traverse((q) => q.layers.set(1));
  const encre = new Encre(renderer); encre.taille(W, H, 1);
  const monde = creerMonde(sc);
  const moi = apprenti(), grib = gribouille(), gr = grum();
  for (const p of [moi, grib, gr]) sc.add(p);
  moi.position.set(1, hauteur(1, 6), 6); grib.position.set(2.4, hauteur(2.4, 4.8), 4.8); gr.position.set(-0.8, hauteur(-0.8, 4.4), 4.4);
  const sol = sceauAuSol(SCEAU(), -2.5, hauteur(-2.5, -4.5), -4.5, 3.2); sansOmbre(sol); sc.add(sol);
  for (const o of monde.sansOmbre) sansOmbre(o);
  return { renderer, sc, camera, encre, monde, moi, grib, gr };
}

function poser(S, vue, t) {
  const { camera, encre, monde, moi, grib, gr } = S;
  moi.userData.animer(t, 0); grib.userData.animer(t, 0); gr.userData.animer(t, 0);
  for (const a of monde.anims) a(t, 1 / 30);
  const cible = new THREE.Vector3(moi.position.x, moi.position.y + 1.3, moi.position.z);
  camera.position.set(cible.x + Math.sin(vue.yaw) * Math.cos(vue.pitch) * vue.dist, cible.y + Math.sin(vue.pitch) * vue.dist, cible.z + Math.cos(vue.yaw) * Math.cos(vue.pitch) * vue.dist);
  camera.lookAt(cible); camera.updateMatrixWorld();
  const dir = new THREE.Vector3(0.55, 0.75, 0.38).normalize();
  encre.soleil(dir, new THREE.Vector3(moi.position.x, 0, moi.position.z));
  monde.soleil.position.copy(cible).addScaledVector(dir, 115);
  encre.reglages.nuit = vue.nuit || 0;
}

window.__banc = async (glsl, vues) => {
  const W = 1280, H = 720, S = scene(W, H), { renderer: R, sc, camera, encre } = S;
  // B : les images d'Unreal (4 à la fois), puis le nœud traduit
  const rt = new THREE.WebGLRenderTarget(W, H, { count: 4, type: THREE.HalfFloatType, depthBuffer: true });
  rt.textures[3].minFilter = rt.textures[3].magFilter = THREE.NearestFilter;   // la profondeur ne se filtre pas, comme dans la maquette
  const frag = glsl.replace(/^#version.*\n/, '');
  const B = Array.from({ length: 7 }, () => new THREE.Vector4());
  const noeud = new THREE.RawShaderMaterial({ glslVersion: THREE.GLSL3, depthTest: false, depthWrite: false,
    vertexShader: 'in vec3 position; void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }', fragmentShader: frag,
    uniforms: { Banc: { value: B }, SPIRV_Cross_CombinedtBasesPoint: { value: rt.textures[0] }, SPIRV_Cross_CombinedtScenesPoint: { value: rt.textures[1] },
      SPIRV_Cross_CombinedtNormalesPoint: { value: rt.textures[2] }, SPIRV_Cross_CombinedtProfsPoint: { value: rt.textures[3] }, SPIRV_Cross_CombinedtPapiersPapier: { value: encre.texPapier } } });
  const sc2 = new THREE.Scene(); sc2.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), noeud)); const cam2 = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const lire = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; c.getContext('2d').drawImage(R.domElement, 0, 0); return c; };
  const sorties = [];
  for (const vue of vues) {
    const t = vue.t;
    poser(S, vue, t);
    // A : la maquette
    encre.rendre(sc, camera, t);
    const A = lire();
    // B : comme Unreal
    sc.overrideMaterial = encre.matOmbre; R.setRenderTarget(encre.rtOmbre); R.clear(); R.render(sc, encre.camOmbre); sc.overrideMaterial = null;
    const remettre = versUnreal(sc);
    R.setRenderTarget(rt); R.setClearColor(0x000000, 0); R.clear(); R.render(sc, camera); remettre();
    const p = PALETTE, g = encre.reglages, graine = t;   // la graine du tremblement se calcule dans le nœud, à partir du temps
    B[0].set(W, H, graine, 0); B[1].set(vue.mode || 0, PLEIN_SOLEIL, AMBIANCE, 1.25); B[2].set(1, 1, 1, 1); B[3].set(vue.nuit || 0, g.brume, 1000, 0);
    B[4].set(p.papier.r, p.papier.g, p.papier.b, 1); B[5].set(p.encre.r, p.encre.g, p.encre.b, 1);
    const ciel = new THREE.Color('#8a8fb0'); B[6].set(ciel.r, ciel.g, ciel.b, 1);
    R.setRenderTarget(null); R.setClearColor(p.papier, 1); R.render(sc2, cam2);
    const Bc = lire();
    // l'écart, pixel par pixel
    const a = A.getContext('2d').getImageData(0, 0, W, H).data, b = Bc.getContext('2d').getImageData(0, 0, W, H).data;
    const ecart = document.createElement('canvas'); ecart.width = W; ecart.height = H; const ec = ecart.getContext('2d'), ed = ec.createImageData(W, H);
    let somme = 0, gros = 0, peu = 0;
    for (let i = 0; i < a.length; i += 4) {
      const d = (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2])) / 3;
      somme += d; if (d > 24) gros++; if (d > 3) peu++;
      const k = Math.min(255, d * 4); ed.data[i] = 255; ed.data[i + 1] = 255 - k; ed.data[i + 2] = 255 - k; ed.data[i + 3] = 255;
    }
    ec.putImageData(ed, 0, 0);
    sorties.push({ nom: vue.nom, A: A.toDataURL('image/png'), B: Bc.toDataURL('image/png'), ecart: ecart.toDataURL('image/png'), moyen: somme / (W * H), gros: gros / (W * H), peu: peu / (W * H) });
  }
  return sorties;
};
