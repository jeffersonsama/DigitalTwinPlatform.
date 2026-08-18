import { useEffect, useRef } from 'react';
import { backend } from '../atelier/engine/backend.js';
import { detectCountryCode } from '../atelier/engine/geoip.js';
import { getClientId } from '../atelier/engine/codes.js';

// Session individuelle du jeu principal — dès qu'une partie démarre (state.sessionId, régénéré
// à SELECT_COUNTRY/RESTART_SAME_COUNTRY dans gameReducer.js), on crée une session côté backend :
// même mécanisme que l'atelier (Supabase Realtime ou relais local, cf. atelier/engine/backend.js)
// mais entièrement dissocié du rôle animateur/participant — pas de code à partager, pas de vote,
// juste une session par lancement, suivie en direct comme les jeux d'atelier (carte admin, cf.
// AdminMapScreen.jsx, avec `jeu: 'principal'`).
export function useGameSession(sessionId, scenarioId) {
  const activeRef = useRef(null);

  useEffect(() => {
    if (!sessionId) return undefined;
    activeRef.current = sessionId;
    let cancelled = false;
    let leavePresence = null;

    backend.createSession({ jeu: 'principal' }).then((session) => {
      if (cancelled || activeRef.current !== sessionId) return;
      detectCountryCode().then((pays) => {
        if (cancelled || activeRef.current !== sessionId) return;
        leavePresence = backend.presence.enter({
          sessionId: session.id,
          jeu: 'principal',
          pays,
          scenarioId,
          clientId: getClientId(),
        });
      });
    });

    return () => {
      cancelled = true;
      leavePresence?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);
}
