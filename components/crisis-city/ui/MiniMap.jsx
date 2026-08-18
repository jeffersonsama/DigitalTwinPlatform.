import React, { useEffect, useRef } from 'react';

// Carte miniature en vue de dessus (indépendante de la caméra 1re personne) — devenue nécessaire
// depuis le passage en vue subjective (CameraRig.js) : au ras du sol, on ne voit plus où se
// trouvent les lieux actifs. Un fond dessiné au canvas reproduit le plan réel de la ville
// (bâtiments/eau/sable/végétation/route, classés par matériau — cf. computeCityPlan dans
// Colliders.js) plutôt qu'un simple carré vide, pour vraiment reconnaître le quartier. Le point
// joueur est repositionné à chaque image directement en style DOM par Scene3D.jsx (via
// `playerDotRef`), sans passer par l'état React, pour ne pas re-render à 60 im/s.
const PLAN_COLORS = {
  water: '#2f5f82',
  sand: '#c9ad7a',
  ground: '#24262c',
  vegetation: '#3f5c3c',
  building: '#a89a82',
};
const PLAN_ORDER = ['water', 'sand', 'ground', 'vegetation', 'building'];
const CANVAS_SIZE = 300; // résolution interne (affichée à ~150px CSS, cf. index.css) — netteté écrans retina

function pct(value, min, max) {
  return ((value - min) / (max - min)) * 100;
}

export default function MiniMap({ markers, plan, bounds, playerDotRef }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    if (!plan.length) return;
    const spanX = bounds.maxX - bounds.minX;
    const spanZ = bounds.maxZ - bounds.minZ;
    for (const kind of PLAN_ORDER) {
      ctx.fillStyle = PLAN_COLORS[kind];
      for (const s of plan) {
        if (s.kind !== kind) continue;
        const cx = (pct(s.x, bounds.minX, bounds.maxX) / 100) * CANVAS_SIZE;
        const cz = (pct(s.z, bounds.minZ, bounds.maxZ) / 100) * CANVAS_SIZE;
        const w = Math.max((s.w / spanX) * CANVAS_SIZE, 1.5);
        const d = Math.max((s.d / spanZ) * CANVAS_SIZE, 1.5);
        ctx.fillRect(cx - w / 2, cz - d / 2, w, d);
      }
    }
  }, [plan, bounds]);

  return (
    <div className="minimap" aria-hidden="true">
      <div className="minimap-frame">
        <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} className="minimap-canvas" />
        {markers.map((m) => (
          <div
            key={m.lieu3d}
            className={`minimap-marker ${m.done ? 'is-done' : 'is-active'}`}
            style={{ left: `${pct(m.x, bounds.minX, bounds.maxX)}%`, top: `${pct(m.z, bounds.minZ, bounds.maxZ)}%` }}
            title={m.label}
          />
        ))}
        <div ref={playerDotRef} className="minimap-player" />
      </div>
      <div className="minimap-legend">
        <span><i className="minimap-legend-dot is-active" />à faire</span>
        <span><i className="minimap-legend-dot is-done" />fait</span>
      </div>
    </div>
  );
}
