// ---------- Le Jardin, en petit : de quoi juger la DA ----------
// Terrain à facettes, l'Atelier, des arbres, des rochers, une mare, un feu de camp, une île volante, des nuages.
// Les couleurs sont celles du jeu 2D (js/sim.js, js/data.js).
import * as THREE from 'three';
import { materiau } from './encre.js';

export const COULEURS = {
  herbe: '#78a24a', herbeSombre: '#6a9a45', herbeClaire: '#8fb05a', terre: '#a3844f', chemin: '#b89a64', pierre: '#a8977a', sable: '#d9c48a',
  bois: '#8d6a3c', tronc: '#7a5634', feuillage: ['#5f8f3e', '#6a9a45', '#4f7f35', '#78a24a'], eau: '#9dbcd8', feu: '#e8842a', flamme: '#f0d070',
  mur: '#d6c49a', toit: '#9a4a3a', nuage: '#f7f0de', soleil: '#f3d98a', fleurs: ['#d65a8a', '#e8c040', '#f4efe6', '#b070e0'],
};

// un bruit doux et reproductible
export function hasard(graine) { let a = graine >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const h2 = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
function bruit(x, y) { const i = Math.floor(x), j = Math.floor(y), f = x - i, g = y - j, u = f * f * (3 - 2 * f), v = g * g * (3 - 2 * g);
  return (h2(i, j) * (1 - u) + h2(i + 1, j) * u) * (1 - v) + (h2(i, j + 1) * (1 - u) + h2(i + 1, j + 1) * u) * v; }
const fbm = (x, y) => bruit(x, y) * 0.55 + bruit(x * 2.1, y * 2.1) * 0.28 + bruit(x * 4.3, y * 4.3) * 0.17;

export const MARE = { x: 13, z: 9, r: 6.5, niveau: -0.55 };
export const ATELIER = { x: -2, z: -14 };
// la hauteur du sol : un pré plat autour de l'Atelier, des collines qui montent vers le bord du monde
export function hauteur(x, z) {
  const d = Math.hypot(x, z);
  let h = (fbm(x * 0.045 + 10, z * 0.045 + 3) - 0.45) * 6 + Math.max(0, d - 32) * 0.18 + Math.pow(Math.max(0, d - 70), 1.4) * 0.12;
  h *= Math.min(1, Math.max(0.12, (d - 6) / 22));
  const dm = Math.hypot(x - MARE.x, z - MARE.z); if (dm < MARE.r + 3) h = Math.min(h, -1.6 + Math.max(0, dm - MARE.r + 1) * 0.6);
  const da = Math.hypot(x - ATELIER.x, z - ATELIER.z); if (da < 9) h = h * (da / 9);
  return h;
}
// le chemin : de la porte de l'Atelier vers le sud, en lacets
const surChemin = (x, z) => z > ATELIER.z + 3 && z < 30 && Math.abs(x - (ATELIER.x + Math.sin(z * 0.12) * 4)) < 1.4;

function terrain() {
  const taille = 260, n = 150;
  const g = new THREE.PlaneGeometry(taille, taille, n, n); g.rotateX(-Math.PI / 2);
  const P = g.attributes.position; for (let i = 0; i < P.count; i++) { const x = P.getX(i), z = P.getZ(i); P.setY(i, hauteur(x, z)); }
  g.computeVertexNormals();
  // un lavis continu : l'herbe varie doucement, le chemin et le sable s'y fondent, la pierre affleure sur les pentes
  const N = g.attributes.normal, cols = new Float32Array(P.count * 3), c = new THREE.Color(), a = new THREE.Color(), b = new THREE.Color();
  const herbe = new THREE.Color(COULEURS.herbe), sombre = new THREE.Color(COULEURS.herbeSombre), claire = new THREE.Color(COULEURS.herbeClaire);
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), y = P.getY(i), z = P.getZ(i), pente = 1 - N.getY(i), dm = Math.hypot(x - MARE.x, z - MARE.z), v = fbm(x * 0.08, z * 0.08);
    c.copy(sombre).lerp(claire, Math.min(1, Math.max(0, (v - 0.3) * 2))).lerp(herbe, 0.35);
    const dch = Math.abs(x - (ATELIER.x + Math.sin(z * 0.12) * 4)), chemin = z > ATELIER.z + 3 && z < 30 ? Math.max(0, 1 - Math.max(0, dch - 0.9) / 1.2) : 0;
    c.lerp(a.set(COULEURS.chemin), chemin);
    c.lerp(b.set(COULEURS.pierre), Math.min(1, Math.max(0, (pente - 0.22) * 5)));
    if (dm < MARE.r + 2.2) c.lerp(a.set(COULEURS.sable), Math.min(1, Math.max(0, (MARE.r + 2.2 - dm) / 1.4)) * (y < MARE.niveau + 1 ? 1 : 0.3));
    c.toArray(cols, i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  const m = new THREE.Mesh(g, materiau('#ffffff', { couleursSommets: true, trait: 0.35 })); m.name = 'terrain';
  return m;
}

function facettes(g) { const f = g.toNonIndexed(); f.computeVertexNormals(); return f; }
export function caillou(rnd, r) { const g = new THREE.DodecahedronGeometry(r, 0); const P = g.attributes.position; for (let i = 0; i < P.count; i++) P.setXYZ(i, P.getX(i) * (0.8 + rnd() * 0.4), P.getY(i) * (0.55 + rnd() * 0.3), P.getZ(i) * (0.8 + rnd() * 0.4)); return facettes(g); }

export function arbre(rnd, x, z) {
  const g = new THREE.Group(), y = hauteur(x, z), s = 0.8 + rnd() * 0.7;
  const tronc = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * s, 0.3 * s, 2.6 * s, 7), materiau(COULEURS.tronc, { trait: 0.8 })); tronc.position.y = 1.3 * s; g.add(tronc);
  if (rnd() < 0.3) { // un sapin : des cônes empilés
    for (let k = 0; k < 3; k++) { const c = new THREE.Mesh(facettes(new THREE.ConeGeometry((1.9 - k * 0.45) * s, 2.2 * s, 8)), materiau('#4f7f35', { trait: 0.8 })); c.position.y = (2.4 + k * 1.15) * s; g.add(c); }
  } else { // un feuillu : trois boules de feuillage
    const coul = COULEURS.feuillage[Math.floor(rnd() * COULEURS.feuillage.length)];
    for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(facettes(new THREE.IcosahedronGeometry((1.2 + rnd() * 0.5) * s, 1)), materiau(coul, { trait: 0.8 })); b.position.set((rnd() - 0.5) * 1.4 * s, (2.9 + rnd() * 0.9) * s, (rnd() - 0.5) * 1.4 * s); g.add(b); }
  }
  g.position.set(x, y - 0.1, z); g.rotation.y = rnd() * 6.28; return g;
}

