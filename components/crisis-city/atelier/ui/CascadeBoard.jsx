import React from 'react';

// Sélection + ordonnancement de 4 cartes parmi 12, par clics successifs (l'ordre des clics = le
// rang proposé) — pas de glisser-déposer nécessaire, plus sûr sur mobile.
export default function CascadeBoard({ cards, choc, selected, onToggle, onSubmit, disabled }) {
  const isFull = selected.length >= 4;

  return (
    <div className="cascade-board">
      <div className="cascade-choc">
        <span className="cascade-choc-label">Choc de départ</span>
        <p>{choc}</p>
      </div>

      <div className="cascade-selection">
        {[0, 1, 2, 3].map((i) => {
          const cardId = selected[i];
          const card = cardId ? cards.find((c) => c.id === cardId) : null;
          return (
            <div key={i} className={`cascade-slot ${card ? 'filled' : ''}`}>
              <span className="cascade-slot-rank">{i + 1}</span>
              <span className="cascade-slot-text">{card ? card.texte : '— cliquez une carte —'}</span>
            </div>
          );
        })}
      </div>

      <div className="cascade-grid">
        {cards.map((card) => {
          const chosen = selected.includes(card.id);
          const blocked = disabled || (!chosen && isFull);
          return (
            <button
              key={card.id}
              className={`cascade-card ${chosen ? 'chosen' : ''}`}
              disabled={blocked}
              onClick={() => onToggle(card.id)}
            >
              {chosen && <span className="cascade-card-rank">{selected.indexOf(card.id) + 1}</span>}
              {card.texte}
            </button>
          );
        })}
      </div>

      <button className="btn-primary" disabled={disabled || selected.length !== 4} onClick={onSubmit}>
        Valider ma cascade
      </button>
    </div>
  );
}
