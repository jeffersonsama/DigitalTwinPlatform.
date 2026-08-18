import React from 'react';
import { gradePourXp, gradeSuivant } from '../engine/xp.js';

export default function GradeBadge({ xp, compact }) {
  const grade = gradePourXp(xp);
  const next = gradeSuivant(xp);
  // Progression simple vis-à-vis des paliers non linéaires : ratio par rapport au prochain
  // seuil connu, borné à [0,100].
  const progress = next ? Math.min(100, Math.round((xp / next.xpRequis) * 100)) : 100;

  return (
    <div className={`grade-badge ${compact ? 'compact' : ''}`} title={grade.deblocage}>
      <div className="grade-badge-chevron">{grade.index + 1}</div>
      <div className="grade-badge-info">
        <div className="grade-badge-titre">{grade.titre}</div>
        {!compact && (
          <>
            <div className="grade-badge-bar">
              <div className="grade-badge-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="grade-badge-xp">{xp} XP{next ? ` · prochain grade à ${next.xpRequis}` : ' · grade maximal'}</div>
          </>
        )}
      </div>
    </div>
  );
}
