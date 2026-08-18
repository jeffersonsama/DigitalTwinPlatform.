// Collisions du personnage jouable — calculées UNE fois juste après le chargement complet de la
// ville (pendant l'écran "Chargement de la ville…" déjà existant), jamais par image.
//
// Deux sources, aucun moteur physique :
// 1. Les hitbox des lieux de dialogue (déjà créées par CityGenerator.js) — exactes, gratuites.
// 2. Une Box3 par "pièce" de la maquette dont l'empreinte au sol ET la hauteur dépassent un
//    seuil : capture génériquement les bâtiments/tours quel que soit leur nom, exclut le sol/les
//    avenues (plates) et le petit mobilier (bancs, lampadaires, arbres isolés) sans avoir à
//    connaître les ~150 noms de nœuds de la maquette un par un.
import * as THREE from 'three';

const MIN_FOOTPRINT = 6; // m² (x*z) — sous ce seuil : mobilier urbain, pas un obstacle
const MAX_FOOTPRINT = 5000; // m² — au-dessus : dalle de sol/place dont la hauteur dépasse
// MIN_HEIGHT par une erreur d'arrondi flottant (ex. 1.5000000596…) plutôt qu'un vrai bâtiment ;
// le plus grand immeuble de la maquette avoisine 1200 m², une place ou un sol entier des dizaines
// de milliers — la marge est large.
const MIN_HEIGHT = 1.5; // m — sous ce seuil : sol, avenue, dallage
const WORLD_PAD = 6; // marge par rapport au bord réel de la maquette/grille

// `container` est le groupe des tuiles chargées (CityModelLoader.js) — absent en repli
// procédural (buildProceduralCity), auquel cas seules les hitbox des lieux bloquent.
export function computeCityColliders(container, interactables) {
  const colliders = interactables.map((it) => new THREE.Box3().setFromObject(it.hitbox));
  if (!container) return colliders;

  const size = new THREE.Vector3();
  for (const tile of container.children) {
    for (const part of tile.children || []) {
      const box = new THREE.Box3().setFromObject(part);
      box.getSize(size);
      const footprint = size.x * size.z;
      if (footprint > MIN_FOOTPRINT && footprint <= MAX_FOOTPRINT && size.y > MIN_HEIGHT) colliders.push(box);
    }
  }
  return colliders;
}

// Plan schématique vu du dessus, pour la mini-carte (MiniMap.jsx) — classe chaque pièce de la
// maquette par le NOM de son matériau glTF plutôt que par sa géométrie : les 32 noms utilisés dans
// les 6 tuiles (public/models/tiles/) ont été énumérés une fois pour toutes (aucune texture, que
// des couleurs plates nommées côté export Blender), donc l'éventail ci-dessous est exhaustif.
// Contrairement aux collisions ci-dessus, on NE plafonne PAS l'emprise des sols/eau/végétation :
// une grande dalle de route ou une étendue de mer sont légitimement immenses — seul l'amas
// "bâtiment" (matériau non reconnu) reste borné par les mêmes seuils que la collision.
const TERRAIN_MATERIAL_KIND = {
  water: 'water', sea: 'water',
  sand: 'sand',
  grass: 'vegetation', grass_dark: 'vegetation', foliage: 'vegetation', foliage_light: 'vegetation',
  asphalt: 'ground', lane_line: 'ground', pavement: 'ground', plaza_stone: 'ground', court: 'ground',
};
// Mobilier/props sans intérêt pour un plan (trop petits ou mobiles) : ignorés plutôt que
// classés "bâtiment" par défaut.
const SKIP_MATERIALS = new Set([
  'trunk', 'parasol', 'car_paint_a', 'car_paint_b', 'car_paint_c', 'car_paint_d', 'car_glass',
]);
const MIN_PLAN_FOOTPRINT = 3; // m² — sous ce seuil, trop petit pour rester lisible sur 150px

export function computeCityPlan(container) {
  if (!container) return [];
  const shapes = [];
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  for (const tile of container.children) {
    for (const part of tile.children || []) {
      const mat = Array.isArray(part.material) ? part.material[0] : part.material;
      const name = mat?.name;
      if (!name || SKIP_MATERIALS.has(name)) continue;
      const box = new THREE.Box3().setFromObject(part);
      box.getSize(size);
      const footprint = size.x * size.z;
      const terrainKind = TERRAIN_MATERIAL_KIND[name];
      let kind;
      if (terrainKind) {
        if (footprint < MIN_PLAN_FOOTPRINT) continue;
        kind = terrainKind;
      } else {
        if (footprint <= MIN_FOOTPRINT || footprint > MAX_FOOTPRINT || size.y <= MIN_HEIGHT) continue;
        kind = 'building';
      }
      box.getCenter(center);
      shapes.push({ x: center.x, z: center.z, w: size.x, d: size.z, kind });
    }
  }
  return shapes;
}

// Bornes rectangulaires pour ne pas sortir de la ville. `140` = GRID(14) × CELL(10) de
// CityGenerator.js — l'étendue de la grille de repli procédural quand `container` est absent.
export function computeWorldBounds(container) {
  if (container) {
    const box = new THREE.Box3().setFromObject(container);
    return {
      minX: box.min.x + WORLD_PAD, maxX: box.max.x - WORLD_PAD,
      minZ: box.min.z + WORLD_PAD, maxZ: box.max.z - WORLD_PAD,
    };
  }
  const half = 140 / 2 - WORLD_PAD;
  return { minX: -half, maxX: half, minZ: -half, maxZ: half };
}
