'use strict';
// Mesure une livraison d'assets : chaque .glb (dimensions, triangles, os, animations, matériaux, noms, sens du visage)
// et chaque .fbx (unités, axes, maillages dans les fichiers d'animation), puis compare au cahier des charges (attendu.js).
//   node outils/assets/mesurer.js <dossier Art de la livraison> <rapport.json>
// Les fichiers livrés sont lus comme des données : rien n'est exécuté (les .blend ne sont pas ouverts).
const fs = require('fs'), path = require('path');
const RACINE = path.resolve(__dirname, '..', '..'), MAQUETTE = path.join(RACINE, 'maquette');
const esbuild = require(path.join(MAQUETTE, 'node_modules', 'esbuild'));
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require(path.join(MAQUETTE, 'node_modules', 'playwright')); } })();
const { ATTENDU } = require('./attendu.js');

// ---------- les FBX : l'en-tête (GlobalSettings) et le contenu, lus dans le binaire ----------
function lireFbx(f) {
  const b = fs.readFileSync(f), r = { taille: b.length };
  if (b.slice(0, 18).toString('latin1') !== 'Kaydara FBX Binary') { r.erreur = 'pas un FBX binaire'; return r; }
  r.version = b.readUInt32LE(23);
  // une propriété P : "Nom", "type", "étiquette", "drapeaux", valeur — chaque texte est 'S' + longueur + octets
  const prop = (nom) => {
    const i = b.indexOf(Buffer.from(nom, 'latin1')); if (i < 0) return null;
    let p = i + nom.length;
    for (let k = 0; k < 3; k++) { if (b[p] !== 0x53) return null; p += 5 + b.readUInt32LE(p + 1); }
    const t = String.fromCharCode(b[p]);
    return t === 'D' ? b.readDoubleLE(p + 1) : t === 'I' ? b.readInt32LE(p + 1) : t === 'F' ? b.readFloatLE(p + 1) : null;
  };
  for (const k of ['UnitScaleFactor', 'OriginalUnitScaleFactor', 'UpAxis', 'UpAxisSign', 'FrontAxis', 'FrontAxisSign', 'CoordAxis']) r[k] = prop(k);
  const compter = (classe) => { let n = 0, i = 0; const m = Buffer.from('\x00\x01' + classe, 'latin1'); while ((i = b.indexOf(m, i)) >= 0) { n++; i += m.length; } return n; };
  r.geometries = compter('Geometry'); r.os = compter('NodeAttribute') ; r.animations = compter('AnimStack');
  return r;
}

// ---------- les GLB : mesurés par three.js, dans le navigateur ----------
const ENTREE = `
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
window.mesurer = async (b64, nom) => {
  const buf = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)).buffer;
  const g = await new GLTFLoader().parseAsync(buf, '');
  const sc = g.scene; sc.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(sc, true), d = box.getSize(new THREE.Vector3());
  let tris = 0; const mats = new Set(), noms = [], os = new Set(), textures = {}, sockets = [], ucx = [];
  let visage = null;
  sc.traverse((o) => {
    if (o.name) noms.push(o.name);
    if (/^SOCKET_/i.test(o.name)) sockets.push(o.name);
    if (/^UCX_/i.test(o.name)) ucx.push(o.name);
    if (o.isBone) os.add(o.name);
    if (!o.isMesh) return;
    const geo = o.geometry; tris += (geo.index ? geo.index.count : geo.attributes.position.count) / 3;
    for (const m of [].concat(o.material)) {
      mats.add(m.name);
      for (const k of ['map', 'emissiveMap', 'normalMap']) if (m[k] && m[k].image) textures[m.name + '.' + k] = [m[k].image.width, m[k].image.height];
      // le visage : où est-il par rapport au centre ? (glTF regarde vers +Z : c'est −Y dans Blender)
      if (/visage|face|yeux|oeil|eye/i.test(m.name) && !visage) { const bb = new THREE.Box3().setFromObject(o, true); visage = bb.getCenter(new THREE.Vector3()).sub(box.getCenter(new THREE.Vector3())).toArray().map((v) => +v.toFixed(3)); }
    }
  });
  return { nom, dims: [d.x, d.y, d.z].map((v) => +v.toFixed(3)), min: box.min.toArray().map((v) => +v.toFixed(3)), tris: Math.round(tris),
    materiaux: [...mats], textures, os: os.size, clips: g.animations.map((a) => ({ nom: a.name, duree: +a.duration.toFixed(3), pistes: a.tracks.length,
      interp: [...new Set(a.tracks.map((t) => t.getInterpolation()))] })), sockets, ucx, visage, noms: noms.slice(0, 400) };
};`;

