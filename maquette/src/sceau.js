// ---------- Les sceaux, dessinés par le jeu 2D lui-même (Seal.draw, Seal.drawTrace), posés en 3D ----------
import * as THREE from 'three';
import { materiauDecalque } from './encre.js';

// le sceau de démonstration : une zone de petit soleil, la Puissance juste sous la Gravité, équilibré
export const SCEAU = () => Seal.clone({ taille: 'grand', core: 'feu', core2: 'gravite', shape: 'zone', mods: ['puissance', 'duree', 'taille', null, null], trigger: 'contact', trigger2: 'retarde' });

function texture(canvas) { const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.NoColorSpace; t.anisotropy = 4; return t; }

// au sol : le cercle entier, comme sur la table des sceaux
export function sceauAuSol(seal, x, y, z, rayon = 3.2) {
  const c = document.createElement('canvas'); c.width = c.height = 1024;
  Seal.draw(c.getContext('2d'), seal, 512, 530, 400, { t: 0, slots: 5, fusion: true, filtres: true, cibles: true });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(rayon * 2, rayon * 2), materiauDecalque(texture(c), 1));
  m.rotation.x = -Math.PI / 2; m.position.set(x, y + 0.06, z); m.renderOrder = 2;
  return m;
}

// dans l'air : le tracé, anneau par anneau, devant la baguette (redessiné à chaque image)
export function traceDansLAir(seal) {
  const c = document.createElement('canvas'); c.width = c.height = 512; const ctx = c.getContext('2d'), tex = texture(c);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), materiauDecalque(tex, 1)); m.renderOrder = 3; m.visible = false;
  m.userData.dessiner = (prog, t) => { ctx.clearRect(0, 0, 512, 512); Seal.drawTrace(ctx, seal, 256, 256, 210, prog, t); tex.needsUpdate = true; };
  return m;
}
