import React, { useState } from 'react';
import { useParticipantSession } from './engine/useParticipantSession.js';
import ExitButton from './ui/ExitButton.jsx';
import ParticipantS1 from './games/ParticipantS1.jsx';
import ParticipantS2 from './games/ParticipantS2.jsx';
import ParticipantS3 from './games/ParticipantS3.jsx';
import ParticipantS4 from './games/ParticipantS4.jsx';

const GAMES = { s1: ParticipantS1, s2: ParticipantS2, s3: ParticipantS3, s4: ParticipantS4 };

function CodeEntry({ onSubmit }) {
  const [value, setValue] = useState('');
  return (
    <div className="screen atelier-join">
      <ExitButton />
      <h1>Rejoindre une session</h1>
      <p className="muted">Entrez le code à 6 caractères affiché à l'écran.</p>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value.toUpperCase())}
        maxLength={6}
        placeholder="ABC123"
        className="atelier-code-input"
      />
      <button className="btn-primary" disabled={value.length !== 6} onClick={() => onSubmit(value)}>
        Rejoindre
      </button>
    </div>
  );
}

export default function ParticipantScreen({ initialCode }) {
  const [code, setCode] = useState(initialCode || null);
  const { session, participant, submitResponse, updateProfil, error, joining, isLiveBackend } = useParticipantSession(code || '');

  if (!code) return <CodeEntry onSubmit={setCode} />;
  if (joining) return <div className="screen atelier-loading"><ExitButton />Connexion à la session {code}…</div>;
  if (error) return (
    <div className="screen atelier-error">
      <ExitButton />
      <p>{error}</p>
      <button className="btn-secondary" onClick={() => setCode(null)}>Réessayer avec un autre code</button>
    </div>
  );
  if (!session || !participant) return <div className="screen atelier-loading"><ExitButton />Chargement…</div>;

  const GameView = GAMES[session.jeu];
  if (!GameView) return <div className="screen atelier-error"><ExitButton />Jeu « {session.jeu} » pas encore implémenté.</div>;

  return (
    <div className="app atelier-app">
      <ExitButton />
      {!isLiveBackend && (
        <div className="atelier-demo-banner">Mode démo locale — voir SETUP_ATELIER.md pour Supabase.</div>
      )}
      <GameView session={session} participant={participant} submitResponse={submitResponse} updateProfil={updateProfil} />
    </div>
  );
}