(async () => {
  const art = path.resolve(process.argv[2]), sortie = path.resolve(process.argv[3] || 'rapport-assets.json');
  const tous = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? tous(path.join(d, e.name)) : [path.join(d, e.name)]);
  const fichiers = tous(path.join(art, 'Export'));
  const glb = fichiers.filter((f) => f.endsWith('.glb')), fbx = fichiers.filter((f) => f.endsWith('.fbx'));
  const rapport = { glb: {}, fbx: {}, problemes: [] };
  for (const f of fbx) rapport.fbx[path.relative(art, f)] = lireFbx(f);

  const r = await esbuild.build({ stdin: { contents: ENTREE, resolveDir: MAQUETTE }, bundle: true, format: 'iife', write: false, nodePaths: [path.join(MAQUETTE, 'node_modules')] });
  const nav = await chromium.launch(), onglet = await nav.newPage(); onglet.setDefaultTimeout(120000);
  await onglet.setContent('<!doctype html><meta charset="utf-8"><script>' + r.outputFiles[0].text + '</script>');
  for (const f of glb) {
    try { rapport.glb[path.relative(art, f)] = await onglet.evaluate(([b, n]) => window.mesurer(b, n), [fs.readFileSync(f).toString('base64'), path.basename(f, '.glb')]); }
    catch (e) { rapport.problemes.push({ fichier: path.relative(art, f), quoi: 'illisible : ' + e.message }); }
  }
  await nav.close();

  // ---------- la comparaison au cahier ----------
  const pb = (fichier, quoi) => rapport.problemes.push({ fichier, quoi });
  for (const [rel, m] of Object.entries(rapport.glb)) {
    const a = ATTENDU[m.nom];
    if (/[^\x20-\x7e]|\s/.test(m.nom)) pb(rel, 'un accent ou une espace dans le nom');
    if (!/^(SM|SK)_/.test(m.nom)) pb(rel, 'pas de préfixe SM_ ou SK_');
    if (/^SK_/.test(m.nom) && m.os === 0) pb(rel, 'SK_ sans squelette');
    if (Math.abs(m.min[1]) > 0.02 && !(a && a.pivot === 'libre')) pb(rel, `pas posé sur le sol : le bas est à ${m.min[1]} m`);
    if (m.visage && m.visage[2] < 0) pb(rel, `le visage regarde vers l'arrière (z = ${m.visage[2]}) : dans Blender, il doit regarder vers −Y`);
    if (!a) continue;
    m.attendu = a;
    const H = m.dims[1], L = Math.max(m.dims[0], m.dims[2]);
    if (a.h && (H < a.h[0] * 0.92 || H > a.h[1] * 1.08)) pb(rel, `hauteur ${H} m, attendu ${a.h[0] === a.h[1] ? a.h[0] : a.h.join(' à ')} m`);
    if (a.l && (L < a.l[0] * 0.85 || L > a.l[1] * 1.15)) pb(rel, `largeur ${L} m, attendu ${a.l[0] === a.l[1] ? a.l[0] : a.l.join(' à ')} m`);
    if (a.tris && m.tris > a.tris) pb(rel, `${m.tris} triangles, plafond ${a.tris}`);
    if (a.clips && m.clips.length < a.clips) pb(rel, `${m.clips.length} animations, attendu au moins ${a.clips}`);
  }
  for (const [rel, f] of Object.entries(rapport.fbx)) {
    if (f.erreur) { pb(rel, f.erreur); continue; }
    if (/\/A_[^/]+\.fbx$/.test(rel) && f.geometries > 0) pb(rel, `une animation qui contient ${f.geometries} maillage(s)`);
  }
  fs.writeFileSync(sortie, JSON.stringify(rapport, null, 1));
  const unites = {}; for (const f of Object.values(rapport.fbx)) { const k = `UnitScaleFactor ${f.UnitScaleFactor}, UpAxis ${f.UpAxis}${f.UpAxisSign < 0 ? '-' : ''}, FrontAxis ${f.FrontAxis}${f.FrontAxisSign < 0 ? '-' : ''}`; unites[k] = (unites[k] || 0) + 1; }
  console.log(`${glb.length} GLB, ${fbx.length} FBX mesurés ; ${rapport.problemes.length} remarque(s)`);
  console.log('FBX :', JSON.stringify(unites));
  for (const p of rapport.problemes) console.log(' - ' + p.fichier + ' : ' + p.quoi);
})().catch((e) => { console.error(e.message || e); process.exit(1); });
