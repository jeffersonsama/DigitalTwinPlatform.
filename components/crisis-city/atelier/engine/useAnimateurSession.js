import { useCallback, useEffect, useRef, useState } from 'react';
import { backend, isLiveBackend } from './backend.js';

// Crée et pilote une session côté écran animateur : phase courante, réponses en direct
// (accumulées au fil des insertions), avancement de phase.
export function useAnimateurSession(jeu) {
  const [session, setSession] = useState(null);
  const [responses, setResponses] = useState([]);
  const [presence, setPresence] = useState([]);
  const [error, setError] = useState(null);
  const createdRef = useRef(false);

  useEffect(() => {
    if (createdRef.current) return;
    createdRef.current = true;
    backend
      .createSession({ jeu })
      .then(setSession)
      .catch((e) => setError(e.message || String(e)));
  }, [jeu]);

  useEffect(() => {
    if (!session) return undefined;
    const unsubSession = backend.subscribeSession(session.id, (updated) => setSession(updated));
    const unsubResponses = backend.subscribeResponses(session.id, (row) => {
      setResponses((prev) => (prev.some((r) => r.id === row.id) ? prev : [...prev, row]));
    });
    // Présence temps réel scopée à cette session — qui est connecté MAINTENANT sur ce jeu
    // précis (incrémente/décrémente en direct), par opposition aux réponses qui s'accumulent.
    const unsubPresence = backend.presence.subscribe((all) => {
      setPresence(all.filter((p) => p.sessionId === session.id));
    });
    backend.fetchResponses(session.id).then(setResponses).catch(() => {});
    return () => {
      unsubSession();
      unsubResponses();
      unsubPresence();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id]);

  const setPhase = useCallback(
    (phase, payload = {}) => {
      if (!session) return;
      backend.updateSessionPhase(session.id, phase, payload).catch((e) => setError(e.message || String(e)));
    },
    [session]
  );

  const responsesByManche = useCallback(
    (manche) => responses.filter((r) => r.manche === manche),
    [responses]
  );

  return { session, responses, presence, responsesByManche, setPhase, error, isLiveBackend };
}
