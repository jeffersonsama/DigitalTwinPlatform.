import React from 'react';
import { gradePourXp, gradeSuivant, niveauPourXp } from '../engine/xp.js';

export default function GradeBadge({ xp, compact }) {
  const grade = gradePourXp(xp);
  const next = gradeSuivant(xp);
  const niveau = niveauPourXp(xp);
  // Progression simple vis-à-vis des paliers non linéaires : ratio par rapport au prochain
  // seuil connu, borné à [0,100].
  const progress = next ? Math.min(100, Math.round((xp / next.xpRequis) * 100)) : 100;
  // XP restant plutôt qu'un total abstrait (2.2) : la courbe 100×n^1.6 écarte de plus en plus les
  // paliers, un total brut ("prochain grade à 3360") donne une fausse impression de ralentissement
  // là où le nombre d'XP qu'il reste réellement à gagner, lui, ne s'emballe pas de la même façon.
  const xpRestant = next ? Math.max(0, next.xpRequis - xp) : 0;

  return (
    <div className={`grade-badge ${compact ? 'compact' : ''}`} title={grade.deblocage}>
      <div className="grade-badge-chevron">{grade.index + 1}</div>
      <div className="grade-badge-info">
        <div className="grade-badge-titre">{grade.titre}</div>
        {!compact && (
          <>
            <div className="grade-badge-niveau muted">Niveau {niveau}/10</div>
            <div className="grade-badge-bar">
              <div className="grade-badge-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="grade-badge-xp">{xp} XP{next ? ` · encore ${xpRestant} XP avant ${next.titre}` : ' · grade maximal'}</div>
          </>
        )}
      </div>
    </div>
  );
}
