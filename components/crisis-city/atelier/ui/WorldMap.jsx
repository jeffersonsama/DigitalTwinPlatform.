import React, { useMemo } from 'react';
import Globe3D from './Globe3D.jsx';
import { COUNTRIES } from '../data/countryGeo.js';

// Carte des priorités — Document n°5, section 1.3 : « la carte mondiale se remplit en direct ».
// Pays réel détecté automatiquement à la connexion (engine/geoip.js), plus le pays n'est plus
// demandé manuellement pendant l'ancrage S1. Un seul segment (teal) — vue multi-jeux colorée :
// voir AdminMapScreen.jsx.
const S1_COLOR = '#3fae8a';

export default function WorldMap({ participants = [] }) {
  const points = useMemo(() => {
    const byCountry = new Map();
    for (const p of participants) {
      if (!p.pays || !COUNTRIES[p.pays]) continue;
      if (!byCountry.has(p.pays)) {
        const geo = COUNTRIES[p.pays];
        byCountry.set(p.pays, { key: p.pays, label: geo.name, lat: geo.latlng[0], lon: geo.latlng[1], count: 0 });
      }
      byCountry.get(p.pays).count += 1;
    }
    return Array.from(byCountry.values()).map((c) => ({ ...c, segments: [{ count: c.count, color: S1_COLOR }] }));
  }, [participants]);

  const total = points.reduce((sum, p) => sum + p.segments[0].count, 0);

  return (
    <div className="world-map">
      <Globe3D points={points} total={total} />
    </div>
  );
}
