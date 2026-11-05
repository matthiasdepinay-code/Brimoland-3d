'use strict';
// L'atlas de palette (C2) : T_Palette.png, 256 × 256, une case de 16 px par couleur du cahier des charges,
// et T_Palette.md, la liste des cases (couleur, usage, coordonnées UV du centre de la case).
//   node outils/palette.js
// Dans Blender : un seul matériau avec cette image, interpolation « Closest » ; on pose les UV d'une zone unie sur sa case.
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const RACINE = path.resolve(__dirname, '..'), SORTIE = path.join(RACINE, 'Art', 'Textures');

// [famille, [[couleur, nom], ...]] : dans l'ordre du cahier des charges ; une couleur déjà vue n'a pas de seconde case
const FAMILLES = [
  ['Encre et papier', [['1f1a16', 'encre'], ['efe3c4', 'papier'], ['6b4f2a', 'sépia'], ['f4efe6', 'blanc des yeux']]],
  ['Apprenti(e) : peaux', [['f3dcc0', 'peau 1'], ['e8c39e', 'peau 2'], ['c99a6e', 'peau 3'], ['9c6b45', 'peau 4'], ['6e4a30', 'peau 5']]],
  ['Apprenti(e) : cheveux', [['2a2521', 'noir'], ['6b4f2a', 'châtain'], ['a3782e', 'noisette'], ['d8b060', 'blond'], ['9a4a3a', 'roux'], ['e8e0d0', 'blanc'], ['5a6b8a', 'bleu'], ['c45a8a', 'rose']]],
  ['Apprenti(e) : étoffes', [['6b3f73', 'prune'], ['2f4a7a', 'nuit'], ['4a6b3a', 'vert mousse (cape par défaut)'], ['9a4a3a', 'brique'], ['2a2521', 'charbon'], ['a3782e', 'ocre'], ['3f7a7a', 'sarcelle'], ['c4a35a', 'moutarde'], ['8a3a5a', 'framboise'], ['e8dcc0', 'lin']]],
  ['Apprenti(e) : écharpes, ceinture, baguette', [['9a3a2a', 'écharpe rouge'], ['3a5a8a', 'écharpe bleue'], ['8d6a3c', 'ceinture, bois clair'], ['7a5634', 'baguette, tronc'], ['f0d070', 'étoile de la baguette, flamme']]],
  ['Gribouille', [['1f1a22', 'corps'], ['3d3348', 'reflet du corps'], ['a8307e', 'chapeau classique'], ['6e1d55', 'ombre du chapeau'], ['4e1440', 'dessous du bord'], ['e8d4a8', 'pièces cousues'], ['e8d8b0', 'étiquette'], ['6b3a2a', 'le G'],
    ['2c4290', 'arcaniste : chapeau'], ['1b2a60', 'arcaniste : ombre'], ['131d44', 'arcaniste : dessous'], ['e8c858', 'arcaniste : étoiles'], ['d8b040', 'arcaniste : bande'],
    ['9a6230', 'alchimiste : chapeau'], ['6a4020', 'alchimiste : ombre'], ['4a2c16', 'alchimiste : dessous'], ['d8843a', 'alchimiste : pièces'], ['6ac46a', 'alchimiste : fiole'], ['a8d8e8', 'alchimiste : verres des lunettes'], ['7a5a20', 'alchimiste : monture'],
    ['66733e', 'explorateur : chapeau'], ['454f28', 'explorateur : ombre'], ['30381a', 'explorateur : dessous'], ['b8502a', 'explorateur : plume'], ['8a5a2a', 'explorateur : sac'],
    ['2f7fc0', 'céruléen : corps'], ['8fd0f4', 'céruléen : reflet'], ['7ccfee', 'céruléen : chapeau'], ['3f97c8', 'céruléen : ombre'], ['2a6f9e', 'céruléen : dessous'], ['ffffff', 'céruléen : étoiles'], ['9fe0ff', 'céruléen : lueur'],
    ['8ec8ec', 'goutte de sueur']]],
  ['Giga Gribouille', [['2a1838', 'corps'], ['6a2c98', 'reflets'], ['9a40d0', 'lueur'], ['fff6ff', 'œil']]],
  ['Grum', [['c8925a', 'pierre'], ['9a6a3a', 'ombre de la pierre'], ['6e4a2a', 'joints'], ['b8c43a', 'mousse'], ['7d8a24', 'dessous de la mousse'], ['ffd23a', 'yeux'], ['f4ead0', 'rune'], ['2a1e14', 'visière'],
    ['93a0ad', 'runique : pierre'], ['6b7682', 'runique : ombre'], ['4a525c', 'runique : joints'], ['5f7a5a', 'runique : mousse'], ['3f523c', 'runique : dessous'], ['7ae8f6', 'runique : yeux et runes'],
    ['74747c', 'forgeron : pierre'], ['55555c', 'forgeron : ombre'], ['38383e', 'forgeron : joints'], ['ffa040', 'forgeron : yeux'], ['ffc070', 'forgeron : rune'], ['4a4a52', 'forgeron : cerclage'], ['9a9aa4', 'forgeron : rivets'], ['5a5a62', 'forgeron : casque'],
    ['b08850', 'forestier : pierre'], ['86643a', 'forestier : ombre'], ['5e4426', 'forestier : joints'], ['6aa83a', 'forestier : mousse'], ['3f7a24', 'forestier : dessous, lierre'], ['ffe060', 'forestier : yeux'], ['e88ab0', 'forestier : fleurs'], ['f8e070', 'cœur des fleurs'],
    ['a8949e', 'cristallin : pierre'], ['7e6a76', 'cristallin : ombre'], ['5a4854', 'cristallin : joints'], ['f0d8ff', 'cristallin : yeux'], ['e8c8ff', 'cristallin : rune'], ['b48ae8', 'cristallin : cristaux']]],
  ['Gâteau et pioche', [['f0d8a0', 'génoise'], ['f3b6c8', 'glaçage'], ['c0392b', 'cerise, baies, champignon'], ['7a5530', 'manche de la pioche'], ['8a8a92', 'fer de la pioche']]],
  ['L\'Atelier', [['d6c49a', 'torchis'], ['6b4a2a', 'colombages, porte'], ['f0c860', 'vitres allumées']]],
  ['Objets', [['3b6fb6', 'fiole d\'eau'], ['c45a5a', 'potion de soin'], ['3f9c9b', 'élixir de saut'], ['d9622b', 'fiole de flamme'], ['d8a63a', 'potion de vision'], ['d8a03a', 'miel'], ['e8842a', 'feu']]],
  ['Nature', [['78a24a', 'herbe, feuillage 4'], ['6a9a45', 'herbe sombre, feuillage 2'], ['8fb05a', 'herbe claire, mousse'], ['5f8f3e', 'feuillage 1'], ['4f7f35', 'feuillage 3, sapin, vigne'], ['a8977a', 'pierre, rochers'],
    ['d65a8a', 'fleur rose'], ['e8c040', 'fleur jaune'], ['b070e0', 'fleur violette'], ['f7f0de', 'nuages']]],
  ['Terrain et eau', [['a3844f', 'terre'], ['b89a64', 'chemin'], ['d9c48a', 'sable'], ['9dbcd8', 'eau de la mare']]],
  ['Bêtes et gardien', [['5c8f3e', 'grenouille, couronne de l\'Ent'], ['8fb8d8', 'poisson d\'argent'], ['5a4022', 'Ent : tronc'], ['3e2c1c', 'Ent : tronc sombre'], ['4a7a34', 'Ent : feuilles sombres'], ['9a2a2a', 'Ent : baies'], ['e0b050', 'Ent : regard d\'ambre']]],
];

