// JEU S3 · LE COMITÉ D'INVESTISSEMENT — Document n°5, chapitre 4. Contenu transcrit intégralement
// (les 6 dossiers + l'audit) ; les déclinaisons de la manche 2 « le goulot » au-delà de la
// sécheresse (donnée en 4.5) sont adaptées au même gabarit — voir commentaire ADAPTATION.
import { CRISE_OPTIONS } from './s1.js';

export const DOSSIERS = [
  {
    id: 'second_souffle', nom: '« Second Souffle »',
    pitch: "Reconversion de 200 jeunes du tourisme sinistré vers la maintenance des réseaux d'eau, avec l'office national et certification à la clé.",
    pieces: ["Base : registre des 200 inscrits", 'Convention signée avec l\'office', 'Taux d\'insertion visé 60 % à 12 mois, audité'],
    verdict: 'financer', oddAffiches: [8, 6],
    signaux: "Base de départ chiffrée + indicateur d'EFFET (insertion, pas « formés ») + tiers vérificateur : les trois cases cochées.",
  },
  {
    id: 'agritech', nom: '« AgriTech Academy »',
    pitch: "Formation au numérique agricole pour zones touchées par la sécheresse.",
    pieces: ['Vidéo léchée', '« 5 000 jeunes sensibilisés »', "Partenariat avec une marque d'engrais"],
    verdict: 'ecarter', oddAffiches: [2],
    signaux: "Indicateur d'ACTIVITÉ (« sensibilisés ») sans effet mesuré ; le partenaire vend l'intrant que la sécheresse rend inefficace — l'activité sert le sponsor.",
  },
  {
    id: 'sdg_champions', nom: '« SDG Champions Platform »',
    pitch: "Plateforme qui « aligne la jeunesse sur les 17 ODD » avec badges numériques et sommet annuel.",
    pieces: ['Site magnifique', 'Les 17 logos ODD', "40 % du budget en événementiel"],
    verdict: 'ecarter', oddAffiches: Array.from({ length: 17 }, (_, i) => i + 1),
    signaux: "Alignement déclaré sur LES 17 ODD (= sur aucun) ; aucun bénéficiaire défini ; le budget raconte la vérité : c'est un projet de visibilité.",
  },
  {
    id: 'filets_filieres', nom: '« Filets & Filières »',
    pitch: "Coopérative de transformation du poisson par les femmes du littoral, chambre froide solaire incluse.",
    pieces: ['Étude de marché locale', '45 emplois directs chiffrés', 'Un seul ODD revendiqué (8) + co-bénéfices honnêtes'],
    verdict: 'financer', oddAffiches: [8],
    signaux: "La modestie du dossier EST le signal : un ODD revendiqué, des chiffres petits et vérifiables.",
  },
  {
    id: 'code4crisis', nom: '« Code4Crisis »',
    pitch: "Bootcamp de développeurs pour digitaliser les services d'urgence.",
    pieces: ['Programme solide', 'MAIS aucune donnée sur la demande locale', "Placement « espéré » dans des institutions non consultées"],
    verdict: 'hesiter', oddAffiches: [9],
    signaux: "Sincère mais goulot ignoré : on forme à une offre sans vérifier la demande — le goulot éducation→emploi. Finançable après étude.",
  },
  {
    id: 'green_ribbon', nom: '« Green Ribbon Initiative »',
    pitch: "Grande campagne médiatique « la jeunesse s'engage pour le climat » portée par un consortium.",
    pieces: ['Reach de 2 M de vues visé', 'Ruban vert', 'Budget célébrités'],
    verdict: 'ecarter', oddAffiches: [13],
    signaux: "Aucune chaîne activité→effet : la sensibilisation seule plafonne. Communiquer n'est pas agir.",
  },
];

// Barème (4.4) : +2 par bon financement, +2 par washing écarté, +1 hésitation documentée sur
// Code4Crisis, -1 par washing financé.
export function scoreVote({ finances, hesitations }) {
  let points = 0;
  for (const d of DOSSIERS) {
    const finance = finances.includes(d.id);
    if (d.verdict === 'financer') {
      points += finance ? 2 : 0;
    } else if (d.verdict === 'ecarter') {
      points += finance ? -1 : 2;
    } else if (d.verdict === 'hesiter') {
      if (!finance && hesitations.includes(d.id)) points += 1;
    }
  }
  return points;
}

const MAX_VOTE_POINTS = 2 * 2 /* bons financements */ + 3 * 2 /* washing écartés */ + 1 /* hésitation */;

export function voteScoreSur10(points) {
  return Math.max(0, Math.min(10, Math.round((points / MAX_VOTE_POINTS) * 10)));
}

