'use strict';
// Vérifie le nœud d'encre d'Unreal dans la maquette : compile Unreal/Rendu/BrimoEncre.hlsl (compiler.js), puis rend la même
// scène deux fois, par la maquette (A) et « comme Unreal » avec le nœud traduit (B), et compare les deux images.
//   node outils/shaders/verifier.js [dossier des images]        (glslang-tools, spirv-cross ; maquette : npm install)
// Échoue si l'écart dépasse le seuil : le nœud n'est alors plus la traduction fidèle de la maquette.
const fs = require('fs'), path = require('path');
const { compiler } = require('./compiler.js');
const ICI = __dirname, RACINE = path.resolve(ICI, '..', '..'), MAQUETTE = path.join(RACINE, 'maquette');
const esbuild = require(path.join(MAQUETTE, 'node_modules', 'esbuild'));
// Playwright : installé dans l'environnement, ou dans maquette/node_modules (la CI)
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require(path.join(MAQUETTE, 'node_modules', 'playwright')); } })();

const VUES = [
  { nom: 'jour', t: 2.0, yaw: 0.55, pitch: 0.3, dist: 9.5 },
  { nom: 'loin', t: 3.3, yaw: 2.2, pitch: 0.42, dist: 22 },
  { nom: 'nuit', t: 4.1, yaw: -0.6, pitch: 0.25, dist: 12, nuit: 1 },
];
// les seuils, réglés sur la mesure : le nœud fidèle donne environ 1 / 255 d'écart moyen, quelques % de pixels touchés
// (les vitres, qui ne luisent qu'à moitié dans la maquette, et des pixels de bord) ; une ombre faussée les dépasse nettement.
const SEUIL_MOYEN = 1.5, SEUIL_PEU = 0.06, SEUIL_GROS = 0.015;

(async () => {
  const sortie = path.resolve(process.argv[2] || path.join(require('os').tmpdir(), 'brimo-encre'));
  const { code: glsl } = compiler(sortie);
  const r = await esbuild.build({ entryPoints: [path.join(MAQUETTE, 'banc', 'entree.js')], bundle: true, format: 'iife', target: 'es2020', write: false, nodePaths: [path.join(MAQUETTE, 'node_modules')] });
  const deux = ['util', 'data', 'seal', 'fx'].map((f) => '<script>' + fs.readFileSync(path.join(MAQUETTE, '2d', f + '.js'), 'utf8') + '</script>').join('');
  const nav = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }), onglet = await nav.newPage({ viewport: { width: 1280, height: 720 } });
  const erreurs = []; onglet.on('pageerror', (e) => erreurs.push(e.message)); onglet.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
  await onglet.setContent('<!doctype html><meta charset="utf-8"><body style="margin:0">' + deux + '<script>' + r.outputFiles[0].text + '</script>');
  onglet.setDefaultTimeout(300000);
  const res = await onglet.evaluate(({ glsl, vues }) => window.__banc(glsl, vues), { glsl, vues: VUES });
  await nav.close();
  if (erreurs.length) { console.error(erreurs.join('\n')); process.exit(1); }
  let ok = true;
  for (const v of res) {
    for (const k of ['A', 'B', 'ecart']) fs.writeFileSync(path.join(sortie, v.nom + '-' + k + '.png'), Buffer.from(v[k].split(',')[1], 'base64'));
    const bon = v.moyen <= SEUIL_MOYEN && v.peu <= SEUIL_PEU && v.gros <= SEUIL_GROS; ok = ok && bon;
    console.log(`${bon ? 'ok ' : 'ÉCART'} ${v.nom.padEnd(5)} écart moyen ${v.moyen.toFixed(2)} / 255 ; pixels touchés ${(v.peu * 100).toFixed(2)} %, nettement différents ${(v.gros * 100).toFixed(2)} %`);
  }
  console.log('images : ' + sortie + ' (A : la maquette, B : le nœud Unreal, ecart : la différence en rouge)');
  if (!ok) process.exit(1);
})().catch((e) => { console.error((e.stdout && e.stdout.toString()) || e.message || e); process.exit(1); });
