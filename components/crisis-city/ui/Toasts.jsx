import React from 'react';

// Gains discrets et empilables (Annexe 1, 9.1) — jamais affichés pendant un dialogue,
// l'appelant (App.jsx) est responsable de ne pas en émettre à ce moment-là si besoin.
export default function Toasts({ items }) {
  if (!items.length) return null;
  return (
    <div className="toasts-stack">
      {items.map((t) => (
        <div key={t.id} className={`toast-item toast-${t.kind}`}>
          {t.text}
        </div>
      ))}
    </div>
  );
}
