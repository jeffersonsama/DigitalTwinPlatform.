import React, { useState } from 'react';
import { KNOWLEDGE_CARDS } from '../data/knowledgeCards.js';
import KnowledgeCardView from './KnowledgeCard.jsx';
import GradeBadge from './GradeBadge.jsx';
import { gradePourXp } from '../engine/xp.js';

export default function HUD({
  scenario, resources, acteIndex, actionsLeft, actionsMax, knowledgeCards,
  fontScale, onFontScale, xp, onOpenCareer, cosmeticEnabled, onToggleCosmetic,
}) {
  const [showCollection, setShowCollection] = useState(false);
  const grade = gradePourXp(xp);

  return (
    <div className="hud">
      <div className="hud-top">
        <div className="hud-acte">
          Acte {acteIndex + 1}/3 · actions restantes : {actionsLeft}/{actionsMax}
        </div>
        <div className="hud-controls">
          <a href="/" className="hud-btn" title="Retour à l'accueil de la plateforme">🏠 Accueil</a>
          <GradeBadge xp={xp} compact />
          <button className="hud-btn" onClick={onOpenCareer}>Carrière</button>
          <button className="hud-btn" onClick={() => setShowCollection(true)}>
            Cartes ({knowledgeCards.length})
          </button>
          {grade.index >= 3 && (
            <button
              className={`hud-btn ${cosmeticEnabled ? 'active' : ''}`}
              onClick={() => onToggleCosmetic(!cosmeticEnabled)}
              title="Palette « heure dorée » (grade Officier de liaison)"
            >
              ☀ Heure dorée
            </button>
          )}
          <div className="hud-font">
            {['petit', 'normal', 'grand'].map((size, i) => (
              <button
                key={size}
                className={`hud-font-btn ${fontScale === i ? 'active' : ''}`}
                onClick={() => onFontScale(i)}
                title={`Taille de police : ${size}`}
              >
                A
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="hud-gauges">
        {scenario.ressources.filter((r) => r.code !== 'BUD').map((r) => {
          const value = resources[r.code] ?? r.initial;
          const pct = Math.round(((value - r.min) / (r.max - r.min)) * 100);
          return (
            <div className="hud-gauge" key={r.code}>
              <span className="hud-gauge-label">{r.nom}</span>
              <div className="hud-gauge-bar">
                <div className="hud-gauge-fill" style={{ width: `${pct}%` }} />
              </div>
              <span className="hud-gauge-value">{value}</span>
            </div>
          );
        })}
        <div className="hud-gauge hud-gauge-budget">
          <span className="hud-gauge-label">Budget</span>
          <span className="hud-gauge-value">{resources.BUD ?? 0}</span>
        </div>
      </div>

      {showCollection && (
        <div className="modal-overlay" onClick={() => setShowCollection(false)}>
          <div className="modal collection-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Cartes de savoir de cette partie</h2>
              <button className="modal-close" onClick={() => setShowCollection(false)}>✕</button>
            </div>
            <div className="collection-grid">
              {knowledgeCards.length === 0 && <p className="muted">Aucune carte débloquée pour l'instant.</p>}
              {knowledgeCards.map((id) => (
                <KnowledgeCardView key={id} card={KNOWLEDGE_CARDS[id]} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
