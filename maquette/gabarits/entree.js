// ---------- Les gabarits (C1) : les formes de la maquette, exportées en .glb pour Blender ----------
// Ce sont les mêmes blocs que dans la maquette de la DA, à la bonne échelle (1 unité = 1 m), aux bonnes couleurs.
// glTF regarde vers +Z : à l'import, Blender les tourne vers −Y, comme le veut le cahier des charges.
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { apprenti, gribouille, grum } from '../src/personnages.js';
import { arbre, atelier, caillou, hasard, COULEURS } from '../src/monde.js';
import { materiau } from '../src/encre.js';

THREE.ColorManagement.enabled = false; // les couleurs du jeu 2D telles quelles (on les passe en linéaire à l'export)

// le matériau à l'encre ne voyage pas : on le remplace par un matériau standard de la même couleur, nommé par sa couleur
function versStandard(racine) {
  const cache = new Map(); let n = 0;
  racine.traverse((o) => {
    o.userData = {};
    if (!o.isMesh) return;
    if (!o.name) o.name = racine.name + '_' + String(++n).padStart(2, '0');
    const u = o.material.uniforms || {};
    const hex = u.albedo ? u.albedo.value.getHexString() : '888888', em = u.emissif ? u.emissif.value : 0;
    const cle = hex + ':' + em;
    if (!cache.has(cle)) {
      const lin = new THREE.Color().setHex(parseInt(hex, 16)).convertSRGBToLinear();
      const m = new THREE.MeshStandardMaterial({ color: lin, roughness: 1, metalness: 0 });
      if (em >= 0.3) { m.emissive = lin.clone(); m.emissiveIntensity = 1; }
      m.name = 'M_' + hex.toUpperCase();
      cache.set(cle, m);
    }
    o.material = cache.get(cle);
  });
  return racine;
}

// la boîte exacte (précise : sinon un toit tourné de 45° compte pour sa boîte tournée)
const boite = (g) => { g.updateMatrixWorld(true); return new THREE.Box3().setFromObject(g, true); };
// debout sur le sol, au centre ; les personnages, mis à la hauteur du cahier des charges (avec le chapeau)
const HAUTEUR = { Apprenti: 2.40, Gribouille: 1.70, Grum: 1.45 };
function posePied(g, nom) {
  g.position.set(0, 0, 0); g.rotation.set(0, 0, 0); g.scale.setScalar(1);
  if (HAUTEUR[nom]) { const b = boite(g); g.scale.setScalar(HAUTEUR[nom] / (b.max.y - b.min.y)); }
  const b = boite(g); g.position.set(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2); return g;
}

const GABARITS = {
  Apprenti: () => apprenti(),
  Gribouille: () => gribouille(),
  Grum: () => grum(),
  Atelier: () => atelier(),
  // arbre() tire au hasard un feuillu (trois boules placées de travers) ou un sapin (trois cônes empilés dans l'axe)
  Arbre_Feuillu: () => { let k = 1, a; do { a = arbre(hasard(k++), 0, 0); } while (a.children[1].position.x === 0); return a; },
  Sapin: () => { let k = 1, a; do { a = arbre(hasard(k++), 0, 0); } while (a.children[1].position.x !== 0); return a; },
  Rocher: () => { const g = new THREE.Group(); g.add(new THREE.Mesh(caillou(hasard(3), 1.4), materiau(COULEURS.pierre))); return g; },
};

async function exporter() {
  const ex = new GLTFExporter(), sortie = {}, tailles = {}, rangee = new THREE.Scene();
  let x = 0;
  for (const [nom, faire] of Object.entries(GABARITS)) {
    const g = posePied(faire(), nom); g.name = 'Gabarit_' + nom; versStandard(g);
    const b = boite(g), d = b.getSize(new THREE.Vector3());
    tailles[nom] = { largeur: +d.x.toFixed(2), hauteur: +d.y.toFixed(2), profondeur: +d.z.toFixed(2) };
    const scene = new THREE.Scene(); scene.add(g);
    sortie[nom] = await ex.parseAsync(scene, { binary: true });
    // la rangée : tous côte à côte, pour comparer les échelles
    const copie = g.clone(); x += d.x / 2; copie.position.x += x; x += d.x / 2 + 1; rangee.add(copie);
  }
  sortie.Ensemble = await ex.parseAsync(rangee, { binary: true });
  const b64 = (buf) => { const o = new Uint8Array(buf); let s = ''; for (let i = 0; i < o.length; i += 0x8000) s += String.fromCharCode.apply(null, o.subarray(i, i + 0x8000)); return btoa(s); };
  const fichiers = {}; for (const k in sortie) fichiers[k] = b64(sortie[k]);
  return { fichiers, tailles };
}
window.__gabarits = exporter;
