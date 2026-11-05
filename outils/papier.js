'use strict';
// Le papier pour Unreal (C3) : Art/Textures/T_Papier.png, 1024 × 1024, le parchemin du jeu 2D (U.paper, même graine que la
// maquette) mais RACCORDÉ : chaque tache et chaque fibre qui déborde d'un bord revient par le bord opposé, pour que la
// texture se répète sans couture sur tout l'écran.
//   node outils/papier.js
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const RACINE = path.resolve(__dirname, '..'), SORTIE = path.join(RACINE, 'Art', 'Textures');

// la recette de U.paper (js/util.js du jeu 2D), dessinée sur un tore
function papierRaccorde(w, h, graine) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'), TAU = Math.PI * 2;
  g.fillStyle = U.PAPER; g.fillRect(0, 0, w, h);
  const r = U.mulberry32(graine);
  const neuf = (dessin) => { for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) { g.save(); g.translate(dx, dy); dessin(); g.restore(); } };
  for (let i = 0; i < (w * h) / 900; i++) { // les taches
    const x = r() * w, y = r() * h, rad = 6 + r() * 40, a = 0.02 + r() * 0.05;
    neuf(() => { const grd = g.createRadialGradient(x, y, 0, x, y, rad); grd.addColorStop(0, 'rgba(120,90,40,' + a + ')'); grd.addColorStop(1, 'rgba(120,90,40,0)'); g.fillStyle = grd; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); });
  }
  g.strokeStyle = 'rgba(90,70,40,0.08)'; g.lineWidth = 1;
  for (let i = 0; i < (w * h) / 600; i++) { // les fibres
    const x = r() * w, y = r() * h, a = r() * TAU, l = 3 + r() * 10;
    neuf(() => { g.strokeStyle = 'rgba(90,70,40,0.08)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); });
  }
  g.fillStyle = 'rgba(60,40,20,0.10)';
  for (let i = 0; i < (w * h) / 150; i++) g.fillRect(Math.floor(r() * w), Math.floor(r() * h), 1, 1); // les points
  return c.toDataURL('image/png');
}

(async () => {
  const nav = await chromium.launch(), onglet = await nav.newPage();
  await onglet.setContent('<script>' + fs.readFileSync(path.join(RACINE, 'maquette', '2d', 'util.js'), 'utf8') + '</script>');
  const url = await onglet.evaluate('(' + papierRaccorde.toString() + ')(1024, 1024, 7)');
  await nav.close();
  fs.mkdirSync(SORTIE, { recursive: true });
  fs.writeFileSync(path.join(SORTIE, 'T_Papier.png'), Buffer.from(url.split(',')[1], 'base64'));
  console.log('écrit Art/Textures/T_Papier.png (1024 × 1024, raccordé)');
})().catch((e) => { console.error(e.message || e); process.exit(1); });
