import { useCallback, useEffect, useState } from 'react';
import { backend, isLiveBackend } from './backend.js';
import { getClientId } from './codes.js';
import { detectCountryCode } from './geoip.js';

// Rejoint une session par code depuis le téléphone d'un participant. Persiste le lien
// (sessionId, participantId) le temps de la partie ; suit la phase diffusée par l'animateur.
export function useParticipantSession(code) {
  const [session, setSession] = useState(null);
  const [participant, setParticipant] = useState(null);
  const [error, setError] = useState(null);
  const [joining, setJoining] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setJoining(true);
    setError(null);
    backend
      .getSessionByCode(code)
      .then((found) => {
        if (cancelled) return null;
        if (!found) {
          setError('Aucune session avec ce code. Vérifiez auprès de l\'animateur.');
          return null;
        }
        setSession(found);
        // Pays détecté automatiquement via l'IP publique — pas de saisie manuelle du
        // participant. `null` si la détection échoue (hors-ligne, service bloqué) : l'écran
        // de jeu propose alors un repli manuel (voir ParticipantS1.jsx).
        return detectCountryCode().then((pays) =>
          backend.addParticipant(found.id, { clientId: getClientId(), pays, crise: null })
        );
      })
      .then((p) => {
        if (!cancelled && p) setParticipant(p);
      })
      .catch((e) => !cancelled && setError(e.message || String(e)))
      .finally(() => !cancelled && setJoining(false));
    return () => {
      cancelled = true;
    };
  }, [code]);

  useEffect(() => {
    if (!session) return undefined;
    return backend.subscribeSession(session.id, setSession);
  }, [session?.id]);

  // Présence temps réel — incrémente la carte à la connexion, la décrémente à la déconnexion
  // (fermeture d'onglet, perte réseau). Ré-entre si le pays change (repli manuel, voir
  // ParticipantS1.jsx) pour que la carte reflète toujours la bonne donnée.
  useEffect(() => {
    if (!session || !participant) return undefined;
    return backend.presence.enter({
      sessionId: session.id,
      jeu: session.jeu,
      pays: participant.pays,
      clientId: getClientId(),
    });
  }, [session?.id, session?.jeu, participant?.pays]);

  const submitResponse = useCallback(
    (manche, payload) => {
      if (!session || !participant) return Promise.resolve();
      return backend.submitResponse(session.id, participant.id, manche, payload);
    },
    [session, participant]
  );

  const updateProfil = useCallback(
    (pays, crise) => {
      if (!session || !participant) return Promise.resolve();
      return backend.addParticipant(session.id, { clientId: getClientId(), pays, crise }).then(setParticipant);
    },
    [session, participant]
  );

  return { session, participant, submitResponse, updateProfil, error, joining, isLiveBackend };
}
