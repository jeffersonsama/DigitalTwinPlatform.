// Bible de style — Document n°4, section 8.1.
//
// Parti pris : sans outil de génération d'images, on ne simule pas la peinture semi-réaliste —
// on assume un style « théâtre d'ombres géométrique » : silhouettes plates à arêtes franches,
// lumière chaude directionnelle en dégradé, contours implicites (jamais de trait noir), grain
// léger uniforme. C'est un parti pris vectoriel cohérent, pas un repli — mais il respecte
// l'esprit du document (pas de photoréalisme, "vallée de l'étrange" évitée, silhouettes pour les
// foules). Portraits (art/PortraitArt.jsx) et décors (art/DecorArt.jsx) partagent ces tokens pour
// ne jamais se contredire visuellement.

export const PALETTES = {
  maroc: {
    nom: 'Aïn Sarra',
    fond: '#2a1d12', // nuit ocre profonde, base des dégradés de ciel
    ciel: ['#f2c98a', '#e08a4e', '#3d2417'], // aube/jour/nuit — interpolés selon l'acte
    accent: '#d9a253', // ocre — mobilier, accents lumineux
    accent2: '#5f7a52', // vert palmeraie
    terre: '#8a5a3c',
    pierre: '#c7a878',
    peau: ['#d9a873', '#c48a5c', '#a86f45'], // variations de carnation du casting
    crise: { teinte: 24, saturation: 0.35, luminosite: -0.08 }, // brume ocre — filtre CSS
  },
  egypte: {
    nom: 'El-Bahriya',
    fond: '#0d1f26',
    ciel: ['#dce8ea', '#4a7a8c', '#0a1a22'],
    accent: '#2e7a8c', // bleu méditerranée
    accent2: '#7bc4c4',
    terre: '#6b5a3c', // Delta / sel
    pierre: '#8f9296', // digue en enrochements
    peau: ['#c98a5c', '#a8734a', '#8a5c3a'],
    crise: { teinte: 200, saturation: 0.3, luminosite: -0.22 }, // nuit de tempête — filtre CSS
  },
};

// Lumière chaude directionnelle unique (haut-gauche) — tous les dégradés de mise en volume
// (portraits et décors) utilisent le même angle pour rester cohérents entre les deux systèmes.
export const LIGHT_ANGLE_DEG = 128;

export function ligne(pays) {
  return PALETTES[pays].terre;
}

// Grain léger uniforme — un filtre SVG partagé, référencé par son id depuis les deux systèmes.
export const GRAIN_FILTER_ID = 'cc-grain';

export function GrainDefs() {
  return (
    <filter id={GRAIN_FILTER_ID} x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="noise" />
      <feColorMatrix in="noise" type="saturate" values="0" />
      <feComponentTransfer><feFuncA type="linear" slope="0.05" /></feComponentTransfer>
      <feComposite operator="over" in2="SourceGraphic" />
    </filter>
  );
}

// Filtre CSS de "palette de crise" (4.3) — un réglage, pas une nouvelle illustration.
export function crisisFilterCss(pays, actif) {
  const c = PALETTES[pays].crise;
  if (!actif) return 'none';
  return `hue-rotate(${c.teinte}deg) saturate(${1 + c.saturation}) brightness(${1 + c.luminosite})`;
}
