'use strict';
// Compile le nœud Custom d'Unreal (Unreal/Rendu/BrimoEncre.hlsl) hors d'Unreal, avec glslang (HLSL → SPIR-V),
// puis le traduit en GLSL ES 3.0 avec SPIRV-Cross, pour le faire tourner dans la maquette (outils/shaders/verifier.js).
//   node outils/shaders/compiler.js [dossier de sortie]      (apt install glslang-tools spirv-cross)
//
// Une seule retouche, faite ici et nulle part ailleurs : dans Unreal, la structure FBrimoEncre est déclarée DANS la fonction
// du nœud (l'astuce habituelle pour écrire des fonctions dans un nœud Custom) ; glslang ne sait pas compiler les méthodes
// d'une structure locale, alors le banc la sort à la portée globale. Son code est recopié tel quel, caractère pour caractère.
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const ICI = __dirname, RACINE = path.resolve(ICI, '..', '..');
const NOEUD = path.join(RACINE, 'Unreal', 'Rendu', 'BrimoEncre.hlsl');

function compiler(sortie) {
  fs.mkdirSync(sortie, { recursive: true });
  const code = fs.readFileSync(NOEUD, 'utf8');
  // la structure : de « struct FBrimoEncre » à l'accolade fermante qui lui répond, suivie de « ; »
  const debut = code.indexOf('struct FBrimoEncre');
  if (debut < 0) throw new Error('struct FBrimoEncre introuvable dans ' + NOEUD);
  let prof = 0, fin = -1;
  for (let i = code.indexOf('{', debut); i < code.length; i++) { if (code[i] === '{') prof++; else if (code[i] === '}' && --prof === 0) { fin = code.indexOf(';', i) + 1; break; } }
  if (fin <= 0) throw new Error('fin de la structure introuvable');
  const avant = code.slice(0, debut), structure = code.slice(debut, fin), corps = code.slice(fin);
  const banc = fs.readFileSync(path.join(ICI, 'banc.hlsl'), 'utf8')
    .replace('#include "../../Unreal/Rendu/BrimoEncre.hlsl"', () => corps)
    .replace('// le nœud Custom : ses entrées', () => avant + structure + '\n\n// le nœud Custom : ses entrées');
  const hlsl = path.join(sortie, 'banc-genere.hlsl'), spv = path.join(sortie, 'banc.spv'), glsl = path.join(sortie, 'banc.frag');
  fs.writeFileSync(hlsl, banc);
  execFileSync('glslangValidator', ['-D', '-V', '-S', 'frag', '-e', 'main', '--auto-map-bindings', hlsl, '-o', spv], { stdio: 'pipe' });
  const sortieGlsl = execFileSync('spirv-cross', [spv, '--version', '300', '--es', '--flatten-ubo'], { encoding: 'utf8' });
  fs.writeFileSync(glsl, sortieGlsl);
  return { hlsl, spv, glsl, code: sortieGlsl };
}
module.exports = { compiler };

if (require.main === module) {
  const sortie = path.resolve(process.argv[2] || path.join(require('os').tmpdir(), 'brimo-shaders'));
  try { const r = compiler(sortie); console.log('compilé : ' + path.relative(process.cwd(), r.glsl) + ' (' + r.code.split('\n').length + ' lignes de GLSL)'); }
  catch (e) { console.error((e.stdout && e.stdout.toString()) || e.message); process.exit(1); }
}
