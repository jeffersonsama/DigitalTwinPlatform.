// Pont entre la partie en cours (gameReducer, pur) et la progression persistée côté serveur, par
// compte. Le réducteur ignore tout ceci ; ce hook est le seul endroit qui lit/écrit
// engine/persistence.js, conformément à la séparation décrite en tête de gameReducer.js.
import { useCallback, useEffect, useRef, useState } from 'react';
import { loadProgress, saveProgress, emptyProgress, totalXp } from './persistence.js';
import { gradePourXp } from './xp.js';
import { evaluateScenarioCompletion, evaluateReplay, earnAmbassadeur, serializeHistory, BADGES } from './badges.js';
import { SCENARIOS } from '../data/scenarios.js';

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function badgeTitre(id) {
  return BADGES.find((b) => b.id === id)?.titre || id;
}

export function useProgress() {
  // Valeur par défaut synchrone (compte tout juste créé / chargement en cours), remplacée dès
  // que la carrière serveur est chargée — cf. l'effet ci-dessous.
  const [progress, setProgress] = useState(emptyProgress);
  const progressRef = useRef(progress);
  progressRef.current = progress;

  useEffect(() => {
    let cancelled = false;
    loadProgress().then((loaded) => {
      if (!cancelled) setProgress(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const [toasts, setToasts] = useState([]);
  const [promotion, setPromotion] = useState(null);
  const toastIdRef = useRef(0);

  const pushToast = useCallback((text, kind = 'xp') => {
    const id = ++toastIdRef.current;
    setToasts((t) => [...t.slice(-4), { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const commit = useCallback((draft) => {
    saveProgress(draft);
    setProgress(draft);
  }, []);

  // Consomme les événements XP émis par le réducteur (idempotent : clé déjà payée = no-op).
  const processXpEvents = useCallback(
    (events) => {
      if (!events.length) return;
      const draft = clone(progressRef.current);
      const before = totalXp(draft);
      let changed = false;
      for (const ev of events) {
        if (draft.xpEvents[ev.key] === undefined) {
          draft.xpEvents[ev.key] = ev.amount;
          changed = true;
          pushToast(`+${ev.amount} XP`, 'xp');
        }
      }
      if (!changed) return;
      const after = totalXp(draft);
      commit(draft);
      if (gradePourXp(after).index > gradePourXp(before).index) {
        setPromotion(gradePourXp(after));
      }
    },
    [commit, pushToast]
  );

  // Appelé quand une partie atteint le bilan final : met à jour les méta-données par scénario
  // et calcule les badges qui en découlent.
  const completeScenario = useCallback(
    (scenarioId, runState) => {
      const draft = clone(progressRef.current);
      const meta = draft.scenarios[scenarioId] || {};
      const now = new Date().toISOString();
      meta.firstCompletedAt = meta.firstCompletedAt || now;
      meta.epilogueViews = (meta.epilogueViews || 0) + 1;
      meta.openQuestionDone = meta.openQuestionDone || runState.openQuestionAnswered;
      meta.lastHistoryKey = serializeHistory(runState.history);
      meta.lastPlayedAt = now;
      meta.finsVues = meta.finsVues || {};
      meta.finsVues[runState.defeatText ? 'degradee' : 'standard'] = true;
      draft.scenarios[scenarioId] = meta;

      const scenario = SCENARIOS[scenarioId];
      const newlyBadges = evaluateScenarioCompletion({
        scenarioId,
        runState: { ...runState, scenarioActesCount: scenario.actes.length },
        progress: draft,
      });

      commit(draft);
      newlyBadges.forEach((id) => pushToast('Badge débloqué : ' + badgeTitre(id), 'badge'));
    },
    [commit, pushToast]
  );

  // Appelé au moment où le joueur choisit un pays, avant de démarrer la partie.
  const checkReplayBadge = useCallback(
    (scenarioId) => {
      const draft = clone(progressRef.current);
      const { newly } = evaluateReplay({ scenarioId, progress: draft });
      if (newly.length) {
        commit(draft);
        newly.forEach((id) => pushToast('Badge débloqué : ' + badgeTitre(id), 'badge'));
      }
    },
    [commit, pushToast]
  );

  const shareCommitment = useCallback(() => {
    const draft = clone(progressRef.current);
    const { newly } = earnAmbassadeur(draft);
    if (newly.length) {
      commit(draft);
      pushToast('Badge débloqué : Ambassadeur', 'badge');
    }
  }, [commit, pushToast]);

  const dismissPromotion = useCallback(() => setPromotion(null), []);

  return {
    progress,
    toasts,
    promotion,
    processXpEvents,
    completeScenario,
    checkReplayBadge,
    shareCommitment,
    dismissPromotion,
  };
}
