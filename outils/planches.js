'use strict';
// Les planches de référence (C4) : Gribouille, Grum et l'apprenti(e), dessinés par le code du jeu 2D lui-même
// (maquette/2d/mascottes.js et perso.js, copiés par outils/depuis-le-jeu-2d.js) : expressions, poses, tenues, variantes.
//   node outils/planches.js        (Playwright, déjà installé dans l'environnement)
// Sortie : Art/Reference/Planches/*.png, sur le parchemin du jeu.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const RACINE = path.resolve(__dirname, '..'), DEUX = path.join(RACINE, 'maquette', '2d'), SORTIE = path.join(RACINE, 'Art', 'Reference', 'Planches');

// ---------- ce qui se dessine dans le navigateur ----------
function dessinerPlanches() {
  const INK = U.INK, CASE_L = 230, CASE_H = 290, MARGE = 40, COLS = 6;
  // une planche : un titre, puis des rangées de cases légendées ; chaque case appelle dessin(ctx, x, yPied)
  function planche(titre, sections) {
    let h = 110; for (const s of sections) h += 60 + Math.ceil(s.cases.length / (s.cols || COLS)) * (s.h || CASE_H);
    const w = MARGE * 2 + COLS * CASE_L, c = document.createElement('canvas'); c.width = w; c.height = h + MARGE;
    const ctx = c.getContext('2d'); ctx.drawImage(U.paper(w, h + MARGE, 7), 0, 0);
    ctx.fillStyle = INK; ctx.font = 'bold 44px Georgia, serif'; ctx.fillText(titre, MARGE, 70);
    ctx.font = 'italic 18px Georgia, serif'; ctx.fillStyle = '#6b4f2a'; ctx.fillText('Dessiné par le code du jeu 2D (L\'Atelier des Sceaux) · référence pour Brimoland 3D', MARGE, 98);
    let y = 110;
    for (const s of sections) {
      const cols = s.cols || COLS, ch = s.h || CASE_H, cl = (w - MARGE * 2) / cols;
      ctx.fillStyle = INK; ctx.font = 'bold 26px Georgia, serif'; ctx.fillText(s.titre, MARGE, y + 38);
      if (s.note) { ctx.font = 'italic 16px Georgia, serif'; ctx.fillStyle = '#6b4f2a'; ctx.fillText(s.note, MARGE + ctx.measureText(s.titre).width * 1.75 + 24, y + 38); }
      ctx.strokeStyle = 'rgba(31,26,22,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(MARGE, y + 50); ctx.lineTo(w - MARGE, y + 50); ctx.stroke();
      y += 60;
      s.cases.forEach((k, i) => {
        const cx = MARGE + (i % cols) * cl + cl / 2, cy = y + Math.floor(i / cols) * ch;
        ctx.save(); ctx.beginPath(); ctx.rect(cx - cl / 2 + 4, cy + 2, cl - 8, ch - 6); ctx.clip();
        k.dessin(ctx, cx, cy + ch - 44); ctx.restore();
        ctx.fillStyle = INK; ctx.font = '19px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText(k.nom, cx, cy + ch - 14); ctx.textAlign = 'left';
      });
      y += Math.ceil(s.cases.length / cols) * ch;
    }
    return c.toDataURL('image/png');
  }
  const M = Mascottes, T = 1; // à t = 1 s : personne ne cligne des yeux
  const grib = (o, ech = 3.6, dx = 0, dy = 0) => (ctx, x, y) => M.dessiner(ctx, 'gribouille', x + dx, y + dy, Object.assign({ t: T, dir: 1, regard: { x: 0.7, y: 0 } }, o), ech);
  const grum = (o, ech = 3.6, dx = 0) => (ctx, x, y) => M.dessiner(ctx, 'grum', x + dx, y, Object.assign({ t: T, dir: 1, regard: { x: 0.6, y: 0 } }, o), ech);
  const nomsTenue = (qui) => Object.entries(M.TENUES[qui]).map(([id, t]) => ({ id, nom: t.nom.replace(/^(Gribouille|Grum) /, '') + (t.rare ? ' (rare)' : '') }));

  const EXPR_G = [['neutre', 'neutre'], ['content', 'content'], ['triomphant', 'triomphant'], ['excite', 'excité'], ['curieux', 'curieux'], ['surpris', 'surpris'], ['effraye', 'effrayé'], ['reflechi', 'réfléchi'],
    ['agace', 'agacé'], ['colere', 'colère'], ['determine', 'déterminé'], ['malicieux', 'malicieux'], ['inquiet', 'inquiet'], ['gene', 'gêné'], ['endormi', 'endormi']];
  const POSES_G = [['neutre', 'attente', {}], ['marche', 'marche', { t: 1.07 }], ['course', 'course', { t: 1.07 }], ['saut', 'saut', {}], ['levite', 'lévite', {}], ['sort', 'sort', { prog: 0.8, couleur: '#3b6fb6' }],
    ['victoire', 'victoire', { expr: 'triomphant' }], ['theatral', 'théâtral', { expr: 'malicieux' }], ['lecture', 'lecture', { expr: 'reflechi' }], ['dormir', 'dormir', { expr: 'endormi' }], ['effraye', 'effrayé', { expr: 'effraye' }], ['chute', 'chute', { expr: 'surpris' }]];
  const gribouille = planche('Gribouille', [
    { titre: 'Les expressions', note: 'un seul grand œil, au milieu ; la paupière et la bouche font tout', cases: EXPR_G.map(([e, n]) => ({ nom: n, dessin: grib({ expr: e }) })) },
    { titre: 'Les poses', note: 'de profil, tourné vers la droite, comme dans le jeu', cases: POSES_G.map(([p, n, o]) => ({ nom: n, dessin: grib(Object.assign({ pose: p }, o), p === 'chute' ? 2.7 : 3.6, p === 'chute' ? 85 : 0, p === 'chute' ? -40 : 0) })) },
    { titre: 'Les tenues', cases: nomsTenue('gribouille').map(({ id, nom }) => ({ nom, dessin: grib({ tenue: id, expr: 'content' }) })) },
    { titre: 'Giga Gribouille', note: 'la transformation, puis la forme amplifiée (chapeau resté petit)', h: 420, cols: 3,
      cases: [{ nom: 'il se gonfle (à mi-chemin)', dessin: grib({ pose: 'transfo', prog: 0.5 }, 2.6) }, { nom: 'Giga', dessin: grib({ pose: 'giga' }, 2.6) }, { nom: 'Giga, la frappe', dessin: grib({ pose: 'giga', frappe: 0.5 }, 2.6) }] },
  ]);

  const EXPR_R = [['neutre', 'neutre'], ['content', 'content'], ['triomphant', 'triomphant'], ['gourmand', 'gourmand'], ['surpris', 'surpris'], ['fatigue', 'fatigué'], ['agace', 'agacé'], ['determine', 'déterminé'], ['endormi', 'endormi'], ['blesse', 'blessé']];
  const POSES_R = [['neutre', 'attente', {}], ['marche', 'marche', { t: 1.1 }], ['course', 'course', { t: 1.1 }], ['saut', 'saut', {}], ['frappe', 'frappe', { prog: 0.5, expr: 'determine' }], ['aide', 'aide (la pioche)', { t: 1.05 }],
    ['manger', 'manger (le gâteau)', { expr: 'gourmand' }], ['repos', 'repos', { expr: 'repos' }], ['dormir', 'dormir', { expr: 'endormi' }], ['neutre', 'heureux (après le gâteau)', { heureux: 1, expr: 'joyeux' }]];
  const grumP = planche('Grum', [
    { titre: 'Les expressions', note: 'seulement les yeux, dans la visière', cases: EXPR_R.map(([e, n]) => ({ nom: n, dessin: grum({ expr: e }) })) },
    { titre: 'Les poses', note: 'de profil, tourné vers la droite ; les mains ne sont pas reliées au corps', cases: POSES_R.map(([p, n, o]) => ({ nom: n, dessin: grum(Object.assign({ pose: p }, o), 3.6, p === 'frappe' ? -24 : 0) })) },
    { titre: 'Les tenues', cases: nomsTenue('grum').map(({ id, nom }) => ({ nom, dessin: grum({ tenue: id, expr: 'content' }) })) },
  ]);

  // l'apprenti(e) : Perso.draw(ctx, x, yPied, hauteur, look, face, anim, sta, bouge, pose)
  const P = Perso, BASE = { cape: 2, chapeau: 0, coiffure: 0, cheveux: 1, peau: 0, acc: 3, echarpe: 0 };
  const app = (look, o = {}) => (ctx, x, y) => P.draw(ctx, x, y, 170, Object.assign({}, BASE, look), 1, o.anim || 0, null, !!o.bouge, Object.assign({ t: T }, o.pose || {}));
  const apprentiP = planche('L\'apprenti(e)', [
    { titre: 'Les poses', cases: [{ nom: 'attente', dessin: app({}) }, { nom: 'marche', dessin: app({}, { bouge: true, anim: 1.2 }) }, { nom: 'marche (autre pas)', dessin: app({}, { bouge: true, anim: 4.3 }) },
      { nom: 'en l\'air', dessin: app({}, { pose: { air: true, vy: -200 } }) }, { nom: 'chute', dessin: app({}, { pose: { air: true, vy: 300 } }) }, { nom: 'lancer un sort', dessin: app({}, { pose: { cast: -0.3 } }) }] },
    { titre: 'Les chapeaux', cases: P.CHAPEAUX.map((n, i) => ({ nom: n, dessin: app({ chapeau: i }) })) },
    { titre: 'Les coiffures', note: 'sans chapeau', cases: P.COIFFURES.map((n, i) => ({ nom: n, dessin: app({ coiffure: i, chapeau: 6 }) })) },
    { titre: 'Les objets tenus', cases: P.OBJETS.map((n, i) => ({ nom: n, dessin: app({ acc: i }) })) },
    { titre: 'Les écharpes', cases: P.ECHARPES.map((n, i) => ({ nom: n, dessin: app({ echarpe: i }) })) },
    { titre: 'Les peaux', cases: P.PEAUX.map((c, i) => ({ nom: c, dessin: app({ peau: i, chapeau: 6, coiffure: i }) })) },
    { titre: 'Les capes', cases: DATA.CAPES.map((c, i) => ({ nom: c.nom, dessin: app({ cape: i }) })) },
  ]);
  return { Gribouille: gribouille, Grum: grumP, Apprenti: apprentiP };
}

(async () => {
  const scripts = ['util', 'fx', 'data', 'seal', 'perso', 'mascottes'].map((f) => '<script>' + fs.readFileSync(path.join(DEUX, f + '.js'), 'utf8').replace(/<\/script>/gi, '<\\/script>') + '</script>').join('\n');
  const nav = await chromium.launch(), onglet = await nav.newPage();
  onglet.on('pageerror', (e) => { console.error('erreur dans la page : ' + e.message); process.exitCode = 1; });
  await onglet.setContent('<!doctype html><meta charset="utf-8"><body>' + scripts);
  const images = await onglet.evaluate('(' + dessinerPlanches.toString() + ')()');
  await nav.close();
  fs.mkdirSync(SORTIE, { recursive: true });
  for (const [nom, url] of Object.entries(images)) {
    const f = path.join(SORTIE, 'Planche_' + nom + '.png'); fs.writeFileSync(f, Buffer.from(url.split(',')[1], 'base64'));
    console.log('écrit ' + path.relative(RACINE, f) + ' (' + Math.round(fs.statSync(f).size / 1024) + ' Ko)');
  }
})().catch((e) => { console.error(e.message || e); process.exit(1); });
