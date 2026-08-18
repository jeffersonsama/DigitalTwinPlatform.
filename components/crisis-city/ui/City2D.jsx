import React from 'react';
import { LANDMARKS } from '../scene3d/CityGenerator.js';
import { resolveLieuLabel } from '../data/packs.js';

// Défaillance douce (directive 3.1) : si WebGL est indisponible ou trop lent, la ville
// bascule en carte 2D — le jeu reste jouable, seuls les effets 3D disparaissent.
// LANDMARKS est un tableau plat depuis la fusion Al-Wasl (Doc n°6) — plus d'indexation par pays.
export default function City2D({ pack, activeLieux, doneLieux, onSelectLieu }) {
  return (
    <div className="city2d">
      <p className="city2d-note">Mode carte (rendu 3D indisponible sur cet appareil)</p>
      <div className="city2d-grid">
        {LANDMARKS.map((l) => {
          const active = activeLieux.includes(l.id);
          const done = doneLieux.includes(l.id);
          const label = resolveLieuLabel(pack, l.id);
          return (
            <button
              key={l.id}
              className={`city2d-tile ${active ? 'active' : ''} ${done ? 'done' : ''}`}
              disabled={!active}
              onClick={() => onSelectLieu(l.id, label)}
            >
              <span className="city2d-tile-label">{label}</span>
              {done && <span className="city2d-tile-badge">✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
