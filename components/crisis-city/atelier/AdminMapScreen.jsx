import React, { useMemo, useState } from 'react';
import ExitButton from './ui/ExitButton.jsx';
import Globe3D from './ui/Globe3D.jsx';
import { useLiveParticipants } from './engine/useLiveParticipants.js';
import { useSiteAttendance } from './engine/useSiteAttendance.js';
import { COUNTRIES } from './data/countryGeo.js';

const GAMES = [
  { id: 'principal', label: 'Jeu principal (parties individuelles)', color: '#9b59b6' },
  { id: 's1', label: 'S1 · Réaction en chaîne', color: '#3fae8a' },
  { id: 's2', label: 'S2 · 53001 en main', color: '#4a90d9' },
  { id: 's3', label: "S3 · Comité d'investissement", color: '#e0c341' },
  { id: 's4', label: 'S4 · Banc d\'essai des 90 jours', color: '#d9534f' },
];
const SITE_COLOR = '#8a8f98';

export default function AdminMapScreen() {
  const participants = useLiveParticipants(); // présence atelier : {pays, jeu, clientId, ...}
  const siteAttendance = useSiteAttendance(); // présence site entier : {pays, clientId, ...}
  const [filters, setFilters] = useState({ principal: true, s1: true, s2: true, s3: true, s4: true, site: true });

  // Ceux qui sont sur le site mais PAS dans un jeu précis en ce moment (dédupliqué par
  // clientId) — évite de compter deux fois quelqu'un déjà affiché dans une couleur de jeu.
  const atelierClientIds = useMemo(() => new Set(participants.map((p) => p.clientId)), [participants]);
  const siteOnly = useMemo(
    () => siteAttendance.filter((v) => !atelierClientIds.has(v.clientId)),
    [siteAttendance, atelierClientIds]
  );

  const points = useMemo(() => {
    const byCountry = new Map();
    function ensure(pays) {
      if (!byCountry.has(pays)) {
        const geo = COUNTRIES[pays];
        byCountry.set(pays, { key: pays, label: geo.name, lat: geo.latlng[0], lon: geo.latlng[1], byBucket: {} });
      }
      return byCountry.get(pays);
    }
    for (const p of participants) {
      if (!p.pays || !COUNTRIES[p.pays] || !filters[p.jeu]) continue;
      const entry = ensure(p.pays);
      entry.byBucket[p.jeu] = (entry.byBucket[p.jeu] || 0) + 1;
    }
    if (filters.site) {
      for (const v of siteOnly) {
        if (!v.pays || !COUNTRIES[v.pays]) continue;
        const entry = ensure(v.pays);
        entry.byBucket.site = (entry.byBucket.site || 0) + 1;
      }
    }
    const buckets = [...GAMES, { id: 'site', color: SITE_COLOR }];
    return Array.from(byCountry.values()).map((c) => ({
      ...c,
      segments: buckets.map((b) => ({ count: c.byBucket[b.id] || 0, color: b.color })),
    }));
  }, [participants, siteOnly, filters]);

  const total = points.reduce((sum, p) => sum + p.segments.reduce((s, x) => s + x.count, 0), 0);
  const totalByGame = useMemo(() => {
    const t = { principal: 0, s1: 0, s2: 0, s3: 0, s4: 0 };
    for (const p of participants) if (p.jeu && t[p.jeu] !== undefined) t[p.jeu] += 1;
    return t;
  }, [participants]);

  return (
    <div className="app atelier-app admin-map-screen">
      <ExitButton />
      <h1>Carte mondiale — toutes les sessions</h1>
      <p className="admin-map-total">
        {siteAttendance.length} personne{siteAttendance.length > 1 ? 's' : ''} sur la plateforme en ce moment
        {participants.length > 0 && <> — dont {participants.length} dans un jeu</>}.
      </p>
      <p className="muted">{total} affichée{total > 1 ? 's' : ''} sur la carte selon les filtres ci-dessous.</p>

      <div className="admin-map-filters">
        {GAMES.map((g) => (
          <label key={g.id} className={`admin-map-filter ${filters[g.id] ? 'on' : ''}`}>
            <input
              type="checkbox"
              checked={filters[g.id]}
              onChange={() => setFilters((f) => ({ ...f, [g.id]: !f[g.id] }))}
            />
            <span className="admin-map-swatch" style={{ background: g.color }} />
            {g.label} <span className="muted">({totalByGame[g.id]})</span>
          </label>
        ))}
        <label className={`admin-map-filter ${filters.site ? 'on' : ''}`}>
          <input
            type="checkbox"
            checked={filters.site}
            onChange={() => setFilters((f) => ({ ...f, site: !f.site }))}
          />
          <span className="admin-map-swatch" style={{ background: SITE_COLOR }} />
          Sur la plateforme, hors jeu <span className="muted">({siteOnly.length})</span>
        </label>
      </div>

      <Globe3D points={points} total={total} hint="Cliquez-glissez pour tourner le globe. Chaque pays affiche la répartition par jeu (+ gris = sur le site, hors jeu)." />
    </div>
  );
}
