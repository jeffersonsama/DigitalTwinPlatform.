import React, { useCallback, useRef, useState } from 'react';
import './TouchJoystick.css';

const MAX_RADIUS = 42; // px

// Joystick virtuel pour le déplacement du personnage sur tablette/mobile (le jeu tourne en
// atelier, un déplacement clavier seul serait inutilisable au toucher — cf. Scene3D.jsx). Pointer
// Events uniquement : souris et tactile se comportent de façon identique, pas de librairie.
// `onMove(x, y)` reçoit un vecteur normalisé [-1, 1] en coordonnées écran (y positif = vers le
// bas) — c'est Scene3D.jsx qui le convertit en direction monde relative à la caméra.
export default function TouchJoystick({ onMove }) {
  const baseRef = useRef(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const activePointerId = useRef(null);

  const updateFromEvent = useCallback(
    (ev) => {
      const rect = baseRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = ev.clientX - cx;
      let dy = ev.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > MAX_RADIUS) {
        dx = (dx / dist) * MAX_RADIUS;
        dy = (dy / dist) * MAX_RADIUS;
      }
      setKnob({ x: dx, y: dy });
      onMove(dx / MAX_RADIUS, dy / MAX_RADIUS);
    },
    [onMove]
  );

  function handlePointerDown(ev) {
    activePointerId.current = ev.pointerId;
    ev.target.setPointerCapture(ev.pointerId);
    updateFromEvent(ev);
  }
  function handlePointerMove(ev) {
    if (activePointerId.current !== ev.pointerId) return;
    updateFromEvent(ev);
  }
  function handlePointerUp(ev) {
    if (activePointerId.current !== ev.pointerId) return;
    activePointerId.current = null;
    setKnob({ x: 0, y: 0 });
    onMove(0, 0);
  }

  return (
    <div
      ref={baseRef}
      className="touch-joystick-base"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      aria-hidden="true"
    >
      <div className="touch-joystick-knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div>
  );
}