export function atelier() {
  const g = new THREE.Group(), y = hauteur(ATELIER.x, ATELIER.z);
  const murs = new THREE.Mesh(new THREE.BoxGeometry(7, 4.2, 6), materiau(COULEURS.mur, { trait: 0.9 })); murs.position.y = 2.1; g.add(murs);
  // les colombages
  for (const [px, pz, w, h, d] of [[-3.5, 0, 0.22, 4.2, 6.1], [3.5, 0, 0.22, 4.2, 6.1], [0, 4.15, 7.2, 0.25, 6.15], [0, 0.12, 7.2, 0.25, 6.15]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), materiau(COULEURS.bois, { trait: 0.5 })); b.position.set(px, pz + (h > 1 ? 2.1 - pz : 0), 0); g.add(b); }
  const toit = new THREE.Mesh(facettes(new THREE.ConeGeometry(5.6, 3.6, 4)), materiau(COULEURS.toit, { trait: 1 })); toit.rotation.y = Math.PI / 4; toit.position.y = 6; toit.scale.set(1.05, 1, 0.92); g.add(toit);
  const chem = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.2, 0.8), materiau(COULEURS.pierre, { trait: 0.9 })); chem.position.set(2, 7, -1); g.add(chem);
  const porte = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.4, 0.2), materiau('#6b4a2a', { trait: 0.9 })); porte.position.set(0, 1.2, 3.02); g.add(porte);
  const fenetres = [];
  for (const fx of [-2.2, 2.2]) { const f = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1, 0.15), materiau('#f0c860', { trait: 0.9, emissif: 0.4 })); f.position.set(fx, 2.5, 3.02); g.add(f); fenetres.push(f); }
  // l'enseigne : un sceau suspendu
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.6, 6), materiau(COULEURS.bois)); pot.rotation.z = Math.PI / 2; pot.position.set(3.4, 3.4, 3.4); g.add(pot);
  g.position.set(ATELIER.x, y, ATELIER.z);
  g.userData.fenetres = fenetres; g.userData.cheminee = new THREE.Vector3(ATELIER.x + 2, y + 8.2, ATELIER.z - 1);
  return g;
}

