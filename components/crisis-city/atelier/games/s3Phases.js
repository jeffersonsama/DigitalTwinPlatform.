// Déroulé minuté du jeu S3 — Document n°5, section 4.2/4.3. La phase « ancrage » (déclaration de
// la crise qui préoccupe le participant) est ajoutée pour que ce jeu reste jouable de façon
// indépendante (règle 1.2) — le document suppose la donnée déjà connue depuis S1.
export const S3_PHASES = ['lobby', 'ancrage', 'vote', 'audit', 'manche2', 'cloture'];

export const S3_PHASE_INFO = {
  lobby: {
    titre: 'Salle d\'attente', minutage: '—',
    script: "Ce matin, on vous a appris à repérer les cascades. À midi, on vous a donné la règle du lien démontrable. Maintenant on vous confie un budget. Cent unités, six projets, trois élus. Détail important : parmi ces six dossiers, certains sont sincères, certains sont... décorés. Personne ne vous dira lesquels. C'est exactement comme dans la vraie vie — sauf qu'aujourd'hui, dans un quart d'heure, vous aurez le corrigé.",
  },
  ancrage: {
    titre: 'Une question avant de commencer', minutage: '0–2 min',
    script: "Quelle crise vous préoccupe ? La manche 2 s'adaptera à votre réponse.",
  },
  vote: {
    titre: 'Manche 1 — l\'instruction des dossiers et le vote du comité', minutage: '2–10 min',
    script: "Le Fonds Jeunesse & Relèvement dispose de 100 unités. Six projets demandent chacun 40. Vous ne pouvez en financer que TROIS — à vous de flairer lesquels tiennent leurs promesses.",
  },
  audit: {
    titre: 'Révélation — l\'audit', minutage: '10–13 min',
    script: "Les jeux sont faits. Avant l'audit, une question : qui a financé la plateforme « SDG Champions » ? Levez la main, soyez fiers, vous êtes nombreux — et c'est normal : c'est le dossier le mieux ÉCRIT des six. C'est précisément pour ça qu'on va l'auditer en premier.",
  },
  manche2: {
    titre: 'Manche 2 — le goulot', minutage: '13–15 min',
    script: "Le radar anti-washing que vous venez de construire tient en quatre questions : où est la base de départ ? où est l'indicateur d'EFFET ? qui le vérifie ? et l'activité sert-elle l'ODD affiché ou l'image de l'organisation ? Gardez-les : la Session 4 vous demande dans une heure d'écrire VOTRE engagement.",
  },
  cloture: {
    titre: 'Clôture', minutage: '15 min',
    script: "Synthèse du portefeuille de la salle avant/après audit, score doux, badge « Détecteur de washing ».",
  },
};

export function nextS3Phase(current) {
  const idx = S3_PHASES.indexOf(current);
  return idx < 0 || idx >= S3_PHASES.length - 1 ? current : S3_PHASES[idx + 1];
}
export function prevS3Phase(current) {
  const idx = S3_PHASES.indexOf(current);
  return idx <= 0 ? current : S3_PHASES[idx - 1];
}
