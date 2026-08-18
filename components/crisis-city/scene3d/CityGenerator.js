// La ville 3D procédurale — spécification section 2.5. Grille 14×14, quartiers typés,
// repères identitaires en primitives composées, lieux de dialogue interactifs (halo + icône).
import * as THREE from 'three';
import { loadCityModel, getModelNodePosition, getCityContainer } from './CityModelLoader.js';
import { LANDMARK_NODES } from './CityModelLandmarks.js';

const GRID = 14;
const CELL = 10;

// Doc n°6 (pivot 2.0), LOI 1 : "la géométrie est universelle" — une seule palette de repli
// procédural pour toute la ville, plus de variante par pays. Palette alignée sur l'identité de
// la plateforme (bleu-navy en base, corail en accent d'activité) plutôt que le grès/ochre d'origine.
const PALETTE_ALWASL = {
  centre: 0x2e4a6e, peripherie: 0x4a6684, activite: 0xc97b62,
  ambiance: 0xd8c4b8, sol: 0x3a4a5e,
};

// Les 14 lieux des deux anciens scénarios coexistent tous sur la ville-monde Al-Wasl (aplati,
// plus de nesting par pays — cf. CityModelLandmarks.js). `cell` ne sert qu'au repli procédural
// (grille 14×14) ; `centre_operationnel` est décalé en [6,7] pour ne pas coïncider avec
// `cellule_crise` en [7,7] (les deux visaient la case centrale dans les specs par-pays d'origine).
export const LANDMARKS = [
  { id: 'agence_bassin', cell: [2, 2], label: 'Agence du bassin' },
  { id: 'palmeraie', cell: [11, 3], label: 'Palmeraie' },
  { id: 'radio', cell: [3, 10], label: 'Radio Aïn Sarra' },
  { id: 'cellule_crise', cell: [7, 7], label: 'Cellule de crise' },
  { id: 'parvis_commune', cell: [7, 4], label: 'Parvis de la commune' },
  { id: 'bureau_coordinateur', cell: [5, 9], label: 'Bureau du coordinateur' },
  { id: 'hopital', cell: [10, 9], label: 'Hôpital provincial' },
  { id: 'conseil_communal', cell: [2, 7], label: 'Conseil communal' },
  { id: 'centre_operationnel', cell: [6, 7], label: 'Centre opérationnel' },
  { id: 'ezbet', cell: [11, 2], label: 'Ezbet El-Sayadin' },
  { id: 'digue_est', cell: [12, 7], label: 'Digue Est' },
  { id: 'ecole_refuge', cell: [4, 10], label: 'École Al-Nahda' },
  { id: 'delta_agricole', cell: [10, 11], label: 'Terres du Delta' },
  { id: 'conseil_gouvernorat', cell: [3, 3], label: 'Conseil du gouvernorat' },
  // Module CANICULE (Doc n°6 §4.3) : seul lieu vraiment nouveau depuis le pivot.
  { id: 'centre_moderne', cell: [9, 3], label: 'Centre moderne' },
];

function cellToWorld([row, col]) {
  return new THREE.Vector3((col - GRID / 2 + 0.5) * CELL, 0, (row - GRID / 2 + 0.5) * CELL);
}

function quartierAt(row, col) {
  const d = Math.max(Math.abs(row - GRID / 2), Math.abs(col - GRID / 2));
  if (d < 3) return 'centre';
  if (d < 5.5) return 'peripherie';
  return 'activite';
}

