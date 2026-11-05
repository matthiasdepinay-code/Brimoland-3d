// ---------- L'apprenti(e), Gribouille et Grum, en formes simples aux bonnes proportions ----------
// Ce ne sont pas encore les modèles : des blocs pour juger le rendu, la silhouette et les couleurs (js/mascottes.js).
import * as THREE from 'three';
import { materiau } from './encre.js';

const facettes = (g) => { const f = g.toNonIndexed(); f.computeVertexNormals(); return f; };
const mesh = (geo, coul, o) => new THREE.Mesh(geo, materiau(coul, Object.assign({ trait: 1 }, o)));
// un profil tourné (une robe, une goutte)
const tour = (pts, seg = 20) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);

export function apprenti(look = { cape: '#4a6b3a', chapeau: '#3a5a30', peau: '#f2d3b3' }) {
  const g = new THREE.Group(), corps = new THREE.Group(); g.add(corps);
  corps.add(mesh(tour([[0, 0], [0.47, 0], [0.44, 0.28], [0.33, 0.72], [0.21, 0.98], [0, 1.02]]), look.cape));
  const ceinture = mesh(new THREE.TorusGeometry(0.33, 0.04, 6, 20), '#8d6a3c', { trait: 0.6 }); ceinture.rotation.x = Math.PI / 2; ceinture.position.y = 0.66; corps.add(ceinture);
  const tete = mesh(new THREE.SphereGeometry(0.27, 18, 14), look.peau, { ombrePortee: false }); tete.position.y = 1.22; corps.add(tete);
  for (const s of [-1, 1]) { const o = mesh(new THREE.SphereGeometry(0.035, 8, 6), '#1f1a16', { trait: 0, ombrePortee: false }); o.position.set(s * 0.09, 1.25, 0.245); corps.add(o); }
  const chapeau = new THREE.Group(); chapeau.position.y = 1.38; corps.add(chapeau);
  chapeau.add(mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.035, 24), look.chapeau));
  const c1 = mesh(new THREE.ConeGeometry(0.33, 0.62, 18), look.chapeau); c1.position.y = 0.31; chapeau.add(c1);
  const c2 = mesh(new THREE.ConeGeometry(0.16, 0.42, 14), look.chapeau); c2.position.set(0.12, 0.72, -0.04); c2.rotation.z = -0.6; chapeau.add(c2);
  const bras = new THREE.Group(); bras.position.set(0.3, 0.92, 0.05); corps.add(bras);
  const b = mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.5, 8), look.cape); b.rotation.z = 0.5; b.position.set(0.1, -0.2, 0); bras.add(b);
  const baguette = mesh(new THREE.CylinderGeometry(0.022, 0.03, 0.62, 6), '#7a5634', { trait: 0.7 }); baguette.position.set(0.26, -0.18, 0.16); baguette.rotation.x = 0.9; bras.add(baguette);
  const etoile = mesh(new THREE.OctahedronGeometry(0.06, 0), '#f0d070', { emissif: 1, trait: 0.5 }); etoile.position.set(0.26, 0.04, 0.42); bras.add(etoile);
  g.userData = { corps, chapeau, bras, bout: etoile,
    animer(t, v) { const pas = Math.min(1, v / 4); corps.position.y = Math.abs(Math.sin(t * 9)) * 0.06 * pas; corps.rotation.z = Math.sin(t * 9) * 0.05 * pas; chapeau.rotation.z = Math.sin(t * 2.3) * 0.04 + Math.sin(t * 9) * 0.06 * pas; } };
  return g;
}

