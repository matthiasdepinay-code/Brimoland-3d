'use strict';
// Exporte les gabarits (C1) : les formes de la maquette en .glb, dans Art/Reference/Gabarits/.
//   cd maquette && npm install && node gabarits/exporter.js
// Le travail se fait dans un navigateur sans fenêtre (Playwright), là où three.js et la maquette tournent déjà.
const fs = require('fs'), path = require('path'), esbuild = require('esbuild');
const { chromium } = require('playwright');
const ICI = __dirname, MAQUETTE = path.resolve(ICI, '..'), RACINE = path.resolve(MAQUETTE, '..');
const SORTIE = path.join(RACINE, 'Art', 'Reference', 'Gabarits');

(async () => {
  const r = await esbuild.build({ entryPoints: [path.join(ICI, 'entree.js')], bundle: true, format: 'iife', target: 'es2020', write: false });
  const page = '<!doctype html><meta charset="utf-8"><body><script>' + fs.readFileSync(path.join(MAQUETTE, '2d', 'util.js'), 'utf8') + '</script><script>' + r.outputFiles[0].text + '</script>';
  const nav = await chromium.launch(), onglet = await nav.newPage();
  const avertissements = []; onglet.on('console', (m) => { if (m.type() === 'warning' || m.type() === 'error') avertissements.push(m.text()); });
  onglet.on('pageerror', (e) => { console.error(e.message); process.exitCode = 1; });
  await onglet.setContent(page);
  const { fichiers, tailles } = await onglet.evaluate(() => window.__gabarits());
  await nav.close();
  fs.mkdirSync(SORTIE, { recursive: true });
  for (const [nom, b64] of Object.entries(fichiers)) {
    const f = path.join(SORTIE, 'Gabarit_' + nom + '.glb'); fs.writeFileSync(f, Buffer.from(b64, 'base64'));
    console.log('écrit ' + path.relative(RACINE, f) + ' (' + Math.round(fs.statSync(f).size / 1024) + ' Ko)');
  }
  const lignes = Object.entries(tailles).map(([n, t]) => `| ${n.replace('_', ' ')} | ${t.hauteur} m | ${t.largeur} m | ${t.profondeur} m |`);
  fs.writeFileSync(path.join(SORTIE, 'LISEZMOI.md'), `# Les gabarits (C1)

Les formes de la maquette de la DA, à la bonne échelle (1 unité = 1 m) et aux bonnes couleurs.
Ce ne sont pas des modèles : des **blocs de référence**, pour modéliser par-dessus.

**Dans Blender** : Fichier → Importer → glTF 2.0, puis choisir le fichier. Ils arrivent debout sur le sol, tournés vers −Y
(la vue de face, pavé 1), comme le veut le cahier des charges. \`Gabarit_Ensemble.glb\` les range côte à côte pour comparer les tailles.

| Gabarit | Hauteur | Largeur (X) | Profondeur (Y dans Blender) |
| --- | --- | --- | --- |
${lignes.join('\n')}

Les matériaux portent le code de leur couleur (\`M_4A6B3A\` : le vert mousse de la cape) : ce sont celles du cahier des charges.

Régénérer : \`cd maquette && node gabarits/exporter.js\`.
`);
  console.log(lignes.join('\n'));
  const vrais = avertissements.filter((a) => !/Use MeshStandardMaterial/.test(a));
  if (vrais.length) console.log('avertissements :\n' + vrais.join('\n'));
})().catch((e) => { console.error(e.message || e); process.exit(1); });
