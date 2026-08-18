// Agrégation C1-C5, profils de gestionnaire, génération de l'engagement 30/60/90 — section 5.
import { SCENARIOS } from '../data/scenarios.js';

const COMPETENCES = ['C1', 'C2', 'C3', 'C4', 'C5'];

const COMPETENCE_LABELS = {
  C1: 'Diagnostic systémique',
  C2: 'Priorisation',
  C3: 'Arbitrage des ressources',
  C4: 'Communication et confiance',
  C5: 'Anticipation et résilience',
};

// Score brut par compétence, normalisé sur 100 (50 = neutre), borné par les deltas
// effectivement rencontrés sur le parcours du joueur (5.2).
export function computeScores(scenarioId, history) {
  const scenario = SCENARIOS[scenarioId];
  const totals = {};
  for (const c of COMPETENCES) totals[c] = { score: 0, max: 0, min: 0, deltas: [] };

  for (const entry of history) {
    const acte = scenario.actes.find((a) => a.id === entry.acteId);
    const node = acte?.noeuds.find((n) => n.id === entry.nodeId);
    if (!node) continue;
    for (const c of COMPETENCES) {
      const values = node.options.map((o) => o.competences?.[c] ?? 0);
      const max = Math.max(...values, 0);
      const min = Math.min(...values, 0);
      if (max === 0 && min === 0) continue; // compétence non mesurée sur ce nœud
      totals[c].max += max;
      totals[c].min += min;
      const chosen = entry.competences?.[c] ?? 0;
      totals[c].score += chosen;
      if (chosen !== 0) totals[c].deltas.push(chosen);
    }
  }

  const normalized = {};
  const coherence = {};
  for (const c of COMPETENCES) {
    const { score, max, min, deltas } = totals[c];
    const halfRange = (max - min) / 2;
    const mid = (max + min) / 2;
    normalized[c] = halfRange === 0 ? 50 : Math.round(clamp(50 + (50 * (score - mid)) / halfRange, 0, 100));
    coherence[c] = stddev(deltas);
  }

  return { normalized, coherence, raw: totals, labels: COMPETENCE_LABELS };
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function stddev(arr) {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

// Les trois moments-clés : les décisions au plus fort delta (positif ou négatif), toutes
// compétences confondues (5.4).
export function keyMoments(history, count = 3) {
  const withMagnitude = history.map((entry) => {
    const magnitude = Object.values(entry.competences || {}).reduce((a, b) => a + Math.abs(b), 0);
    return { ...entry, magnitude };
  });
  return withMagnitude.sort((a, b) => b.magnitude - a.magnitude).slice(0, count);
}

const PROFILES = [
  {
    match: (dom, faible) => (dom === 'C1' || dom === 'C5') && faible === 'C4',
    nom: 'Le Stratège systémique',
    retour: "Vous voyez loin et juste — mais une stratégie que personne ne comprend est une stratégie qui n'existe pas. Votre chantier : la transparence et le bon messager.",
  },
  {
    match: (dom, faible) => dom === 'C2' && faible === 'C5',
    nom: 'Le Pompier d\'élite',
    retour: "Personne ne triage mieux que vous dans l'urgence. Votre chantier : que la prochaine urgence n'ait pas lieu — préparation, institutionnalisation, temps long.",
  },
  {
    match: (dom, faible) => dom === 'C4' && faible === 'C2',
    nom: 'Le Bâtisseur de confiance',
    retour: "Vous savez faire suivre les gens — capital rare. Votre chantier : assumer des perdants clairement désignés plutôt que de ménager tout le monde trop peu.",
  },
  {
    match: (dom, faible) => dom === 'C3' && faible === 'C1',
    nom: 'Le Négociateur',
    retour: "Vous convertissez les ressources en effets mieux que quiconque. Votre chantier : le diagnostic amont — négocier juste suppose de mesurer juste.",
  },
  {
    match: (dom, faible) => dom === 'C5' && faible === 'C2',
    nom: 'Le Gardien du long terme',
    retour: "Vous construisez pour dans dix ans. Votre chantier : tenir aussi la nuit de l'hôpital — le long terme se gagne en survivant au court terme.",
  },
];

export function computeProfile(normalized) {
  const entries = COMPETENCES.map((c) => [c, normalized[c]]);
  const max = Math.max(...entries.map(([, v]) => v));
  const min = Math.min(...entries.map(([, v]) => v));
  const dominante = entries.find(([, v]) => v === max)[0];
  const faible = entries.find(([, v]) => v === min)[0];

  if (max - min < 10) {
    return {
      nom: 'L\'Équilibriste',
      dominante, faible,
      retour: "Aucune faille béante, aucune arme décisive. Votre chantier : choisissez une force et affûtez-la — les cellules de crise recrutent des profils, pas des moyennes.",
    };
  }
  const found = PROFILES.find((p) => p.match(dominante, faible));
  if (found) return { nom: found.nom, dominante, faible, retour: found.retour };
  return {
    nom: 'Le Praticien de terrain',
    dominante, faible,
    retour: `Votre force reconnue : ${COMPETENCE_LABELS[dominante]}. Votre chantier explicite : ${COMPETENCE_LABELS[faible]} — un profil rarement plat, jamais figé.`,
  };
}

const COMMITMENT_TEMPLATES = {
  'Le Stratège systémique': {
    j30: "Cartographier les usages (eau, données, acteurs) de mon quartier ou de mon organisation.",
    j60: "Présenter ce diagnostic à une association ou un conseil local, avec les sources croisées.",
    j90: "Lancer une action mesurable issue du diagnostic et publier les résultats en toute transparence.",
  },
  'Le Pompier d\'élite': {
    j30: "Identifier les trois scénarios de crise les plus probables dans mon environnement proche.",
    j60: "Rédiger une grille de triage simple (immédiateté × ampleur × réversibilité) pour ces scénarios.",
    j90: "Organiser un exercice de simulation, même informel, pour tester cette grille avant qu'elle ne serve pour de vrai.",
  },
  'Le Bâtisseur de confiance': {
    j30: "Identifier les relais communautaires de mon quartier ou de mon organisation — qui parle à qui.",
    j60: "Organiser une rencontre entre une institution locale et ces relais, avec un mandat clair.",
    j90: "Co-rédiger une fiche réflexe simple (alerte, entraide) et la tester avec les personnes concernées.",
  },
  'Le Négociateur': {
    j30: "Lister les ressources réellement disponibles (budget, temps, capital politique) pour un projet en cours.",
    j60: "Croiser ce budget avec un diagnostic écrit des besoins réels, pas supposés.",
    j90: "Formaliser un contrat ou un accord dont les termes sont publics et vérifiables par toutes les parties.",
  },
  'Le Gardien du long terme': {
    j30: "Repérer une urgence récurrente dans mon environnement que personne ne traite en profondeur.",
    j60: "Documenter les coûts cachés de la non-préparation à cette urgence.",
    j90: "Proposer une mesure structurelle, même modeste, et la présenter à qui peut l'institutionnaliser.",
  },
  'L\'Équilibriste': {
    j30: "Choisir une compétence à muscler en priorité parmi diagnostic, priorisation, ressources, communication, anticipation.",
    j60: "Trouver un contexte réel où l'exercer délibérément — un projet associatif, académique ou familial.",
    j90: "Demander un retour à quelqu'un qui a observé cette décision, et ajuster.",
  },
  'Le Praticien de terrain': {
    j30: "Nommer explicitement, par écrit, ma force et ma faiblesse actuelles en gestion de crise.",
    j60: "Trouver une occasion concrète d'exercer le chantier identifié.",
    j90: "Publier ou partager ce que cette expérience a changé dans ma façon de décider.",
  },
};

export function generateCommitment(profileNom) {
  return COMMITMENT_TEMPLATES[profileNom] || COMMITMENT_TEMPLATES['Le Praticien de terrain'];
}

export { COMPETENCES, COMPETENCE_LABELS };