// Gribouille : une goutte d'encre, UN SEUL grand œil au milieu du visage, un immense chapeau magenta rapiécé, l'étiquette « G »
export function gribouille() {
  const T = { corps: '#2a2232', chapeau: '#a8307e', ombre: '#6e1d55', pieces: '#e8d4a8' };
  const g = new THREE.Group(), corps = new THREE.Group(); g.add(corps);
  corps.add(mesh(tour([[0, 0], [0.3, 0.03], [0.4, 0.2], [0.39, 0.42], [0.3, 0.63], [0.15, 0.8], [0, 0.85]], 24), T.corps, { trait: 1.0 }));
  // l'œil : un grand œil blanc, au milieu
  const oeil = new THREE.Group(); oeil.position.set(0, 0.46, 0.3); corps.add(oeil);
  const blanc = mesh(new THREE.SphereGeometry(0.19, 20, 16), '#f4efe6', { trait: 1, emissif: 0.35, ombrePortee: false }); blanc.scale.set(1, 1.15, 0.5); oeil.add(blanc);
  const pupille = mesh(new THREE.SphereGeometry(0.075, 14, 10), '#1f1a16', { trait: 0 }); pupille.position.set(0, 0, 0.085); pupille.scale.z = 0.5; oeil.add(pupille);
  const reflet = mesh(new THREE.SphereGeometry(0.024, 8, 6), '#ffffff', { trait: 0, emissif: 1 }); reflet.position.set(0.03, 0.03, 0.12); oeil.add(reflet);
  // la queue en spirale
  const spirale = []; for (let k = 0; k <= 24; k++) { const u = k / 24, a = u * 9, r = 0.22 * (1 - u * 0.7); spirale.push(new THREE.Vector3(Math.cos(a) * r * 0.5, 0.08 + u * 0.32 + Math.sin(a) * r, -0.32 - u * 0.25)); }
  corps.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spirale), 48, 0.045, 6), T.corps, { trait: 0.8 }));
  for (const s of [-1, 1]) { const b = mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.3, 6), T.corps, { trait: 0.8 }); b.position.set(s * 0.38, 0.3, 0.04); b.rotation.z = s * 0.9; corps.add(b); }
  // le chapeau, presque aussi haut que lui
  const chapeau = new THREE.Group(); chapeau.position.y = 0.8; corps.add(chapeau);
  chapeau.add(mesh(new THREE.CylinderGeometry(0.58, 0.6, 0.045, 28), T.chapeau));
  const bande = mesh(new THREE.TorusGeometry(0.33, 0.045, 6, 24), T.ombre, { trait: 0.5 }); bande.rotation.x = Math.PI / 2; bande.position.y = 0.06; chapeau.add(bande);
  const c1 = mesh(new THREE.ConeGeometry(0.36, 0.7, 20), T.chapeau); c1.position.y = 0.35; chapeau.add(c1);
  const pointe = new THREE.Group(); pointe.position.set(0.05, 0.62, 0); chapeau.add(pointe);
  const c2 = mesh(new THREE.ConeGeometry(0.16, 0.55, 14), T.chapeau); c2.rotation.z = -1.0; c2.position.set(0.2, 0.12, 0); pointe.add(c2);
  for (const [x, y, z, ry] of [[0.18, 0.24, 0.2, 0.6], [-0.2, 0.36, 0.12, -0.9]]) { const p = mesh(new THREE.BoxGeometry(0.15, 0.13, 0.03), T.pieces, { trait: 0.9 }); p.position.set(x, y, z); p.rotation.set(0.35, ry, 0); chapeau.add(p); }
  const fil = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.22, 4), '#8d6a3c', { trait: 0 }); fil.position.set(-0.55, -0.1, 0.1); chapeau.add(fil);
  const etiquette = mesh(new THREE.BoxGeometry(0.17, 0.2, 0.025), T.pieces, { trait: 1 }); etiquette.position.set(-0.55, -0.27, 0.1); chapeau.add(etiquette);
  const G = mesh(new THREE.TorusGeometry(0.045, 0.012, 4, 12, 4.6), '#7a3a2a', { trait: 0 }); G.position.set(-0.55, -0.27, 0.115); chapeau.add(G);
  g.userData = { corps, chapeau, pupille, oeil,
    animer(t, v) { const pas = Math.min(1, v / 4); corps.position.y = Math.abs(Math.sin(t * 7)) * (0.05 + 0.12 * pas); corps.scale.set(1 + Math.sin(t * 14) * 0.02, 1 - Math.sin(t * 14) * 0.02, 1);
      pointe.rotation.z = Math.sin(t * 2.1) * 0.2; chapeau.rotation.z = Math.sin(t * 1.7) * 0.06; pupille.position.x = Math.sin(t * 0.7) * 0.05; pupille.position.y = Math.sin(t * 0.43) * 0.03; } };
  return g;
}

