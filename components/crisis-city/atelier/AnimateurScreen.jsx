import React from 'react';
import { useAnimateurSession } from './engine/useAnimateurSession.js';
import ExitButton from './ui/ExitButton.jsx';
import AnimateurS1 from './games/AnimateurS1.jsx';
import AnimateurS2 from './games/AnimateurS2.jsx';
import AnimateurS3 from './games/AnimateurS3.jsx';
import AnimateurS4 from './games/AnimateurS4.jsx';

const GAMES = { s1: AnimateurS1, s2: AnimateurS2, s3: AnimateurS3, s4: AnimateurS4 };

export default function AnimateurScreen({ jeu = 's1' }) {
  const { session, responses, presence, setPhase, error, isLiveBackend } = useAnimateurSession(jeu);
  const GameView = GAMES[jeu];

  if (error) return <div className="screen atelier-error"><ExitButton />Erreur : {error}</div>;
  if (!session) return <div className="screen atelier-loading"><ExitButton />Création de la session…</div>;
  if (!GameView) return <div className="screen atelier-error"><ExitButton />Jeu « {jeu} » pas encore implémenté.</div>;

  return (
    <div className="app atelier-app">
      <ExitButton />
      {!isLiveBackend && (
        <div className="atelier-demo-banner">
          Mode démo locale — fonctionne entre onglets de ce navigateur uniquement. Voir
          SETUP_ATELIER.md pour brancher Supabase et jouer entre plusieurs téléphones.
        </div>
      )}
      <GameView session={session} responses={responses} presence={presence} setPhase={setPhase} />
    </div>
  );
}
