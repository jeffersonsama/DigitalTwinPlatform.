// Personnage jouable — le joueur marche dans Al-Wasl au lieu de cliquer pour téléporter la
// caméra. Silhouette humanoïde articulée (tête, torse, bras, jambes) avec un cycle de marche
// animé (balancement des membres proportionnel à la vitesse) et une légère respiration à l'arrêt.
// Collision = disque contre des Box3 (cf. Colliders.js), résolue axe par axe pour un effet de
// glissement le long des murs plutôt qu'un arrêt net.
import * as THREE from 'three';

// Le monde importé est à l'échelle du mètre (une voiture de la maquette ≈ 1,9 × 0,9 × 3,9 unités).
// Le personnage est donc dimensionné comme un humain réel : la silhouette est construite à ~6
// unités puis réduite par PLAYER_SCALE pour culminer à ~1,9 unité — à l'échelle des voitures et
// des trottoirs de la maquette, au lieu du géant précédent.
const PLAYER_SCALE = 0.32;
const SPEED = 9; // unités (≈ mètres) / seconde — allure de course à l'échelle humaine
export const PLAYER_RADIUS = 0.7; // demi-largeur du piéton : passe entre les voitures et sur les trottoirs
const WALK_FREQ = 9; // vitesse du cycle de jambes (radians/seconde à pleine vitesse)
const SWING = 0.7; // amplitude du balancement des membres (radians)

export class PlayerController {
  constructor(color = 0xf2705c) {
    this.position = new THREE.Vector3(0, 0, 0);
    this.facing = 0; // radians — 0 = regarde vers +Z, cohérent avec l'orientation du mesh
    this.inputX = 0;
    this.inputZ = 0;
    this.walkPhase = 0; // phase du cycle de marche, avance avec la vitesse réelle
    this.speed01 = 0; // vitesse normalisée lissée (0 = arrêt, 1 = pleine course) pour l'animation
    const rig = buildMesh(color);
    this.mesh = rig.group;
    // Réduction à l'échelle humaine autour du pivot au sol (y=0) : les pieds restent posés, seule
    // la hauteur passe de ~6 à ~1,9 unité.
    this.mesh.scale.setScalar(PLAYER_SCALE);
    this.parts = rig.parts;
  }

  setColor(color) {
    this.mesh.traverse((o) => {
      if (o.isMesh && o.userData.tint) o.material.color.set(color);
    });
  }

  // `x`/`z` : vecteur monde déjà exprimé par rapport à la vue actuelle (caméra en fps, orientation
  // du personnage en iso — cf. Scene3D.jsx), normalisé côté appelant. Le déplacement suit ainsi
  // toujours le sens de la vue : on ne recale plus `facing` sur la direction de marche (cf.
  // `update`), sans quoi strafer ferait pivoter le personnage et le déplacement dévierait de la
  // vue au lieu de la suivre.
  setMoveInput(x, z) {
    this.inputX = x;
    this.inputZ = z;
  }

  // `turnDelta` : rotation manuelle (radians, déjà mise à l'échelle du delta-temps) — seul moyen
  // de changer `facing` (tourner sur place, cf. Scene3D.jsx) ; marcher ne réoriente plus le
  // personnage tout seul.
  update(dt, colliders, bounds, turnDelta = 0) {
    if (turnDelta) this.facing += turnDelta;

    let dx = this.inputX;
    let dz = this.inputZ;

    const len = Math.hypot(dx, dz);
    const moving = len > 0.001;
    if (moving) {
      dx /= len;
      dz /= len;
      const step = SPEED * dt;
      moveAxis(this.position, 'x', dx * step, colliders, bounds);
      moveAxis(this.position, 'z', dz * step, colliders, bounds);
    }

    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.facing;

    this._animate(dt, Math.min(1, len));
  }

  // Cycle de marche : jambes et bras opposés balancent en sinus ; le buste rebondit légèrement.
  // À l'arrêt, `speed01` retombe vers 0 et les membres reviennent au repos avec une respiration.
  _animate(dt, targetSpeed) {
    // lissage exponentiel pour ne pas figer/relancer brutalement l'animation
    this.speed01 += (targetSpeed - this.speed01) * Math.min(1, dt * 10);
    const p = this.parts;
    if (this.speed01 > 0.01) {
      this.walkPhase += dt * WALK_FREQ * (0.4 + this.speed01 * 0.6);
      const s = Math.sin(this.walkPhase);
      const s2 = Math.sin(this.walkPhase * 2);
      const amp = SWING * this.speed01;
      p.legL.rotation.x = s * amp;
      p.legR.rotation.x = -s * amp;
      p.armL.rotation.x = -s * amp * 0.8;
      p.armR.rotation.x = s * amp * 0.8;
      p.torso.position.y = p.torsoBaseY + Math.abs(s2) * 0.25 * this.speed01;
      p.torso.rotation.z = s * 0.04 * this.speed01;
    } else {
      // retour au repos + respiration douce
      const t = performance.now() / 1000;
      const breathe = Math.sin(t * 1.8) * 0.06;
      p.legL.rotation.x *= 0.8;
      p.legR.rotation.x *= 0.8;
      p.armL.rotation.x = p.armL.rotation.x * 0.8 + breathe * 0.3;
      p.armR.rotation.x = p.armR.rotation.x * 0.8 - breathe * 0.3;
      p.torso.position.y = p.torsoBaseY + breathe * 0.2;
      p.torso.rotation.z *= 0.8;
    }
  }
}