// --- Manche 2 : le goulot (personnalisée) — 4.5 ---
// ADAPTATION : le document donne intégralement la déclinaison "sécheresse" et indique que trois
// autres (inondation/littoral, déplacement/post-conflit, crise de l'information) existent dans un
// fichier de contenu non fourni ici. Elles sont rédigées ci-dessous sur le même gabarit à 4
// options, plus une 5e (choc économique) au plus près du thème même de la session 3. Les 8
// options de crise (data/s1.js) sont raccordées à la déclinaison la plus proche.
export const GOULOT_DECLINAISONS = {
  secheresse: {
    titre: 'Sécheresse / stress hydrique',
    options: [
      { id: 'a', texte: 'Former 500 jeunes de plus aux métiers agricoles classiques', verdict: 'faible',
        lecon: "Former vers un secteur qui se contracte = aggraver le goulot." },
      { id: 'b', texte: 'Certifier les compétences EXISTANTES des jeunes ruraux (reconnaissance des acquis)', verdict: 'fort',
        lecon: "Le goulot n'est pas toujours le savoir : c'est souvent sa reconnaissance." },
      { id: 'c', texte: 'Bootcamp irrigation de précision + gestion de l\'eau, adossé aux employeurs locaux', verdict: 'fort',
        lecon: "Compétence de la transition + demande vérifiée : la formule anti-goulot complète." },
      { id: 'd', texte: "Bourses pour partir étudier à l'étranger", verdict: 'ambigu',
        lecon: "Utile individuellement, n'adresse pas le système — et peut nourrir la fuite des compétences." },
    ],
  },
  inondation: {
    titre: 'Inondation côtière',
    options: [
      { id: 'a', texte: "Former en masse des ingénieurs civils génériques", verdict: 'faible',
        lecon: "Sans ciblage littoral, on forme vers un métier déjà pourvu ailleurs." },
      { id: 'b', texte: "Certifier les savoir-faire locaux de construction résiliente (maçons, artisans)", verdict: 'fort',
        lecon: "Le goulot est la reconnaissance d'un savoir-faire déjà pratiqué, pas son absence." },
      { id: 'c', texte: "Bootcamp gestion des risques côtiers + alerte précoce, adossé aux protections civiles locales", verdict: 'fort',
        lecon: "Compétence de la transition + demande vérifiée auprès des employeurs réels." },
      { id: 'd', texte: "Envoyer des volontaires étrangers reconstruire à la place des habitants", verdict: 'ambigu',
        lecon: "Aide utile, mais prive l'économie locale de l'emploi de reconstruction — à débattre." },
    ],
  },
  deplacement: {
    titre: 'Déplacement / migration forcée',
    options: [
      { id: 'a', texte: "Former uniquement aux métiers du pays d'origine (non reconnus ici)", verdict: 'faible',
        lecon: "Former vers des compétences non reconnues dans le pays d'accueil aggrave le goulot." },
      { id: 'b', texte: "Certifier les compétences déjà acquises avant le déplacement", verdict: 'fort',
        lecon: "Le goulot est souvent la non-reconnaissance de qualifications déjà réelles." },
      { id: 'c', texte: "Bootcamp langue + numérique, adossé à des employeurs locaux qui recrutent", verdict: 'fort',
        lecon: "Compétence de la transition + demande vérifiée : la formule complète." },
      { id: 'd', texte: "Bourses pour poursuivre des études loin de la communauté d'accueil", verdict: 'ambigu',
        lecon: "Utile individuellement, peut retarder l'insertion locale — à débattre." },
    ],
  },
  desinformation: {
    titre: "Désinformation en temps de crise",
    options: [
      { id: 'a', texte: "Former uniquement des community managers à produire plus de contenu", verdict: 'faible',
        lecon: "Produire plus de contenu sans vérification aggrave le problème." },
      { id: 'b', texte: "Certifier les réflexes de vérification déjà pratiqués par journalistes et bénévoles locaux", verdict: 'fort',
        lecon: "Le goulot est la reconnaissance et l'outillage d'un réflexe déjà présent." },
      { id: 'c', texte: "Bootcamp fact-checking + outils, adossé aux médias et autorités locales", verdict: 'fort',
        lecon: "Compétence de la transition + demande vérifiée par des relais crédibles." },
      { id: 'd', texte: "Bourses pour former des ambassadeurs numériques à l'étranger", verdict: 'ambigu',
        lecon: "Utile en principe, mais loin du terrain où la rumeur circule réellement." },
    ],
  },
  emploi: {
    titre: 'Choc économique / emploi des jeunes',
    options: [
      { id: 'a', texte: "Multiplier les formations génériques « entrepreneuriat » sans filière porteuse", verdict: 'faible',
        lecon: "Former sans filière porteuse identifiée disperse l'effort." },
      { id: 'b', texte: "Certifier les compétences informelles déjà exercées (métiers non déclarés, mais réels)", verdict: 'fort',
        lecon: "Le goulot est souvent la non-reconnaissance d'un savoir-faire déjà existant." },
      { id: 'c', texte: "Bootcamp sur un secteur en croissance locale, adossé à des employeurs qui recrutent déjà", verdict: 'fort',
        lecon: "Compétence de la transition + demande vérifiée : la formule anti-goulot complète." },
      { id: 'd', texte: "Bourses pour étudier un domaine sans lien avec le marché local", verdict: 'ambigu',
        lecon: "Utile individuellement, n'adresse pas le système — et peut nourrir l'émigration des compétences." },
    ],
  },
};

// Crise déclarée (s1.js CRISE_OPTIONS) → déclinaison la plus proche.
export const CRISE_TO_GOULOT = {
  'Sécheresse / stress hydrique': 'secheresse',
  'Inondation côtière': 'inondation',
  'Canicule urbaine': 'secheresse',
  'Insécurité alimentaire': 'secheresse',
  'Déplacement / migration forcée': 'deplacement',
  'Désinformation en temps de crise': 'desinformation',
  'Choc économique / emploi des jeunes': 'emploi',
  'Dégradation des sols / désertification': 'secheresse',
};

export { CRISE_OPTIONS };

export function goulotFor(crise) {
  const key = CRISE_TO_GOULOT[crise] || 'emploi';
  return GOULOT_DECLINAISONS[key];
}

export function scoreGoulot(declinaison, choixId) {
  const option = declinaison.options.find((o) => o.id === choixId);
  if (!option) return 0;
  if (option.verdict === 'fort') return 2;
  if (option.verdict === 'ambigu') return 1;
  return 0;
}
