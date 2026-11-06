'use strict';
// Ce que le cahier des charges des assets du Jardin attend de chaque modèle (https://claude.ai/artifact/WmauJYKvrmNiisvzjPFPWH) :
// h : la hauteur, en mètres, [min, max] ; l : la plus grande dimension au sol ; tris : le plafond de triangles (le haut du budget) ;
// clips : le nombre d'animations au moins ; pivot 'libre' : une pièce de montage, qui n'a pas à être posée au sol.
const ATTENDU = {};
const poser = (noms, a) => { for (const n of [].concat(noms)) ATTENDU[n] = Object.assign({}, a); };

// les personnages (A1 à A4) : hauteur avec le chapeau, ou la mousse
poser('SK_Apprenti', { code: 'A1', h: [2.4, 2.4], tris: 9000, clips: 20 });
poser(['SK_Gribouille', 'SK_Gribouille_Alchimiste', 'SK_Gribouille_Arcaniste', 'SK_Gribouille_Ceruleen', 'SK_Gribouille_Explorateur'], { code: 'A2', h: [1.7, 1.7], tris: 5000, clips: 12 });
poser('SK_GigaGribouille', { code: 'A3', h: [4.5, 4.5], l: [3.0, 3.8], tris: 8000, clips: 4 });
poser(['SK_Grum', 'SK_Grum_Cristallin', 'SK_Grum_Forestier', 'SK_Grum_Forgeron', 'SK_Grum_Runique'], { code: 'A4', h: [1.45, 1.6], l: [1.1, 1.5], tris: 6000, clips: 8 });
// les pièces de l'apprenti(e) et des mascottes : des pièces de montage
poser(['SM_Chapeau_Pointu', 'SM_Chapeau_Large', 'SM_Chapeau_Tordu', 'SM_Chapeau_Beret', 'SM_Chapeau_Capuche', 'SM_Chapeau_Couronne',
  'SM_Cheveux_Court', 'SM_Cheveux_Long', 'SM_Cheveux_Tresse', 'SM_Cheveux_Boucles', 'SM_Cheveux_Chignon', 'SM_Cheveux_Ras',
  'SM_Echarpe_Rouge', 'SM_Echarpe_Moutarde', 'SM_Echarpe_Vert', 'SM_Echarpe_Bleu', 'SM_Baton', 'SM_Plume', 'SM_Grimoire', 'SM_Baguette', 'SM_Lanterne',
  'SM_Grib_Chapeau', 'SM_Grum_Mousse', 'SM_Pioche'], { code: 'A1c', pivot: 'libre', tris: 1500 });

// les bêtes et le gardien (A5 à A9)
poser('SK_Limace', { code: 'A5', h: [0.3, 0.4], l: [0.55, 0.65], tris: 1500, clips: 5 });
poser('SK_Grenouille', { code: 'A6', h: [0.2, 0.35], tris: 1000, clips: 4 });
poser(['SK_Corbeau', 'SK_Corbeau_Maitre'], { code: 'A7', h: [0.25, 0.45], tris: 1500, clips: 5 });
poser('SK_Poisson', { code: 'A8', pivot: 'libre', l: [0.18, 0.25], tris: 500, clips: 3 });
poser('SK_EntRonce', { code: 'A9', h: [5, 5], l: [3, 3.5], tris: 12000, clips: 8 });
poser(['SM_GraineEpineuse', 'SM_Racine_Jaillie'], { code: 'A9', pivot: 'libre', tris: 600 });

// l'Atelier (B1 à B6)
poser('SM_Atelier', { code: 'B1', h: [8, 9.2], l: [7, 8.4], tris: 10000 });
poser('SM_Atelier_Porte', { code: 'B1', h: [2.4, 2.4], pivot: 'libre', tris: 1000 });
poser(['SM_Atelier_Vitre', 'SM_Atelier_Enseigne'], { code: 'B1', pivot: 'libre', tris: 1000 });
poser('SM_Atelier_Interieur', { code: 'B2', l: [12, 12.6], tris: 5000 });
poser('SM_TableSceaux', { code: 'B3', h: [0.85, 1.3], l: [1.6, 1.6], tris: 3000 });
poser('SM_Chaudron', { code: 'B4', h: [0.8, 1.2], l: [1.0, 1.3], tris: 1500 });
poser('SM_Miroir', { code: 'B5', h: [1.8, 2.1], tris: 1000 });
poser(['SM_Etagere', 'SM_Etagere_Trophees', 'SM_Pupitre', 'SM_Lit', 'SM_Tapis', 'SM_Plante_Pot', 'SM_Perchoir', 'SM_Bocal_01', 'SM_Bocal_02', 'SM_Bocal_03', 'SM_Bocal_04', 'SM_Bocal_05'], { code: 'B6', tris: 1500 });
poser('SM_Lanterne_Suspendue', { code: 'B6', pivot: 'libre', tris: 1500 });