function buildGenericBuildings() {
  const palette = PALETTE_ALWASL;
  const group = new THREE.Group();
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const byQuartier = { centre: [], peripherie: [], activite: [] };
  const landmarkCells = new Set(LANDMARKS.map((l) => `${l.cell[0]},${l.cell[1]}`));

  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      if (landmarkCells.has(`${row},${col}`)) continue;
      if (Math.random() < 0.12) continue; // place ou voirie
      const quartier = quartierAt(row, col);
      byQuartier[quartier].push([row, col]);
    }
  }

  for (const [quartier, cells] of Object.entries(byQuartier)) {
    if (!cells.length) continue;
    const material = new THREE.MeshLambertMaterial({ color: palette[quartier] });
    const mesh = new THREE.InstancedMesh(geometry, material, cells.length);
    const dummy = new THREE.Object3D();
    cells.forEach(([row, col], i) => {
      const heightBase = quartier === 'activite' ? 6 : quartier === 'centre' ? 4 : 3;
      const h = heightBase + Math.random() * heightBase * 1.4;
      const pos = cellToWorld([row, col]);
      dummy.position.set(pos.x + (Math.random() - 0.5) * 2, h / 2, pos.z + (Math.random() - 0.5) * 2);
      dummy.scale.set(5 + Math.random() * 2, h, 5 + Math.random() * 2);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    group.add(mesh);
  }

  const groundGeo = new THREE.PlaneGeometry(GRID * CELL, GRID * CELL);
  const groundMat = new THREE.MeshLambertMaterial({ color: palette.sol });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.05;
  group.add(ground);

  return group;
}

function landmarkPrimitive(id) {
  const g = new THREE.Group();
  const mat = (color) => new THREE.MeshLambertMaterial({ color });

  switch (id) {
    case 'agence_bassin':
    case 'conseil_communal':
    case 'conseil_gouvernorat':
    case 'centre_operationnel':
    case 'bureau_coordinateur':
    case 'cellule_crise': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(9, 7, 9), mat(0x4a6484));
      base.position.y = 3.5;
      g.add(base);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(7, 2.5, 4), mat(0xd97a5e));
      roof.position.y = 8.2;
      roof.rotation.y = Math.PI / 4;
      g.add(roof);
      break;
    }
    case 'radio': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(7, 6, 7), mat(0x4a6484));
      base.position.y = 3;
      g.add(base);
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 10, 6), mat(0x333333));
      mast.position.y = 11;
      g.add(mast);
      break;
    }
    case 'hopital': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(11, 9, 8), mat(0x7a91ab));
      base.position.y = 4.5;
      g.add(base);
      const crossV = new THREE.Mesh(new THREE.BoxGeometry(1.2, 4, 0.3), mat(0xc0392b));
      crossV.position.set(0, 10, 4.1);
      const crossH = new THREE.Mesh(new THREE.BoxGeometry(4, 1.2, 0.3), mat(0xc0392b));
      crossH.position.set(0, 10, 4.1);
      g.add(crossV, crossH);
      break;
    }
    case 'palmeraie': {
      for (let i = 0; i < 6; i++) {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 5, 6), mat(0x7a5c3e));
        const x = (Math.random() - 0.5) * 8;
        const z = (Math.random() - 0.5) * 8;
        trunk.position.set(x, 2.5, z);
        const leaves = new THREE.Mesh(new THREE.ConeGeometry(2.2, 2.5, 6), mat(0x4c7a3a));
        leaves.position.set(x, 5.5, z);
        g.add(trunk, leaves);
      }
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 6, 10), mat(0x5c7088));
      tower.position.set(-4, 3, -4);
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 2, 10), mat(0x4a6484));
      tank.position.set(-4, 7, -4);
      g.add(tower, tank);
      break;
    }
    case 'parvis_commune': {
      const plaza = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 0.3, 16), mat(0x5c7088));
      plaza.position.y = 0.15;
      const facade = new THREE.Mesh(new THREE.BoxGeometry(10, 8, 3), mat(0x6a86a6));
      facade.position.set(0, 4, -6);
      g.add(plaza, facade);
      break;
    }
    case 'ezbet': {
      for (let i = 0; i < 8; i++) {
        const h = new THREE.Mesh(new THREE.BoxGeometry(3, 2.4, 3), mat(0x6a86a6));
        h.position.set((Math.random() - 0.5) * 9, 1.2, (Math.random() - 0.5) * 9);
        g.add(h);
      }
      const boat = new THREE.Mesh(new THREE.ConeGeometry(1, 4, 4), mat(0x5a4632));
      boat.rotation.z = Math.PI / 2;
      boat.position.set(6, 0.6, 6);
      g.add(boat);
      break;
    }
    case 'digue_est': {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(24, 3, 3), mat(0x5c7088));
      wall.position.y = 1.5;
      g.add(wall);
      break;
    }
    case 'ecole_refuge': {
      const base = new THREE.Mesh(new THREE.BoxGeometry(10, 6, 8), mat(0x7a91ab));
      base.position.y = 3;
      g.add(base);
      break;
    }
    case 'delta_agricole': {
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 4; j++) {
          const salin = (i + j) % 3 === 0;
          const field = new THREE.Mesh(new THREE.BoxGeometry(2, 0.15, 2), mat(salin ? 0xdedad0 : 0x5f8a4a));
          field.position.set(-8 + i * 3.2, 0.1, -6 + j * 3.2);
          g.add(field);
        }
      }
      break;
    }
    case 'centre_moderne': {
      const tower = new THREE.Mesh(new THREE.BoxGeometry(6, 18, 6), mat(0x8fa3ad));
      tower.position.y = 9;
      g.add(tower);
      const annex = new THREE.Mesh(new THREE.BoxGeometry(5, 10, 5), mat(0x9db0b8));
      annex.position.set(6, 5, 2);
      g.add(annex);
      break;
    }
    default: {
      const base = new THREE.Mesh(new THREE.BoxGeometry(8, 6, 8), mat(0x4a6484));
      base.position.y = 3;
      g.add(base);
    }
  }
  return g;
}

