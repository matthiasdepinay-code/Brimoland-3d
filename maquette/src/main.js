// ---------- Brimoland 3D : la maquette de la DA ----------
// On marche dans un petit Jardin rendu à l'encre sur parchemin, avec Gribouille et Grum. Les réglages permettent de
// comparer le rendu brut et le rendu encre, et de juger chaque ingrédient (contours, hachures, papier, tremblement...).
import * as THREE from 'three';
import { Encre } from './encre.js';
import { creerMonde, hauteur } from './monde.js';
import { apprenti, gribouille, grum } from './personnages.js';
import { SCEAU, sceauAuSol, traceDansLAir } from './sceau.js';

THREE.ColorManagement.enabled = false; // les couleurs du jeu 2D telles quelles, comme sur une page

const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
document.getElementById('scene').appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 400); camera.layers.enable(1);
// ce qui ne projette pas d'ombre (décalques, nuages, fumée, soleil) vit sur le calque 1
const sansOmbre = (o) => o.traverse((q) => q.layers.set(1));
const encre = new Encre(renderer);
const monde = creerMonde(scene);

// l'apprenti(e) et ses deux compagnons
const moi = apprenti(), grib = gribouille(), gr = grum();
for (const p of [moi, grib, gr]) scene.add(p);
moi.position.set(1, 0, 6); grib.position.set(2.4, 0, 4.8); gr.position.set(-0.8, 0, 4.4);
const seal = SCEAU();
const sol = sceauAuSol(seal, -2.5, hauteur(-2.5, -4.5), -4.5, 3.2); sansOmbre(sol); scene.add(sol);
const trace = traceDansLAir(seal); sansOmbre(trace); scene.add(trace);
for (const o of monde.sansOmbre) sansOmbre(o);

// ---------- l'état : caméra, touches, réglages ----------
const E = { yaw: 0.55, pitch: 0.3, dist: 9.5, auto: true, inactif: 99, touches: new Set(), cap: 0, lance: null, prochainLancer: 3, douze: true, nuit: 0, nuitCible: 0 };
const R = encre.reglages;
window.__maquette = { E, R, moi, grib, gr, camera, lancer: () => lancer() };

function taille() {
  const w = window.innerWidth, h = window.innerHeight, ratio = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(ratio); renderer.setSize(w, h); encre.taille(w, h, ratio);
  camera.aspect = w / h; camera.updateProjectionMatrix();
}
window.addEventListener('resize', taille); taille();

// ---------- les commandes ----------
const el = renderer.domElement; let glisse = null;
el.addEventListener('pointerdown', (e) => { glisse = { x: e.clientX, y: e.clientY, bouge: 0 }; el.setPointerCapture(e.pointerId); });
el.addEventListener('pointermove', (e) => { if (!glisse) return; const dx = e.clientX - glisse.x, dy = e.clientY - glisse.y; glisse.x = e.clientX; glisse.y = e.clientY; glisse.bouge += Math.abs(dx) + Math.abs(dy);
  E.yaw -= dx * 0.006; E.pitch = Math.min(1.25, Math.max(0.04, E.pitch + dy * 0.004)); E.auto = false; E.inactif = 0; });
el.addEventListener('pointerup', () => { if (glisse && glisse.bouge < 6) lancer(); glisse = null; });
el.addEventListener('wheel', (e) => { E.dist = Math.min(24, Math.max(3.5, E.dist * (1 + e.deltaY * 0.001))); E.inactif = 0; e.preventDefault(); }, { passive: false });
const TOUCHES = { avant: ['z', 'w', 'arrowup'], arriere: ['s', 'arrowdown'], gauche: ['q', 'a', 'arrowleft'], droite: ['d', 'arrowright'] };
window.addEventListener('keydown', (e) => { const k = e.key.toLowerCase(); E.touches.add(k); if (k === 'e' || k === ' ') lancer(); if (Object.values(TOUCHES).flat().includes(k) || k === ' ') { e.preventDefault(); E.auto = false; E.inactif = 0; } });
window.addEventListener('keyup', (e) => E.touches.delete(e.key.toLowerCase()));
const appuie = (n) => TOUCHES[n].some((k) => E.touches.has(k));

function lancer() { if (!E.lance) E.lance = { t0: temps, fin: 0 }; E.inactif = Math.min(E.inactif, 0); }

// les réglages : boutons de la page
for (const b of document.querySelectorAll('[data-reglage]')) {
  const k = b.dataset.reglage;
  const maj = () => b.classList.toggle('on', k === 'douze' ? E.douze : k === 'nuit' ? E.nuitCible > 0.5 : k === 'auto' ? E.auto : k === 'dessin' ? R.dessin > 0.9 : !!R[k]);
  b.addEventListener('click', () => { if (k === 'douze') E.douze = !E.douze; else if (k === 'nuit') E.nuitCible = E.nuitCible > 0.5 ? 0 : 1; else if (k === 'auto') { E.auto = !E.auto; E.inactif = E.auto ? 99 : 0; } else if (k === 'dessin') R.dessin = R.dessin > 0.9 ? 0.65 : 1; else R[k] = !R[k]; maj(); });
  b.addEventListener('maj', maj); maj();
}
document.getElementById('lancer').addEventListener('click', () => lancer());
const majBoutons = () => document.querySelectorAll('[data-reglage]').forEach((b) => b.dispatchEvent(new Event('maj')));
window.__maquette.majBoutons = majBoutons;

