// Casting récurrent d'Al-Wasl — Document n°6, section 5.2. Les 12 personnages des deux
// scénarios v1 fusionnent en 10 figures permanentes de la ville : chaque figure garde le
// portrait/caractère d'un personnage existant (data/characters.js, inchangé à 100 %) mais
// existe désormais dans toutes les crises, pas un seul scénario. "Le Gouverneur" (maroc) ne
// fait pas partie des 10 figures du document — son personnage reste dans CHARACTERS (rien
// n'est supprimé), simplement débranché du roster récurrent.
export const FIGURES = {
  scientifique: {
    id: 'scientifique', nom: 'La Scientifique', characterId: 'yousra',
    fonction: "Directrice de l'Observatoire des risques de la ville",
    arc: 'De conseillère à alliée : si on suit ses données 2 fois, elle défend publiquement au module 3.',
  },
  doyen: {
    id: 'doyen', nom: 'Le Doyen', characterId: 'khaled',
    fonction: "Doyen du port et d'Al-Sayadin, mémoire de la ville",
    arc: 'Sa confiance est le marqueur le plus précieux du jeu — lente à gagner, jamais reperdue si honorée.',
  },
  jeune_leader: {
    id: 'jeune_leader', nom: 'La Jeune Leader', characterId: 'salma',
    fonction: "Présidente du conseil jeunesse d'Al-Wasl",
    arc: 'Son organisation grandit de module en module si on lui donne des mandats réels.',
  },
  journaliste: {
    id: 'journaliste', nom: 'La Journaliste', characterId: 'leila',
    fonction: 'Rédactrice en chef, tour des médias',
    arc: 'Partenaire d\'information si traitée en alliée ; ses questions deviennent des pièges sinon.',
  },
  ingenieur: {
    id: 'ingenieur', nom: "L'Ingénieur", characterId: 'karim',
    fonction: 'Directeur des infrastructures',
    arc: 'Le baromètre de vérité technique : son silence en dit toujours plus long que ses rapports.',
  },
  politique: {
    id: 'politique', nom: 'La Politique', characterId: 'mona',
    fonction: "Gouverneure adjointe — l'arbitrage politique",
    arc: 'Apprend le style du joueur : elle anticipe ses choix au module 3, et le lui dit.',
  },
  capitaine: {
    id: 'capitaine', nom: 'Le Capitaine', characterId: 'tarek',
    fonction: 'Protection civile',
    arc: 'Le nombre de ses équipes disponibles dépend des exercices institutionnalisés aux modules précédents.',
  },
  volontaire: {
    id: 'volontaire', nom: 'La Volontaire', characterId: 'nour',
    fonction: 'Coordinatrice Croissant humanitaire',
    arc: 'De 120 à 300 volontaires si intégrée avec mandat deux fois.',
  },
  commercant: {
    id: 'commercant', nom: 'Le Commerçant', characterId: 'hamid',
    fonction: "Voix du souk et de l'économie du quotidien",
    arc: 'Son thé offert ou refusé en ouverture de dialogue = l\'indicateur de cohésion le plus lisible du jeu.',
  },
  agricultrice: {
    id: 'agricultrice', nom: "L'Agricultrice", characterId: 'fatma', secondaryCharacterId: 'brahim',
    fonction: 'Présidente de la coopérative agricole (Si Brahim, doyen des irrigants, second rôle)',
    arc: 'Le pacte agricole signé une fois devient un co-financement permanent.',
  },
};

export const FIGURE_IDS = Object.keys(FIGURES);
