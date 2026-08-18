import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildWorldTexture } from './globeTexture.js';
import { buildOSMWorldTexture } from './osmTexture.js';
import { drawPieMarker } from './pieMarker.js';
import WorldMapFallback from './WorldMapFallback.jsx';

// Globe 3D générique — reçoit des points déjà calculés par l'appelant (pays réels, un ou
// plusieurs segments colorés par jeu). Utilisé par WorldMap.jsx (S1 seul, un segment) et
// AdminMapScreen.jsx (toutes sessions, un segment par jeu s1..s4). Repli sur WorldMapFallback
// si WebGL est indisponible (même pattern que Scene3D.jsx du jeu principal).
function webglAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
}

function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

export default function Globe3D({ points = [], total = 0, hint = 'Cliquez-glissez pour tourner le globe.' }) {
  const mountRef = useRef(null);
  const labelsRef = useRef(null);
  const syncMarkersRef = useRef(null);
  const [failed, setFailed] = useState(!webglAvailable());

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

    const height = 420;
    const width = mount.clientWidth;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f12);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 2.6);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.minDistance = 1.6;
    controls.maxDistance = 4;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.6;
    controls.enableDamping = true;
    // La rotation auto ne doit pas contrarier quelqu'un qui essaie de pointer un pays précis.
    const stopAutoRotate = () => { controls.autoRotate = false; };
    renderer.domElement.addEventListener('pointerdown', stopAutoRotate, { once: true });

    scene.add(new THREE.AmbientLight(0xffffff, 1));

    // Fond hors-ligne (frontières réelles dessinées localement) affiché immédiatement, puis
    // remplacé par de vraies tuiles OpenStreetMap dès qu'elles ont fini de charger — jamais de
    // globe vide pendant les quelques secondes de chargement, ni si la salle perd le réseau.
    let currentTexture = new THREE.CanvasTexture(buildWorldTexture());
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(1, 64, 64),
      new THREE.MeshBasicMaterial({ map: currentTexture }),
    );
    scene.add(globe);

    let cancelled = false;
    buildOSMWorldTexture()
      .then((canvas) => {
        if (cancelled) return;
        const osmTexture = new THREE.CanvasTexture(canvas);
        globe.material.map = osmTexture;
        globe.material.needsUpdate = true;
        currentTexture.dispose();
        currentTexture = osmTexture;
      })
      .catch(() => {
        // Hors-ligne / tuiles bloquées / timeout — on garde le fond local, pas d'action.
      });

    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(1.03, 48, 48),
      new THREE.MeshBasicMaterial({ color: 0x3fae8a, transparent: true, opacity: 0.05, side: THREE.BackSide }),
    );
    scene.add(glow);

    const markerGroup = new THREE.Group();
    scene.add(markerGroup);
    const markers = new Map(); // key -> { pos, sprite, texture, signature }

    function syncMarkers(nextPoints) {
      const nextKeys = new Set(nextPoints.map((p) => p.key));
      for (const [key, m] of markers) {
        if (!nextKeys.has(key)) {
          markerGroup.remove(m.sprite);
          m.sprite.material.map.dispose();
          m.sprite.material.dispose();
          markers.delete(key);
        }
      }
      for (const point of nextPoints) {
        const count = point.segments.reduce((s, x) => s + x.count, 0);
        const signature = `${count}|${point.segments.map((s) => `${s.color}:${s.count}`).join(',')}`;
        const existing = markers.get(point.key);
        if (existing && existing.signature === signature) continue;

        if (existing) {
          markerGroup.remove(existing.sprite);
          existing.sprite.material.map.dispose();
          existing.sprite.material.dispose();
        }

        const canvas = drawPieMarker(point.segments);
        const tex = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: tex, depthTest: true, transparent: true });
        const sprite = new THREE.Sprite(material);
        const pos = latLonToVector3(point.lat, point.lon, 1.02);
        sprite.position.copy(pos);
        const scale = 0.045 + Math.min(count, 20) * 0.006;
        sprite.scale.set(scale, scale, 1);
        markerGroup.add(sprite);
        markers.set(point.key, { pos, sprite, signature });
      }
    }
    syncMarkersRef.current = syncMarkers;
    syncMarkers(points);

    function updateLabels() {
      const labelsEl = labelsRef.current;
      if (!labelsEl) return;
      const rect = renderer.domElement.getBoundingClientRect();
      for (const child of labelsEl.children) {
        const m = markers.get(child.dataset.key);
        if (!m) {
          child.style.display = 'none';
          continue;
        }
        const outward = m.pos.clone().normalize();
        const camDir = camera.position.clone().normalize();
        if (outward.dot(camDir) < 0.15) {
          child.style.display = 'none';
          continue;
        }
        child.style.display = 'block';
        const projected = m.pos.clone().project(camera);
        const x = (projected.x * 0.5 + 0.5) * rect.width;
        const y = (-projected.y * 0.5 + 0.5) * rect.height;
        child.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
      }
    }

    let raf;
    function animate() {
      raf = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
      updateLabels();
    }
    animate();

    function handleResize() {
      const w = mount.clientWidth;
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
      renderer.setSize(w, height);
    }
    window.addEventListener('resize', handleResize);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      for (const m of markers.values()) {
        m.sprite.material.map.dispose();
        m.sprite.material.dispose();
      }
      renderer.dispose();
      currentTexture.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [failed]);

  useEffect(() => {
    syncMarkersRef.current?.(points);
  }, [points]);

  if (failed) {
    return <WorldMapFallback points={points} total={total} />;
  }

  return (
    <div className="world-map-globe-wrap">
      <div ref={mountRef} className="world-map-globe" />
      <div ref={labelsRef} className="world-map-globe-labels">
        {points.map((p) => {
          const count = p.segments.reduce((s, x) => s + x.count, 0);
          return (
            <div key={p.key} data-key={p.key} className="world-map-globe-label active">
              {p.label}{count > 0 ? ` — ${count}` : ''}
            </div>
          );
        })}
      </div>
      {hint && <p className="muted world-map-globe-hint">{hint}</p>}
      {total > 0 && <p className="muted world-map-caption">{total} connexion{total > 1 ? 's' : ''} affichée{total > 1 ? 's' : ''} en direct.</p>}
    </div>
  );
}
