// Icône « camembert » dessinée en Canvas 2D — un segment par jeu (s1..s4), taille proportionnelle
// au nombre de connexions. Partagée entre Globe3D.jsx (texture de sprite 3D) et
// WorldMapFallback.jsx (dessin direct 2D) pour un rendu identique dans les deux modes.
export function drawPieMarker(segments, { size = 64, inactiveColor = '#4a5a54', ringColor = '#10171c' } = {}) {
  const total = segments.reduce((sum, s) => sum + s.count, 0);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 2;

  if (total === 0) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = inactiveColor;
    ctx.fill();
    return canvas;
  }

  let start = -Math.PI / 2;
  for (const seg of segments) {
    if (!seg.count) continue;
    const angle = (seg.count / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, start + angle);
    ctx.closePath();
    ctx.fillStyle = seg.color;
    ctx.fill();
    start += angle;
  }

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.lineWidth = 2;
  ctx.strokeStyle = ringColor;
  ctx.stroke();

  return canvas;
}
