// Badges (accomplissements transversaux) — Annexe 1, section 8.3.
//
// Deux badges du document (Cartographe, Main tendue) supposent un contenu que la V1 ne modélise
// qu'en partie ; les conditions ont été adaptées au plus près du matériau existant plutôt que
// simulées — voir les commentaires marqués ADAPTATION.

export const ALLIES_PAR_SCENARIO = {
  maroc: ['brahim_allie', 'salma_alliee'],
  egypte: ['khaled_allie', 'nour_alliee'],
};

// Trois badges « surprise » : condition masquée tant qu'ils ne sont pas obtenus (section 9.1).
export const BADGES = [
  {
    id: 'cartographe', titre: 'Cartographe', surprise: false,
    condition: "Consulter le dossier de données à chaque acte d'un scénario.",
    celebre: 'Le réflexe de diagnostic.',
  },
  {
    id: 'marathonien', titre: 'Marathonien du Delta / de l\'Atlas', surprise: false,
    condition: 'Terminer un scénario en une seule session.',
    celebre: 'La persévérance.',
  },
  {
    id: 'autre_versant', titre: 'L\'autre versant', surprise: false,
    condition: 'Terminer un parcours contrasté (≥ 60 % de choix différents).',
    celebre: 'La curiosité pour les conséquences alternatives.',
  },
  {
    id: 'bibliothecaire', titre: 'Bibliothécaire', surprise: false,
    condition: 'Débloquer les 10 cartes de savoir d\'un scénario.',
    celebre: 'La complétion du « manuel ».',
  },
  {
    id: 'plume_ouverte', titre: 'Plume ouverte', surprise: false,
    condition: 'Répondre aux questions ouvertes des deux scénarios.',
    celebre: 'La réflexivité.',
  },
  {
    id: 'sans_filet', titre: 'Sans filet', surprise: true,
    condition: 'Terminer l\'acte 2 égyptien sans aucun timeout.',
    celebre: 'La décision assumée sous stress.',
  },
  {
    id: 'ambassadeur', titre: 'Ambassadeur', surprise: false,
    condition: 'Partager son engagement 30/60/90.',
    celebre: 'Le pont vers le réel.',
  },
  {
    id: 'binational', titre: 'Binational', surprise: false,
    condition: 'Terminer Maroc et Égypte.',
    celebre: 'Le transfert entre contextes.',
  },
  {
    id: 'recidiviste', titre: 'Récidiviste éclairé', surprise: true,
    condition: 'Rejouer un scénario après 7 jours.',
    celebre: 'Le retour espacé (consolidation).',
  },
  {
    id: 'main_tendue', titre: 'Main tendue', surprise: false,
    // ADAPTATION : le document vise 3 déblocages d'alliés ; seuls 2 alliés distincts existent
    // par scénario dans le contenu actuel (7 et 8). Seuil ramené à 2 en conséquence.
    condition: 'Recruter les alliés disponibles dans une même partie.',
    celebre: 'Le jeu collectif avec les PNJ.',
  },
  {
    id: 'temoin', titre: 'Témoin', surprise: false,
    condition: 'Regarder le bilan final d\'un même scénario deux fois.',
    celebre: 'L\'attention aux conséquences longues.',
  },
  {
    id: 'fondateur', titre: 'Fondateur', surprise: true,
    condition: 'Avoir joué pendant l\'édition YKF 2026.',
    celebre: 'Badge commémoratif du forum, non reproductible.',
  },
  // Badges de session — Document n°5 (jeux d'après-session), passerelle décrite en 1.2 :
  // chaque jeu terminé crédite 60 XP + son badge ; les 4 badges déclenchent « Jour 1 complet ».
  {
    id: 'atelier_s1', titre: 'Cartographe du chaos', surprise: false,
    condition: 'Terminer le jeu S1 · Réaction en chaîne.',
    celebre: 'Lire une crise en système.',
  },
  {
    id: 'atelier_s2', titre: 'Permis 53001', surprise: false,
    condition: 'Terminer le jeu S2 · 53001 en main.',
    celebre: 'La carte de référence devenue réflexe.',
  },
  {
    id: 'atelier_s3', titre: 'Détecteur de washing', surprise: false,
    condition: 'Terminer le jeu S3 · Le comité d\'investissement.',
    celebre: 'Le lien démontrable entre activité et effet.',
  },
  {
    id: 'atelier_s4', titre: 'Bâtisseur du Jour 1', surprise: false,
    condition: 'Terminer le jeu S4 · Le banc d\'essai des 90 jours.',
    celebre: 'Un engagement testé par des pairs.',
  },
  {
    id: 'jour1_complet', titre: 'Jour 1 complet', surprise: false,
    condition: 'Terminer les quatre jeux d\'après-session.',
    celebre: 'Accès prioritaire à la démo Crisis City du stand.',
  },
];

