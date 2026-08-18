// Texture du globe à partir de vraies tuiles OpenStreetMap — nécessite internet (accepté
// explicitement : voir la discussion sur le compromis hors-ligne). Les tuiles OSM sont en
// projection Web Mercator (carrée) ; la longitude s'y projette déjà de façon identique à
// l'équirectangulaire (linéaire), seule la latitude a besoin d'être re-projetée ligne par ligne.
const ZOOM = 3; // 8x8 tuiles = 64 requêtes, résolution raisonnable pour un globe qui tourne
const TILE_SIZE = 256;
const FETCH_TIMEOUT_MS = 9000;
const MERCATOR_LAT_LIMIT = 85.0511; // limite standard de la projection Web Mercator

function loadTile(z, x, y) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`tuile OSM ${z}/${x}/${y} injoignable`));
    img.src = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
  });
}

async function buildMercatorCanvas(zoom) {
  const tilesPerSide = 2 ** zoom;
  const size = tilesPerSide * TILE_SIZE;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const coords = [];
  for (let x = 0; x < tilesPerSide; x++) {
    for (let y = 0; y < tilesPerSide; y++) coords.push([x, y]);
  }
  const tiles = await Promise.all(coords.map(([x, y]) => loadTile(zoom, x, y)));
  tiles.forEach((img, i) => {
    const [x, y] = coords[i];
    ctx.drawImage(img, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  });
  return canvas;
}

function reprojectMercatorToEquirect(mercatorCanvas) {
  const size = mercatorCanvas.width;
  const width = size;
  const height = Math.round(size / 2);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  for (let row = 0; row < height; row++) {
    let latDeg = 90 - ((row + 0.5) / height) * 180;
    if (latDeg > MERCATOR_LAT_LIMIT) latDeg = MERCATOR_LAT_LIMIT;
    if (latDeg < -MERCATOR_LAT_LIMIT) latDeg = -MERCATOR_LAT_LIMIT;
    const latRad = (latDeg * Math.PI) / 180;
    const mercYNorm = 0.5 - Math.log(Math.tan(Math.PI / 4 + latRad / 2)) / (2 * Math.PI);
    const sourceRow = Math.min(size - 1, Math.max(0, Math.round(mercYNorm * size)));
    ctx.drawImage(mercatorCanvas, 0, sourceRow, size, 1, 0, row, width, 1);
  }
  return canvas;
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout tuiles OSM')), ms)),
  ]);
}

// Retourne un canvas équirectangulaire prêt à devenir une THREE.CanvasTexture, ou lève une
// erreur (hors-ligne, tuile bloquée, timeout) — l'appelant doit alors se rabattre sur
// globeTexture.js (frontières réelles dessinées localement, 100% hors-ligne).
export async function buildOSMWorldTexture() {
  const mercator = await withTimeout(buildMercatorCanvas(ZOOM), FETCH_TIMEOUT_MS);
  return reprojectMercatorToEquirect(mercator);
}