// Halo pulsant + icône flottante + hitbox élargie (risque « tap imprécis », registre des
// risques 9.2) : repérage et interaction d'un lieu de dialogue, quelle que soit la source
// des visuels de décor (primitives procédurales ou maquette importée).
function addInteractable(group, landmark, pos, interactables) {
  const halo = new THREE.Mesh(
    new THREE.RingGeometry(4.6, 5.4, 24),
    new THREE.MeshBasicMaterial({ color: 0xffd35c, transparent: true, opacity: 0.8, side: THREE.DoubleSide })
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.set(pos.x, 0.2, pos.z);
  group.add(halo);

  const icon = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.9, 0),
    new THREE.MeshBasicMaterial({ color: 0xffe08a })
  );
  icon.position.set(pos.x, 10, pos.z);
  group.add(icon);

  const hitbox = new THREE.Mesh(
    new THREE.BoxGeometry(10.5, 16, 10.5),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hitbox.position.set(pos.x, 6, pos.z);
  hitbox.userData.lieu3d = landmark.id;
  hitbox.userData.label = landmark.label;
  group.add(hitbox);

  interactables.push({ lieu3d: landmark.id, label: landmark.label, hitbox, halo, icon, worldPosition: new THREE.Vector3(pos.x, 4, pos.z) });
}

function buildProceduralCity(scene) {
  const group = new THREE.Group();
  group.add(buildGenericBuildings());

  const interactables = [];
  for (const landmark of LANDMARKS) {
    const pos = cellToWorld(landmark.cell);
    const primitive = landmarkPrimitive(landmark.id);
    primitive.position.copy(pos);
    group.add(primitive);
    addInteractable(group, landmark, pos, interactables);
  }

  scene.add(group);
  return { group, interactables, container: null };
}

async function buildCityFromModel(scene, onProgress) {
  const group = new THREE.Group();
  // Le conteneur est attaché tout de suite (même vide) : les tuiles chargées par
  // loadCityModel() s'y ajoutent au fur et à mesure et apparaissent donc progressivement
  // à l'écran, plutôt que d'attendre que toute la maquette soit chargée.
  const container = getCityContainer();
  group.add(container);
  scene.add(group);

  try {
    await loadCityModel(onProgress);
    const interactables = [];
    for (const landmark of LANDMARKS) {
      const nodeName = LANDMARK_NODES[landmark.id];
      const pos = getModelNodePosition(container, nodeName);
      addInteractable(group, landmark, pos, interactables);
    }
    return { group, interactables, container };
  } catch (err) {
    // Ne pas laisser à la fois le groupe (partiel/cassé) et le repli procédural attachés
    // à la scène — le conteneur partagé lui-même reste intact pour une éventuelle nouvelle
    // tentative (changement de module), seul ce groupe raté est nettoyé.
    scene.remove(group);
    group.remove(container);
    throw err;
  }
}

// La maquette (public/models/tiles/, ~13 Mo au total, cf. scripts/splitCityModel.mjs) est la
// ville-monde Al-Wasl (Doc n°6) : chargée tuile par tuile pour éviter un pic de RAM/CPU au
// démarrage ; en cas d'échec (réseau, fichier absent) on retombe sur les primitives générées en
// code pour ne jamais laisser la scène vide.
export async function buildCity(scene, onProgress) {
  try {
    return await buildCityFromModel(scene, onProgress);
  } catch (err) {
    console.error('CityGenerator: échec du chargement de la maquette 3D, retour au décor procédural.', err);
    return buildProceduralCity(scene);
  }
}
