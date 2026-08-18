// Système de progression — Annexe 1, chapitres 7 et 8. Ajouté après le socle V1 sur demande
// explicite : cette annexe précise elle-même qu'elle est du chantier V1.5/V2.

// 7.1 — barème des sources d'XP. Le "quand" indique la portée anti-abus de la clé
// d'événement (voir engine/persistence.js) : 'partie' = unique par partie (sessionId inclus,
// se réinitialise à chaque rejouabilité) ; 'globale' = unique pour toujours sur cet appareil.
export const XP_BAREME = {
  NODE_RESOLVED: { xp: 15, portee: 'partie' },
  NODE_TIMED_BONUS: { xp: 5, portee: 'partie' },
  ACT_COMPLETE: { xp: 50, portee: 'partie' },
  SCENARIO_COMPLETE: { xp: 200, portee: 'partie' },
  PAYS_PREMIERE_FOIS: { xp: 100, portee: 'globale' },
  CARTE_DEBLOQUEE: { xp: 25, portee: 'globale' },
  QUESTION_OUVERTE: { xp: 40, portee: 'partie' },
  PARCOURS_CONTRASTE: { xp: 150, portee: 'partie' },
  DEUX_PAYS: { xp: 150, portee: 'globale' },
  CONSULTER_DOSSIER: { xp: 10, portee: 'partie' },
};

// 7.2 — courbe de niveaux : xpPourNiveau(n) = arrondi10(100 * n^1.6), cumulatif.
export function xpPourNiveau(n) {
  return Math.round((100 * Math.pow(n, 1.6)) / 10) * 10;
}

const NIVEAUX = Array.from({ length: 10 }, (_, i) => xpPourNiveau(i + 1));

export function niveauPourXp(xp) {
  let n = 0;
  for (let i = 0; i < NIVEAUX.length; i++) {
    if (xp >= NIVEAUX[i]) n = i + 1;
  }
  return n;
}

export function xpProchainNiveau(xp) {
  const n = niveauPourXp(xp);
  if (n >= NIVEAUX.length) return null;
  return NIVEAUX[n];
}

// 8.1 — l'échelle des grades. Les déblocages marqués `implemente: false` existent dans le
// document de référence mais demandent un contenu ou une infrastructure hors du périmètre
// actuel (mode difficile séparé, atelier de groupe, scénario bonus...) — annoncés comme
// « à venir » plutôt que simulés.
export const GRADES = [
  { niveau: 0, titre: 'Volontaire', deblocage: 'Accès aux deux scénarios de base.', implemente: true },
  { niveau: 1, titre: 'Agent de terrain', deblocage: 'Galerie des fins consultable.', implemente: true },
  { niveau: 2, titre: 'Chef d\'équipe', deblocage: 'Journal de partie exportable.', implemente: true },
  { niveau: 3, titre: 'Officier de liaison', deblocage: 'Palette « heure dorée » pour la ville.', implemente: true },
  { niveau: 4, titre: 'Coordinateur adjoint', deblocage: 'Mode commentaires du mentor.', implemente: false },
  { niveau: 5, titre: 'Coordinateur de crise', deblocage: 'Mode contrasté guidé.', implemente: false },
  { niveau: 6, titre: 'Directeur de cellule', deblocage: 'Scénario bonus « La canicule ».', implemente: false },
  { niveau: 7, titre: 'Conseiller régional', deblocage: 'Mode difficile (opt-in, hors évaluation comparée).', implemente: false },
  { niveau: 8, titre: 'Émissaire résilience', deblocage: 'Atelier : héberger une session de groupe.', implemente: false },
  { niveau: 9, titre: 'Bâtisseur de l\'avenir', deblocage: 'Insigne doré, mention au générique communautaire.', implemente: true },
];

// Les grades 9 et 10 (Émissaire résilience / Bâtisseur de l'avenir) sautent le niveau 9
// (3390 XP) exactement comme dans le document — aucun grade n'exige ce palier.
const GRADE_NIVEAU_REQUIS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 10];

export function gradePourXp(xp) {
  const niveau = niveauPourXp(xp);
  let idx = 0;
  for (let i = 0; i < GRADE_NIVEAU_REQUIS.length; i++) {
    if (niveau >= GRADE_NIVEAU_REQUIS[i]) idx = i;
  }
  return { index: idx, ...GRADES[idx] };
}

export function gradeSuivant(xp) {
  const { index } = gradePourXp(xp);
  if (index >= GRADES.length - 1) return null;
  return { ...GRADES[index + 1], xpRequis: xpPourNiveau(GRADE_NIVEAU_REQUIS[index + 1]) };
}
