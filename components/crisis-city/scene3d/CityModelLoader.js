// Charge la maquette 3D par tuiles (public/models/tiles/, générées par scripts/splitCityModel.mjs
// depuis source-assets/maquette-ville.glb, ~13 Mo) plutôt qu'en un seul bloc : un fetch+parse
// séquentiel de 6 fichiers de ~1-3 Mo évite le pic de RAM/CPU d'un unique parse JSON de 6 Mo +
// construction de 5600+ Object3D d'un coup, qui pouvait faire échouer le chargement sur des
// machines modestes. Bonus : la ville apparaît progressivement tuile par tuile.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const TILE_COUNT = 6;
const TILE_URLS = Array.from({ length: TILE_COUNT }, (_, i) => `/models/tiles/maquette-ville-${i}.glb`);

// Matériaux glTF des voitures garées dans la maquette (cf. Colliders.js#SKIP_MATERIALS, qui les
// excluait déjà du plan de mini-carte) — retirées de la scène 3D elle-même à la demande produit.
const CAR_MATERIALS = new Set(['car_paint_a', 'car_paint_b', 'car_paint_c', 'car_paint_d', 'car_glass']);

function stripCars(root) {
  const toRemove = [];
  root.traverse((obj) => {
    if (!obj.isMesh) return;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    if (mats.some((m) => m && CAR_MATERIALS.has(m.name))) toRemove.push(obj);
  });
  for (const obj of toRemove) obj.parent?.remove(obj);
}

const loader = new GLTFLoader();
let container = null;
let modelPromise = null;
let tilesLoaded = 0;
const progressListeners = new Set();

// Le même conteneur est réutilisé entre les scènes Maroc/Égypte (Object3D.add() le détache
// automatiquement de son ancien parent) : disponible immédiatement, même vide, pour qu'on puisse
// l'attacher à la scène avant la fin du chargement et voir les tuiles apparaître au fur et à mesure.
export function getCityContainer() {
  if (!container) {
    container = new THREE.Group();
    container.userData.nodesByName = new Map();
  }
  return container;
}

function indexNodes(root) {
  const nodesByName = getCityContainer().userData.nodesByName;
  root.traverse((obj) => {
    if (!obj.name) return;
    if (!nodesByName.has(obj.name)) nodesByName.set(obj.name, []);
    nodesByName.get(obj.name).push(obj);
  });
}

// `onTileLoaded(loaded, total)` est appelé après chaque tuile insérée dans le conteneur partagé —
// utile pour afficher une progression ("3/6") pendant le chargement initial. Plusieurs appelants
// peuvent s'enregistrer (ex. React StrictMode monte l'effet deux fois, ou l'utilisateur change de
// pays pendant le premier chargement) : on ne garde pas qu'un seul callback lié à la création de
// la promesse, sinon les appelants suivants restent muets pendant tout le chargement.
export function loadCityModel(onTileLoaded) {
  if (onTileLoaded) {
    progressListeners.add(onTileLoaded);
    if (tilesLoaded > 0) onTileLoaded(tilesLoaded, TILE_URLS.length);
  }

  if (!modelPromise) {
    const target = getCityContainer();
    modelPromise = (async () => {
      for (let i = 0; i < TILE_URLS.length; i++) {
        const gltf = await loader.loadAsync(TILE_URLS[i]);
        const tile = gltf.scene;
        tile.updateMatrixWorld(true);
        stripCars(tile);
        indexNodes(tile);
        target.add(tile);
        tilesLoaded = i + 1;
        progressListeners.forEach((fn) => fn(tilesLoaded, TILE_URLS.length));
      }
      return target;
    })().catch((err) => {
      // Une tuile en échec ne doit pas condamner tout le reste de la session : on nettoie les
      // tuiles déjà ajoutées pour que la prochaine tentative (ex. changement de pays) reparte
      // de zéro plutôt que de dupliquer les tuiles déjà chargées ou de rester bloquée pour
      // toujours sur cette promesse rejetée.
      modelPromise = null;
      tilesLoaded = 0;
      target.clear();
      target.userData.nodesByName.clear();
      throw err;
    });
  }
  return modelPromise;
}

// Position monde d'un nœud nommé de la maquette. GLTFLoader désambiguïse déjà les noms
// dupliqués côté three.js (suffixes "_1", "_2"...), donc chaque nom restant est unique ici.
export function getModelNodePosition(model, name) {
  const matches = model.userData.nodesByName.get(name);
  if (!matches) {
    throw new Error(`CityModelLoader: nœud "${name}" introuvable dans la maquette.`);
  }
  return matches[0].getWorldPosition(new THREE.Vector3());
}
