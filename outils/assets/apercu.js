'use strict';
// L'aperçu à l'encre d'une livraison d'assets : les vrais modèles (Art/Export/*.glb) posés dans le Jardin de la maquette,
// rendus avec le rendu à l'encre (maquette/apercu/entree.js).
//   node outils/assets/apercu.js <dossier Art de la livraison> <dossier des images>
const fs = require('fs'), path = require('path');
const RACINE = path.resolve(__dirname, '..', '..'), MAQUETTE = path.join(RACINE, 'maquette');
const esbuild = require(path.join(MAQUETTE, 'node_modules', 'esbuild'));
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require(path.join(MAQUETTE, 'node_modules', 'playwright')); } })();

const VUES = [
  { nom: '1-le-trio', t: 0.35, cible: [1, 1.3, 6], yaw: 0.55, pitch: 0.3, dist: 9.5 },
  { nom: '2-le-jardin', t: 0.5, cible: [2, 2, -2], yaw: 0.3, pitch: 0.4, dist: 36 },
  { nom: '3-le-gardien', t: 0.6, cible: [16, 2.2, -13], yaw: 0.75, pitch: 0.22, dist: 16 },
  { nom: '4-la-nuit', t: 0.5, cible: [1, 1.3, 6], yaw: 0.2, pitch: 0.22, dist: 10.5, nuit: true },
  { nom: '6-de-pres', t: 0.35, cible: [1.5, 1.1, 5.6], yaw: 0.45, pitch: 0.1, dist: 4.4, fov: 40 },
  { nom: '5-les-tenues', t: 0.2, scene: 'tenues', cible: [0, 0.9, 5], yaw: 0, pitch: 0.14, dist: 13, fov: 42 },
];

(async () => {
  const art = path.resolve(process.argv[2]), sortie = path.resolve(process.argv[3] || 'apercu');
  const exp = path.join(art, 'Export');
  const r = await esbuild.build({ entryPoints: [path.join(MAQUETTE, 'apercu', 'entree.js')], bundle: true, format: 'iife', target: 'es2020', write: false, nodePaths: [path.join(MAQUETTE, 'node_modules')] });
  const deux = ['util', 'data', 'seal', 'fx'].map((f) => '<script>' + fs.readFileSync(path.join(MAQUETTE, '2d', f + '.js'), 'utf8') + '</script>').join('');
  const nav = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }), onglet = await nav.newPage({ viewport: { width: 1600, height: 900 } });
  onglet.setDefaultTimeout(600000);
  const erreurs = []; onglet.on('pageerror', (e) => erreurs.push(e.message)); onglet.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
  // les modèles, servis depuis le dossier de la livraison (et rien d'autre)
  await onglet.route('http://assets/**', (route) => {
    const rel = decodeURIComponent(new URL(route.request().url()).pathname).replace(/^\/+/, ''), f = path.resolve(exp, rel);
    if (!f.startsWith(exp + path.sep) || !fs.existsSync(f)) return route.fulfill({ status: 404, body: 'absent : ' + rel });
    route.fulfill({ status: 200, body: fs.readFileSync(f), contentType: 'model/gltf-binary', headers: { 'access-control-allow-origin': '*' } });
  });
  await onglet.route('http://apercu/', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><meta charset="utf-8"><body style="margin:0">' + deux + '<script>' + r.outputFiles[0].text + '</script>' }));
  await onglet.goto('http://apercu/');
  const res = await onglet.evaluate((v) => window.__apercu(v), VUES);
  await nav.close();
  fs.mkdirSync(sortie, { recursive: true });
  for (const [nom, url] of Object.entries(res.images)) fs.writeFileSync(path.join(sortie, nom + '.png'), Buffer.from(url.split(',')[1], 'base64'));
  fs.writeFileSync(path.join(sortie, 'luisants-par-le-nom.json'), JSON.stringify(res.luisantsParLeNom, null, 1));
  console.log(Object.keys(res.images).length + ' vues dans ' + sortie);
  console.log('luisent par leur nom (pas d\'Emissive dans le fichier) : ' + res.luisantsParLeNom.length);
  if (erreurs.length) { console.error(erreurs.slice(0, 10).join('\n')); process.exitCode = 1; }
})().catch((e) => { console.error(e.message || e); process.exit(1); });
