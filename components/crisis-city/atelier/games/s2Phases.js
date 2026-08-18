// Déroulé minuté du jeu S2 — Document n°5, section 3.2/3.3.
export const S2_PHASES = ['lobby', 'manche1', 'revelation1', 'manche2', 'revelation2', 'manche3', 'cloture'];

export const S2_PHASE_INFO = {
  lobby: {
    titre: 'Salle d\'attente', minutage: '—',
    script: "On vient de vous remettre une carte de référence. Dans la vraie vie, personne ne connaît une norme par cœur — les professionnels savent OÙ chercher. Ce jeu se joue donc carte en main : c'est même la règle. Douze minutes pour transformer ce papier en réflexe.",
  },
  manche1: {
    titre: 'Manche 1 — Quelle famille de clauses ?', minutage: '1–4 min',
    script: "Sortez la carte qu'on vient de vous donner. Ce jeu se joue AVEC elle. Six situations flash : à chaque fois, quelle famille du système de management est en cause ?",
  },
  revelation1: {
    titre: 'Révélation 1', minutage: '4–6 min',
    script: "Regardez ce que vous venez de faire sans vous en rendre compte : six situations réelles, et vous avez su dire à chaque fois QUEL étage du système était en panne. C'est ça, la littératie d'une norme — pas la réciter : diagnostiquer avec.",
  },
  manche2: {
    titre: 'Manche 2 — Le vrai ODD', minutage: '6–9 min',
    script: "Quatre mini-projets. Pour chacun, choisissez les 2 ODD réellement servis parmi 5 proposés — un piège par projet.",
  },
  revelation2: {
    titre: 'Révélation 2 — le lien démontrable', minutage: '9–10 min',
    script: "Retenez la règle qui a corrigé vos réponses, elle resservira dans une heure : un projet ne « contribue » pas à un ODD parce que son affiche le dit — il y contribue si on peut tracer activité, effet mesurable, cible. La Session 3 va vous montrer des gens qui oublient cette règle... parfois volontairement.",
  },
  manche3: {
    titre: 'Manche 3 — Votre porte d\'entrée', minutage: '10–12 min',
    script: "Personnalisée selon votre profil : quel est le premier pas 53001 réaliste, parmi quatre ?",
  },
  cloture: {
    titre: 'Clôture', minutage: '12 min',
    script: "Synthèse, score doux, badge « Permis 53001 ».",
  },
};

export function nextS2Phase(current) {
  const idx = S2_PHASES.indexOf(current);
  return idx < 0 || idx >= S2_PHASES.length - 1 ? current : S2_PHASES[idx + 1];
}
export function prevS2Phase(current) {
  const idx = S2_PHASES.indexOf(current);
  return idx <= 0 ? current : S2_PHASES[idx - 1];
}