// ---------- les cases ----------
const vues = new Map(), cases = [];
for (const [famille, liste] of FAMILLES) for (const [hex, nom] of liste) {
  if (vues.has(hex)) { vues.get(hex).noms.push(famille + ' : ' + nom); continue; }
  const c = { hex, famille, noms: [nom], i: cases.length }; vues.set(hex, c); cases.push(c);
}
const N = 16, CASE = 16, W = N * CASE;
if (cases.length > N * N) throw new Error('trop de couleurs : ' + cases.length);

// ---------- l'image (PNG écrit à la main : pas de dépendance) ----------
const px = Buffer.alloc(W * W * 4);
for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
  const k = Math.floor(y / CASE) * N + Math.floor(x / CASE), c = cases[k], o = (y * W + x) * 4;
  const h = c ? c.hex : '808080';
  px[o] = parseInt(h.slice(0, 2), 16); px[o + 1] = parseInt(h.slice(2, 4), 16); px[o + 2] = parseInt(h.slice(4, 6), 16); px[o + 3] = 255;
}
const crcT = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc = (b) => { let c = -1; for (const v of b) c = crcT[(c ^ v) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
const bloc = (type, data) => { const t = Buffer.from(type), l = Buffer.alloc(4), c = Buffer.alloc(4); l.writeUInt32BE(data.length); c.writeUInt32BE(crc(Buffer.concat([t, data]))); return Buffer.concat([l, t, data, c]); };
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(W, 4); ihdr[8] = 8; ihdr[9] = 6;
const brut = Buffer.alloc(W * (W * 4 + 1)); for (let y = 0; y < W; y++) px.copy(brut, y * (W * 4 + 1) + 1, y * W * 4, (y + 1) * W * 4);
const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), bloc('IHDR', ihdr), bloc('IDAT', zlib.deflateSync(brut, { level: 9 })), bloc('IEND', Buffer.alloc(0))]);
fs.mkdirSync(SORTIE, { recursive: true });
fs.writeFileSync(path.join(SORTIE, 'T_Palette.png'), png);

// ---------- la liste ----------
let md = `# T_Palette (C2)

L'atlas de palette : **${cases.length} couleurs**, une case de 16 × 16 px chacune, sur une image de 256 × 256.
Ce sont les couleurs du cahier des charges, famille par famille. Les cases grises au bout sont libres.

**Dans Blender** : un seul matériau (\`MI_Palette\` dans Unreal) avec \`T_Palette.png\` en couleur de base, **interpolation « Closest »**.
Pour peindre une zone : sélectionne ses faces, dans l'éditeur UV réduis-les à un point (échelle 0) et pose-le au centre de sa case.
Les UV ci-dessous sont celles du centre de chaque case (V compté du bas, comme dans Blender).

| Case | Couleur | U | V | Usage |
| --- | --- | --- | --- | --- |
`;
let fam = null;
for (const c of cases) {
  if (c.famille !== fam) { fam = c.famille; md += `| | **${fam}** | | | |\n`; }
  const col = c.i % N, lig = Math.floor(c.i / N), u = (col + 0.5) / N, v = 1 - (lig + 0.5) / N;
  md += `| ${c.i} (col. ${col}, lig. ${lig}) | \`#${c.hex}\` | ${u.toFixed(5)} | ${v.toFixed(5)} | ${c.noms.join(' ; ')} |\n`;
}
md += '\nRégénérer : `node outils/palette.js`.\n';
fs.writeFileSync(path.join(SORTIE, 'T_Palette.md'), md);
console.log('écrit Art/Textures/T_Palette.png et T_Palette.md (' + cases.length + ' couleurs)');
