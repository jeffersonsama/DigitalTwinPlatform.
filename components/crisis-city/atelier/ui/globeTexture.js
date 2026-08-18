import { feature } from 'topojson-client';
import countriesTopology from 'world-atlas/countries-110m.json';

// Texture équirectangulaire dessinée depuis de vraies frontières (Natural Earth 110m via
// world-atlas), 100% locale — aucune requête réseau, contrairement aux tuiles OpenStreetMap
// utilisées par la carte 2D. C'est ce qui rend le globe 3D utilisable hors connexion.
const WIDTH = 2048;
const HEIGHT = 1024;

function project(lon, lat) {
  return [((lon + 180) / 360) * WIDTH, ((90 - lat) / 180) * HEIGHT];
}

export function buildWorldTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#10171c';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const geo = feature(countriesTopology, countriesTopology.objects.countries);
  ctx.fillStyle = '#2b3a35';
  ctx.strokeStyle = '#3d4d47';
  ctx.lineWidth = 1.2;

  for (const f of geo.features) {
    const polygons = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    if (!polygons) continue;
    ctx.beginPath();
    for (const rings of polygons) {
      for (const ring of rings) {
        let started = false;
        let prevLon = null;
        for (const [lon, lat] of ring) {
          // Coupe le tracé au niveau de l'antiméridien pour éviter une bande qui traverse
          // toute la texture (ex: Russie, Alaska, Fidji).
          if (prevLon !== null && Math.abs(lon - prevLon) > 180) started = false;
          const [x, y] = project(lon, lat);
          if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
          prevLon = lon;
        }
        ctx.closePath();
      }
    }
    ctx.fill('evenodd');
    ctx.stroke();
  }

  return canvas;
}