// les objets (O1 à O14)
poser(['SM_Coffre_Ferme', 'SM_Coffre_Scelle'], { code: 'O1', h: [0.6, 0.7], l: [0.9, 0.95], tris: 1000 });
poser('SM_Coffre_Ouvert', { code: 'O1', l: [0.9, 0.95], tris: 1000 });
poser(['SM_Levier_Actif', 'SM_Levier_Inactif'], { code: 'O2', tris: 400 });
poser('SM_Stele', { code: 'O3', h: [2, 2], l: [0.8, 0.9], tris: 800 });
poser('SM_Caisse', { code: 'O4', h: [0.8, 0.8], l: [0.8, 0.85], tris: 300 });
poser(['SM_Caisse_Morceau_01', 'SM_Caisse_Morceau_02', 'SM_Caisse_Morceau_03', 'SM_Caisse_Morceau_04', 'SM_Caisse_Morceau_05', 'SM_Caisse_Morceau_06'], { code: 'O4', pivot: 'libre', tris: 300 });
poser('SM_Pancarte', { code: 'O5', tris: 300 });
poser('SK_Mannequin', { code: 'O6', tris: 1200 });
poser('SM_Torche', { code: 'O7', h: [1.6, 1.8], tris: 300 });
poser('SM_Torche_Murale', { code: 'O7', pivot: 'libre', tris: 300 });
poser('SM_Puits', { code: 'O8', h: [2.6, 2.6], l: [1.6, 1.8], tris: 1500 });
poser('SM_Vigne_Puits', { code: 'O8', pivot: 'libre', tris: 1500 });
poser('SM_FeuCamp', { code: 'O9', tris: 600 });
poser(['SM_Fiole_Vide', 'SM_Fiole_Eau', 'SM_Fiole_Soin', 'SM_Fiole_Encre', 'SM_Fiole_Saut', 'SM_Fiole_Flamme', 'SM_Fiole_Vision'], { code: 'O10', h: [0.13, 0.2], tris: 300 });
poser('SM_Plante_Stade_1', { code: 'O11', tris: 1000 });
poser('SM_Plante_Stade_2', { code: 'O11', h: [0.45, 0.6], tris: 1000 });
poser('SM_Plante_Stade_3', { code: 'O11', h: [3.7, 4.3], tris: 1000 });
poser('SM_Ruche', { code: 'O12', tris: 600 });
poser('SM_Page_Dechiree', { code: 'O13', pivot: 'libre', l: [0.26, 0.3], tris: 50 });
poser('SM_Gateau', { code: 'O14', tris: 400 });

// la nature (N1 à N12)
poser(['SM_Arbre_Feuillu_01', 'SM_Arbre_Feuillu_02', 'SM_Arbre_Feuillu_03'], { code: 'N1', h: [5, 8], l: [4, 6], tris: 4000 });
poser(['SM_Sapin_01', 'SM_Sapin_02'], { code: 'N2', h: [6, 9], l: [3, 4], tris: 2000 });
poser(['SM_Buisson_01', 'SM_Buisson_02', 'SM_Buisson_03'], { code: 'N3', h: [0.5, 1.5], tris: 800 });
poser(['SM_Rocher_01', 'SM_Rocher_02', 'SM_Rocher_03', 'SM_Rocher_04', 'SM_Rocher_05', 'SM_Rocher_Fissure'], { code: 'N4', h: [0.3, 3], tris: 600 });
poser(['SM_Rocher_Fissure_Eclat_01', 'SM_Rocher_Fissure_Eclat_02', 'SM_Rocher_Fissure_Eclat_03', 'SM_Rocher_Fissure_Eclat_04', 'SM_Rocher_Fissure_Eclat_05', 'SM_Rocher_Fissure_Eclat_06'], { code: 'N4', pivot: 'libre', tris: 600 });
poser('SM_Souche', { code: 'N5', h: [0.5, 0.7], tris: 600 });
poser('SM_Tronc_Couche', { code: 'N5', l: [3.8, 4.2], tris: 600 });
poser(['SM_Herbe_01', 'SM_Herbe_02', 'SM_Herbe_03'], { code: 'N6', h: [0.3, 0.6], tris: 80 });
poser(['SM_Fleur_01', 'SM_Fleur_02', 'SM_Fleur_03', 'SM_Fleur_04'], { code: 'N7', h: [0.15, 0.3], tris: 60 });
poser('SM_Vigne_Panneau', { code: 'N8', tris: 600 });
poser('SM_Roseaux', { code: 'N9', h: [1.1, 1.3], tris: 200 });
poser('SM_Nenuphar', { code: 'N9', pivot: 'libre', l: [0.35, 0.45], tris: 200 });
poser(['SM_Champignon_01', 'SM_Champignon_02'], { code: 'N10', h: [0.1, 0.4], tris: 150 });
poser(['SM_Nuage_01', 'SM_Nuage_02', 'SM_Nuage_03'], { code: 'N11', pivot: 'libre', l: [10, 30], tris: 500 });
poser('SM_Ile_Volante', { code: 'N12', pivot: 'libre', l: [18, 24], tris: 3000 });

// le terrain et l'eau (T1 à T3)
poser('SM_Jardin_Blockout', { code: 'T1', pivot: 'libre', l: [250, 250] });
poser('SM_Eau_Mare', { code: 'T3', pivot: 'libre', l: [12, 14] });

module.exports = { ATTENDU };
