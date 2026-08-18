// Deux caméras au choix du joueur (bouton "Vue" / touche V, cf. Scene3D.jsx), pas de rechargement
// entre les deux :
// - 'fps'  : 3e personne en perspective, orbite librement autour du joueur (glisser souris/doigt
//            ou flèches gauche/droite, molette pour le recul) — cadrage proche de l'iso au départ
//            (même azimut/élévation) mais en perspective, avec une caméra qui tourne au lieu d'être
//            verrouillée. Personnage visible, WASD avance dans la direction actuellement regardée.
// - 'iso'  : orbite isométrique fixe (45°/35°, orthographique) qui suit le joueur de haut — vue
//            d'ensemble, personnage visible, zoom à la molette, pas de rotation libre.
// Une seule caméra active à la fois (`getActiveCamera`) ; les deux instances Three.js existent en
// permanence (Perspective/Orthographic ne se convertissent pas l'une en l'autre) pour un bascule
// instantané sans reconstruire de contexte WebGL.
import * as THREE from 'three';

// Hauteur du point visé par l'orbite (tête/poitrine du piéton, cf. PlayerController) — pas la
// position de la caméra elle-même : elle orbite à `orbitDistance` autour de ce point.
const TARGET_HEIGHT = 1.6;
const LOOK_SPEED = 0.0035; // radians par pixel glissé, en mode fps
const PITCH_MIN = 0.12; // ~7°, quasi à hauteur du sujet
const PITCH_MAX = 1.45; // ~83°, quasi à la verticale sans y être tout à fait (évite le gimbal lock)

const ORBIT_DISTANCE_DEFAULT = 11; // recul en unités (≈ mètres) — cadrage proche de l'iso rapproché
const ORBIT_DISTANCE_MIN = 5;
const ORBIT_DISTANCE_MAX = 26;
const ORBIT_ZOOM_STEP = 0.02; // unités de recul par pixel de molette

const ISO_AZIMUTH = Math.PI / 4; // 45°
const ISO_ELEVATION = Math.atan(1 / Math.sqrt(2)); // ~35.264° — élévation isométrique "vraie"
const ISO_DISTANCE = 90;
// Cadrage isométrique rapproché pour l'échelle humaine : on veut voir le piéton parmi les
// voitures et les trottoirs, pas un plan large où il ne ferait qu'un point.
const ISO_VIEW_SIZE = 18; // demi-hauteur du frustum orthographique, en unités monde
const ISO_ZOOM_MIN = 0.6;
const ISO_ZOOM_MAX = 2.2;
const ISO_ZOOM_STEP = 0.0015;
const ISO_DIR = new THREE.Vector3(
  Math.cos(ISO_ELEVATION) * Math.sin(ISO_AZIMUTH),
  Math.sin(ISO_ELEVATION),
  Math.cos(ISO_ELEVATION) * Math.cos(ISO_AZIMUTH)
).normalize();

function easeInOutCubic(t) {
  return t * t * (3 - 2 * t);
}

