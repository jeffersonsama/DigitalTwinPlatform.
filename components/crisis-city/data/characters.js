// Casting — Document n°4, section 3.2. Briefs d'illustration transcrits, plus les paramètres
// nécessaires au générateur de portrait vectoriel (art/PortraitArt.jsx) : silhouette de coiffe/
// vêtement, accessoire signature, carnation, accent de palette — pensés pour rendre chaque
// personnage identifiable en silhouette seule, avant même le visage (test "plissement d'yeux").
export const CHARACTERS = {
  yousra: {
    id: 'yousra', pays: 'maroc', nom: 'Dr. Yousra Amrani', role: 'Hydrologue — la voix des données',
    age: 38, brief: "Tailleur sobre + foulard technique, tablette à la main, regard direct.",
    silhouette: 'foulard_tablette', accent: '#5a7a8c', carnation: 1, accessoire: 'tablette',
  },
  brahim: {
    id: 'brahim', pays: 'maroc', nom: 'Si Brahim Oulhaj', role: 'Président des agriculteurs — la terre',
    age: 60, brief: "Djellaba brune et chèche, mains marquées, canne d'olivier.",
    silhouette: 'djellaba_cheche', accent: '#8a5a3c', carnation: 2, accessoire: 'canne',
  },
  salma: {
    id: 'salma', pays: 'maroc', nom: 'Salma Idrissi', role: 'Présidente Chabab Aïn Sarra — la jeunesse',
    age: 22, brief: "Sweat associatif + keffieh, badge bénévole, mégaphone en bandoulière.",
    silhouette: 'sweat_keffieh', accent: '#c9564a', carnation: 1, accessoire: 'megaphone',
  },
  leila: {
    id: 'leila', pays: 'maroc', nom: 'Leïla Tazi', role: 'Journaliste radio — le récit',
    age: 45, brief: "Casque audio autour du cou, carnet, veste safran.",
    silhouette: 'casque_veste', accent: '#d9a253', carnation: 1, accessoire: 'carnet',
  },
  hamid: {
    id: 'hamid', pays: 'maroc', nom: 'Hamid Bennour', role: 'Commerçant du souk — l\'économie du quotidien',
    age: 50, brief: "Tablier sur chemise, calculette, thé à portée.",
    silhouette: 'tablier', accent: '#a86f45', carnation: 2, accessoire: 'theiere',
  },
  gouverneur: {
    id: 'gouverneur', pays: 'maroc', nom: 'Le Gouverneur', role: 'Autorité provinciale — la pression',
    age: 55, brief: "Costume sombre, drapeau en fond, lunettes tenues à la main.",
    silhouette: 'costume', accent: '#3d3428', carnation: 1, accessoire: 'lunettes',
  },
  mona: {
    id: 'mona', pays: 'egypte', nom: 'Mona Abdel-Rahman', role: 'Gouverneure adjointe — l\'arbitrage politique',
    age: 50, brief: "Tailleur bleu nuit, chignon strict, téléphone retourné sur la table.",
    silhouette: 'tailleur_chignon', accent: '#25384a', carnation: 1, accessoire: 'telephone',
  },
  karim: {
    id: 'karim', pays: 'egypte', nom: 'Ing. Karim Mansour', role: 'Protection côtière — la digue',
    age: 40, brief: "Gilet haute visibilité sur chemise, casque sous le bras, plans roulés.",
    silhouette: 'gilet_casque', accent: '#d9a23c', carnation: 2, accessoire: 'plans',
  },
  khaled: {
    id: 'khaled', pays: 'egypte', nom: 'Abou Khaled', role: 'Doyen des pêcheurs — la mémoire du rivage',
    age: 65, brief: "Galabeya grise, filet sur l'épaule, visage buriné.",
    silhouette: 'galabeya_filet', accent: '#6b7a7c', carnation: 3, accessoire: 'filet',
  },
  fatma: {
    id: 'fatma', pays: 'egypte', nom: 'Fatma Om Sayed', role: 'Porte-parole des exploitants — la terre qui sale',
    age: 48, brief: "Robe paysanne et châle, poignée de terre blanchie dans la main.",
    silhouette: 'robe_chale', accent: '#8a7a5c', carnation: 2, accessoire: 'terre',
  },
  tarek: {
    id: 'tarek', pays: 'egypte', nom: 'Cap. Tarek El-Shazly', role: 'Protection civile — l\'urgence',
    age: 38, brief: "Uniforme opérationnel, radio à l'épaule, lampe frontale relevée.",
    silhouette: 'uniforme_radio', accent: '#2e4a3c', carnation: 1, accessoire: 'radio',
  },
  nour: {
    id: 'nour', pays: 'egypte', nom: 'Nour Hassan', role: 'Croissant-Rouge — les volontaires',
    age: 26, brief: "Gilet Croissant-Rouge, brassard, liste de pointage.",
    silhouette: 'gilet_croissant', accent: '#c9564a', carnation: 1, accessoire: 'liste',
  },
};

// Cinq expressions : neutre, préoccupé (entrée par défaut), ferme/en colère, soulagé (3.3), et
// complice — le sourire de qui reconnaît le joueur (Doc n°6 §5.3, mémoire inter-modules).
export const EXPRESSIONS = ['neutre', 'preoccupe', 'ferme', 'soulage', 'complice'];