function serializeHistory(history) {
  return history.map((h) => `${h.nodeId}:${h.optionLabel}`).join('|');
}

function contrastRatio(prevKey, history) {
  if (!prevKey) return 0;
  const prevEntries = prevKey.split('|');
  const curEntries = serializeHistory(history).split('|');
  const len = Math.min(prevEntries.length, curEntries.length) || 1;
  let diff = 0;
  for (let i = 0; i < len; i++) {
    if (prevEntries[i] !== curEntries[i]) diff++;
  }
  return diff / len;
}

// Appelé une fois, quand une partie atteint le bilan final (FINAL_DEBRIEF). Retourne les ids de
// badges nouvellement obtenus pour CETTE partie (hors "ambassadeur" et "récidiviste", évalués
// ailleurs — voir App.jsx).
export function evaluateScenarioCompletion({ scenarioId, runState, progress }) {
  const newly = [];
  const already = (id) => !!progress.badgesEarned[id];
  const earn = (id, variant) => {
    if (!already(id)) newly.push(id);
    progress.badgesEarned[id] = progress.badgesEarned[id] || { earnedAt: new Date().toISOString(), variant };
  };

  // Cartographe : dossier consulté à chaque acte du scénario joué.
  const scenario = runState.scenarioActesCount;
  if (runState.dossierConsultedActs.length >= scenario) earn('cartographe');

  // Marathonien : toujours vrai en V1 (aucune reprise de partie possible entre deux sessions).
  earn('marathonien', scenarioId);

  // L'autre versant : parcours contrasté vs la dernière partie connue de ce scénario.
  const prevKey = progress.scenarios[scenarioId]?.lastHistoryKey;
  if (prevKey && contrastRatio(prevKey, runState.history) >= 0.6) earn('autre_versant');

  // Bibliothécaire : 10/10 cartes du scénario débloquées dans cette partie.
  if (runState.knowledgeCards.length >= 10) earn('bibliothecaire');

  // Sans filet : acte 2 égyptien terminé sans aucun timeout.
  if (scenarioId === 'egypte') {
    const acte2 = runState.history.filter((h) => h.acteId === 'acte2');
    if (acte2.length > 0 && acte2.every((h) => !h.timedOut)) earn('sans_filet');
  }

  // Main tendue : tous les alliés disponibles recrutés dans cette partie (adaptation : seuil = 2).
  const allies = ALLIES_PAR_SCENARIO[scenarioId] || [];
  const recruited = allies.filter((m) => runState.marqueurs.includes(m));
  if (allies.length > 0 && recruited.length >= allies.length) earn('main_tendue');

  // Fondateur : badge commémoratif de l'édition en cours.
  if (new Date().getFullYear() === 2026) earn('fondateur');

  // Témoin : bilan final d'un même scénario regardé deux fois (compteur mis à jour par App.jsx
  // dans progress.scenarios[scenarioId].epilogueViews avant l'appel à cette fonction).
  if ((progress.scenarios[scenarioId]?.epilogueViews || 0) >= 2) earn('temoin');

  // Binational et Plume ouverte dépendent de l'état persistant mis à jour par App.jsx AVANT
  // l'appel à cette fonction (progress.scenarios[...].firstCompletedAt / openQuestionDone).
  const scenarioIds = Object.keys(progress.scenarios);
  const bothCompleted = ['maroc', 'egypte'].every((id) => progress.scenarios[id]?.firstCompletedAt);
  if (bothCompleted) earn('binational');
  const bothOpenQ = ['maroc', 'egypte'].every((id) => progress.scenarios[id]?.openQuestionDone);
  if (bothOpenQ) earn('plume_ouverte');

  return newly;
}

export function evaluateReplay({ scenarioId, progress }) {
  const meta = progress.scenarios[scenarioId];
  if (!meta?.lastPlayedAt) return { newly: [] };
  const days = (Date.now() - new Date(meta.lastPlayedAt).getTime()) / 86400000;
  if (days >= 7 && !progress.badgesEarned.recidiviste) {
    progress.badgesEarned.recidiviste = { earnedAt: new Date().toISOString() };
    return { newly: ['recidiviste'] };
  }
  return { newly: [] };
}

export function earnAmbassadeur(progress) {
  if (progress.badgesEarned.ambassadeur) return { newly: [] };
  progress.badgesEarned.ambassadeur = { earnedAt: new Date().toISOString() };
  return { newly: ['ambassadeur'] };
}

export { serializeHistory };
