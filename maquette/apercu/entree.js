// ---------- L'aperçu d'une livraison d'assets, à l'encre ----------
// Les vrais modèles livrés (Art/Export/*.glb), posés dans le Jardin de la maquette et rendus avec le même rendu
// à l'encre que la maquette (et que le nœud d'Unreal, vérifié par outils/shaders/verifier.js).
// Les .glb sont servis par outils/assets/apercu.js à l'adresse http://assets/<chemin dans Art/Export>.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as clonerAvecSquelette } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { Encre, materiau } from '../src/encre.js';
import { creerMonde, hauteur, ATELIER, MARE, hasard } from '../src/monde.js';

THREE.ColorManagement.enabled = false;
const chargeur = new GLTFLoader(), cache = new Map();
const charger = (rel) => { if (!cache.has(rel)) cache.set(rel, chargeur.loadAsync('http://assets/' + rel)); return cache.get(rel); };

// l'épaisseur du trait, par famille (le pochoir du cahier des charges)
const TRAIT = { Personnages: 1, Betes: 1, Batiments: 0.9, Objets: 0.8, Nature: 0.8, Terrain: 0.35 };
// ce qui luit : marqué émissif dans le fichier, ou reconnu à son nom (braises, flammes, vitres, yeux...) ; noté dans le rapport
const LUIT = /braise|flamme|vitre|pointe|yeux|lueur|feu\b/i;
const luisantsParLeNom = new Set();

function versEncre(objet, famille, nomFichier) {
  objet.traverse((o) => {
    if (!o.isMesh) return;
    if (/^UCX_/i.test(o.name)) { o.visible = false; return; }
    o.frustumCulled = false;
    const conv = (m) => {
      const c = m.color ? m.color.clone().convertLinearToSRGB() : new THREE.Color(1, 1, 1);
      const carte = m.map || null;
      if (carte) { carte.colorSpace = THREE.NoColorSpace; carte.needsUpdate = true; }
      const emissifFichier = m.emissive && (m.emissive.r + m.emissive.g + m.emissive.b) > 0.05;
      const parNom = !emissifFichier && LUIT.test(m.name || '');
      if (parNom) luisantsParLeNom.add(nomFichier + ' : ' + m.name);
      const herbe = /Herbe|Fleur/.test(nomFichier);
      return materiau(c, { carte, trait: herbe ? 0 : TRAIT[famille] ?? 0.6, emissif: emissifFichier || parNom ? 1 : 0, deuxFaces: true,
        transparent: m.transparent || m.alphaMode === 'BLEND', opacite: m.opacity ?? 1, ombrePortee: !/visage|yeux|peau|oeil|pupille/i.test(m.name || '') });
    };
    o.material = Array.isArray(o.material) ? o.material.map(conv) : conv(o.material);
  });
  return objet;
}

// une instance d'un asset : « Famille/SM_Nom »
async function poser(sc, ref, x, z, o = {}) {
  const [famille] = ref.split('/'), g = await charger(ref + '.glb');
  const obj = versEncre(clonerAvecSquelette(g.scene), famille, ref);
  obj.position.set(x, (o.y ?? hauteur(x, z)) + (o.dy || 0), z); obj.rotation.y = o.rot || 0; if (o.echelle) obj.scale.setScalar(o.echelle);
  sc.add(obj);
  if (o.clip && g.animations.length) {
    const mixer = new THREE.AnimationMixer(obj), clip = THREE.AnimationClip.findByName(g.animations, o.clip) || g.animations[0];
    mixer.clipAction(clip).play(); obj.userData.poser = (t) => { mixer.setTime((t + (o.decalage || 0)) % Math.max(clip.duration, 0.01)); };
  }
  if (o.sansOmbre) obj.traverse((q) => q.layers.set(1));
  return obj;
}