function feuDeCamp(x, z) {
  const g = new THREE.Group(), y = hauteur(x, z), rnd = hasard(5);
  for (let k = 0; k < 8; k++) { const a = k / 8 * 6.28, c = new THREE.Mesh(caillou(rnd, 0.28), materiau(COULEURS.pierre, { trait: 0.7 })); c.position.set(Math.cos(a) * 0.9, 0.1, Math.sin(a) * 0.9); g.add(c); }
  for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 1.3, 6), materiau(COULEURS.tronc, { trait: 0.8 })); b.rotation.set(Math.PI / 2 - 0.35, k * 2.1, 0); b.position.y = 0.3; g.add(b); }
  const flammes = [];
  for (const [r, h, c, dx] of [[0.42, 1.3, COULEURS.feu, 0], [0.28, 1.0, COULEURS.flamme, 0.12], [0.22, 0.8, COULEURS.feu, -0.25]]) { const f = new THREE.Mesh(facettes(new THREE.ConeGeometry(r, h, 6)), materiau(c, { emissif: 1, trait: 0.7 })); f.position.set(dx, h / 2 + 0.2, dx * 0.5); g.add(f); flammes.push(f); }
  g.position.set(x, y, z); g.userData.flammes = flammes;
  return g;
}

function ileVolante(x, y, z) {
  const g = new THREE.Group(), rnd = hasard(9);
  const roc = new THREE.Mesh(facettes(new THREE.ConeGeometry(7, 9, 9, 2)), materiau(COULEURS.pierre, { trait: 1 })); roc.rotation.x = Math.PI; roc.position.y = -4.5; g.add(roc);
  const pre = new THREE.Mesh(facettes(new THREE.CylinderGeometry(7.2, 7, 0.9, 9)), materiau(COULEURS.herbe, { trait: 1 })); g.add(pre);
  const a = arbre(rnd, 0, 0); a.position.set(1, 0.4, -1); a.scale.setScalar(1.2); g.add(a);
  g.position.set(x, y, z); return g;
}

function nuage(rnd) {
  const g = new THREE.Group();
  for (let k = 0; k < 5; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(2.2 + rnd() * 2.4, 14, 10), materiau(COULEURS.nuage, { trait: 0.5, emissif: 0.55 })); b.position.set((k - 2) * 3 + rnd(), rnd() * 1.6, rnd() * 2); b.scale.y = 0.7; g.add(b); }
  return g;
}

// les touffes d'herbe et les fleurs : des centaines, en instances
function touffes(rnd) {
  const geo = facettes(new THREE.ConeGeometry(0.14, 0.55, 3)), n = 420;
  const m = new THREE.InstancedMesh(geo, materiau('#ffffff', { trait: 0 }), n), M = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color();
  let k = 0;
  while (k < n) { const x = (rnd() - 0.5) * 120, z = (rnd() - 0.5) * 120; if (Math.hypot(x - MARE.x, z - MARE.z) < MARE.r + 1.5 || surChemin(x, z) || Math.hypot(x - ATELIER.x, z - ATELIER.z) < 6) continue;
    q.setFromEuler(new THREE.Euler((rnd() - 0.5) * 0.5, rnd() * 6.28, (rnd() - 0.5) * 0.5)); const s = 0.6 + rnd() * 0.9;
    M.compose(new THREE.Vector3(x, hauteur(x, z) + 0.2 * s, z), q, new THREE.Vector3(s, s, s)); m.setMatrixAt(k, M);
    m.setColorAt(k, c.set(rnd() < 0.5 ? COULEURS.herbeClaire : COULEURS.herbe)); k++; }
  const fl = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.09, 0), materiau('#ffffff', { trait: 0, emissif: 0.3 }), 110);
  for (let i = 0; i < 110; i++) { const a = rnd() * 6.28, r = 7 + rnd() * 28, x = Math.cos(a) * r, z = Math.sin(a) * r; M.compose(new THREE.Vector3(x, hauteur(x, z) + 0.22, z), q.identity(), new THREE.Vector3(1, 1, 1)); fl.setMatrixAt(i, M); fl.setColorAt(i, c.set(COULEURS.fleurs[i % 4])); }
  return [m, fl];
}

