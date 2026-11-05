'use strict';
// Exporte les données de la magie depuis le jeu 2D (L'Atelier des Sceaux) et calcule les vecteurs de parité :
// des milliers de sceaux tirés au hasard, avec ce que le jeu 2D en dit (coût, paramètres, fusion, taille...).
// Le cœur C++ (Core/) doit donner exactement les mêmes réponses.
//   node outils/depuis-le-jeu-2d.js [chemin du jeu 2D]      (par défaut : ../Jjk2, ou $BRIMO_JEU2D)
const fs = require('fs'), path = require('path');
const RACINE = path.resolve(__dirname, '..');
const JEU2D = path.resolve(process.argv[2] || process.env.BRIMO_JEU2D || path.join(RACINE, '..', 'Jjk2'));
if (!fs.existsSync(path.join(JEU2D, 'js', 'seal.js'))) { console.error('Jeu 2D introuvable : ' + JEU2D); process.exit(1); }

// ---------- charger le jeu 2D (util, données, sceaux) sans navigateur ----------
global.window = global;
for (const f of ['util', 'data', 'seal']) (0, eval)(fs.readFileSync(path.join(JEU2D, 'js', f + '.js'), 'utf8').replace(/^const (\w+) =/m, 'global.$1 ='));
let version = '?'; try { version = require('child_process').execSync('git -C "' + JEU2D + '" rev-parse --short HEAD').toString().trim(); } catch (e) { /* pas de git */ }

// ---------- 1. les données ----------
const garder = (o, champs) => { const r = {}; for (const k in o) { const v = o[k], q = {}; for (const c of champs) if (v[c] !== undefined) q[c] = v[c]; r[k] = q; } return r; };
const donnees = {
  source: 'L\'Atelier des Sceaux (jeu 2D), commit ' + version,
  essences: DATA.ESSENCES,
  cores: garder(DATA.CORES, ['nom', 'couleur', 'cout', 'desc', 'interne']),
  pseudo: garder(DATA.PSEUDO, ['nom', 'couleur']),
  inverse: DATA.INVERSE,
  mods: garder(DATA.MODS, ['nom', 'cout', 'desc', 'aspect', 'devient', 'langue']),
  shapes: garder(DATA.SHAPES, ['nom', 'cout', 'desc']),
  triggers: garder(DATA.TRIGGERS, ['nom', 'cout', 'desc']),
  filtres: garder(DATA.FILTRES, ['nom', 'cout', 'couleur', 'mats']),
  cibles: garder(DATA.CIBLES, ['nom', 'cout', 'desc']),
  tailles: garder(DATA.TAILLES, ['nom', 'slots', 'coutMul', 'coutAdd', 'geste', 'desc']),
  dims: DATA.DIMS, dimVals: DATA.DIM_VALS, matiere: DATA.MATIERE,
  langages: garder(DATA.LANGAGES, ['glyphe', 'nom', 'de', 'paliers']),
  combos: garder(DATA.COMBOS, ['nom', 'desc', 'indice']), trios: garder(DATA.TRIOS, ['nom', 'desc', 'indice']), genres: garder(DATA.GENRES, ['nom', 'desc', 'indice']),
  aspects: Object.keys(DATA.ASPECTS), // les aspects d'origine, dans l'ordre (les recettes de fusion les cherchent là)
  migration: DATA.MIGRATION, migrMods: DATA.MIGR_MODS,
  elans: DATA.ELANS, teintes: DATA.TEINTES,
  modAngles: Seal.MOD_ANGLES,
};
const ecrire = (f, o, compact) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, (compact ? JSON.stringify(o) : JSON.stringify(o, null, 1)) + '\n'); console.log('écrit ' + path.relative(RACINE, f) + ' (' + Math.round(fs.statSync(f).size / 1024) + ' Ko)'); };
ecrire(path.join(RACINE, 'Core', 'donnees', 'brimo.json'), donnees);