export class CameraRig {
  constructor(domElement, initialMode = 'fps') {
    this.domElement = domElement;
    this.mode = initialMode;
    this.eyePosition = null;
    this.nudge = null; // { kind: 'fps'|'iso', ... } — annulé au changement de mode ou de cadrage manuel

    this.fpsCamera = new THREE.PerspectiveCamera(75, 1, 0.15, 700);
    // Démarre au même azimut/élévation que l'iso ("presque la même vue") — seule la projection et
    // la liberté de rotation diffèrent ensuite.
    this.yaw = ISO_AZIMUTH;
    this.pitch = ISO_ELEVATION;
    this.orbitDistance = ORBIT_DISTANCE_DEFAULT;
    this._orbitTarget = new THREE.Vector3();
    this._orbitOffset = new THREE.Vector3();

    this.isoCamera = new THREE.OrthographicCamera(-ISO_VIEW_SIZE, ISO_VIEW_SIZE, ISO_VIEW_SIZE, -ISO_VIEW_SIZE, 1, 500);
    this.isoCamera.zoom = ISO_ZOOM_MAX;
    this.isoCamera.updateProjectionMatrix();
    this.isoLookTarget = new THREE.Vector3();

    this._activePointerId = null;
    this._lastX = 0;
    this._lastY = 0;
    this.onPointerDown = (ev) => {
      if (this.mode !== 'fps') return;
      if (this._activePointerId !== null) return; // ignore un second doigt/bouton simultané
      if (ev.pointerType === 'mouse' && ev.button !== 0) return;
      this._activePointerId = ev.pointerId;
      this._lastX = ev.clientX;
      this._lastY = ev.clientY;
    };
    this.onPointerMove = (ev) => {
      if (ev.pointerId !== this._activePointerId) return;
      const dx = ev.clientX - this._lastX;
      const dy = ev.clientY - this._lastY;
      this._lastX = ev.clientX;
      this._lastY = ev.clientY;
      this.yaw -= dx * LOOK_SPEED;
      this.pitch = THREE.MathUtils.clamp(this.pitch - dy * LOOK_SPEED, PITCH_MIN, PITCH_MAX);
      this.nudge = null; // un glissé manuel annule un cadrage automatique en cours
    };
    this.onPointerEnd = (ev) => {
      if (ev.pointerId === this._activePointerId) this._activePointerId = null;
    };
    this.onWheel = (ev) => {
      ev.preventDefault();
      if (this.mode === 'iso') {
        const next = this.isoCamera.zoom - ev.deltaY * ISO_ZOOM_STEP;
        this.isoCamera.zoom = THREE.MathUtils.clamp(next, ISO_ZOOM_MIN, ISO_ZOOM_MAX);
        this.isoCamera.updateProjectionMatrix();
      } else {
        const next = this.orbitDistance + ev.deltaY * ORBIT_ZOOM_STEP;
        this.orbitDistance = THREE.MathUtils.clamp(next, ORBIT_DISTANCE_MIN, ORBIT_DISTANCE_MAX);
      }
    };
    this.domElement.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerEnd);
    window.addEventListener('pointercancel', this.onPointerEnd);
    this.domElement.addEventListener('wheel', this.onWheel, { passive: false });
  }

  getMode() {
    return this.mode;
  }

  // Bascule immédiate, sans transition animée (un bouton/touche de bascule doit répondre tout de
  // suite) : en passant en iso, le point de visée saute directement sur le joueur pour ne pas
  // laisser un ancien cadrage (ex. resté au point de spawn si le joueur a marché en fps) provoquer
  // un survol parasite avant de rattraper sa cible.
  setMode(mode) {
    if (this.mode === mode) return;
    this.mode = mode;
    this.nudge = null;
    this._activePointerId = null;
    if (mode === 'iso' && this.eyePosition) this.isoLookTarget.copy(this.eyePosition);
  }

  getActiveCamera() {
    return this.mode === 'iso' ? this.isoCamera : this.fpsCamera;
  }

  resize(width, height) {
    const aspect = width / height;
    this.fpsCamera.aspect = aspect;
    this.fpsCamera.updateProjectionMatrix();
    this.isoCamera.left = -ISO_VIEW_SIZE * aspect;
    this.isoCamera.right = ISO_VIEW_SIZE * aspect;
    this.isoCamera.top = ISO_VIEW_SIZE;
    this.isoCamera.bottom = -ISO_VIEW_SIZE;
    this.isoCamera.updateProjectionMatrix();
  }

  // Tour au clavier (flèches gauche/droite, cf. Scene3D.jsx) — orbite la caméra en fps (comme un
  // glissé), tourne le personnage sur place en iso (géré côté Scene3D.jsx via `turnDelta`).
  turn(deltaYaw) {
    if (!deltaYaw || this.mode !== 'fps') return;
    this.yaw += deltaYaw;
    this.nudge = null;
  }

  // Position du joueur suivie par l'orbite (fps) ou par le point de visée à distance (iso).
  setFollowTarget(vector3) {
    this.eyePosition = vector3;
  }

  // Cadrage ponctuel vers un PNJ à l'ouverture d'un dialogue, adapté au mode actif : pivote
  // l'orbite (fps) ou décale le point de visée (iso).
  nudgeTo(lookAtPosition, duration = 400) {
    if (!this.eyePosition) return;
    if (this.mode === 'iso') {
      this.nudge = {
        kind: 'iso',
        startTarget: this.isoLookTarget.clone(),
        endTarget: lookAtPosition.clone(),
        t0: performance.now(),
        duration,
      };
      return;
    }
    const dummy = new THREE.Object3D();
    dummy.position.set(this.eyePosition.x, TARGET_HEIGHT, this.eyePosition.z);
    dummy.rotation.order = 'YXZ';
    dummy.lookAt(lookAtPosition.x, lookAtPosition.y, lookAtPosition.z);
    // `this.yaw` s'accumule sans être ramené dans [-π, π] (cf. onPointerMove) ; on choisit ici
    // l'équivalent de targetYaw (mod 2π) le plus proche pour que le lerp tourne du bon côté au
    // lieu de faire un ou plusieurs tours complets superflus.
    const twoPi = Math.PI * 2;
    let targetYaw = dummy.rotation.y;
    targetYaw += Math.round((this.yaw - targetYaw) / twoPi) * twoPi;
    this.nudge = {
      kind: 'fps',
      startYaw: this.yaw,
      startPitch: this.pitch,
      targetYaw,
      targetPitch: THREE.MathUtils.clamp(dummy.rotation.x, PITCH_MIN, PITCH_MAX),
      t0: performance.now(),
      duration,
    };
  }

  update() {
    if (this.mode === 'iso') this._updateIso();
    else this._updateFps();
  }

  _updateFps() {
    if (this.nudge?.kind === 'fps') {
      const t = Math.min(1, (performance.now() - this.nudge.t0) / this.nudge.duration);
      const e = easeInOutCubic(t);
      this.yaw = THREE.MathUtils.lerp(this.nudge.startYaw, this.nudge.targetYaw, e);
      this.pitch = THREE.MathUtils.lerp(this.nudge.startPitch, this.nudge.targetPitch, e);
      if (t >= 1) this.nudge = null;
    }
    if (!this.eyePosition) return;
    // Orbite en coordonnées sphériques autour d'un point à hauteur de tête/poitrine du joueur —
    // même principe que l'iso (position = cible + direction × distance, lookAt la cible) mais
    // yaw/pitch/distance sont ici libres (glisser, flèches, molette) au lieu d'être figés.
    this._orbitTarget.set(this.eyePosition.x, this.eyePosition.y + TARGET_HEIGHT, this.eyePosition.z);
    this._orbitOffset
      .set(Math.cos(this.pitch) * Math.sin(this.yaw), Math.sin(this.pitch), Math.cos(this.pitch) * Math.cos(this.yaw))
      .multiplyScalar(this.orbitDistance);
    this.fpsCamera.position.copy(this._orbitTarget).add(this._orbitOffset);
    this.fpsCamera.lookAt(this._orbitTarget);
  }

  _updateIso() {
    if (this.nudge?.kind === 'iso') {
      const t = Math.min(1, (performance.now() - this.nudge.t0) / this.nudge.duration);
      this.isoLookTarget.lerpVectors(this.nudge.startTarget, this.nudge.endTarget, easeInOutCubic(t));
      if (t >= 1) this.nudge = null;
    } else if (this.eyePosition) {
      this.isoLookTarget.lerp(this.eyePosition, 0.12);
    }
    this.isoCamera.position.copy(this.isoLookTarget).addScaledVector(ISO_DIR, ISO_DISTANCE);
    this.isoCamera.lookAt(this.isoLookTarget);
  }

  dispose() {
    this.domElement.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerEnd);
    window.removeEventListener('pointercancel', this.onPointerEnd);
    this.domElement.removeEventListener('wheel', this.onWheel);
  }
}