// decor : false pour un Jardin sans l'Atelier, les arbres, les rochers, le feu ni l'île de la maquette (les vrais modèles prennent leur place)
export function creerMonde(scene, { decor = true } = {}) {
  const rnd = hasard(42), anims = [];
  scene.add(terrain());
  const at = atelier(); if (decor) scene.add(at);
  for (const t of touffes(rnd)) scene.add(t);
  // les arbres, en bosquets, loin de l'Atelier, de la mare et du chemin
  if (decor) { let n = 0; while (n < 70) { const a = rnd() * 6.28, r = 14 + rnd() * 75, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (Math.hypot(x - MARE.x, z - MARE.z) < MARE.r + 3 || surChemin(x, z) || Math.hypot(x - ATELIER.x, z - ATELIER.z) < 10 || (Math.abs(x) < 9 && z > -4 && z < 14)) continue; scene.add(arbre(rnd, x, z)); n++; } }
  if (decor) for (let k = 0; k < 30; k++) { const a = rnd() * 6.28, r = 8 + rnd() * 60, x = Math.cos(a) * r, z = Math.sin(a) * r; const c = new THREE.Mesh(caillou(rnd, 0.5 + rnd() * 1.4), materiau(COULEURS.pierre, { trait: 0.8 })); c.position.set(x, hauteur(x, z), z); c.rotation.y = rnd() * 6; scene.add(c); }
  // la mare et ses ronds dans l'eau
  const eau = new THREE.Mesh(new THREE.CircleGeometry(MARE.r + 1.2, 40), materiau(COULEURS.eau, { trait: 0.4 })); eau.rotation.x = -Math.PI / 2; eau.position.set(MARE.x, MARE.niveau, MARE.z); scene.add(eau);
  const ronds = []; for (let k = 0; k < 3; k++) { const r = new THREE.Mesh(new THREE.TorusGeometry(1, 0.03, 4, 40), materiau('#7f9fc4', { trait: 0, emissif: 0.5 })); r.rotation.x = Math.PI / 2; r.position.set(MARE.x - 1.5 + k, MARE.niveau + 0.02, MARE.z + 0.5 - k * 0.8); scene.add(r); ronds.push(r); }
  anims.push((t) => ronds.forEach((r, k) => { const u = (t * 0.35 + k / 3) % 1; const sc = 0.4 + u * 3.2; r.scale.set(sc, sc, 1); r.material.uniforms.opacite.value = 1; r.visible = u < 0.85; }));
  const feu = feuDeCamp(5, 1); if (decor) scene.add(feu);
  anims.push((t) => feu.userData.flammes.forEach((f, k) => { const q = Math.sin(t * 9 + k * 2) * 0.12 + Math.sin(t * 13.7 + k) * 0.08; f.scale.set(1 - q * 0.5, 1 + q, 1 - q * 0.5); f.rotation.y = t * (1 + k * 0.5); }));
  const ile = ileVolante(-34, 24, -46); if (decor) scene.add(ile); anims.push((t) => { ile.position.y = 24 + Math.sin(t * 0.5) * 0.8; ile.rotation.y = t * 0.03; });
  const nuages = []; for (let k = 0; k < 7; k++) { const nu = nuage(rnd); nu.position.set(-80 + k * 26 + rnd() * 10, 30 + rnd() * 10, -60 + rnd() * 50); scene.add(nu); nuages.push(nu); }
  anims.push((t, dt) => nuages.forEach((nu) => { nu.position.x += dt * 0.6; if (nu.position.x > 100) nu.position.x = -100; }));
  // la fumée de la cheminée : des boules qui montent et s'effacent
  const fumees = []; for (let k = 0; k < 6; k++) { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 1), materiau('#e4dccb', { trait: 0.4, emissif: 0.5 })); if (decor) scene.add(s); fumees.push(s); }
  anims.push((t) => fumees.forEach((s, k) => { const u = (t * 0.18 + k / 6) % 1, c = at.userData.cheminee; s.position.set(c.x + Math.sin(u * 5 + k) * 0.6 + u * 2, c.y + u * 6, c.z); s.scale.setScalar(0.5 + u * 1.8); s.visible = u < 0.92; }));
  // le soleil, un disque dessiné
  const soleil = new THREE.Mesh(new THREE.SphereGeometry(7, 24, 16), materiau(COULEURS.soleil, { emissif: 1, trait: 0.6 })); scene.add(soleil);
  return { anims, soleil, fenetres: at.userData.fenetres, sansOmbre: [soleil, ...nuages, ...fumees, ...ronds] };
}
