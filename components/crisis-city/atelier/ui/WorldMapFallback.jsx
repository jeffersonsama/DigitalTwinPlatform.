import React, { useEffect, useRef } from 'react';
import { buildWorldTexture } from './globeTexture.js';
import { drawPieMarker } from './pieMarker.js';

// Repli hors-3D de Globe3D.jsx (WebGL indisponible) — même donnée réelle (vraies frontières,
// mêmes points), rendue en Canvas 2D plat plutôt qu'en globe. `points`: mêmes objets que
// Globe3D ({ key, label, lat, lon, segments }).
const WIDTH = 1000;
const HEIGHT = 500;

function project(lat, lon) {
  return [((lon + 180) / 360) * WIDTH, ((90 - lat) / 180) * HEIGHT];
}

export default function WorldMapFallback({ points = [], total = 0 }) {
  const canvasRef = useRef(null);
  const worldTextureRef = useRef(null);

  useEffect(() => {
    if (!worldTextureRef.current) worldTextureRef.current = buildWorldTexture();
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(worldTextureRef.current, 0, 0, WIDTH, HEIGHT);

    for (const point of points) {
      const count = point.segments.reduce((s, x) => s + x.count, 0);
      const size = 20 + Math.min(count, 20) * 3;
      const [x, y] = project(point.lat, point.lon);
      const pie = drawPieMarker(point.segments, { size: 48 });
      ctx.drawImage(pie, x - size / 2, y - size / 2, size, size);
      ctx.fillStyle = '#e8e2d4';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${point.label}${count > 0 ? ` — ${count}` : ''}`, x, y - size / 2 - 6);
    }
  }, [points]);

  return (
    <div className="world-map-fallback">
      <canvas ref={canvasRef} className="world-map-canvas" />
      {total > 0 && <p className="muted world-map-caption">{total} connexion{total > 1 ? 's' : ''} affichée{total > 1 ? 's' : ''} en direct.</p>}
    </div>
  );
}
