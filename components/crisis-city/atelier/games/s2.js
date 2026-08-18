// JEU S2 · 53001 EN MAIN — Document n°5, chapitre 3. Contenu transcrit intégralement.

export const FAMILLES = [
  'Contexte & parties prenantes', 'Leadership & responsabilités', 'Planification & risques',
  'Support', 'Opération', 'Évaluation & amélioration',
];

// Manche 1 — 6 situations flash (3.4)
export const SITUATIONS = [
  { id: 1, texte: "Le comité de crise du campus existe, mais personne ne sait qui décide quoi.",
    famille: 'Leadership & responsabilités',
    note: "Rôles, autorités et redevabilité non définis — le défaut n°1 des structures jeunes." },
  { id: 2, texte: "L'association a un super plan… écrit après avoir choisi les actions, pour le bailleur.",
    famille: 'Planification & risques',
    note: "La planification suit l'analyse de risques, elle ne la décore pas." },
  { id: 3, texte: "Les bénévoles changent chaque année et tout se réapprend de zéro.",
    famille: 'Support',
    note: "Compétences et connaissance organisationnelle : la mémoire est une ressource à gérer." },
  { id: 4, texte: "On a mené l'action, mais impossible de dire si ça a servi.",
    famille: 'Évaluation & amélioration',
    note: "Pas d'indicateurs définis AVANT l'action — la boucle amputée de son Check." },
  { id: 5, texte: "Le projet aide des déplacés, mais on n'a jamais parlé aux autorités locales ni aux hôtes.",
    famille: 'Contexte & parties prenantes',
    note: "Cartographie des parties intéressées absente." },
  { id: 6, texte: "Le jour J, chacun a improvisé sa procédure de distribution.",
    famille: 'Opération',
    note: "Maîtrise opérationnelle : des critères et des procédures pour l'action elle-même." },
];

// Manche 2 — 4 mini-projets, 5 ODD proposés, 2 vrais + 1 piège explicite (3.5)
export const MINI_PROJETS = [
  {
    id: 'fuites', nom: "Brigade étudiante de réparation des fuites d'eau du campus + tableau de bord public",
    odd: [4, 6, 11, 13, 14], vrais: [6, 11], piege: 14,
    legende: { 4: 'Éducation', 6: 'Eau propre', 11: 'Villes durables', 13: 'Climat', 14: 'Vie aquatique' },
    piegeNote: "« Vie aquatique » : proximité lexicale sans lien causal — le piège lexical.",
  },
  {
    id: 'numerique', nom: "Ateliers de compétences numériques pour jeunes déplacés, avec certification",
    odd: [1, 4, 8, 10, 16], vrais: [4, 8], piege: 16,
    legende: { 1: 'Pas de pauvreté', 4: 'Éducation', 8: 'Travail décent', 10: 'Inégalités réduites', 16: 'Paix et justice' },
    piegeNote: "« Paix et justice » : le contexte n'est pas l'effet du projet — le piège de contexte.",
  },
  {
    id: 'sel', nom: "Coopérative de cultures tolérantes au sel dans un delta",
    odd: [2, 5, 13, 15, 7], vrais: [2, 13], piege: 7,
    legende: { 2: 'Faim zéro', 5: 'Égalité des genres', 13: 'Climat', 15: 'Vie terrestre', 7: 'Énergie' },
    piegeNote: "« Énergie » : aucun volet énergie — le piège du remplissage.",
  },
  {
    id: 'rumeurs', nom: "Appli communautaire de signalement des rumeurs en crise, avec fact-checking",
    odd: [3, 9, 11, 16, 17], vrais: [16, 11], piege: 17,
    legende: { 3: 'Santé', 9: 'Innovation', 11: 'Villes durables', 16: 'Paix et justice', 17: 'Partenariats' },
    piegeNote: "« Partenariats » : avoir des partenaires n'est pas SERVIR l'ODD 17 — le piège du badge automatique.",
  },
];

// Manche 3 — portes d'entrée par profil (3.6)
export const PROFILS_PORTE_ENTREE = [
  {
    id: 'etudiant', label: 'Étudiant / association étudiante',
    options: [
      { id: 'a', texte: 'Viser la certification complète' },
      { id: 'b', texte: 'Autodiagnostic 1 page avec la carte (contexte + parties prenantes)' },
      { id: 'c', texte: 'Recruter un consultant' },
      { id: 'd', texte: "Attendre d'être une ONG enregistrée" },
    ],
    correct: 'b',
    note: "La norme s'applique par morceaux, en commençant par le contexte : « de l'association étudiante au ministère »." ,
  },
  {
    id: 'collectif', label: 'Conseil de jeunesse / collectif local',
    options: [
      { id: 'a', texte: 'Écrire la matrice rôles-responsabilités du collectif' },
      { id: 'b', texte: 'Créer un logo ODD' },
      { id: 'c', texte: "Demander un budget d'abord" },
      { id: 'd', texte: 'Rédiger 40 pages de procédures' },
    ],
    correct: 'a',
    note: "Leadership d'abord : qui décide, qui rend compte. Une page suffit pour commencer.",
  },
  {
    id: 'employe', label: "Employé / stagiaire d'une organisation",
    options: [
      { id: 'a', texte: 'Proposer un audit externe' },
      { id: 'b', texte: 'Cartographier ce que l\'organisation fait DÉJÀ qui correspond à la norme' },
      { id: 'c', texte: 'Créer un nouveau département' },
      { id: 'd', texte: 'Ne rien faire sans mandat' },
    ],
    correct: 'b',
    note: "L'alignement commence par l'existant : 80 % des pratiques sont déjà là, non nommées.",
  },
  {
    id: 'entrepreneur', label: 'Porteur de projet / entrepreneur',
    options: [
      { id: 'a', texte: "Définir 3 indicateurs d'effet AVANT la prochaine action" },
      { id: 'b', texte: 'Acheter la certification' },
      { id: 'c', texte: 'Ajouter les 17 ODD au site web' },
      { id: 'd', texte: 'Recruter un responsable qualité' },
    ],
    correct: 'a',
    note: "L'évaluation se conçoit avant l'action ; le pas qui coûte zéro et change tout.",
  },
];

export function scoreManche1(reponses) {
  // reponses: [{situationId, familleChoisie}]
  let points = 0;
  for (const r of reponses) {
    const situation = SITUATIONS.find((s) => s.id === r.situationId);
    if (situation && situation.famille === r.familleChoisie) points += 1;
  }
  return points;
}

export function scoreManche2(reponses) {
  // reponses: [{projetId, oddChoisis: [id, id]}]
  let points = 0;
  for (const r of reponses) {
    const projet = MINI_PROJETS.find((p) => p.id === r.projetId);
    if (!projet) continue;
    const exact = r.oddChoisis.length === 2 && projet.vrais.every((v) => r.oddChoisis.includes(v));
    if (exact) points += 1;
  }
  return points;
}

export function scoreManche3(profilId, choixId) {
  const profil = PROFILS_PORTE_ENTREE.find((p) => p.id === profilId);
  return profil && profil.correct === choixId ? 2 : 0;
}

const MAX_SCORE_POINTS = 6 /* manche1 */ + 4 /* manche2 */ + 2 /* manche3 */;

export function totalScoreSur10(m1, m2, m3) {
  return Math.min(10, Math.round(((m1 + m2 + m3) / MAX_SCORE_POINTS) * 10));
}
