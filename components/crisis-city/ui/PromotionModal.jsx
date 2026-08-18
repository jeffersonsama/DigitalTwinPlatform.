import React, { useEffect } from 'react';
import { sfx } from '../audio/sfx.js';

// Cérémonie de passage de grade — Annexe 1, 8.2 : plein écran, insigne, une phrase, pas de
// confettis. Document n°4, ch.7 : « insigne forgé — traits qui se dessinent, éclat ». Se ferme
// seule après quelques secondes ou au clic.
export default function PromotionModal({ grade, onDismiss }) {
  useEffect(() => {
    sfx.promotion();
    const t = setTimeout(onDismiss, 3400);
    return () => clearTimeout(t);
  }, [onDismiss]);

  if (!grade) return null;
  return (
    <div className="promotion-overlay" onClick={onDismiss}>
      <div className="promotion-card">
        <svg className="promotion-insigne" width="64" height="64" viewBox="0 0 64 64">
          <circle className="promotion-insigne-ring" cx="32" cy="32" r="27" fill="none" strokeWidth="3" />
          <text x="32" y="39" textAnchor="middle" className="promotion-insigne-num">{grade.index + 1}</text>
        </svg>
        <div className="promotion-label">Promotion</div>
        <h2>{grade.titre}</h2>
        <p className="promotion-phrase">« Le terrain vous connaît, maintenant. »</p>
        {grade.deblocage && <p className="promotion-unlock">{grade.deblocage}</p>}
      </div>
    </div>
  );
}
