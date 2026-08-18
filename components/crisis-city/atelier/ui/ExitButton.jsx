import React from 'react';

// Présent sur toutes les pages du mode atelier (animateur ET participant) — ramène au menu des
// quatre jeux, qui lui-même ramène au jeu principal Crisis City.
export default function ExitButton() {
  return (
    <a href="?atelier=menu" className="atelier-exit-btn" title="Quitter ce jeu">
      ✕ Quitter
    </a>
  );
}
