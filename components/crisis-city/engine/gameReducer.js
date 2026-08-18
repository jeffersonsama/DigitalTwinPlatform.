// Machine à états du jeu — section 2.3. Automate fini strict : toute transition passe ici,
// aucune mutation directe ailleurs dans l'application.
//
// Depuis l'intégration du système de progression (Annexe 1), ce réducteur reste PUR : il émet
// des événements XP (state.xpEvents) mais ne touche jamais localStorage — c'est le rôle de
// engine/persistence.js et du hook côté App.jsx qui, seuls, connaissent l'historique inter-parties
// (première complétion d'un pays, parcours contrasté, badges...). Le réducteur ignore tout cela ;
// il ne connaît que la partie en cours, exactement comme le prescrit la section 3.1.
import { SCENARIOS } from '../data/scenarios.js';
import { applyChoice, tickRecurring, applyPendingActEnd, checkDefeat } from './effects.js';
import { XP_BAREME } from './xp.js';

function newSessionId() {
  return `s${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function initialState() {
  return {
    screen: 'TITLE', // TITLE, COUNTRY_SELECT, BRIEFING, EXPLORE, DIALOGUE, FEEDBACK, ACT_DEBRIEF, FINAL_DEBRIEF, COMMITMENT, END
    scenarioId: null,
    sessionId: null,
    acteIndex: 0,
    resources: {},
    marqueurs: [],
    recurringEffects: [],
    pendingActEnd: [],
    resolvedInAct: [],
    currentNodeId: null,
    lastResult: null,
    history: [],
    knowledgeCards: [],
    defeatText: null,
    dossierConsultedActs: [],
    openQuestionAnswered: false,
    openQuestionText: '',
    xpEvents: [], // {key, amount, label} — jamais retiré par le réducteur, consommé côté App
    completedScenarios: {}, // { maroc: {history, knowledgeCards, marqueurs}, egypte: {...} } — utile en session
  };
}

function scenarioOf(state) {
  return SCENARIOS[state.scenarioId];
}

function currentActe(state) {
  return scenarioOf(state).actes[state.acteIndex];
}

function findNode(state, nodeId) {
  return currentActe(state).noeuds.find((n) => n.id === nodeId);
}

function pushXp(state, key, amount, label) {
  return { ...state, xpEvents: [...state.xpEvents, { key, amount, label }] };
}

export function gameReducer(state, action) {
  switch (action.type) {
    case 'GOTO_TITLE':
      return { ...initialState(), completedScenarios: state.completedScenarios };

    case 'GOTO_COUNTRY_SELECT':
      return { ...state, screen: 'COUNTRY_SELECT' };

    case 'SELECT_COUNTRY': {
      const scenario = SCENARIOS[action.scenarioId];
      const resources = {};
      for (const r of scenario.ressources) resources[r.code] = r.initial;
      // Mémoire inter-modules (Doc n°6 §5.3) : les marqueurs de tout module déjà complété cette
      // session (y compris une partie précédente de CE module) sont hérités — la ville se
      // souvient. Aucune collision de noms entre les marqueurs Maroc/Égypte aujourd'hui, donc un
      // seul tableau suffit (pas de bucket "hérité" séparé).
      const marqueursHerites = Object.values(state.completedScenarios).flatMap((c) => c.marqueurs || []);
      return {
        ...state,
        screen: 'BRIEFING',
        scenarioId: action.scenarioId,
        sessionId: newSessionId(),
        acteIndex: 0,
        resources,
        marqueurs: marqueursHerites,
        recurringEffects: [],
        pendingActEnd: [],
        resolvedInAct: [],
        history: [],
        knowledgeCards: [],
        defeatText: null,
        dossierConsultedActs: [],
        openQuestionAnswered: false,
        openQuestionText: '',
        xpEvents: [],
      };
    }

    case 'START_ACT':
      return { ...state, screen: 'EXPLORE' };

    case 'CONSULT_DOSSIER': {
      const acte = currentActe(state);
      if (state.dossierConsultedActs.includes(acte.id)) return state;
      const next = {
        ...state,
        dossierConsultedActs: [...state.dossierConsultedActs, acte.id],
      };
      return pushXp(
        next,
        `CONSULTER_DOSSIER:${state.sessionId}:${state.scenarioId}:${acte.id}`,
        XP_BAREME.CONSULTER_DOSSIER.xp,
        'Dossier de données consulté'
      );
    }

    case 'OPEN_NODE':
      return { ...state, screen: 'DIALOGUE', currentNodeId: action.nodeId };

    case 'BACK_TO_EXPLORE':
      return { ...state, screen: 'EXPLORE', currentNodeId: null };

    case 'APPLY_CHOICE': {
      const scenario = scenarioOf(state);
      const node = findNode(state, state.currentNodeId);
      const option = node.options[action.optionIndex];
      const timedOut = !!action.timedOut;
      const result = applyChoice(scenario, node, option, state);

      const knowledgeCards = [...state.knowledgeCards];
      const newlyUnlockedCards = [];
      for (const c of option.debloque || []) {
        if (!knowledgeCards.includes(c)) {
          knowledgeCards.push(c);
          newlyUnlockedCards.push(c);
        }
      }

      const history = [
        ...state.history,
        {
          acteId: currentActe(state).id,
          nodeId: node.id,
          nodeTitre: node.titre,
          optionLabel: option.label,
          competences: option.competences || {},
          feedback: option.feedback,
          suite: option.suite,
          timedOut,
        },
      ];

      const resolvedInAct = [...state.resolvedInAct, node.id];

      // Fait progresser les effets récurrents déjà actifs (pas celui qu'on vient de créer).
      const ticked = tickRecurring(scenario, result.resources, result.recurringEffects);

      const defeatText = checkDefeat(scenario, ticked.resources);

      let next = {
        ...state,
        screen: 'FEEDBACK',
        resources: ticked.resources,
        marqueurs: result.marqueurs,
        recurringEffects: ticked.recurringEffects,
        pendingActEnd: result.pendingActEnd,
        knowledgeCards,
        history,
        resolvedInAct,
        defeatText,
        lastResult: {
          nodeTitre: node.titre,
          optionLabel: option.label,
          feedback: option.feedback,
          suite: option.suite,
          tirageResultat: result.tirageResultat,
          nouvellesCartes: newlyUnlockedCards,
          timedOut,
        },
      };

      next = pushXp(next, `NODE_RESOLVED:${state.sessionId}:${node.id}`, XP_BAREME.NODE_RESOLVED.xp, node.titre);
      if (node.timerSec && !timedOut) {
        next = pushXp(next, `NODE_TIMED_BONUS:${state.sessionId}:${node.id}`, XP_BAREME.NODE_TIMED_BONUS.xp, 'Décision rendue à temps');
      }
      for (const cardId of newlyUnlockedCards) {
        next = pushXp(next, `CARTE_DEBLOQUEE:${cardId}`, XP_BAREME.CARTE_DEBLOQUEE.xp, 'Carte de savoir débloquée');
      }
      return next;
    }

    case 'SUBMIT_OPEN_ANSWER': {
      if (state.openQuestionAnswered) return state;
      const wordCount = action.text.trim().split(/\s+/).filter(Boolean).length;
      if (wordCount < 15) return state;
      const next = { ...state, openQuestionAnswered: true, openQuestionText: action.text };
      return pushXp(next, `QUESTION_OUVERTE:${state.sessionId}:${state.scenarioId}`, XP_BAREME.QUESTION_OUVERTE.xp, 'Question ouverte');
    }

    case 'ACK_FEEDBACK': {
      const acte = currentActe(state);
      const allResolved = acte.noeuds.every((n) => state.resolvedInAct.includes(n.id));
      if (allResolved || state.defeatText) {
        const scenario = scenarioOf(state);
        const resources = applyPendingActEnd(scenario, state.resources, state.pendingActEnd, state.marqueurs);
        let next = {
          ...state,
          screen: state.defeatText ? 'FINAL_DEBRIEF' : 'ACT_DEBRIEF',
          resources,
          pendingActEnd: [],
          currentNodeId: null,
        };
        if (allResolved) {
          next = pushXp(next, `ACT_COMPLETE:${state.sessionId}:${acte.id}`, XP_BAREME.ACT_COMPLETE.xp, acte.titre);
        }
        if (state.defeatText) {
          next = pushXp(next, `SCENARIO_COMPLETE:${state.sessionId}:${state.scenarioId}`, XP_BAREME.SCENARIO_COMPLETE.xp, 'Scénario terminé');
          next = pushXp(next, `PAYS_PREMIERE_FOIS:${state.scenarioId}`, XP_BAREME.PAYS_PREMIERE_FOIS.xp, 'Première complétion du pays');
        }
        return next;
      }
      return { ...state, screen: 'EXPLORE', currentNodeId: null };
    }

    case 'NEXT_ACT': {
      const scenario = scenarioOf(state);
      if (state.acteIndex + 1 < scenario.actes.length) {
        return {
          ...state,
          screen: 'BRIEFING',
          acteIndex: state.acteIndex + 1,
          resolvedInAct: [],
        };
      }
      let next = { ...state, screen: 'FINAL_DEBRIEF' };
      next = pushXp(next, `SCENARIO_COMPLETE:${state.sessionId}:${state.scenarioId}`, XP_BAREME.SCENARIO_COMPLETE.xp, 'Scénario terminé');
      next = pushXp(next, `PAYS_PREMIERE_FOIS:${state.scenarioId}`, XP_BAREME.PAYS_PREMIERE_FOIS.xp, 'Première complétion du pays');
      return next;
    }

    case 'GOTO_COMMITMENT': {
      const completedScenarios = {
        ...state.completedScenarios,
        [state.scenarioId]: { history: state.history, knowledgeCards: state.knowledgeCards, marqueurs: state.marqueurs },
      };
      return { ...state, screen: 'COMMITMENT', completedScenarios };
    }

    case 'RESTART_SAME_COUNTRY':
      return gameReducer(state, { type: 'SELECT_COUNTRY', scenarioId: state.scenarioId });

    case 'END':
      return { ...state, screen: 'END' };

    default:
      return state;
  }
}
