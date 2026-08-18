// JEU S4 · LE BANC D'ESSAI DES 90 JOURS — Document n°5, chapitre 5. Le gabarit et le radar (5.4)
// sont transcrits intégralement. Le routage (5.5 : « par proximité de crise déclarée, jamais par
// pays identique ») suppose une base de préoccupations déjà connue (alimentée par S1) — pour que
// ce jeu reste jouable de façon indépendante (règle 1.2), le routage est ici une rotation
// déterministe entre pairs de la MÊME session (participant i teste i+1 et i+2, modulo le nombre
// de participants) : chacun teste 2 pairs, chacun est testé par 2 pairs, sans table d'assignation
// centrale à construire. ADAPTATION documentée, pas la proximité de crise fine du document.

export const RADAR_QUESTIONS = [
  { id: 'faisable', texte: 'Le pas des 30 jours est-il faisable par une personne seule, sans budget ?' },
  { id: 'partenaire', texte: 'Y a-t-il un partenaire NOMMÉ quelque part ?' },
  { id: 'preuve', texte: 'La preuve des 90 jours serait-elle visible par un inconnu ?' },
  { id: 'systemique', texte: "L'action attaque-t-elle un maillon de la cascade, ou seulement le symptôme ?" },
];

export const REPONSE_POINTS = { oui: 2, presque: 1, non: 0 };

export function emptyEngagement() {
  return { verbe: '', objet: '', partenaire: '', preuve: '' };
}

export function engagementText(e) {
  if (!e) return '';
  return `${e.verbe} ${e.objet} — avec ${e.partenaire} — preuve : ${e.preuve}`;
}

export function engagementComplet(e) {
  return !!(e && e.verbe && e.objet && e.partenaire && e.preuve);
}

// Choisit jusqu'à 2 pairs distincts à tester, en excluant soi-même — rotation déterministe.
export function computeTargets(participants, ownId) {
  const ids = participants.map((p) => p.id);
  const idx = ids.indexOf(ownId);
  if (idx < 0 || ids.length < 2) return [];
  const targets = [];
  const t1 = ids[(idx + 1) % ids.length];
  if (t1 !== ownId) targets.push(t1);
  const t2 = ids[(idx + 2) % ids.length];
  if (t2 !== ownId && t2 !== t1) targets.push(t2);
  return targets;
}

export function radarScore(reponses) {
  return RADAR_QUESTIONS.reduce((sum, q) => sum + (REPONSE_POINTS[reponses[q.id]] ?? 0), 0);
}