// ---------- le Jardin, avec les vrais modèles ----------
async function jardin(sc) {
  const rnd = hasard(7), poses = [];
  const P = async (ref, x, z, o) => { const ob = await poser(sc, ref, x, z, o); if (ob.userData.poser) poses.push(ob.userData.poser); return ob; };
  await P('Batiments/SM_Atelier', ATELIER.x, ATELIER.z);
  // les étapes du chemin, comme dans le jeu 2D
  const ch = (z) => ATELIER.x + Math.sin(z * 0.12) * 4;
  await P('Objets/SM_Pancarte', ch(-8) + 2.4, -8, { rot: -0.5 });
  await P('Objets/SM_Levier_Inactif', ch(-4) - 3, -4, { rot: 0.4 });
  await P('Objets/SM_Coffre_Ferme', ch(-4) - 4.6, -4.8, { rot: 0.6 });
  await P('Objets/SK_Mannequin', 7.5, -5, { rot: -0.8 });
  await P('Objets/SM_Caisse', 8.8, -3.4, { rot: 0.3 });
  await P('Objets/SM_Stele', ch(2) - 5.5, 1.5, { rot: 0.5 });
  await P('Objets/SM_Coffre_Scelle', ch(2) - 6.8, 3.2, { rot: 0.7 });
  await P('Objets/SM_Torche', ch(-1) + 2.4, -1, {});
  await P('Objets/SM_FeuCamp', 5, 1, {});
  await P('Objets/SM_Plante_Stade_3', ch(13) - 3.5, 13, {});
  await P('Objets/SM_Puits', ch(18) + 4, 18, { rot: -0.3 });
  await P('Objets/SM_Ruche', -9, -9, { rot: 0.4 });
  // la mare : l'eau, les roseaux, les nénuphars
  await P('Terrain/SM_Eau_Mare', MARE.x, MARE.z, { y: MARE.niveau + 0.02 });
  for (let k = 0; k < 7; k++) { const a = k / 7 * 6.28 + 0.3, r = MARE.r + 0.4; await P('Nature/SM_Roseaux', MARE.x + Math.cos(a) * r, MARE.z + Math.sin(a) * r, { rot: rnd() * 6.28 }); }
  for (let k = 0; k < 5; k++) { const a = rnd() * 6.28, r = rnd() * MARE.r * 0.7; await P('Nature/SM_Nenuphar', MARE.x + Math.cos(a) * r, MARE.z + Math.sin(a) * r, { y: MARE.niveau + 0.04, rot: rnd() * 6.28 }); }
  // les arbres, les rochers, les buissons, l'herbe et les fleurs, loin du chemin, de l'Atelier et de la mare
  const libre = (x, z, m) => Math.hypot(x - MARE.x, z - MARE.z) > MARE.r + m && Math.hypot(x - ATELIER.x, z - ATELIER.z) > 7 + m && Math.abs(x - ch(z)) > 2.2 + m && !(Math.abs(x) < 10 && z > -7 && z < 12);
  const semer = async (refs, n, rMin, rMax, marge, o = {}) => { let k = 0, essais = 0; while (k < n && essais++ < n * 40) { const a = rnd() * 6.28, r = rMin + rnd() * (rMax - rMin), x = Math.cos(a) * r, z = Math.sin(a) * r; if (!libre(x, z, marge)) continue; await P(refs[k % refs.length], x, z, Object.assign({ rot: rnd() * 6.28 }, o)); k++; } };
  await semer(['Nature/SM_Arbre_Feuillu_01', 'Nature/SM_Arbre_Feuillu_02', 'Nature/SM_Sapin_01', 'Nature/SM_Arbre_Feuillu_03', 'Nature/SM_Sapin_02'], 34, 16, 70, 3);
  await semer(['Nature/SM_Rocher_01', 'Nature/SM_Rocher_03', 'Nature/SM_Rocher_05', 'Nature/SM_Rocher_Fissure', 'Nature/SM_Rocher_02'], 14, 9, 55, 1.5);
  await semer(['Nature/SM_Buisson_01', 'Nature/SM_Buisson_02', 'Nature/SM_Buisson_03', 'Nature/SM_Souche', 'Nature/SM_Champignon_01'], 22, 7, 40, 1);
  await semer(['Nature/SM_Herbe_01', 'Nature/SM_Herbe_02', 'Nature/SM_Herbe_03', 'Nature/SM_Fleur_01', 'Nature/SM_Fleur_02', 'Nature/SM_Fleur_03', 'Nature/SM_Fleur_04'], 120, 4, 30, 0.2);
  await P('Nature/SM_Tronc_Couche', 15, -8, { rot: 1.1 });
  await P('Nature/SM_Ile_Volante', -34, -46, { y: 24, sansOmbre: true });
  return poses;
}

