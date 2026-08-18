// Déroulé minuté du jeu S4 — Document n°5, section 5.2/5.3. Le plus long des quatre (18 min).
export const S4_PHASES = ['lobby', 'ecriture', 'banc_essai', 'retour', 'signature', 'cloture'];

export const S4_PHASE_INFO = {
  lobby: {
    titre: 'Salle d\'attente', minutage: '—',
    script: "Vous venez d'entendre trois personnes qui ont fait. Leur point commun n'est pas le talent — c'est qu'un jour, elles ont écrit une phrase avec un verbe, une date et un témoin. À votre tour.",
  },
  ecriture: {
    titre: 'L\'écriture', minutage: '0–5 min',
    script: "Cinq minutes, le gabarit est sous vos doigts : dans 30 jours je... dans 60... dans 90... Un conseil de la maison : petit et daté bat grand et vague, à tous les coups.",
  },
  banc_essai: {
    titre: 'Le banc d\'essai', minutage: '5–11 min',
    script: "Vos engagements partent au banc d'essai. Deux personnes dans cette salle — vous ne saurez pas qui — vont passer le vôtre au radar. Et vous ferez pareil pour deux autres. Soyez exigeants ET généreux : une ligne d'encouragement est obligatoire. On teste les plans, jamais les personnes.",
  },
  retour: {
    titre: 'Le retour et le durcissement', minutage: '11–15 min',
    script: "Vos verdicts sont arrivés. Regardez-les comme un cadeau : deux inconnus ont pris votre projet au sérieux. Quatre minutes pour durcir votre engagement — un partenaire nommé, une preuve datée. C'est maintenant qu'il devient réel.",
  },
  signature: {
    titre: 'La signature et le réseau', minutage: '15–18 min',
    script: "Regardez votre écran : deux personnes dans cette salle travaillent sur la même crise que vous — ce sont celles que vous venez de tester. Levez-vous, trouvez-vous, échangez un contact. Le radar est dans votre tête — mais dans six mois, ce qui restera du forum, ce sont ces deux prénoms. Allez-y.",
  },
  cloture: {
    titre: 'Clôture', minutage: '18 min',
    script: "Badge « Bâtisseur du Jour 1 ». Votre engagement est aussi enregistré côté Crisis City.",
  },
};

export function nextS4Phase(current) {
  const idx = S4_PHASES.indexOf(current);
  return idx < 0 || idx >= S4_PHASES.length - 1 ? current : S4_PHASES[idx + 1];
}
export function prevS4Phase(current) {
  const idx = S4_PHASES.indexOf(current);
  return idx <= 0 ? current : S4_PHASES[idx - 1];
}