// ---------- la boucle ----------
let temps = 0, avant = performance.now();
const v3 = new THREE.Vector3(), cible = new THREE.Vector3(), soleilDir = new THREE.Vector3();
const angleVers = (a, b, k) => { let d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; return a + d * k; };
function suivre(p, cx, cz, dt, vmax) {
  const dx = cx - p.position.x, dz = cz - p.position.z, d = Math.hypot(dx, dz);
  let v = 0; if (d > 0.25) { v = Math.min(vmax, d * 2.2); p.position.x += dx / d * v * dt; p.position.z += dz / d * v * dt; p.rotation.y = angleVers(p.rotation.y, Math.atan2(dx, dz), Math.min(1, dt * 6)); }
  else p.rotation.y = angleVers(p.rotation.y, moi.rotation.y, Math.min(1, dt * 2));
  p.position.y = hauteur(p.position.x, p.position.z); return v;
}
function image(t, dt) {
  E.inactif += dt; if (E.inactif > 8) E.auto = true;
  // marcher, relativement à la caméra
  const av = (appuie('avant') ? 1 : 0) - (appuie('arriere') ? 1 : 0), dr = (appuie('droite') ? 1 : 0) - (appuie('gauche') ? 1 : 0);
  let vitesse = 0;
  if (av || dr) { const fx = -Math.sin(E.yaw), fz = -Math.cos(E.yaw), rx = Math.cos(E.yaw), rz = -Math.sin(E.yaw); let mx = fx * av + rx * dr, mz = fz * av + rz * dr; const n = Math.hypot(mx, mz); mx /= n; mz /= n;
    vitesse = 4.5; moi.position.x += mx * vitesse * dt; moi.position.z += mz * vitesse * dt; moi.rotation.y = angleVers(moi.rotation.y, Math.atan2(mx, mz), Math.min(1, dt * 10));
    const r = Math.hypot(moi.position.x, moi.position.z); if (r > 70) { moi.position.x *= 70 / r; moi.position.z *= 70 / r; } }
  moi.position.y = hauteur(moi.position.x, moi.position.z);
  // les compagnons suivent : Gribouille à gauche, Grum à droite, un peu en arrière
  const c = Math.cos(moi.rotation.y), s = Math.sin(moi.rotation.y), loc = (x, z) => [moi.position.x + x * c + z * s, moi.position.z - x * s + z * c];
  const [gx, gz] = loc(1.4, -1.3), [rx2, rz2] = loc(-1.7, -1.5);
  const vg = suivre(grib, gx, gz, dt, 6), vr = suivre(gr, rx2, rz2, dt, 5.5);
  const ta = E.douze ? Math.floor(t * 12) / 12 : t; // l'animation « à la main », à 12 images par seconde
  moi.userData.animer(ta, vitesse); grib.userData.animer(ta, vg); gr.userData.animer(ta, vr);
  // lancer : le bras se lève, le sceau se trace dans l'air anneau par anneau, puis s'efface
  if (!E.lance && E.auto) { E.prochainLancer -= dt; if (E.prochainLancer <= 0) { lancer(); E.prochainLancer = 6; } }
  const bras = moi.userData.bras;
  if (E.lance) {
    const u = (t - E.lance.t0) / 1.6;
    bras.rotation.x = -Math.min(1, u * 4) * 1.1;
    if (u < 1.5) { trace.visible = true; trace.userData.dessiner(Math.min(1, u), t); moi.userData.bout.getWorldPosition(v3); trace.position.copy(v3).add(new THREE.Vector3(Math.sin(moi.rotation.y) * 1.1, 0.55, Math.cos(moi.rotation.y) * 1.1)); trace.quaternion.copy(camera.quaternion); trace.material.uniforms.opacite.value = u < 1.1 ? 1 : 1 - (u - 1.1) / 0.4; }
    else { trace.visible = false; E.lance = null; }
  } else bras.rotation.x *= Math.max(0, 1 - dt * 6);
  // la caméra, en troisième personne (en visite, elle tourne doucement)
  if (E.auto) E.yaw += dt * 0.07;
  cible.set(moi.position.x, moi.position.y + 1.3, moi.position.z);
  camera.position.set(cible.x + Math.sin(E.yaw) * Math.cos(E.pitch) * E.dist, cible.y + Math.sin(E.pitch) * E.dist, cible.z + Math.cos(E.yaw) * Math.cos(E.pitch) * E.dist);
  const sol = hauteur(camera.position.x, camera.position.z) + 0.6; if (camera.position.y < sol) camera.position.y = sol;
  camera.lookAt(cible);
  // le soleil (la lune la nuit), l'ombre portée autour de l'apprenti(e)
  E.nuit += (E.nuitCible - E.nuit) * Math.min(1, dt * 2.5); R.nuit = E.nuit;
  soleilDir.set(0.55, 0.75, 0.38).normalize();
  encre.soleil(soleilDir, new THREE.Vector3(moi.position.x, 0, moi.position.z));
  monde.soleil.position.copy(cible).addScaledVector(soleilDir, 115); monde.soleil.material.uniforms.albedo.value.set(E.nuit > 0.5 ? '#e8e4d0' : '#f3d98a');
  for (const f of monde.fenetres) f.material.uniforms.emissif.value = 0.4 + E.nuit * 0.6;
  for (const a of monde.anims) a(t, dt);
  encre.rendre(scene, camera, t);
}
function boucle() {
  const now = performance.now(), dt = Math.min(0.05, (now - avant) / 1000); avant = now; temps += dt;
  if (!window.__maquette.pause) image(temps, dt); window.__pret = true; requestAnimationFrame(boucle);
}
// pour les captures : avancer le temps à la main
window.__maquette.avancer = (n, dt = 1 / 30) => { for (let i = 0; i < n; i++) { temps += dt; image(temps, dt); } };
requestAnimationFrame(boucle);
