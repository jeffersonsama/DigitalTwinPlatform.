import React, { useState } from 'react';

const JEUX = [
  { id: 's1', nom: 'Réaction en chaîne', session: 'S1 · Awareness', duree: '15 min' },
  { id: 's2', nom: '53001 en main', session: 'S2 · Understanding', duree: '12 min' },
  { id: 's3', nom: "Le comité d'investissement", session: 'S3 · Application', duree: '15 min' },
  { id: 's4', nom: 'Le banc d\'essai des 90 jours', session: 'S4 · Action', duree: '18 min' },
];

export default function AtelierMenu() {
  const [code, setCode] = useState('');

  return (
    <div className="screen atelier-menu">
      <h1>Jeux d'après-session</h1>
      <p className="muted">Un jeu collectif de 12 à 18 minutes après chaque session du Jour 1 — voir SETUP_ATELIER.md.</p>

      <h2>Je suis l'animateur</h2>
      <div className="atelier-menu-grid">
        {JEUX.map((j) => (
          <a key={j.id} className="atelier-menu-card" href={`/crisis-city/admin?atelier=animateur&jeu=${j.id}`}>
            <span className="atelier-menu-session">{j.session}</span>
            <strong>{j.nom}</strong>
            <span className="muted">{j.duree} — écran à projeter</span>
          </a>
        ))}
      </div>

      <h2>Vue d'ensemble</h2>
      <div className="atelier-menu-grid">
        <a className="atelier-menu-card" href="/crisis-city/admin?atelier=carte">
          <span className="atelier-menu-session">Admin</span>
          <strong>Carte mondiale — toutes les sessions</strong>
          <span className="muted">Qui est connecté, d'où, sur quel jeu — en direct</span>
        </a>
      </div>

      <h2>Je rejoins une session</h2>
      <div className="atelier-menu-join">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={6}
          placeholder="Code à 6 caractères"
          className="atelier-code-input"
        />
        <a
          className={`btn-primary ${code.length !== 6 ? 'is-disabled' : ''}`}
          href={code.length === 6 ? `/crisis-city/join?code=${code}` : undefined}
          onClick={(e) => { if (code.length !== 6) e.preventDefault(); }}
        >
          Rejoindre
        </a>
      </div>

      <p className="atelier-menu-back"><a href="/crisis-city">← Retour au jeu Crisis City</a></p>
    </div>
  );
}
