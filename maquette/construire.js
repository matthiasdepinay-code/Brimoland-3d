'use strict';
// Assemble la maquette en UN fichier HTML autonome (dist/maquette-da.html) : les scripts de dessin du jeu 2D
// (util, data, seal, fx, copiés dans 2d/ par outils/depuis-le-jeu-2d.js), puis three.js et la maquette, regroupés par esbuild.
//   npm install && npm run construire
const fs = require('fs'), path = require('path'), esbuild = require('esbuild');
const ICI = __dirname;
(async () => {
  const r = await esbuild.build({ entryPoints: [path.join(ICI, 'src', 'main.js')], bundle: true, minify: true, format: 'iife', target: 'es2020', write: false, legalComments: 'eof' });
  const echapper = (c) => c.replace(/<\/script>/gi, '<\\/script>');
  const deux = ['util', 'data', 'seal', 'fx'].map((f) => '<script>\n' + echapper(fs.readFileSync(path.join(ICI, '2d', f + '.js'), 'utf8')) + '\n</script>').join('\n');
  const page = fs.readFileSync(path.join(ICI, 'page.html'), 'utf8').replace('<!--2D-->', () => deux).replace('<!--MAQUETTE-->', () => '<script>\n' + echapper(r.outputFiles[0].text) + '\n</script>');
  fs.mkdirSync(path.join(ICI, 'dist'), { recursive: true });
  const sortie = path.join(ICI, 'dist', 'maquette-da.html'); fs.writeFileSync(sortie, page);
  console.log('écrit ' + path.relative(ICI, sortie) + ' (' + Math.round(fs.statSync(sortie).size / 1024) + ' Ko)');
})().catch((e) => { console.error(e.message || e); process.exit(1); });