// ---------- 2. les vecteurs de parité ----------
let graine = 20261105;
const hasard = () => { graine |= 0; graine = (graine + 0x6D2B79F5) | 0; let t = Math.imul(graine ^ (graine >>> 15), 1 | graine); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const un = (L) => L[Math.floor(hasard() * L.length)];
const p = (x) => hasard() < x;
const MODS = Object.keys(DATA.MODS).filter((m) => m !== 'sous'), SHAPES = Object.keys(DATA.SHAPES), TRIG = Object.keys(DATA.TRIGGERS);
const FIL = Object.keys(DATA.FILTRES), CIB = Object.keys(DATA.CIBLES), E = DATA.ESSENCES;
// un mod plus souvent parmi ceux qui comptent (Puissance, Inverser, aspects...) pour exercer les liaisons
const unMod = () => (p(0.3) ? un(['puissance', 'inverser', 'puissance', 'duree', 'taille', 'portee', 'rafale', 'double']) : un(MODS));
function tirer(prof = 0) {
  const taille = un(['petit', 'moyen', 'moyen', 'grand', 'grand']);
  const s = { taille, core: p(0.94) ? un(E) : null, core2: p(0.55) ? un(E) : null, core3: p(0.4) ? un(E) : null, shape: p(0.92) ? un(SHAPES) : null,
    mods: [0, 1, 2, 3, 4].map(() => (p(0.45) ? (prof < 1 && p(0.04) ? { sub: tirer(prof + 1) } : unMod()) : null)),
    trigger: p(0.8) ? un(TRIG) : null, trigger2: p(0.35) ? un(TRIG) : null, filtre: p(0.25) ? un(FIL) : null, cible: p(0.25) ? un(CIB) : null,
    delai: un([1, 2, 5, 10]), periode: un([1, 2, 5]), dimL: p(0.2) ? un(DATA.DIM_VALS) : 1, dimH: p(0.2) ? un(DATA.DIM_VALS) : 1 };
  if (p(0.12)) s.core = un(['froid', 'acide', 'metal', 'son', 'force', 'lien', 'rembobinage', 'marque', 'ombre']); // anciennes essences : migrées
  if (p(0.03)) s.mods[0] = un(['givre', 'mordant', 'tenebres']);
  if (taille === 'grand' && s.trigger2 && p(0.6)) s.lien2 = un(['core', 'core2', 'core3']);
  return s;
}
// ce que le moteur prépare au lancement (sans le hasard du sceau bancal ni la charge)
function lancement(s, charge) {
  const prm = Seal.params(s);
  if (charge > 0) { prm.power *= 1 + 0.8 * charge; prm.range *= 1 + 0.5 * charge; prm.size *= 1 + 0.4 * charge; prm.duration *= 1 + 0.3 * charge; }
  let cores = Seal.effets(s);
  for (const e in prm.asp) for (const A of prm.asp[e]) if (A.n > 1) { prm.lg[A.devient] = 2; prm.power *= 1.3; }
  const effets0 = cores.slice(); let gInv = false;
  if (prm.inverse) { gInv = cores.includes('gravite'); cores = cores.map((c) => (c === 'gravite' ? c : DATA.INVERSE[c] || c)); }
  else if (prm.invEss && prm.invEss.length) { cores = cores.map((c) => (prm.invEss.includes(c) && c !== 'gravite' ? DATA.INVERSE[c] || c : c)); if (prm.invEss.includes('gravite')) gInv = true; }
  const lg = prm.lg || {};
  if (lg.gravite && cores.includes('gravite')) { prm.size *= 1 + 0.3 * lg.gravite; prm.power *= 1 + 0.4 * lg.gravite; }
  const combo = !prm.inverse && !(prm.invEss && prm.invEss.length) ? DATA.comboCle(effets0) : null;
  const trs = Seal.triggers(s), proj = s.shape === 'projectile' || s.shape === 'chaine';
  const PRIM = ['tenu', 'immediat', 'contact', 'retarde', 'commande', 'proximite'];
  const trig = trs.find((t) => PRIM.includes(t)) || (trs.includes('repetition') && proj ? 'contact' : 'immediat');
  const big = s.taille !== 'petit';
  // l'élan (sur soi) : l'essence du centre, teintée des autres
  const IMM = ['feu', 'eau', 'vent', 'terre', 'vie', 'lumiere', 'foudre', 'portail', 'esprit', 'transmutation', 'contre'];
  const TENIR = IMM.concat(['gravite', 'temps', 'metamorphose']);
  const nu = [...new Set(cores.slice(1))].filter((c) => c !== cores[0]);
  const elan = s.shape === 'soi' ? { essence: cores[0], immediat: IMM.includes(cores[0]), maintenu: trig === 'tenu' && TENIR.includes(cores[0]), teintes: nu, avance: (prm.rafale ? (prm.rafale > 1 ? 4 : 2) : 0) + (prm.extra || 0) } : null;
  return { effets: cores, effetsBase: effets0, gInv, combo, trig, repeat: trs.includes('repetition') ? (s.periode || 2) : 0, expire: trs.includes('expiration'), delai: s.delai || 2,
    filtre: big ? s.filtre || null : null, cible: big ? s.cible || 'souris' : 'souris', bancal: Seal.equilibre(s).etat === 'bancal',
    power: prm.power, range: prm.range, size: prm.size, duration: prm.duration, lg: prm.lg, elan };
}
const r6 = (x) => Math.round(x * 1e6) / 1e6;
const arrondir = (o) => JSON.parse(JSON.stringify(o, (k, v) => (typeof v === 'number' ? r6(v) : v)));
const cas = [];
for (let i = 0; i < 1500; i++) {
  const brut = tirer(), s = Seal.clone(brut), prm = Seal.params(s);
  const tailles = un([['petit', 'moyen', 'grand'], ['moyen', 'grand'], ['moyen'], ['petit', 'moyen']]), slots = un([1, 2, 3]);
  const charge = un([0, 0, 0.5, 1]);
  const ef = Seal.effets(s), cle = DATA.comboCle(ef), info = cle && DATA.comboInfo(cle);
  const deux = Seal.enDeuxTemps(s);
  cas.push(arrondir({
    brut, normal: s,
    cout: Seal.cost(s), detail: Seal.coutDetail(s).parts.map((q) => [q.cle, q.v, !!q.pct]),
    params: { power: prm.power, range: prm.range, duration: prm.duration, size: prm.size, bounces: prm.bounces, persist: prm.persist, speed: prm.speed, extra: prm.extra,
      inverse: prm.inverse, echo: prm.echo, teleguide: prm.teleguide, orbite: prm.orbite, canalise: prm.canalise, traj: prm.traj, percant: prm.percant, gerbe: prm.gerbe,
      matiere: prm.matiere, rafale: prm.rafale, dimL: prm.dimL, dimH: prm.dimH, ess: prm.ess, invEss: prm.invEss, liaisons: prm.liaisons, lg: prm.lg, asp: prm.asp },
    effets: ef, combo: cle || null, comboNom: info ? info.nom : null,
    equilibre: Seal.equilibre(s), tailles, slots, tailleMin: Seal.tailleMin(s, tailles, slots), tailleBesoin: Seal.tailleBesoin(s, slots),
    geste: Seal.geste(s), nGlyphes: Seal.nGlyphes(s), triggers: Seal.triggers(s), nbSlots: Seal.nbSlots(s, slots),
    deuxTemps: deux, scinde: deux ? Seal.scinder(s) : null,
    anneaux: Seal.anneaux(s), prog: (i % 5) / 5 + 0.1, partiel: Seal.partiel(s, (i % 5) / 5 + 0.1),
    inutiles: Seal.inutiles(s), etat: Seal.etat(s), nom: Seal.nom(s), profondeur: Seal.depth(s),
    charge, lancement: lancement(s, charge),
  }));
}
// les recettes des fusions : de la clé aux glyphes, et retour
const recettes = Object.keys(DATA.COMBOS).concat(Object.keys(DATA.TRIOS), ['feu|portail', 'eau|esprit', 'contre|feu', 'metamorphose|vent']).map((k) => ({ cle: k, recette: DATA.recetteCombo(k), info: DATA.comboInfo(k) }));
ecrire(path.join(RACINE, 'Core', 'tests', 'vecteurs.json'), { source: donnees.source, cas, recettes }, true);