// les personnages et les bêtes
async function compagnie(sc, nuit) {
  const poses = [], P = async (ref, x, z, o) => { const ob = await poser(sc, ref, x, z, o); if (ob.userData.poser) poses.push(ob.userData.poser); return ob; };
  const moi = await P('Personnages/SK_Apprenti', 1, 6, { rot: 0.5, clip: nuit ? 'A_Apprenti_Tracer_Tenir' : 'A_Apprenti_Marche' });
  await P('Personnages/SK_Gribouille', 2.6, 4.6, { rot: 0.2, clip: nuit ? 'A_Grib_Sort' : 'A_Grib_Attente' });
  await P('Personnages/SK_Grum', -0.9, 4.2, { rot: 0.7, clip: nuit ? 'A_Grum_Repos' : 'A_Grum_Attente', decalage: 0.3 });
  return { moi, poses };
}
async function betes(sc) {
  const poses = [], P = async (ref, x, z, o) => { const ob = await poser(sc, ref, x, z, o); if (ob.userData.poser) poses.push(ob.userData.poser); return ob; };
  await P('Betes/SK_EntRonce', 21, -15, { rot: -1.0, clip: 'A_EntRonce_Balai', decalage: 0.25 });
  await P('Personnages/SK_GigaGribouille', 14, -19, { rot: -0.4, clip: 'A_Giga_Frappe', decalage: 0.35 });
  await P('Betes/SK_Limace', 17, -9.5, { rot: -2.2, clip: 'A_Limace_Bond' });
  await P('Betes/SK_Grenouille', MARE.x - 6.8, MARE.z - 2.5, { rot: -1.6, clip: 'A_Grenouille_Chant' });
  await P('Betes/SK_Corbeau', 11.2, -12.4, { rot: -2.4, clip: 'A_Corbeau_Croasse' });
  await P('Betes/SK_Corbeau_Maitre', 12.4, -11.4, { rot: -2.8, clip: 'A_Corbeau_Attente' });
  return poses;
}

// la rangée des tenues, sur un pré
async function tenues(sc) {
  const poses = [], noms = ['SK_Gribouille', 'SK_Gribouille_Arcaniste', 'SK_Gribouille_Alchimiste', 'SK_Gribouille_Explorateur', 'SK_Gribouille_Ceruleen',
    'SK_Grum', 'SK_Grum_Runique', 'SK_Grum_Forgeron', 'SK_Grum_Forestier', 'SK_Grum_Cristallin'];
  for (let i = 0; i < noms.length; i++) {
    const ob = await poser(sc, 'Personnages/' + noms[i], -9 + i * 2, 5, { rot: 0, clip: i < 5 ? 'A_Grib_Attente' : 'A_Grum_Attente', decalage: i * 0.17 });
    if (ob.userData.poser) poses.push(ob.userData.poser);
  }
  return poses;
}

window.__apercu = async (vues) => {
  const W = 1600, H = 900;
  const R = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true }); R.outputColorSpace = THREE.LinearSRGBColorSpace; R.setPixelRatio(1); R.setSize(W, H);
  document.body.appendChild(R.domElement);
  const encre = new Encre(R); encre.taille(W, H, 1);
  const sortie = {};
  for (const v of vues) {
    const sc = new THREE.Scene(), camera = new THREE.PerspectiveCamera(v.fov || 48, W / H, 0.1, 400); camera.layers.enable(1);
    const monde = creerMonde(sc, { decor: false }); for (const o of monde.sansOmbre) o.traverse((q) => q.layers.set(1));
    let poses = [], centre = new THREE.Vector3(1, 0, 6);
    if (v.scene === 'tenues') { poses = await tenues(sc); centre.set(0, 0, 5); }
    else {
      poses = poses.concat(await jardin(sc));
      const c = await compagnie(sc, v.nuit); poses = poses.concat(c.poses);
      poses = poses.concat(await betes(sc));
    }
    for (const p of poses) p(v.t || 0);
    for (const a of monde.anims) a(v.t || 0, 1 / 30);
    sc.updateMatrixWorld(true);
    const cible = new THREE.Vector3(...v.cible);
    camera.position.set(cible.x + Math.sin(v.yaw) * Math.cos(v.pitch) * v.dist, cible.y + Math.sin(v.pitch) * v.dist, cible.z + Math.cos(v.yaw) * Math.cos(v.pitch) * v.dist);
    camera.lookAt(cible); camera.updateMatrixWorld();
    const dir = new THREE.Vector3(0.55, 0.75, 0.38).normalize();
    encre.soleil(dir, new THREE.Vector3(v.cible[0], 0, v.cible[2]));
    monde.soleil.position.copy(cible).addScaledVector(dir, 115);
    encre.reglages.nuit = v.nuit ? 1 : 0;
    encre.reglages.encre = v.brut ? false : true;
    encre.rendre(sc, camera, v.t || 0);
    sortie[v.nom] = R.domElement.toDataURL('image/png');
  }
  return { images: sortie, luisantsParLeNom: [...luisantsParLeNom].sort() };
};