// Grum : un golem de pierre ocre coiffé de mousse, une visière sombre, deux yeux dorés, une rune sur le poing
export function grum() {
  const T = { pierre: '#c8925a', fonce: '#6e4a2a', mousse: '#b8c43a', mousseF: '#7d8a24', yeux: '#ffd23a', rune: '#f4ead0' };
  const g = new THREE.Group(), corps = new THREE.Group(); g.add(corps);
  const pierre = (geo) => { const P = geo.attributes.position; for (let i = 0; i < P.count; i++) { const s = 1 + (Math.sin(i * 12.9898) * 43758.5453 % 1) * 0.06; P.setXYZ(i, P.getX(i) * s, P.getY(i), P.getZ(i) * s); } return facettes(geo); };
  const torse = mesh(pierre(new THREE.BoxGeometry(1.0, 0.95, 0.75, 2, 2, 2)), T.pierre); torse.position.y = 0.78; corps.add(torse);
  const dome = mesh(pierre(new THREE.SphereGeometry(0.5, 9, 6, 0, Math.PI * 2, 0, Math.PI / 2)), T.pierre); dome.position.y = 1.25; dome.scale.set(1, 0.8, 0.8); corps.add(dome);
  const mousse = mesh(facettes(new THREE.IcosahedronGeometry(0.5, 1)), T.mousse, { trait: 0.9 }); mousse.scale.set(1.06, 0.36, 0.86); mousse.position.y = 1.52; corps.add(mousse);
  for (const [x, z] of [[0.25, 0.2], [-0.3, -0.1]]) { const b = mesh(facettes(new THREE.IcosahedronGeometry(0.16, 0)), T.mousseF, { trait: 0.6 }); b.position.set(x, 1.62, z); corps.add(b); }
  const visiere = mesh(new THREE.BoxGeometry(0.74, 0.2, 0.12), T.fonce, { trait: 0.9 }); visiere.position.set(0, 1.3, 0.37); corps.add(visiere);
  for (const s of [-1, 1]) { const o = mesh(new THREE.SphereGeometry(0.065, 10, 8), T.yeux, { emissif: 1, trait: 0 }); o.position.set(s * 0.17, 1.3, 0.44); corps.add(o); }
  const poings = [];
  for (const s of [-1, 1]) {
    const bras = new THREE.Group(); bras.position.set(s * 0.62, 1.05, 0); corps.add(bras);
    const haut = mesh(pierre(new THREE.CylinderGeometry(0.17, 0.2, 0.6, 7)), T.pierre); haut.position.y = -0.25; bras.add(haut);
    const poing = mesh(pierre(new THREE.DodecahedronGeometry(0.28, 0)), T.pierre); poing.position.y = -0.62; bras.add(poing);
    if (s > 0) { const rune = mesh(new THREE.TorusGeometry(0.09, 0.022, 4, 4), T.rune, { emissif: 0.9, trait: 0 }); rune.position.set(0, -0.62, 0.27); bras.add(rune); }
    poings.push(bras);
  }
  for (const s of [-1, 1]) { const j = mesh(pierre(new THREE.BoxGeometry(0.32, 0.36, 0.38)), T.pierre); j.position.set(s * 0.26, 0.18, 0); corps.add(j); }
  g.userData = { corps, poings,
    animer(t, v) { const pas = Math.min(1, v / 4); corps.position.y = Math.abs(Math.sin(t * 5)) * 0.06 * pas; corps.rotation.z = Math.sin(t * 5) * 0.04 * pas;
      poings[0].rotation.x = Math.sin(t * 5) * 0.4 * pas + Math.sin(t * 1.3) * 0.05; poings[1].rotation.x = -Math.sin(t * 5) * 0.4 * pas - Math.sin(t * 1.3) * 0.05; } };
  return g;
}
