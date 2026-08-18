// Mémoire inter-modules — Doc n°6 §5.3. Al-Wasl se souvient : un marqueur gagné dans un module
// (ex. Égypte) reste dans `state.marqueurs` quand le joueur enchaîne sur un autre module (ex.
// Maroc) dans la même session — cf. gameReducer.js (SELECT_COUNTRY hérite de
// `completedScenarios[*].marqueurs`). Ce fichier fournit le contenu narratif qui rend cette
// mémoire visible : la reconnaissance à l'entrée d'un nœud.
//
// Échantillon volontairement réduit (4 lignes, pas les "3-4 par figure" du document) : le reste
// est un chantier d'écriture à part, cf. Doc n°6 chantier "Fondations" pour la même limite posée
// sur la réécriture de prose. Ces lignes sont un premier jet à valider par un auteur.
export const NODE_RECOGNITION = {
  M1: [
    {
      marqueur: 'khaled_allie',
      expr: 'complice',
      ligne: "Le Doyen du port m'a parlé de vous. Si vous partagez vos chiffres comme vous l'avez fait là-bas, on devrait bien s'entendre.",
    },
  ],
  M2: [
    {
      marqueur: 'nour_alliee',
      expr: 'complice',
      ligne: "On m'a dit que vous saviez tenir un registre honnête pendant une urgence. Ici, c'est une terre qu'il faut compter, pas des lits — mais l'honnêteté, c'est la même.",
    },
  ],
  E1: [
    {
      marqueur: 'brahim_allie',
      expr: 'complice',
      ligne: "Un pacte tenu avec les irrigants, à ce qu'on raconte. On va voir si vous tenez aussi vos promesses avec la mer.",
    },
  ],
  E2: [
    {
      marqueur: 'salma_alliee',
      expr: 'complice',
      ligne: "La jeunesse d'Aïn Sarra dit du bien de vous. Ici aussi, on préfère un siège à la table qu'une promesse en l'air.",
    },
  ],
};

// Regroupement par figure des marqueurs d'alliance déjà utilisés par les badges (badges.js
// ALLIES_PAR_SCENARIO) — pas de nouveau marqueur inventé, juste une deuxième lecture de ceux qui
// existent déjà, pour la fiche civile (CareerScreen.jsx). `brahim_allie` est rattaché à
// `agricultrice` : Si Brahim est le second rôle de cette figure (cf. figures.js).
export const FIGURE_ALLY_MARKERS = {
  agricultrice: ['brahim_allie'],
  jeune_leader: ['salma_alliee'],
  doyen: ['khaled_allie'],
  volontaire: ['nour_alliee'],
};