function moveAxis(position, axis, delta, colliders, bounds) {
  const next = position.clone();
  next[axis] += delta;
  next.x = THREE.MathUtils.clamp(next.x, bounds.minX, bounds.maxX);
  next.z = THREE.MathUtils.clamp(next.z, bounds.minZ, bounds.maxZ);
  if (!collides(next, colliders)) position.copy(next);
}

function collides(pos, colliders) {
  for (const box of colliders) {
    if (
      pos.x > box.min.x - PLAYER_RADIUS && pos.x < box.max.x + PLAYER_RADIUS &&
      pos.z > box.min.z - PLAYER_RADIUS && pos.z < box.max.z + PLAYER_RADIUS
    ) {
      return true;
    }
  }
  return false;
}

// Humanoïde stylisé, à l'échelle de l'ancienne silhouette (~5 unités de haut). Les membres
// pivotent depuis leur sommet (géométrie décalée vers le bas dans un pivot Group) pour que la
// rotation `x` du cycle de marche se lise comme une articulation d'épaule/de hanche.
function buildMesh(color) {
  const group = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: 0xe6b98f, roughness: 0.85, metalness: 0 });
  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.05 });
  bodyMat.userData = {}; // (évite de partager le userData du prototype)
  const legMat = new THREE.MeshStandardMaterial({ color: 0x4a4f5c, roughness: 0.8, metalness: 0 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x2c2320, roughness: 0.9, metalness: 0 });

  const markTint = (mesh) => { mesh.userData.tint = true; return mesh; };

  // Jambe pivotée depuis la hanche : géométrie de longueur 2.2 décalée pour que le pivot soit en haut.
  function makeLimb(mat, length, radiusTop, radiusBottom) {
    const pivot = new THREE.Group();
    const geo = new THREE.CylinderGeometry(radiusTop, radiusBottom, length, 10);
    geo.translate(0, -length / 2, 0);
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    pivot.add(m);
    return pivot;
  }

  // Torse
  const torso = new THREE.Group();
  const torsoBaseY = 3.05;
  torso.position.y = torsoBaseY;
  const chest = markTint(new THREE.Mesh(new THREE.CapsuleGeometry(1.05, 1.5, 6, 12), bodyMat));
  chest.castShadow = true;
  torso.add(chest);

  // Tête + cheveux
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.95, 18, 14), skin);
  head.position.y = 1.9;
  head.castShadow = true;
  torso.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(1.0, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.62), hairMat);
  hair.position.y = 2.02;
  torso.add(hair);

  // Bras (pivotent depuis l'épaule), teintés comme le corps
  const armL = makeLimb(bodyMat, 2.1, 0.35, 0.28);
  armL.position.set(-1.25, 1.35, 0);
  markTint(armL.children[0]);
  const armR = makeLimb(bodyMat, 2.1, 0.35, 0.28);
  armR.position.set(1.25, 1.35, 0);
  markTint(armR.children[0]);
  torso.add(armL, armR);

  group.add(torso);

  // Jambes (pivotent depuis la hanche), attachées au groupe racine (elles restent au sol pendant
  // le rebond du torse)
  const legL = makeLimb(legMat, 3.0, 0.45, 0.35);
  legL.position.set(-0.55, 3.05, 0);
  const legR = makeLimb(legMat, 3.0, 0.45, 0.35);
  legR.position.set(0.55, 3.05, 0);
  group.add(legL, legR);

  // Repère de direction — une petite visière sur le front pour lire l'orientation d'un coup d'œil.
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.7, 8), new THREE.MeshStandardMaterial({ color: 0xffe08a, roughness: 0.6 }));
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, 1.85, 0.95);
  torso.add(nose);

  torso.userData.baseY = torsoBaseY;

  return {
    group,
    parts: { torso, torsoBaseY, head, armL, armR, legL, legR },
  };
}
