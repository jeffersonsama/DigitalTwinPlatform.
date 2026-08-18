'use client';

import './index.css';
import React, { useReducer, useState, useCallback, useEffect, useRef } from 'react';
import { gameReducer, initialState } from './engine/gameReducer.js';
import { SCENARIOS } from './data/scenarios.js';
import { KNOWLEDGE_CARDS } from './data/knowledgeCards.js';
import { useProgress } from './engine/useProgress.js';
import { useGameSession } from './engine/useGameSession.js';
import { totalXp } from './engine/persistence.js';
import Scene3D from './ui/Scene3D.jsx';
import HUD from './ui/HUD.jsx';
import DialogueBox from './ui/DialogueBox.jsx';
import SceneStage from './ui/SceneStage.jsx';
import DebriefScreen from './ui/DebriefScreen.jsx';
import Toasts from './ui/Toasts.jsx';
import PromotionModal from './ui/PromotionModal.jsx';
import CareerScreen from './ui/CareerScreen.jsx';
import { REACTIONS } from './data/reactions.js';
import { PACKS, DEFAULT_PACK_ID, resolveAutoPack } from './data/packs.js';
import { getIsoCodeByCountryName } from '@/lib/countries';
import {
  TitleScreen, CountrySelectScreen, BriefingScreen, FeedbackScreen,
  ActDebriefScreen, CommitmentScreen, EndScreen,
} from './ui/Screens.jsx';

const FONT_CLASSES = ['font-small', 'font-normal', 'font-large'];

