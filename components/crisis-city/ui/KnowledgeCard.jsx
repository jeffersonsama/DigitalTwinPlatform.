import React, { useEffect } from 'react';
import { sfx } from '../audio/sfx.js';

// Document n°4, ch.7 : « la carte de savoir se matérialise physiquement (retournement 3D CSS)
// quand elle est débloquée » — .just-unlocked déclenche le flip en CSS (voir index.css).
export default function KnowledgeCardView({ card, justUnlocked }) {
  useEffect(() => {
    if (justUnlocked) sfx.carte();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!card) return null;
  return (
    <div className={`knowledge-card-flip ${justUnlocked ? 'just-unlocked' : ''}`}>
      <div className="knowledge-card">
        <div className="knowledge-card-title">{card.titre}</div>
        <p className="knowledge-card-principe">{card.principe}</p>
        <div className="knowledge-card-ancrage">{card.ancrage}</div>
      </div>
    </div>
  );
}
