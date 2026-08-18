// JEU S1 · RÉACTION EN CHAÎNE — Document n°5, chapitre 2. Contenu transcrit intégralement
// (Cascade A, dominante climat/eau) + barème de scoring (2.5).

export const CRISE_OPTIONS = [
  'Sécheresse / stress hydrique', 'Inondation côtière', 'Canicule urbaine',
  'Insécurité alimentaire', 'Déplacement / migration forcée', 'Désinformation en temps de crise',
  'Choc économique / emploi des jeunes', 'Dégradation des sols / désertification',
];

export const CHOC_DEPART =
  "Troisième année de sécheresse dans une région agricole (pays fictif). Le barrage principal passe sous 15 %.";

// rangsAcceptes : positions (1-4) où cette carte compte comme « rang exact » si le participant
// l'y place. Une carte "vrai" hors de cette liste rapporte quand même le point de détection.
export const CASCADE_A = [
  { id: 1, texte: 'Chute des rendements agricoles', statut: 'vrai', rangsAcceptes: [1],
    note: "Effet direct — presque tout le monde l'a." },
  { id: 2, texte: 'Hausse des prix alimentaires en ville', statut: 'vrai', rangsAcceptes: [2],
    note: "La crise rurale devient urbaine par les prix : premier pont." },
  { id: 3, texte: 'Exode rural vers les quartiers informels', statut: 'vrai', rangsAcceptes: [3],
    note: "L'effet de 2e ordre le plus sous-estimé — il arrive AVANT la crise de l'eau urbaine." },
  { id: 4, texte: 'Tension sur l\'eau potable urbaine', statut: 'vrai', rangsAcceptes: [4],
    note: "Amplifiée par l'exode (maillon 3) : les effets se multiplient, ils ne s'additionnent pas." },
  { id: 5, texte: 'Rumeurs de détournement d\'eau, défiance', statut: 'vrai', rangsAcceptes: [5],
    note: "L'intégrité de l'information est une dimension de crise à part entière." },
  { id: 6, texte: 'Déscolarisation d\'enfants (corvée d\'eau, revenus)', statut: 'vrai', rangsAcceptes: [4],
    note: "Cascade éducative : chemin vrai alternatif au maillon 4." },
  { id: 7, texte: 'Baisse du tourisme balnéaire', statut: 'distracteur', rangsAcceptes: [],
    note: "Plausible mais hors périmètre du choc (région agricole intérieure)." },
  { id: 8, texte: 'Épidémie liée à l\'eau stockée insalubre', statut: 'vrai', rangsAcceptes: [],
    note: "Vrai mais en 3e rideau — le choisir dans le top 4 = sauter des étapes." },
  { id: 9, texte: 'PIÈGE : « La sécheresse fait baisser le niveau de la mer »', statut: 'piege', rangsAcceptes: [],
    note: "Le lien pseudo-logique : confusion d'échelles." },
  { id: 10, texte: 'Endettement des ménages agricoles', statut: 'vrai', rangsAcceptes: [2],
    note: "Chemin économique alternatif au maillon 2." },
  { id: 11, texte: 'Conflits d\'usage agriculteurs/éleveurs', statut: 'vrai', rangsAcceptes: [3],
    note: "Chemin social alternatif au maillon 3." },
  { id: 12, texte: 'Panne des réseaux électriques (hydroélectricité)', statut: 'vrai', rangsAcceptes: [2, 3],
    note: "Le lien eau-énergie — le pont sectoriel." },
];

export const INTERVENTIONS = [
  { id: 'puits', label: 'Forer de nouveaux puits d\'urgence', maillonsCasses: 1, gagnant: false,
    verdict: "Traite le symptôme du choc — levier faible, coût fort (et nappe non renouvelable)." },
  { id: 'filets', label: 'Filets sociaux + soutien au revenu rural', maillonsCasses: 3, gagnant: true,
    verdict: "LE levier gagnant : il casse le pont rural→urbain, là où la cascade s'amplifie." },
  { id: 'campagne', label: 'Campagne « tout va bien »', maillonsCasses: 0, gagnant: false,
    verdict: "L'anti-levier — la leçon d'intégrité de l'information (il crée de la défiance en plus)." },
  { id: 'fuites', label: 'Réparation des fuites du réseau urbain', maillonsCasses: 2, gagnant: false,
    verdict: "Bon levier aval — le meilleur si l'exode a déjà eu lieu : le timing d'une intervention fait son levier." },
  { id: 'stocks', label: 'Stocks alimentaires stratégiques', maillonsCasses: 1, gagnant: false,
    verdict: "Amortisseur utile, ne casse pas la dynamique." },
  { id: 'tourisme', label: 'Subvention du tourisme', maillonsCasses: 0, gagnant: false,
    verdict: "Répond au distracteur — ceux qui l'ont prise ont suivi la carte 7." },
];

const PIEGE_ID = 9;
const MAX_SCORE_POINTS = 4 /* vrai */ + 8 /* rang exact */ + 2 /* piège évité */ + 3 /* levier */;

// `chosenIds` : les 4 ids choisis, DANS L'ORDRE (position = rang proposé par le participant).
export function scoreManche1(chosenIds) {
  const cards = chosenIds.map((id) => CASCADE_A.find((c) => c.id === id));
  let vraiCount = 0;
  let rangExactCount = 0;
  cards.forEach((card, index) => {
    if (!card) return;
    const rangPropose = index + 1;
    if (card.statut === 'vrai') {
      vraiCount += 1;
      if (card.rangsAcceptes.includes(rangPropose)) rangExactCount += 1;
    }
  });
  const piegeEvite = !chosenIds.includes(PIEGE_ID);
  return {
    vraiCount, rangExactCount, piegeEvite,
    points: vraiCount * 1 + rangExactCount * 2 + (piegeEvite ? 2 : 0),
  };
}

export function scoreManche2(interventionId) {
  const intervention = INTERVENTIONS.find((i) => i.id === interventionId);
  return { gagnant: !!intervention?.gagnant, points: intervention?.gagnant ? 3 : 0 };
}

export function totalScoreSur10(manche1Points, manche2Points) {
  return Math.min(10, Math.round(((manche1Points + manche2Points) / MAX_SCORE_POINTS) * 10));
}

// Le maillon le plus « raté » selon le script (verbatim 2.3) — utilisé si l'agrégat réel
// ne peut pas être calculé (salle trop petite) : le fait pédagogique reste vrai dans tous les cas.
export const MAILLON_LE_PLUS_SOUS_ESTIME = 3;