export default function CrisisCityGame({ country }) {
  const countryCode = getIsoCodeByCountryName(country);
  const [state, dispatch] = useReducer(gameReducer, undefined, initialState);
  const [fontScale, setFontScale] = useState(1);
  const [toast, setToast] = useState(null);
  const [showCareer, setShowCareer] = useState(false);
  const [cosmeticEnabled, setCosmeticEnabled] = useState(false);
  const [packId, setPackId] = useState(DEFAULT_PACK_ID); // Doc n°6 §J5 — pas de compte joueur,
  // choix invité non persisté (comme fontScale/cosmeticEnabled aujourd'hui).
  const [autoPack, setAutoPack] = useState(null);
  const packTouchedRef = useRef(false); // passe à true dès que le joueur clique le sélecteur —
  // la détection automatique (ci-dessous) ne doit alors plus jamais écraser son choix.
  const pack = (autoPack && packId === autoPack.id) ? autoPack : (PACKS[packId] || PACKS[DEFAULT_PACK_ID]);
  const packCycleIds = autoPack ? [autoPack.id, ...Object.keys(PACKS)] : Object.keys(PACKS);

  // Pack civique dérivé du pays renseigné à l'inscription (User.country, plateforme) — remplace
  // l'ancienne détection par géolocalisation IP (ipapi.co/ipwho.is), peu fiable en salle avec des
  // centaines de connexions simultanées sur le même wifi. Ne personnalise QUE la couleur civique
  // et le nom de la ville (donnée factuelle et publique, le drapeau officiel) — jamais la
  // toponymie/les prénoms, qui restent gated par la LOI 2 (validation native). Repli silencieux
  // si le pays n'est pas couvert (cf. data/countryFlags.js) : le pack neutre reste actif.
  useEffect(() => {
    if (packTouchedRef.current) return;
    const resolved = resolveAutoPack(countryCode);
    if (resolved) {
      setAutoPack(resolved);
      setPackId(resolved.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryCode]);
  const [exportableRuns, setExportableRuns] = useState(() =>
    Object.fromEntries(Object.keys(SCENARIOS).map((id) => [id, null]))
  );
  const [pendingReaction, setPendingReaction] = useState(null); // {expr, ligne, fx} — 6.2
  const [pendingOptionIndex, setPendingOptionIndex] = useState(null); // pour DetailInsert (Livre n°2)
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(null);
  const reactionTimeoutRef = useRef(null);

  const progress = useProgress();
  const xp = totalXp(progress.progress);
  useGameSession(state.sessionId, state.scenarioId, countryCode);

  // Couleurs civiques du pack appliquées en direct, sans remount (Doc n°6 §J5 : "changer de
  // pack change... sans recharger"). Repli implicite : si le pack n'a pas de `couleurs`, on ne
  // touche à rien et les valeurs par défaut de index.css s'appliquent.
  useEffect(() => {
    if (!pack?.couleurs) return;
    const root = document.documentElement.style;
    if (pack.couleurs.accent) root.setProperty('--accent', pack.couleurs.accent);
    if (pack.couleurs.accent2) root.setProperty('--accent-2', pack.couleurs.accent2);
  }, [pack]);

  // Consomme les événements XP émis par le réducteur — jamais pendant un dialogue en cours
  // (Annexe 1, 9.1 : « muet pendant les dialogues »).
  const processedCountRef = useRef(0);
  useEffect(() => {
    if (state.screen === 'DIALOGUE') return;
    if (state.xpEvents.length > processedCountRef.current) {
      const pending = state.xpEvents.slice(processedCountRef.current);
      processedCountRef.current = state.xpEvents.length;
      progress.processXpEvents(pending);
    }
  }, [state.xpEvents, state.screen, progress]);

  // Évalue les badges/méta-progression dès l'entrée dans l'écran d'engagement (la question
  // ouverte, répondue pendant le bilan final, doit déjà être connue).
  const prevScreenRef = useRef(state.screen);
  useEffect(() => {
    const prevScreen = prevScreenRef.current;
    prevScreenRef.current = state.screen;
    if (state.screen === 'COMMITMENT' && prevScreen !== 'COMMITMENT') {
      progress.completeScenario(state.scenarioId, {
        sessionId: state.sessionId,
        history: state.history,
        knowledgeCards: state.knowledgeCards,
        marqueurs: state.marqueurs,
        dossierConsultedActs: state.dossierConsultedActs,
        openQuestionAnswered: state.openQuestionAnswered,
        defeatText: state.defeatText,
      });
      setExportableRuns((prev) => ({ ...prev, [state.scenarioId]: state.history }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.screen]);

  const scenario = state.scenarioId ? SCENARIOS[state.scenarioId] : null;
  const acte = scenario ? scenario.actes[state.acteIndex] : null;
  const node = acte && state.currentNodeId ? acte.noeuds.find((n) => n.id === state.currentNodeId) : null;

  const handleSelectLieu = useCallback(
    (lieu3d) => {
      if (!acte) return;
      const targetNode = acte.noeuds.find((n) => n.lieu3d === lieu3d && !state.resolvedInAct.includes(n.id));
      if (targetNode) {
        dispatch({ type: 'OPEN_NODE', nodeId: targetNode.id });
        return;
      }
      // Lieu déjà joué : bulle « souvenir » plutôt qu'un message générique (Document n°4, 6.1) —
      // fort effet de conséquence pour un coût nul, la décision est déjà dans state.history.
      const doneNode = acte.noeuds.find((n) => n.lieu3d === lieu3d && state.resolvedInAct.includes(n.id));
      const souvenir = doneNode && [...state.history].reverse().find((h) => h.nodeId === doneNode.id);
      setToast(souvenir ? `Vous avez choisi : « ${souvenir.optionLabel} »` : 'Rien à faire ici pour l\'instant.');
      setTimeout(() => setToast(null), souvenir ? 3200 : 1800);
    },
    [acte, state.resolvedInAct, state.history]
  );

  // Réaction au choix (Document n°4, 6.2) : l'expression et l'effet de couche jouent 1,5 s
  // AVANT que le réducteur n'applique le choix et n'affiche le flash pédagogique. Le moteur
  // ne voit jamais cet état intermédiaire — App.jsx retarde seulement l'appel à dispatch.
  const handleChooseOption = useCallback(
    (optionIndex, timedOut) => {
      if (pendingReaction) return; // un choix est déjà en cours de résolution
      const reaction = node ? REACTIONS[node.id]?.[optionIndex] : null;
      if (reaction) {
        setPendingReaction(reaction);
        setPendingOptionIndex(optionIndex);
        reactionTimeoutRef.current = setTimeout(() => {
          setPendingReaction(null);
          setPendingOptionIndex(null);
          dispatch({ type: 'APPLY_CHOICE', optionIndex, timedOut });
        }, 1500);
      } else {
        dispatch({ type: 'APPLY_CHOICE', optionIndex, timedOut });
      }
    },
    [node, pendingReaction]
  );

  useEffect(() => () => clearTimeout(reactionTimeoutRef.current), []);

  const handleSelectCountry = useCallback(
    (scenarioId) => {
      progress.checkReplayBadge(scenarioId);
      dispatch({ type: 'SELECT_COUNTRY', scenarioId });
    },
    [progress]
  );

  let content;

  switch (state.screen) {
    case 'TITLE':
      content = (
        <TitleScreen
          onStart={() => dispatch({ type: 'GOTO_COUNTRY_SELECT' })}
          xp={xp}
          onOpenCareer={() => setShowCareer(true)}
          pack={pack}
          packIds={packCycleIds}
          packAutoDetected={!!autoPack && !packTouchedRef.current && packId === autoPack.id}
          onCyclePack={() => {
            packTouchedRef.current = true;
            setPackId(packCycleIds[(packCycleIds.indexOf(packId) + 1) % packCycleIds.length]);
          }}
        />
      );
      break;

    case 'COUNTRY_SELECT':
      content = <CountrySelectScreen onSelect={handleSelectCountry} xp={xp} />;
      break;

    case 'BRIEFING':
      content = (
        <BriefingScreen
          scenario={scenario}
          acte={acte}
          acteIndex={state.acteIndex}
          dossierConsulted={state.dossierConsultedActs.includes(acte.id)}
          onConsultDossier={() => dispatch({ type: 'CONSULT_DOSSIER' })}
          onStartAct={() => dispatch({ type: 'START_ACT' })}
        />
      );
      break;

    // PLAN MONDE (Scene3D + HUD) reste monté en continu à travers EXPLORE/DIALOGUE/FEEDBACK —
    // c'est le changement central du document n°4 : la ville ne se démonte plus entre deux
    // nœuds, la caméra "y est vraiment" pendant que le PLAN SCÈNE s'ouvre par-dessus.
    case 'EXPLORE':
    case 'DIALOGUE':
    case 'FEEDBACK': {
      const activeLieux = acte.noeuds.filter((n) => !state.resolvedInAct.includes(n.id)).map((n) => n.lieu3d);
      const doneLieux = acte.noeuds.filter((n) => state.resolvedInAct.includes(n.id)).map((n) => n.lieu3d);
      content = (
        <div className="explore-screen">
          <Scene3D
            pays={state.scenarioId}
            resources={state.resources}
            acteIndex={state.acteIndex}
            activeLieux={activeLieux}
            doneLieux={doneLieux}
            onSelectLieu={handleSelectLieu}
            cosmetic={{ heureDoree: cosmeticEnabled }}
            pack={pack}
            movementEnabled={state.screen === 'EXPLORE'}
          />
          <HUD
            scenario={scenario}
            resources={state.resources}
            acteIndex={state.acteIndex}
            actionsLeft={acte.noeuds.length - state.resolvedInAct.length}
            actionsMax={acte.noeuds.length}
            knowledgeCards={state.knowledgeCards}
            fontScale={fontScale}
            onFontScale={setFontScale}
            xp={xp}
            onOpenCareer={() => setShowCareer(true)}
            cosmeticEnabled={cosmeticEnabled}
            onToggleCosmetic={setCosmeticEnabled}
          />
          {toast && <div className="toast">{toast}</div>}

          {state.screen === 'DIALOGUE' && node && (
            <SceneStage
              node={node}
              crisisActive={state.acteIndex === 1}
              reaction={pendingReaction}
              reactionTrigger={pendingReaction ? `replique_${pendingOptionIndex}` : null}
              tension={timerSecondsLeft !== null && timerSecondsLeft <= 10}
              pack={pack}
              marqueurs={state.marqueurs}
            >
              <DialogueBox
                scenario={scenario}
                node={node}
                state={state}
                disabled={!!pendingReaction}
                onChoose={handleChooseOption}
                onTimerTick={setTimerSecondsLeft}
              />
            </SceneStage>
          )}

          {state.screen === 'FEEDBACK' && (
            <div className="feedback-overlay">
              <FeedbackScreen
                lastResult={state.lastResult}
                defeatText={state.defeatText}
                onContinue={() => { setTimerSecondsLeft(null); dispatch({ type: 'ACK_FEEDBACK' }); }}
              />
            </div>
          )}
        </div>
      );
      break;
    }

    case 'ACT_DEBRIEF':
      content = (
        <ActDebriefScreen
          scenario={scenario}
          acte={acte}
          acteIndex={state.acteIndex}
          resources={state.resources}
          onNextAct={() => dispatch({ type: 'NEXT_ACT' })}
        />
      );
      break;

    case 'FINAL_DEBRIEF':
      content = (
        <DebriefScreen
          scenario={scenario}
          history={state.history}
          knowledgeCardsIds={state.knowledgeCards}
          knowledgeCards={KNOWLEDGE_CARDS}
          openQuestionAnswered={state.openQuestionAnswered}
          onSubmitOpenAnswer={(text) => dispatch({ type: 'SUBMIT_OPEN_ANSWER', text })}
          onContinue={() => dispatch({ type: 'GOTO_COMMITMENT' })}
        />
      );
      break;

    case 'COMMITMENT':
      content = (
        <CommitmentScreen
          scenario={scenario}
          history={state.history}
          onRestartSame={() => dispatch({ type: 'RESTART_SAME_COUNTRY' })}
          onPlayOther={() => dispatch({ type: 'GOTO_COUNTRY_SELECT' })}
          onEnd={() => dispatch({ type: 'END' })}
          onShare={progress.shareCommitment}
        />
      );
      break;

    case 'END':
    default:
      content = <EndScreen onRestart={() => dispatch({ type: 'GOTO_TITLE' })} xp={xp} onOpenCareer={() => setShowCareer(true)} />;
      break;
  }

  return (
    <div className={`app ${FONT_CLASSES[fontScale]}`}>
      {content}
      <Toasts items={progress.toasts} />
      {progress.promotion && <PromotionModal grade={progress.promotion} onDismiss={progress.dismissPromotion} />}
      {showCareer && (
        <CareerScreen
          progress={progress.progress}
          exportableRuns={exportableRuns}
          completedScenarios={state.completedScenarios}
          pack={pack}
          onClose={() => setShowCareer(false)}
        />
      )}
    </div>
  );
}
