import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { buildCity } from '../scene3d/CityGenerator.js';
import { CrisisFX, animateHalos } from '../scene3d/CrisisFX.js';
import { CameraRig } from '../scene3d/CameraRig.js';
import { PlayerController } from '../scene3d/PlayerController.js';
import { computeCityColliders, computeCityPlan, computeWorldBounds } from '../scene3d/Colliders.js';
import City2D from './City2D.jsx';
import TouchJoystick from './TouchJoystick.jsx';
import MiniMap from './MiniMap.jsx';

const INTERACT_RADIUS = 10;
const TURN_SPEED = 2.2; // radians/seconde — tourner sur place (flèches gauche/droite)
const DEFAULT_BOUNDS = { minX: -60, maxX: 60, minZ: -60, maxZ: 60 };

function pct(value, min, max) {
  return ((value - min) / (max - min)) * 100;
}

function webglAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
}

// Flèches et WASD divergent volontairement : WASD (avec les flèches haut/bas) avance/recule/
// strafe comme un FPS classique ; flèches gauche/droite tournent sur place (cf. TURN_SPEED) au
// lieu de strafer — un moyen dédié de se réorienter sans se déplacer.
const KEY_MAP = {
  ArrowUp: 'forward', KeyW: 'forward',
  ArrowDown: 'back', KeyS: 'back',
  KeyA: 'left',
  KeyD: 'right',
  ArrowLeft: 'turnLeft',
  ArrowRight: 'turnRight',
};

