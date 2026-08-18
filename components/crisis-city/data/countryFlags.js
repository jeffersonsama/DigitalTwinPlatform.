// Couleurs civiques dérivées des drapeaux nationaux — donnée factuelle et publique (le drapeau
// officiel d'un pays), pas un choix d'interprétation culturelle comme un monument ou un toponyme.
// C'est la seule personnalisation par pays qui ne dépend pas de la validation native exigée par
// la LOI 2 du Doc n°6 (voir data/packs.js `resolveAutoPack`). Quand un drapeau est dominé par du
// blanc/noir, la deuxième couleur est une teinte dérivée plutôt qu'un choix arbitraire.
//
// Liste volontairement ouverte (~30 pays, mélange ICESCO + pays fréquents en test) : le repli est
// toujours la palette neutre existante, donc aucun besoin de couvrir tous les pays du monde pour
// que le mécanisme reste correct.
export const COUNTRY_FLAG_COLORS = {
  MA: { accent: '#c1272d', accent2: '#006233' }, // Maroc
  EG: { accent: '#ce1126', accent2: '#c09a3e' }, // Égypte
  SA: { accent: '#006c35', accent2: '#8fbf7a' }, // Arabie saoudite
  AE: { accent: '#ce1126', accent2: '#009739' }, // Émirats arabes unis
  TR: { accent: '#e30a17', accent2: '#f4c542' }, // Turquie
  PK: { accent: '#01411c', accent2: '#7bab6e' }, // Pakistan
  ID: { accent: '#ce1126', accent2: '#e8e2d5' }, // Indonésie
  MY: { accent: '#010066', accent2: '#cc0001' }, // Malaisie
  NG: { accent: '#008751', accent2: '#6fb98f' }, // Nigeria
  SN: { accent: '#00853f', accent2: '#fdef42' }, // Sénégal
  TN: { accent: '#e70013', accent2: '#f2c14e' }, // Tunisie
  DZ: { accent: '#006233', accent2: '#d21034' }, // Algérie
  JO: { accent: '#007a3d', accent2: '#ce1126' }, // Jordanie
  QA: { accent: '#8d1b3d', accent2: '#e8e2d5' }, // Qatar
  KW: { accent: '#007a3d', accent2: '#ce1126' }, // Koweït
  BH: { accent: '#ce1126', accent2: '#e8e2d5' }, // Bahreïn
  OM: { accent: '#db161b', accent2: '#008d36' }, // Oman
  LB: { accent: '#ee161f', accent2: '#00a651' }, // Liban
  IQ: { accent: '#ce1126', accent2: '#007a3d' }, // Irak
  SD: { accent: '#d21034', accent2: '#007229' }, // Soudan
  SO: { accent: '#4189dd', accent2: '#a9c8ec' }, // Somalie
  BD: { accent: '#006a4e', accent2: '#f42a41' }, // Bangladesh
  FR: { accent: '#0055a4', accent2: '#ef4135' }, // France
  ES: { accent: '#aa151b', accent2: '#f1bf00' }, // Espagne
  IT: { accent: '#009246', accent2: '#ce2b37' }, // Italie
  DE: { accent: '#dd0000', accent2: '#ffce00' }, // Allemagne
  GB: { accent: '#00247d', accent2: '#cf142b' }, // Royaume-Uni
  US: { accent: '#3c3b6e', accent2: '#b22234' }, // États-Unis
  CA: { accent: '#d80621', accent2: '#e8e2d5' }, // Canada
  BR: { accent: '#009739', accent2: '#fedd00' }, // Brésil
  IN: { accent: '#ff9933', accent2: '#138808' }, // Inde
};
