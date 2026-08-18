// Déroulé minuté du jeu S1 — Document n°5, section 2.2/2.3. Le script verbatim est affiché à
// l'animateur comme aide-mémoire (téléprompteur), jamais lu par l'app à voix haute.
export const S1_PHASES = ['lobby', 'ancrage', 'manche1', 'revelation1', 'manche2', 'revelation2', 'cloture'];

export const S1_PHASE_INFO = {
  lobby: {
    titre: 'Salle d\'attente', minutage: '—',
    script: "Vous venez d'entendre des ministres décrire des crises qui ne viennent jamais seules. Dans les quinze prochaines minutes, on vérifie si VOUS savez les voir venir. Scannez le code — première question, trente secondes : quelle crise vous empêche de dormir, et où ?",
  },
  ancrage: {
    titre: 'Ancrage (pays + crise)', minutage: '0–3 min',
    script: "Regardez la carte derrière moi : c'est nous, ce sont nos urgences. Maintenant le jeu. Je vous donne UN choc de départ. Vous avez douze conséquences possibles sous les doigts : choisissez les quatre qui suivent vraiment, et mettez-les dans l'ordre où elles tombent. Attention — l'une des douze est un piège : elle a l'air logique, elle est fausse. Huit minutes au total, c'est parti.",
  },
  manche1: {
    titre: 'Manche 1 — la cascade', minutage: '3–6 min',
    script: "Choisissez les 4 cartes qui suivent vraiment le choc de départ, et ordonnez-les. Une carte sur les douze est un piège.",
  },
  revelation1: {
    titre: 'Révélation 1 — la cascade réelle', minutage: '6–8 min',
    script: "Stop. Voici comment la cascade tombe réellement — maillon par maillon. Levez la main si vous aviez le maillon 3... C'est le plus raté dans toutes les salles : l'effet de DEUXIÈME ordre. Le premier effet, tout le monde le voit. La polycrise, c'est le deuxième.",
  },
  manche2: {
    titre: 'Manche 2 — le point de rupture', minutage: '8–11 min',
    script: "Dernière manche, la seule qui compte pour la suite de votre journée : vous n'avez le budget que d'UNE intervention. Où la placez-vous pour casser le plus de dominos ?",
  },
  revelation2: {
    titre: 'Révélation 2 — le levier + le piège', minutage: '11–13 min',
    script: "Regardez : l'intervention gagnante n'est PAS sur le choc de départ. On n'empêche pas toujours la pluie — on choisit où l'eau ne passera pas. Retenez ce réflexe : cet après-midi, une norme internationale va vous donner la méthode pour le systématiser. C'est la Session 2.",
  },
  cloture: {
    titre: 'Clôture', minutage: '13–15 min',
    script: "Synthèse : votre salle a vu venir X % des effets de 2e ordre. Score doux affiché, badge « Cartographe du chaos », teaser S2.",
  },
};

export function nextS1Phase(current) {
  const idx = S1_PHASES.indexOf(current);
  if (idx < 0 || idx >= S1_PHASES.length - 1) return current;
  return S1_PHASES[idx + 1];
}

export function prevS1Phase(current) {
  const idx = S1_PHASES.indexOf(current);
  if (idx <= 0) return current;
  return S1_PHASES[idx - 1];
}