export default function Scene3D({ pays, resources, acteIndex, activeLieux, doneLieux, onSelectLieu, cosmetic, pack, movementEnabled }) {
  const mountRef = useRef(null);
  const stateRef = useRef({});
  const joystickRef = useRef({ x: 0, y: 0 });
  const minimapPlayerRef = useRef(null);
  const [failed, setFailed] = useState(!webglAvailable());
  const [cityLoading, setCityLoading] = useState(true);
  const [cityProgress, setCityProgress] = useState(null);
  const [nearby, setNearby] = useState(null); // { lieu3d, label } — le lieu à portée d'interaction
  const [minimapBase, setMinimapBase] = useState([]); // positions monde (fixes) de tous les lieux, calculées une fois la ville chargée
  const [worldBounds, setWorldBounds] = useState(DEFAULT_BOUNDS);
  const [cityPlan, setCityPlan] = useState([]); // silhouettes bâtiments/eau/végétation/sol pour le fond de la mini-carte
  const [viewMode, setViewModeReact] = useState('fps'); // 'fps' | 'iso' — reflet React de CameraRig.mode, pour le libellé du bouton

  // Sous-ensemble pertinent pour l'acte en cours (actifs + déjà faits) — recalculé seulement
  // quand ces listes changent (rare : après un choix), jamais par image.
  const minimapMarkers = useMemo(
    () =>
      minimapBase
        .filter((m) => activeLieux.includes(m.lieu3d) || doneLieux.includes(m.lieu3d))
        .map((m) => ({ ...m, done: doneLieux.includes(m.lieu3d) })),
    [minimapBase, activeLieux, doneLieux]
  );

  useEffect(() => {
    if (failed) return undefined;
    const mount = mountRef.current;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    } catch (e) {
      setFailed(true);
      return undefined;
    }
    const scene = new THREE.Scene();
    const skyColor = new THREE.Color(pays === 'maroc' ? 0xf4e3c1 : 0xdfeef2);
    scene.background = skyColor;
    // Brume atténuée vers l'horizon : donne de la profondeur à la grille et masque en douceur le
    // bord du monde / le chargement progressif des tuiles au loin.
    scene.fog = new THREE.Fog(skyColor, 120, 320);

    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    // Éclairage : ciel/sol doux en base + soleil chaud directionnel projetant des ombres nettes,
    // + une lumière d'appoint froide côté opposé pour décoller les façades à l'ombre.
    const hemi = new THREE.HemisphereLight(0xfff4e0, 0x5a4a38, 0.75);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xfff2d8, 1.5);
    sun.position.set(70, 110, 50);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.4;
    const sc = sun.shadow.camera;
    sc.near = 10;
    sc.far = 320;
    sc.left = -110; sc.right = 110; sc.top = 110; sc.bottom = -110;
    sc.updateProjectionMatrix();
    scene.add(sun);
    scene.add(sun.target);
    const fill = new THREE.DirectionalLight(0xbcd4ff, 0.35);
    fill.position.set(-50, 40, -30);
    scene.add(fill);

    const player = new PlayerController(pack?.couleurs?.accent || 0xd9a253);
    scene.add(player.mesh); // visible en iso comme en fps : les deux vues sont désormais à la 3e personne
    const initialMode = 'fps';
    setViewModeReact(initialMode); // resynchronise le libellé du bouton si l'effet est reconstruit (ex. changement de `pays`) après un bascule iso précédente

    let interactables = [];
    let colliders = [];
    let bounds = DEFAULT_BOUNDS;
    let cancelled = false;
    setCityLoading(true);
    setCityProgress(null);
    setMinimapBase([]);
    setCityPlan([]);
    setWorldBounds(DEFAULT_BOUNDS);
    buildCity(scene, (loaded, total) => {
      if (!cancelled) setCityProgress({ loaded, total });
    }).then((result) => {
      if (cancelled) return;
      interactables = result.interactables;
      stateRef.current.interactables = interactables;
      // Ombres sur le décor : les surfaces éclairées (Lambert/Standard) projettent et reçoivent
      // les ombres du soleil ; on ignore les matériaux « plats » (halos, icônes, hitbox invisible)
      // qui ne sont pas concernés par la lumière.
      result.group.traverse((o) => {
        if (!o.isMesh) return;
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        const lit = mats.some((m) => m && (m.isMeshStandardMaterial || m.isMeshLambertMaterial || m.isMeshPhongMaterial));
        if (!lit) return;
        o.castShadow = true;
        o.receiveShadow = true;
      });
      colliders = computeCityColliders(result.container, interactables);
      bounds = computeWorldBounds(result.container);
      for (const it of interactables) {
        it.halo.visible = activeLieux.includes(it.lieu3d);
        it.icon.visible = activeLieux.includes(it.lieu3d);
        it.halo.material.color.set(doneLieux.includes(it.lieu3d) ? 0x8fbf8f : 0xffd35c);
      }
      if (typeof window !== 'undefined') window.__city = result.container; // [v0] sonde temporaire
      setMinimapBase(interactables.map((it) => ({ lieu3d: it.lieu3d, label: it.label, x: it.worldPosition.x, z: it.worldPosition.z })));
      setWorldBounds(bounds);
      setCityPlan(computeCityPlan(result.container));
      setCityLoading(false);
    });
    const fx = new CrisisFX(scene, pays);
    // CameraRig écoute lui-même les événements pointer sur renderer.domElement pour le regard
    // libre en fps (glisser) — plus de "clic pour marcher" : glisser sert à regarder autour de
    // soi, ça entrerait en conflit avec un raycast-vers-la-cible au pointerdown.
    const rig = new CameraRig(renderer.domElement, initialMode);

    function setViewMode(mode) {
      rig.setMode(mode);
      setViewModeReact(mode);
    }

    function resize() {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      rig.resize(w, h);
      renderer.setSize(w, h);
    }
    resize();
    window.addEventListener('resize', resize);

    // Clavier — actif seulement quand `movementEnabled` (pas pendant un dialogue/feedback en
    // arrière-plan, cf. le garde dans le tick ci-dessous). `preventDefault` sur les flèches pour
    // ne pas faire défiler la page.
    const keys = { forward: false, back: false, left: false, right: false, turnLeft: false, turnRight: false };
    function onKeyDown(ev) {
      const dir = KEY_MAP[ev.code];
      if (dir) {
        keys[dir] = true;
        ev.preventDefault();
        return;
      }
      if (!stateRef.current.movementEnabled) return;
      if (ev.code === 'KeyE' || ev.code === 'Enter' || ev.code === 'Space' || ev.code === 'KeyX') {
        ev.preventDefault();
        triggerInteract();
      } else if (ev.code === 'KeyV') {
        setViewMode(rig.getMode() === 'iso' ? 'fps' : 'iso');
      }
    }
    function onKeyUp(ev) {
      const dir = KEY_MAP[ev.code];
      if (dir) keys[dir] = false;
    }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    function triggerInteract() {
      const target = stateRef.current.nearbyTarget;
      if (!target) return;
      rig.nudgeTo(target.worldPosition, 400);
      clearTimeout(stateRef.current.interactTimeout);
      stateRef.current.interactTimeout = setTimeout(() => {
        stateRef.current.onSelectLieu(target.lieu3d, target.label);
      }, 380);
    }

    const forward3 = new THREE.Vector3();
    const right3 = new THREE.Vector3();

    let raf;
    const clockRef = { t: 0 };
    let last = performance.now();
    function tick(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      clockRef.t += dt;
      fx.animate(dt);
      animateHalos(interactables, clockRef.t);

      let turnDelta = 0;
      if (stateRef.current.movementEnabled) {
        let inForward = (keys.forward ? 1 : 0) - (keys.back ? 1 : 0) - joystickRef.current.y;
        let inStrafe = (keys.right ? 1 : 0) - (keys.left ? 1 : 0) + joystickRef.current.x;
        const mag = Math.hypot(inForward, inStrafe);
        if (mag > 1) { inForward /= mag; inStrafe /= mag; }

        // Le déplacement suit toujours la vue actuelle, jamais un repère figé : en fps la caméra
        // (orbite libre) ; en iso l'orientation du personnage (tourné sur place aux flèches, cf.
        // plus bas) — jamais l'angle fixe de la caméra isométrique elle-même, sans quoi marcher
        // dévierait de ce que montre la vue dès qu'on a tourné sur place.
        const isFps = rig.getMode() === 'fps';
        if (isFps) {
          rig.getActiveCamera().getWorldDirection(forward3);
          forward3.y = 0;
          forward3.normalize();
        } else {
          forward3.set(Math.sin(player.facing), 0, Math.cos(player.facing));
        }
        right3.set(-forward3.z, 0, forward3.x);

        const moveX = forward3.x * inForward + right3.x * inStrafe;
        const moveZ = forward3.z * inForward + right3.z * inStrafe;
        player.setMoveInput(moveX, moveZ);

        // En vue 3D (orbite libre), le personnage se tourne vers la direction de marche relative
        // à la caméra dès qu'on avance/strafe — la caméra, elle, peut orbiter librement autour de
        // lui à l'arrêt (glisser/flèches) sans le faire pivoter tant qu'on ne marche pas.
        if (isFps && (inForward !== 0 || inStrafe !== 0)) {
          player.facing = Math.atan2(moveX, moveZ);
        }

        // Tourner sur place (flèches gauche/droite) : pivote le personnage en iso (visible, 3e
        // personne) ou directement le regard en fps (pas de personnage visible à faire pivoter).
        const turnInput = (keys.turnRight ? 1 : 0) - (keys.turnLeft ? 1 : 0);
        if (turnInput) {
          if (rig.getMode() === 'iso') turnDelta = turnInput * TURN_SPEED * dt;
          else rig.turn(turnInput * TURN_SPEED * dt);
        }
      } else {
        player.setMoveInput(0, 0);
      }
      player.update(dt, colliders, bounds, turnDelta);
      rig.setFollowTarget(player.position);
      rig.update();

      // Position du point joueur sur la mini-carte — écrite directement en style DOM (pas de
      // setState) puisque ça bouge à chaque image, cf. le commentaire de MiniMap.jsx.
      if (minimapPlayerRef.current) {
        minimapPlayerRef.current.style.left = `${pct(player.position.x, bounds.minX, bounds.maxX)}%`;
        minimapPlayerRef.current.style.top = `${pct(player.position.z, bounds.minZ, bounds.maxZ)}%`;
      }

      // Lieu de dialogue le plus proche à portée — recalculé chaque frame mais l'état React
      // n'est mis à jour que si la cible change (évite un re-render à 60 im/s).
      let closest = null;
      let closestDist = INTERACT_RADIUS;
      for (const it of interactables) {
        const d = Math.hypot(it.worldPosition.x - player.position.x, it.worldPosition.z - player.position.z);
        if (d < closestDist) { closestDist = d; closest = it; }
      }
      if (stateRef.current.nearbyTarget?.lieu3d !== closest?.lieu3d) {
        stateRef.current.nearbyTarget = closest;
        setNearby(closest ? { lieu3d: closest.lieu3d, label: closest.label } : null);
      }

      renderer.render(scene, rig.getActiveCamera());
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    stateRef.current = { fx, interactables, onSelectLieu, resize, rig, movementEnabled, triggerInteract, setViewMode };

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      clearTimeout(stateRef.current.interactTimeout);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      rig.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pays, failed]);

  useEffect(() => {
    stateRef.current.onSelectLieu = onSelectLieu;
  }, [onSelectLieu]);

  useEffect(() => {
    stateRef.current.movementEnabled = movementEnabled;
    if (!movementEnabled) setNearby(null);
  }, [movementEnabled]);

  useEffect(() => {
    if (stateRef.current.fx) stateRef.current.fx.update({ resources, acteIndex, cosmetic });
    if (stateRef.current.interactables) {
      for (const it of stateRef.current.interactables) {
        const active = activeLieux.includes(it.lieu3d);
        const done = doneLieux.includes(it.lieu3d);
        it.halo.visible = active;
        it.icon.visible = active;
        it.halo.material.color.set(done ? 0x8fbf8f : 0xffd35c);
      }
    }
  }, [resources, acteIndex, activeLieux, doneLieux, cosmetic]);

  if (failed) {
    return <City2D pack={pack} activeLieux={activeLieux} doneLieux={doneLieux} onSelectLieu={onSelectLieu} />;
  }

  return (
    <>
      <div ref={mountRef} className="scene3d-mount" />
      {cityLoading && (
        <div className="scene3d-loading">
          Chargement de la ville{cityProgress ? ` (${cityProgress.loaded}/${cityProgress.total})` : '…'}
        </div>
      )}
      {movementEnabled && !cityLoading && (
        <TouchJoystick onMove={(x, y) => { joystickRef.current = { x, y }; }} />
      )}
      {movementEnabled && !cityLoading && (
        <button
          className="btn-secondary scene3d-view-toggle"
          title="Changer de vue (touche V)"
          onClick={() => stateRef.current.setViewMode?.(viewMode === 'iso' ? 'fps' : 'iso')}
        >
          {viewMode === 'iso' ? '🧍 Vue 3D' : '🗺️ Vue iso'}
        </button>
      )}
      {movementEnabled && !cityLoading && (
        <MiniMap markers={minimapMarkers} plan={cityPlan} bounds={worldBounds} playerDotRef={minimapPlayerRef} />
      )}
      {movementEnabled && nearby && (
        <button
          key={nearby.lieu3d}
          className="btn-primary scene3d-interact-btn"
          onClick={() => stateRef.current.triggerInteract?.()}
        >
          <span className="scene3d-interact-icon" aria-hidden="true">📍</span>
          <span className="scene3d-interact-text">
            <strong>{nearby.label}</strong>
            <span className="scene3d-interact-hint">Appuyez sur <kbd>Espace</kbd> ou <kbd>X</kbd> pour entrer</span>
          </span>
        </button>
      )}
    </>
  );
}
