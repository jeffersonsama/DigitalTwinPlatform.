import React from 'react';

// Barres anonymes de répartition — jamais de classement individuel (1.2 : « scoring doux »).
export default function VoteBars({ items, total }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <div className="vote-bars">
      {items.map((item) => (
        <div key={item.label} className="vote-bar-row">
          <span className="vote-bar-label">{item.label}</span>
          <div className="vote-bar-track">
            <div
              className={`vote-bar-fill ${item.highlight ? 'highlight' : ''}`}
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
          <span className="vote-bar-count">
            {item.count}{total ? ` (${Math.round((item.count / total) * 100)}%)` : ''}
          </span>
        </div>
      ))}
    </div>
  );
}
