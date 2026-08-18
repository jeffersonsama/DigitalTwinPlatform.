// Portraits de personnages — Document n°4, §3.2 (casting) et §3.3 (expressions & micro-animations).
//
// Parti pris (cf. art/styleBible.jsx) : « théâtre d'ombres géométrique ». Aucune image externe,
// aucune dépendance : chaque buste est dessiné en SVG paramétrique. Contours implicites (jamais
// de trait noir : on utilise une version assombrie et désaturée de la couleur de base), volumes
// obtenus par aplats + une nappe de lumière directionnelle unique (LIGHT_ANGLE_DEG) appliquée en
// `soft-light` par-dessus toute la vignette — ce qui garantit que les 12 personnages, et les
// décors qui partagent la même bible, sont éclairés exactement pareil.
//
// Chaque personnage possède sa propre géométrie (largeur/inclinaison de tête, pente d'épaules,
// coiffe, pilosité, accessoire au premier plan) : l'objectif est le « test du plissement d'yeux »
// — reconnaître qui parle à la silhouette seule, avant tout détail de visage.

import { useEffect, useId, useMemo, useRef } from 'react';
import { CHARACTERS } from '../data/characters.js';
import { PALETTES, LIGHT_ANGLE_DEG, GRAIN_FILTER_ID, GrainDefs } from './styleBible.jsx';
import './PortraitArt.css';

const VB_W = 100;
const VB_H = 120;

/* ------------------------------------------------------------------ couleurs */

const INK = '#211913'; // brun très sombre — remplace le noir pur, jamais de #000
const GLOW = '#fff3dc';

function hexToRgb(hex) {
  let h = String(hex).replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
const byte = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
const toHex = (r, g, b) => `#${byte(r)}${byte(g)}${byte(b)}`;

function mix(a, b, t) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return toHex(A.r + (B.r - A.r) * t, A.g + (B.g - A.g) * t, A.b + (B.b - A.b) * t);
}
function desat(hex, t) {
  const { r, g, b } = hexToRgb(hex);
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  return toHex(r + (y - r) * t, g + (y - g) * t, b + (y - b) * t);
}
const lighten = (c, t = 0.22) => mix(c, GLOW, t);
const darken = (c, t = 0.28) => mix(c, INK, t);
/** Contour implicite : la base assombrie *et* désaturée — jamais un trait noir. */
const edge = (c, t = 0.42) => desat(mix(c, INK, t), 0.3);

/** Vecteur de dégradé dérivé de LIGHT_ANGLE_DEG (convention CSS : 0° = vers le haut). */
const LIGHT_VEC = (() => {
  const rad = ((LIGHT_ANGLE_DEG - 90) * Math.PI) / 180;
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);
  return {
    x1: (0.5 - dx / 2).toFixed(4),
    y1: (0.5 - dy / 2).toFixed(4),
    x2: (0.5 + dx / 2).toFixed(4),
    y2: (0.5 + dy / 2).toFixed(4),
  };
})();

/* ------------------------------------------------------------ géométrie de base */

const BASE_GEO = {
  cx: 50,
  headCy: 39,
  headW: 15.2,
  headH: 21,
  jaw: 8.4,
  tilt: 0,
  neckHalf: 5,
};

const BASE_BUST = { neckY: 69, hl: 31, hr: 31, riseL: 28, riseR: 28, lean: 0, bottom: 120 };

function headPath(g) {
  const { cx, headCy: cy, headW: w, headH: h, jaw } = g;
  return [
    `M ${cx - w} ${cy - h * 0.25}`,
    `C ${cx - w} ${cy - h * 1.05} ${cx + w} ${cy - h * 1.05} ${cx + w} ${cy - h * 0.25}`,
    `C ${cx + w} ${cy + h * 0.55} ${cx + jaw} ${cy + h} ${cx} ${cy + h}`,
    `C ${cx - jaw} ${cy + h} ${cx - w} ${cy + h * 0.55} ${cx - w} ${cy - h * 0.25}`,
    'Z',
  ].join(' ');
}

function neckPath(g, bust) {
  const { cx, neckHalf: nh, headCy, headH } = g;
  const top = headCy + headH - 8;
  return `M ${cx - nh} ${top} L ${cx - nh} ${bust.neckY + 1} Q ${cx} ${bust.neckY + 6} ${cx + nh} ${bust.neckY + 1} L ${cx + nh} ${top} Z`;
}

/** Buste en cloche : deux cubiques symétriques depuis la base du cou vers le bas du cadre. */
function bustPath(b) {
  const { neckY, hl, hr, riseL, riseR, lean, bottom } = { ...BASE_BUST, ...b };
  const cx = 50 + lean;
  const l = cx - hl;
  const r = cx + hr;
  return [
    `M ${cx} ${neckY - 2}`,
    `C ${cx + 14} ${neckY + 1} ${r - 4} ${bottom - riseR} ${r} ${bottom}`,
    `L ${l} ${bottom}`,
    `C ${l} ${bottom - riseL} ${cx - 14} ${neckY + 1} ${cx} ${neckY - 2}`,
    'Z',
  ].join(' ');
}

/* --------------------------------------------------------------- expressions */
// Chaque expression modifie réellement les traits : hauteur et inclinaison de chaque extrémité
// de sourcil, ouverture de l'œil (via la paupière), largeur et courbure de la bouche, rides
// du lion. Aucune n'est un simple changement de couleur.

const EXPR_PARAMS = {
  neutre: {
    browY: 0, browIn: 0, browOut: 0, browArch: 1.0,
    lid: 0.10, eyeH: 1.0, mouthW: 1.0, mouthCurve: 0.3, mouthY: 0, frown: 0, gaze: 0,
  },
  preoccupe: {
    // sourcils intérieurs relevés (inquiétude), bouche pincée et légèrement tombante
    browY: -0.7, browIn: -2.3, browOut: 1.3, browArch: 1.3,
    lid: 0.20, eyeH: 0.96, mouthW: 0.84, mouthCurve: -0.3, mouthY: 0.6, frown: 0.7, gaze: -0.35,
  },
  ferme: {
    // sourcils abaissés et rentrants (colère froide), bouche droite/tombante, yeux plissés
    browY: 1.9, browIn: 2.5, browOut: -1.5, browArch: 0.55,
    lid: 0.34, eyeH: 0.80, mouthW: 0.96, mouthCurve: -0.95, mouthY: 0.3, frown: 1, gaze: 0,
  },
  soulage: {
    // sourcils remontés et détendus, yeux mi-clos, sourire large
    browY: -1.5, browIn: -0.7, browOut: -0.9, browArch: 1.35,
    lid: 0.44, eyeH: 0.74, mouthW: 1.14, mouthCurve: 1.55, mouthY: -0.3, frown: 0, gaze: 0.15,
  },
  complice: {
    // Doc n°6 §5.3 (mémoire inter-modules) : le sourire de qui reconnaît le joueur — chaleureux
    // et détendu comme "soulage" mais plus contenu (pas un sourire de soulagement), regard qui
    // va vers le joueur plutôt que vers le décor.
    browY: -0.8, browIn: -0.4, browOut: -0.6, browArch: 1.15,
    lid: 0.28, eyeH: 0.88, mouthW: 1.05, mouthCurve: 0.85, mouthY: -0.1, frown: 0, gaze: 0.25,
  },
};

/* --------------------------------------------------------- briques réutilisables */

function Hand({ x, y, r = 0, s = 1, fill, shade }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <path
        d="M -3.6 -2.4 C -1.4 -4.8 3 -4.6 4.2 -2 C 5.4 0.6 4.2 3.6 1.2 4.2 C -1.8 4.8 -4.2 3.4 -4.6 0.8 C -4.8 -0.6 -4.4 -1.7 -3.6 -2.4 Z"
        fill={fill}
      />
      <path
        d="M -1.8 3.9 C 0.4 4.4 2.6 3.7 3.7 2"
        fill="none"
        stroke={shade}
        strokeWidth="0.7"
        strokeLinecap="round"
        opacity="0.7"
      />
    </g>
  );
}

/** Avant-bras : un simple trait épais arrondi, dans la couleur du vêtement. */
function Arm({ d, fill, w = 9 }) {
  return <path d={d} fill="none" stroke={fill} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />;
}

/* ------------------------------------------------------------------- le visage */

function Face({ k }) {
  const { g, ex, look } = k;
  const cx = g.cx;
  const eyeY = g.headCy + 2.6;
  const browY = g.headCy - 4.6;
  const noseY = g.headCy + 8.6;
  const mouthY = g.headCy + 13.9 + (look.mouthDy || 0);
  const eyeDx = g.headW * 0.415;
  const ew = 3.5;
  const eh = 2.55 * ex.eyeH;

  const lidBottom0 = eyeY - eh * 0.875;
  const lidDrop = ex.lid * eh * 1.5;
  const blinkDrop = Math.max(1.5, eh * 1.95 - lidDrop);
  const blinkStyle = { '--cc-blink-drop': `${blinkDrop.toFixed(2)}px` };
  const blinkCls = k.animate ? 'cc-eyelid is-blinking' : 'cc-eyelid';

  const eye = (s) => {
    const ecx = cx + s * eyeDx;
    const almond =
      `M ${ecx - ew} ${eyeY} Q ${ecx} ${eyeY - eh * 1.75} ${ecx + ew} ${eyeY}` +
      ` Q ${ecx} ${eyeY + eh * 1.45} ${ecx - ew} ${eyeY} Z`;
    const clipId = k.id(`eye${s < 0 ? 'L' : 'R'}`);
    return (
      <g key={s}>
        <clipPath id={clipId}>
          <path d={almond} />
        </clipPath>
        <g clipPath={`url(#${clipId})`}>
          <path d={almond} fill={k.sclera} />
          <ellipse
            cx={ecx + ex.gaze}
            cy={eyeY - 0.15}
            rx="1.8"
            ry={Math.min(1.8, eh * 0.85)}
            fill={k.iris}
          />
          <circle cx={ecx + ex.gaze} cy={eyeY - 0.15} r="0.85" fill={INK} />
          <circle cx={ecx + ex.gaze - 0.75} cy={eyeY - 1.05} r="0.5" fill="#fffaf0" opacity="0.85" />
          {/* décalage statique dû à l'expression, puis clignement animé par-dessus */}
          <g transform={`translate(0 ${lidDrop.toFixed(2)})`}>
            <g className={blinkCls} style={blinkStyle}>
              <rect
                x={ecx - ew - 1.6}
                y={lidBottom0 - eh * 3}
                width={ew * 2 + 3.2}
                height={eh * 3}
                fill={k.skinLid}
              />
              <rect x={ecx - ew - 1.6} y={lidBottom0} width={ew * 2 + 3.2} height="1.05" fill={k.lash} />
            </g>
          </g>
        </g>
        {/* commissure externe : petit trait de cil qui déborde de l'amande */}
        <path
          d={`M ${ecx + s * (ew - 0.4)} ${eyeY - 0.5} L ${ecx + s * (ew + 1.5)} ${eyeY - 1.2}`}
          stroke={k.lash}
          strokeWidth="0.85"
          strokeLinecap="round"
          opacity="0.75"
        />
      </g>
    );
  };

  const brow = (s) => {
    const ecx = cx + s * eyeDx;
    const bw = 4.9;
    const ox = ecx + s * bw;
    const ix = ecx - s * bw;
    const oy = browY + ex.browY + ex.browOut;
    const iy = browY + ex.browY + ex.browIn;
    const my = Math.min(oy, iy) - 2.4 * ex.browArch;
    return (
      <path
        key={s}
        d={`M ${ox} ${oy.toFixed(2)} Q ${ecx} ${my.toFixed(2)} ${ix} ${iy.toFixed(2)}`}
        fill="none"
        stroke={k.brow}
        strokeWidth={look.browW || 2.4}
        strokeLinecap="round"
      />
    );
  };

  const mw = 4.9 * ex.mouthW;
  const my = mouthY + ex.mouthY;
  const lift = ex.mouthCurve * 1.15;
  const depth = ex.mouthCurve * 2.5;
  const mouthLine = `M ${cx - mw} ${(my - lift).toFixed(2)} Q ${cx} ${(my + depth).toFixed(2)} ${cx + mw} ${(my - lift).toFixed(2)}`;
  const lowerLip =
    `M ${cx - mw * 0.86} ${(my - lift + 0.35).toFixed(2)}` +
    ` Q ${cx} ${(my + depth + 2.1).toFixed(2)} ${cx + mw * 0.86} ${(my - lift + 0.35).toFixed(2)}` +
    ` Q ${cx} ${(my + depth + 0.5).toFixed(2)} ${cx - mw * 0.86} ${(my - lift + 0.35).toFixed(2)} Z`;

  return (
    <g>
      {/* ombre portée du côté opposé à la lumière (lumière haut-gauche => ombre bas-droite) */}
      <path
        d={
          `M ${cx + 2.6} ${g.headCy - g.headH * 0.92}` +
          ` C ${cx + g.headW} ${g.headCy - g.headH * 0.7} ${cx + g.headW} ${g.headCy + g.headH * 0.42} ${cx + g.jaw * 0.62} ${g.headCy + g.headH * 0.93}` +
          ` C ${cx + g.headW * 0.78} ${g.headCy + g.headH * 0.5} ${cx + g.headW * 0.62} ${g.headCy - g.headH * 0.38} ${cx + 2.6} ${g.headCy - g.headH * 0.92} Z`
        }
        fill={k.skinD}
        opacity="0.4"
      />
      {look.ears !== false && (
        <>
          <ellipse cx={cx - g.headW + 0.7} cy={g.headCy + 3.4} rx="1.9" ry="3" fill={mix(k.skin, k.skinD, 0.55)} />
          <ellipse cx={cx + g.headW - 0.7} cy={g.headCy + 3.4} rx="1.9" ry="3" fill={k.skinD} />
          <path
            d={`M ${cx - g.headW + 0.4} ${g.headCy + 2} C ${cx - g.headW + 1.6} ${g.headCy + 3} ${cx - g.headW + 1.4} ${g.headCy + 4.6} ${cx - g.headW + 0.6} ${g.headCy + 5.4}`}
            fill="none"
            stroke={k.skinE}
            strokeWidth="0.6"
            opacity="0.55"
          />
        </>
      )}
      {[-1, 1].map(eye)}
      {[-1, 1].map(brow)}
      {ex.frown > 0 && (
        <g stroke={k.skinE} strokeWidth="0.75" strokeLinecap="round" opacity={0.55 * ex.frown}>
          <path d={`M ${cx - 1.5} ${browY + 1.8} L ${cx - 1.9} ${browY + 4.6}`} />
          <path d={`M ${cx + 1.5} ${browY + 1.8} L ${cx + 1.9} ${browY + 4.6}`} />
        </g>
      )}
      <path
        d={
          `M ${cx - 0.6} ${noseY - 5.6} C ${cx + 1.1} ${noseY - 2.4} ${cx + 2.5} ${noseY - 0.6} ${cx + 1.7} ${noseY + 0.8}` +
          ` C ${cx + 0.7} ${noseY + 1.9} ${cx - 1.3} ${noseY + 1.7} ${cx - 2.1} ${noseY + 0.4}`
        }
        fill="none"
        stroke={k.skinE}
        strokeWidth="1.15"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
      {look.Beard ? look.Beard(k) : null}
      <path d={lowerLip} fill={k.lipSoft} opacity="0.7" />
      <path d={mouthLine} fill="none" stroke={k.lip} strokeWidth="1.9" strokeLinecap="round" />
      {look.Moustache ? look.Moustache(k) : null}
    </g>
  );
}

/* ------------------------------------------------------------------ les 12 rôles */
// Chaque entrée décrit une silhouette entière : géométrie du crâne, pente d'épaules,
// arrière-plan, vêtement, coiffe (derrière/devant), pilosité et accessoire signature.
// Rien n'est partagé entre deux personnages hormis les primitives de tête et de visage.

const LOOKS = {
  /* ---------- MAROC ---------- */

  // Voile technique ajusté + tailleur sobre + tablette : silhouette en goutte, épaules nettes.
  yousra: {
    geo: { headW: 14.6, headH: 20.4, jaw: 8, tilt: -1.5 },
    bust: { neckY: 70, hl: 27, hr: 28, riseL: 27, riseR: 25 },
    ears: false,
    hairColor: '#2a2320',
    Body: (k) => {
      const veste = darken(k.acc, 0.55);
      const chemise = lighten(k.P.pierre, 0.35);
      return (
        <g>
          <path d={bustPath({ neckY: 70, hl: 27, hr: 28, riseL: 27, riseR: 25 })} fill={veste} />
          <path d="M 50 74 L 43.4 81 L 48.2 120 L 51.8 120 L 56.6 81 Z" fill={chemise} />
          <path d="M 44.6 76.6 L 35.6 84 L 37.6 92.6 L 45.6 85.6 L 49 120 L 42 120 Z" fill={lighten(veste, 0.1)} />
          <path d="M 55.4 76.6 L 64.4 84 L 62.4 92.6 L 54.4 85.6 L 51 120 L 58 120 Z" fill={darken(veste, 0.12)} />
          <path d="M 35.6 84 L 37.6 92.6" stroke={edge(veste)} strokeWidth="0.7" fill="none" />
        </g>
      );
    },
    HeadFront: (k) => {
      const voile = k.acc;
      const dome =
        'M 50 14.8 C 34.6 14.8 28.4 26.6 28.8 41.6 C 29.1 52 30.6 59 29.6 66 ' +
        'C 33 71 39 74 50 74 C 61 74 67 71 70.4 66 C 69.4 59 70.9 52 71.2 41.6 ' +
        'C 71.6 26.6 65.4 14.8 50 14.8 Z';
      const opening =
        'M 50 25.6 C 40.4 25.6 38.4 34 38.6 41.6 C 38.9 50 41.6 57.4 50 59.6 ' +
        'C 58.4 57.4 61.1 50 61.4 41.6 C 61.6 34 59.6 25.6 50 25.6 Z';
      return (
        <g>
          <path d={`${dome} ${opening}`} fillRule="evenodd" fill={voile} />
          <path
            d="M 50 25.6 C 40.4 25.6 38.4 34 38.6 41.6 L 41.5 41.6 C 41.3 35 43 28.6 50 28.6 C 57 28.6 58.7 35 58.5 41.6 L 61.4 41.6 C 61.6 34 59.6 25.6 50 25.6 Z"
            fill={darken(voile, 0.22)}
          />
          <path d="M 30.6 60 C 27 72 25.6 88 27 104 L 36.4 104 C 34.6 88 35 74 37.4 66 Z" fill={darken(voile, 0.14)} />
          <path d="M 69.4 60 C 73 72 74.4 88 73 104 L 63.6 104 C 65.4 88 65 74 62.6 66 Z" fill={darken(voile, 0.3)} />
          <path d="M 33.2 22 C 36.6 17.4 43 14.8 50 14.8" stroke={lighten(voile, 0.3)} strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.7" />
          <circle cx="63.6" cy="64" r="1.6" fill={lighten(voile, 0.4)} />
        </g>
      );
    },
    Props: (k) => {
      const veste = darken(k.acc, 0.55);
      const ecran = darken('#1d2b33', 0.1);
      return (
        <g>
          <Arm d="M 66 84 C 74 90 78 96 78 102" fill={veste} w={9} />
          <g transform="translate(80 104) rotate(-17)">
            <rect x="-12" y="-16" width="24" height="32" rx="2.4" fill={darken(k.P.pierre, 0.5)} />
            <rect x="-10" y="-14" width="20" height="28" rx="1.2" fill={ecran} />
            <rect x="-7.4" y="-10" width="14.8" height="1.5" rx="0.7" fill={lighten(k.acc, 0.45)} opacity="0.85" />
            <rect x="-7.4" y="-6.4" width="9" height="1.5" rx="0.7" fill={lighten(k.acc, 0.2)} opacity="0.7" />
            <path d="M -7.4 4 L -3.4 -0.6 L 0.6 2.4 L 4.6 -4 L 7.4 -1" fill="none" stroke={lighten(k.acc, 0.55)} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="-7.4" y="8" width="14.8" height="1.2" rx="0.6" fill={lighten(k.acc, 0.15)} opacity="0.5" />
          </g>
          <Hand x="70" y="102" r="-24" fill={k.skin} shade={k.skinE} />
        </g>
      );
    },
  },

  // Chèche volumineux à pan retombant + capuche de djellaba + barbe pleine + canne d'olivier.
  brahim: {
    geo: { headW: 15.4, headH: 21.2, jaw: 8.9, tilt: 1 },
    bust: { neckY: 70, hl: 33, hr: 33, riseL: 30, riseR: 29 },
    ears: false,
    hairColor: '#b9ada0',
    browW: 2.9,
    mouthDy: 0.5,
    Scene: (k) => (
      <path d="M 32 94 C 31 73 38 60 50 60 C 62 60 69 73 68 94 Z" fill={darken(k.acc, 0.42)} />
    ),
    Body: (k) => {
      const dj = darken(k.acc, 0.12);
      return (
        <g>
          <path d={bustPath({ neckY: 70, hl: 33, hr: 33, riseL: 30, riseR: 29 })} fill={dj} />
          <path d="M 50 70 C 44 70 40 73.4 39 78.6 C 43.6 75.4 56.4 75.4 61 78.6 C 60 73.4 56 70 50 70 Z" fill={darken(dj, 0.26)} />
          <path d="M 50 78 L 50 108" stroke={lighten(dj, 0.3)} strokeWidth="1.4" strokeLinecap="round" opacity="0.6" />
          {[84, 90, 96].map((y) => (
            <circle key={y} cx="50" cy={y} r="1.1" fill={lighten(dj, 0.45)} opacity="0.7" />
          ))}
          <path d="M 24 106 C 30 100 34 96 36 90" stroke={darken(dj, 0.3)} strokeWidth="1.3" fill="none" opacity="0.6" />
          <path d="M 76 106 C 70 100 66 96 64 90" stroke={darken(dj, 0.3)} strokeWidth="1.3" fill="none" opacity="0.6" />
        </g>
      );
    },
    HeadFront: (k) => {
      const ch = lighten(k.P.pierre, 0.18);
      return (
        <g>
          <path
            d="M 31.6 34.4 C 28.6 21.6 36.4 11.2 50 11.2 C 63.6 11.2 71.4 21.6 68.4 34.4 C 66 30 60.8 26.2 50 26.2 C 39.2 26.2 34 30 31.6 34.4 Z"
            fill={ch}
          />
          <path d="M 33.4 30.4 C 40 25 60 25 66.6 30.4" fill="none" stroke={edge(ch, 0.3)} strokeWidth="1" opacity="0.75" />
          <path d="M 32.4 24.4 C 40 18.4 60 18.4 67.6 24.4" fill="none" stroke={edge(ch, 0.3)} strokeWidth="1" opacity="0.6" />
          <path d="M 36 15.6 C 42 12.4 58 12.4 64 15.6" fill="none" stroke={lighten(ch, 0.4)} strokeWidth="1.2" opacity="0.7" />
          <path
            d="M 67.6 30.6 C 74.6 35 77 46 74 56 C 72.4 61.6 70 65.4 69.4 70 L 62.6 68 C 64 62.4 66.2 56.6 66.6 49.6 C 67 43 66 35.4 64 31 Z"
            fill={darken(ch, 0.18)}
          />
          <path d="M 66.6 40 C 69.4 45 70 52 68.6 58" fill="none" stroke={edge(ch, 0.35)} strokeWidth="0.9" opacity="0.6" />
        </g>
      );
    },
    Beard: (k) => (
      <g>
        <path
          d="M 36 44 C 34.8 55.6 38 66.4 43.4 72 C 46.8 75.6 53.2 75.6 56.6 72 C 62 66.4 65.2 55.6 64 44 C 62.4 51.8 58 55.4 50 55.4 C 42 55.4 37.6 51.8 36 44 Z"
          fill={k.hair}
        />
        <path d="M 42 62 C 46 66 54 66 58 62" fill="none" stroke={darken(k.hair, 0.2)} strokeWidth="0.9" opacity="0.55" />
      </g>
    ),
    Moustache: (k) => (
      <path
        d="M 40.4 51 C 44.4 48.4 47.6 49.6 50 51 C 52.4 49.6 55.6 48.4 59.6 51 C 56.2 54.4 52.8 53.2 50 52.5 C 47.2 53.2 43.8 54.4 40.4 51 Z"
        fill={k.hair}
      />
    ),
    Props: (k) => {
      const bois = '#7d5a33';
      return (
        <g>
          <path d="M 30.6 120 L 58.4 80.6" stroke={bois} strokeWidth="3.2" strokeLinecap="round" fill="none" />
          <path d="M 30.6 120 L 58.4 80.6" stroke={lighten(bois, 0.35)} strokeWidth="0.9" strokeLinecap="round" fill="none" opacity="0.55" />
          <path d="M 58.4 80.6 C 60.6 76.6 65 76.4 66.4 79.4 C 67.4 81.6 65.6 84 63.2 83.6" fill="none" stroke={bois} strokeWidth="3.2" strokeLinecap="round" />
          <Hand x="57.4" y="86" r="14" s="1.05" fill={k.skin} shade={k.skinE} />
        </g>
      );
    },
  },

  // Queue-de-cheval haute + capuche roulée + keffieh frangé + mégaphone en bandoulière.
  salma: {
    geo: { headW: 14.4, headH: 20, jaw: 7.9, tilt: -3.5 },
    bust: { neckY: 69, hl: 26, hr: 27, riseL: 22, riseR: 24 },
    hairColor: '#2b1f1a',
    HeadBack: (k) => (
      <g>
        <path
          d="M 58.6 20.6 C 69.6 19 78.4 28 78 40.6 C 77.6 51.4 72.6 59.6 67 64.6 L 60.4 58.6 C 65 54 68.4 47.4 68.2 40.4 C 68 32.6 63.6 25.6 57.4 22.6 Z"
          fill={k.hair}
        />
        <path d="M 62 26 C 68.6 29.6 71.6 36 71.4 43" fill="none" stroke={lighten(k.hair, 0.25)} strokeWidth="1.1" opacity="0.65" />
        <rect x="55.6" y="20.6" width="7.6" height="5.2" rx="2.4" transform="rotate(-24 59.4 23.2)" fill={darken('#c9564a', 0.1)} />
      </g>
    ),
    Body: (k) => {
      const sweat = k.acc;
      return (
        <g>
          <path d={bustPath({ neckY: 69, hl: 26, hr: 27, riseL: 22, riseR: 24 })} fill={sweat} />
          <path
            d="M 32.6 86 C 33.6 75.4 40.6 68.6 50 68.6 C 59.4 68.6 66.4 75.4 67.4 86 C 60 80.4 40 80.4 32.6 86 Z"
            fill={darken(sweat, 0.3)}
          />
          <path d="M 36 106 C 40.6 102 59.4 102 64 106 L 64 120 L 36 120 Z" fill={darken(sweat, 0.14)} />
          <path d="M 44.6 82.6 C 44 90 44.4 95 45.6 99" stroke={lighten(sweat, 0.55)} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M 55.4 82.6 C 56 90 55.6 95 54.4 99" stroke={lighten(sweat, 0.55)} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <circle cx="45.6" cy="99.6" r="1.2" fill={lighten(sweat, 0.55)} />
          <circle cx="54.4" cy="99.6" r="1.2" fill={lighten(sweat, 0.55)} />
        </g>
      );
    },
    HeadFront: (k) => {
      const kef = '#e6dcc4';
      return (
        <g>
          <path
            d="M 34.6 40 C 33 26 40 18.4 50 18.4 C 60 18.4 67 26 65.4 40 C 64.4 32.8 62 28.4 55 26.8 C 48 25.2 41 28.4 38 32.8 C 36.6 34.8 35.4 37.6 34.6 40 Z"
            fill={k.hair}
          />
          <path d="M 39 27.4 C 44 23.6 52 22.6 58.6 25" fill="none" stroke={lighten(k.hair, 0.22)} strokeWidth="1.1" opacity="0.6" />
          {/* keffieh noué autour du cou */}
          <path
            d="M 36 71 C 40 81 60 81 64 71 C 68.4 75.4 69.4 84 66.4 90.4 C 58.4 94.6 41.6 94.6 33.6 90.4 C 30.6 84 31.6 75.4 36 71 Z"
            fill={kef}
          />
          <g stroke={darken('#c9564a', 0.2)} strokeWidth="0.7" opacity="0.55" fill="none">
            <path d="M 34.6 78 L 66 78" />
            <path d="M 33.4 85 L 66.8 85" />
            <path d="M 42 73.6 L 42 92.6" />
            <path d="M 50 74.6 L 50 93.6" />
            <path d="M 58 73.6 L 58 92.6" />
          </g>
          <path d="M 34.6 89 C 32 97 31.2 107 32.2 116 L 40.6 116 C 39.2 107 39.6 97 41.2 90.6 Z" fill={darken(kef, 0.12)} />
          <g stroke={darken(kef, 0.3)} strokeWidth="0.9" strokeLinecap="round">
            {[33, 35.4, 37.8, 40.2].map((x, i) => (
              <path key={i} d={`M ${x} 116 L ${x - 0.4} 120`} />
            ))}
          </g>
        </g>
      );
    },
    Props: (k) => {
      const mega = darken(k.acc, 0.42);
      return (
        <g>
          {/* bandoulière : sangle fine et incurvée (une bande droite et épaisse se lisait
              comme un fût rigide dans le prolongement du pavillon) */}
          <path d="M 61.6 74.6 C 52 82.6 42 88.6 33 93.4" stroke={darken(k.acc, 0.46)} strokeWidth="2.8" strokeLinecap="round" fill="none" />
          <path
            d="M 61.6 74.6 C 52 82.6 42 88.6 33 93.4"
            stroke={lighten(k.acc, 0.35)}
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeDasharray="2 2.6"
            fill="none"
            opacity="0.5"
          />
          {/* mégaphone vu de face : le pavillon est un disque, pas un fût — aucune ambiguïté
              de lecture avec un objet allongé. */}
          <g transform="translate(25 104) rotate(-16)">
            <ellipse cx="0" cy="0" rx="10.4" ry="12.6" fill={mega} />
            <ellipse cx="0" cy="0" rx="10.4" ry="12.6" fill="none" stroke={lighten(mega, 0.45)} strokeWidth="2" />
            <ellipse cx="1.6" cy="0.6" rx="6.4" ry="8.2" fill={darken(mega, 0.34)} />
            <ellipse cx="2.8" cy="1" rx="2.8" ry="3.6" fill={darken(mega, 0.55)} />
            <path d="M -4 11.4 L 2.6 12.4 L 1.4 19.6 L -4.4 18.6 Z" fill={darken(mega, 0.45)} />
            <circle cx="-1" cy="-11.6" r="1.5" fill={lighten(mega, 0.3)} />
          </g>
          <rect x="58" y="88" width="8.6" height="6" rx="1.2" transform="rotate(-6 62.3 91)" fill={lighten(k.P.accent2, 0.2)} />
          <path d="M 59.6 91 L 65 90.4" stroke={darken(k.P.accent2, 0.5)} strokeWidth="0.8" />
        </g>
      );
    },
  },

  // Carré court, casque audio autour du cou (deux coques repérables), veste safran, carnet.
  leila: {
    geo: { headW: 15, headH: 20.6, jaw: 8.1, tilt: 1.5 },
    bust: { neckY: 70, hl: 29, hr: 29, riseL: 26, riseR: 26 },
    ears: false, // le carré descend sous la mâchoire : les oreilles sont couvertes
    hairColor: '#3a2820',
    HeadBack: (k) => (
      <g>
        <path
          d="M 30.8 42 C 29 24 38 14.2 50 14.2 C 62 14.2 71 24 69.2 42 C 69 52.6 68 60.6 66 66 L 34 66 C 32 60.6 31 52.6 30.8 42 Z"
          fill={k.hair}
        />
        <path d="M 34.6 62.6 C 33.6 55 33.2 47 33.8 39" fill="none" stroke={lighten(k.hair, 0.22)} strokeWidth="1.2" opacity="0.6" />
        <path d="M 66 62.6 C 67 55 67.4 47 66.8 39" fill="none" stroke={darken(k.hair, 0.35)} strokeWidth="1.2" opacity="0.6" />
      </g>
    ),
    Body: (k) => {
      const veste = k.acc;
      const chemise = lighten(k.P.pierre, 0.45);
      return (
        <g>
          <path d={bustPath({ neckY: 70, hl: 29, hr: 29, riseL: 26, riseR: 26 })} fill={veste} />
          <path d="M 50 71 L 43.6 79.6 L 47.6 120 L 52.4 120 L 56.4 79.6 Z" fill={chemise} />
          <path d="M 44.6 73.4 L 34.6 82.6 L 39.6 100.6 L 47.6 82 Z" fill={lighten(veste, 0.16)} />
          <path d="M 55.4 73.4 L 65.4 82.6 L 60.4 100.6 L 52.4 82 Z" fill={darken(veste, 0.16)} />
          <path d="M 34.6 82.6 L 39.6 100.6" fill="none" stroke={edge(veste, 0.3)} strokeWidth="0.7" opacity="0.7" />
        </g>
      );
    },
    HeadFront: (k) => {
      const casque = '#3d3a36';
      return (
        <g>
          <path
            d="M 34.4 33 C 34.4 21.6 41.4 15.2 50.6 15.2 C 60 15.2 66.4 21 66.4 29.6 C 62.6 25 57 22.6 51 24.6 C 45 26.6 39.6 30.6 36.6 36.4 C 35.4 35.2 34.6 34.4 34.4 33 Z"
            fill={k.hair}
          />
          <path d="M 41 21 C 47 17.6 56 18.4 61.4 22.6" fill="none" stroke={lighten(k.hair, 0.25)} strokeWidth="1.1" opacity="0.6" />
          <path d="M 36.4 69.6 C 38 60.6 62 60.6 63.6 69.6" fill="none" stroke={casque} strokeWidth="2.6" strokeLinecap="round" />
          <g fill={casque}>
            <rect x="31.8" y="65.6" width="7.4" height="10.4" rx="3.4" />
            <rect x="60.8" y="65.6" width="7.4" height="10.4" rx="3.4" />
          </g>
          <ellipse cx="35.5" cy="70.8" rx="2.2" ry="3.2" fill={lighten(k.P.accent2, 0.1)} />
          <ellipse cx="64.5" cy="70.8" rx="2.2" ry="3.2" fill={darken(k.P.accent2, 0.2)} />
          <path d="M 63 74.6 C 68 80 70 88 69 96" fill="none" stroke={casque} strokeWidth="1.3" strokeLinecap="round" opacity="0.85" />
        </g>
      );
    },
    Props: (k) => {
      const papier = lighten(k.P.pierre, 0.55);
      return (
        <g>
          <Arm d="M 68 86 C 74 92 76 98 75 104" fill={k.acc} w={8.6} />
          <g transform="translate(76 104) rotate(13)">
            <rect x="-11" y="-14" width="22" height="28" rx="1.6" fill={papier} />
            <rect x="-11" y="-14" width="4" height="28" fill={darken(papier, 0.16)} />
            <g stroke={darken(papier, 0.42)} strokeWidth="0.9" strokeLinecap="round" opacity="0.7">
              {[-8.5, -3.5, 1.5, 6.5].map((y) => (
                <path key={y} d={`M -4.4 ${y} L 8 ${y}`} />
              ))}
            </g>
            <g fill={darken(papier, 0.3)}>
              {[-11.5, -6.5, -1.5, 3.5, 8.5].map((y) => (
                <circle key={y} cx="-9" cy={y} r="0.85" />
              ))}
            </g>
          </g>
          <path d="M 62 92 L 71 86" stroke={darken(k.P.terre, 0.2)} strokeWidth="1.8" strokeLinecap="round" />
          <Hand x="66" y="99" r="16" fill={k.skin} shade={k.skinE} />
        </g>
      );
    },
  },

  // Crâne dégarni + moustache + grand tablier à bavette : le bloc rectangulaire du tablier
  // est la marque de fabrique de la silhouette.
  hamid: {
    geo: { headW: 15.6, headH: 21.2, jaw: 8.8, tilt: -1 },
    bust: { neckY: 70, hl: 32, hr: 32, riseL: 29, riseR: 29 },
    hairColor: '#4a3a30',
    browW: 2.8,
    Body: (k) => {
      const chemise = lighten(k.P.pierre, 0.4);
      const tablier = darken(k.acc, 0.28);
      return (
        <g>
          <path d={bustPath({ neckY: 70, hl: 32, hr: 32, riseL: 29, riseR: 29 })} fill={chemise} />
          <path d="M 50 70 L 42.6 76.6 L 46.6 82 L 50 76 L 53.4 82 L 57.4 76.6 Z" fill={darken(chemise, 0.22)} />
          <path d="M 44 84 C 44.6 76.6 46 72.6 48 70.6" fill="none" stroke={tablier} strokeWidth="3" strokeLinecap="round" />
          <path d="M 56 84 C 55.4 76.6 54 72.6 52 70.6" fill="none" stroke={tablier} strokeWidth="3" strokeLinecap="round" />
          <path d="M 38 84 L 62 84 L 66 120 L 34 120 Z" fill={tablier} />
          <path d="M 38 84 L 62 84" stroke={lighten(tablier, 0.3)} strokeWidth="1" opacity="0.7" />
          <rect x="42" y="98" width="16" height="12" rx="1.4" fill={darken(tablier, 0.22)} />
          <path d="M 50 98 L 50 110" stroke={darken(tablier, 0.4)} strokeWidth="0.8" />
          <path d="M 30 102 C 32 96 33.6 92 34 88" fill="none" stroke={darken(chemise, 0.2)} strokeWidth="1.1" opacity="0.6" />
        </g>
      );
    },
    HeadFront: (k) => (
      <g>
        {/* implantation reculée en M : deux golfes temporaux dégagés de part et d'autre
            d'une pointe de veuve — la marque d'âge la plus lisible à cette échelle */}
        <path
          d="M 34.6 42 C 33.4 27 40 19.6 50 19.6 C 60 19.6 66.6 27 65.4 42
             C 64.6 36 62.6 31.6 59 29.6 C 57.6 32.6 57 36 56.8 39.6
             C 55.4 33 53 29.6 50 28.6 C 47 29.6 44.6 33 43.2 39.6
             C 43 36 42.4 32.6 41 29.6 C 37.4 31.6 35.4 36 34.6 42 Z"
          fill={k.hair}
        />
        <path
          d="M 50 19.6 C 60 19.6 66.6 27 65.4 42 C 64.6 36 62.6 31.6 59 29.6 C 57.6 32.6 57 36 56.8 39.6 C 55.4 33 53 29.6 50 28.6 Z"
          fill={darken(k.hair, 0.22)}
        />
        <path d="M 36.6 33 C 38.4 28.6 41.6 25.4 45.6 23.6" fill="none" stroke={lighten(k.hair, 0.35)} strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
        {/* crayon glissé sur l'oreille */}
        <path d="M 65.4 40 L 69.6 32" stroke="#d8b04a" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M 69.6 32 L 70.4 30.4" stroke={darken('#d8b04a', 0.55)} strokeWidth="1.8" strokeLinecap="round" />
      </g>
    ),
    Moustache: (k) => (
      <path
        d="M 40.6 50.6 C 44.6 47.6 47.6 49 50 50.4 C 52.4 49 55.4 47.6 59.4 50.6 C 56 54.4 52.8 52.8 50 52.2 C 47.2 52.8 44 54.4 40.6 50.6 Z"
        fill={darken(k.hair, 0.12)}
      />
    ),
    Props: (k) => {
      const calc = darken(k.P.pierre, 0.55);
      const laiton = '#c8a15c';
      return (
        <g>
          <Arm d="M 34 88 C 29 92 26.6 96 26.6 100" fill={lighten(k.P.pierre, 0.4)} w={8.4} />
          <g transform="translate(25.6 102) rotate(-11)">
            <rect x="-7.6" y="-10.6" width="15.2" height="21.2" rx="1.8" fill={calc} />
            <rect x="-5.6" y="-8.6" width="11.2" height="4.6" rx="0.8" fill={lighten(k.P.accent2, 0.35)} />
            <g fill={lighten(calc, 0.3)}>
              {[-1.4, 2.2, 5.8].map((y) =>
                [-4.4, 0, 4.4].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.2" />)
              )}
            </g>
          </g>
          <Hand x="30.6" y="98" r="-18" fill={k.skin} shade={k.skinE} />
          {/* théière et verre à thé */}
          <g transform="translate(83 106)">
            <path d="M -8 -2 C -8 -8 8 -8 8 -2 C 8 5 5 10 0 10 C -5 10 -8 5 -8 -2 Z" fill={laiton} />
            <path d="M -8 -3 C -13 -5 -15 -10 -12.6 -13.6" fill="none" stroke={laiton} strokeWidth="2" strokeLinecap="round" />
            <path d="M 8 -3 C 12 -2 13 3 10.4 6" fill="none" stroke={laiton} strokeWidth="1.8" strokeLinecap="round" />
            <path d="M -3 -8 L 3 -8 L 1.6 -11.6 L -1.6 -11.6 Z" fill={darken(laiton, 0.2)} />
            <path d="M -5.6 -3.6 C -4 -6 2 -6.6 4.6 -4.6" fill="none" stroke={lighten(laiton, 0.45)} strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
          </g>
          <g opacity="0.35" stroke={GLOW} strokeWidth="1.1" fill="none" strokeLinecap="round">
            <path d="M 70.4 92 C 68 88 71 85 69 81" />
            <path d="M 75.4 90 C 73 86 76 83 74 79.4" />
          </g>
        </g>
      );
    },
  },

  // Épaules larges et carrées, costume à revers crantés, drapeau en fond, lunettes à la main.
  gouverneur: {
    geo: { headW: 15.4, headH: 21, jaw: 8.6, tilt: 0 },
    bust: { neckY: 70, hl: 35, hr: 35, riseL: 34, riseR: 34 },
    hairColor: '#8d867c',
    Scene: () => {
      const rouge = '#9c2a2e';
      const vert = '#3d7a4a';
      return (
        <g>
          <path d="M 66 4 L 102 4 L 102 120 L 66 120 C 68 92 68 40 66 4 Z" fill={rouge} opacity="0.92" />
          <path d="M 66 4 C 68 40 68 92 66 120 L 70 120 C 68.6 92 68.6 40 70 4 Z" fill={darken(rouge, 0.3)} opacity="0.6" />
          <path
            d="M 84 28 L 91.05 49.71 L 72.59 36.29 L 95.41 36.29 L 76.95 49.71 Z"
            fill="none"
            stroke={vert}
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </g>
      );
    },
    Body: (k) => {
      const suit = darken(k.acc, 0.2);
      const chemise = '#e8e2d4';
      const cravate = '#7d2f2c';
      return (
        <g>
          <path d={bustPath({ neckY: 70, hl: 35, hr: 35, riseL: 34, riseR: 34 })} fill={suit} />
          <path d="M 50 69 L 41.6 78.6 L 46.6 120 L 53.4 120 L 58.4 78.6 Z" fill={chemise} />
          <path d="M 50 69 L 44.4 74 L 47.8 78 Z" fill={darken(chemise, 0.16)} />
          <path d="M 50 69 L 55.6 74 L 52.2 78 Z" fill={darken(chemise, 0.26)} />
          <path d="M 50 72.4 L 46.8 76.4 L 50 79.6 L 53.2 76.4 Z" fill={cravate} />
          <path d="M 48.4 79.6 L 51.6 79.6 L 52.6 120 L 47.4 120 Z" fill={darken(cravate, 0.12)} />
          <path d="M 44 71.4 L 33.6 81.6 L 36.2 90.6 L 45 83 L 41.6 78.6 Z" fill={lighten(suit, 0.13)} />
          <path d="M 56 71.4 L 66.4 81.6 L 63.8 90.6 L 55 83 L 58.4 78.6 Z" fill={darken(suit, 0.16)} />
          <path d="M 33.6 81.6 L 36.2 90.6" fill="none" stroke={edge(suit, 0.25)} strokeWidth="0.8" />
          <rect x="34" y="96" width="9" height="1.4" rx="0.7" fill={lighten(suit, 0.2)} opacity="0.7" />
        </g>
      );
    },
    HeadFront: (k) => (
      <g>
        <path
          d="M 34.4 37 C 33.4 24 40 17.4 50 17.4 C 60.6 17.4 66.6 24 65.6 37 C 64.2 29.4 61 24.6 55 23.6 C 47.6 22.4 40 26.2 36.8 34 C 36 35 35.2 36.2 34.4 37 Z"
          fill={k.hair}
        />
        <path d="M 40.6 25.6 C 46.6 21.6 55 21.6 60.6 25.6" fill="none" stroke={lighten(k.hair, 0.3)} strokeWidth="1.1" opacity="0.7" />
        <path d="M 34.8 40 C 34.4 36 34.8 33 35.6 31" fill="none" stroke={k.hair} strokeWidth="2" strokeLinecap="round" />
        <path d="M 65.2 40 C 65.6 36 65.2 33 64.4 31" fill="none" stroke={darken(k.hair, 0.2)} strokeWidth="2" strokeLinecap="round" />
      </g>
    ),
    Props: (k) => {
      const metal = '#c9c2b2';
      return (
        <g>
          <Arm d="M 63 88 C 66.6 92 68 96 67.6 100" fill={darken(k.acc, 0.2)} w={8.8} />
          <g transform="translate(68.6 94) rotate(-13)">
            <rect x="-11.6" y="-3.8" width="9" height="7.6" rx="2.6" fill="none" stroke={metal} strokeWidth="1.2" />
            <rect x="1.6" y="-3.8" width="9" height="7.6" rx="2.6" fill="none" stroke={metal} strokeWidth="1.2" />
            <path d="M -2.6 -0.6 L 1.6 -0.6" stroke={metal} strokeWidth="1.2" fill="none" />
            <path d="M 10.6 -2.6 C 14.6 -2 16.6 0.4 17 3.6" stroke={metal} strokeWidth="1.2" fill="none" strokeLinecap="round" />
            <path d="M -11.6 -2.6 C -15.6 -2 -17.6 0.4 -18 3.6" stroke={metal} strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.5" />
          </g>
          <Hand x="66.6" y="100" r="-8" s="1.05" fill={k.skin} shade={k.skinE} />
        </g>
      );
    },
  },

  /* ---------- ÉGYPTE ---------- */

  // Chignon strict en boule décentrée + tailleur à col châle + bord de table et téléphone retourné.
  mona: {
    geo: { headW: 14.6, headH: 20.4, jaw: 7.8, tilt: 0 },
    bust: { neckY: 69, hl: 30, hr: 30, riseL: 34, riseR: 34 },
    hairColor: '#241c1a',
    HeadBack: (k) => (
      <g>
        <circle cx="64.6" cy="23.4" r="7.8" fill={k.hair} />
        <path d="M 59.6 27.4 C 61.4 22.6 65.4 20.4 69.4 21.4" fill="none" stroke={lighten(k.hair, 0.3)} strokeWidth="1.1" opacity="0.65" />
        <path d="M 57.4 26 C 60.6 22.6 63.6 20.6 66.6 19.6" fill="none" stroke={darken(k.hair, 0.4)} strokeWidth="1.6" opacity="0.5" />
      </g>
    ),
    Body: (k) => {
      const suit = k.acc;
      const chemise = '#e6e2d8';
      return (
        <g>
          <path d={bustPath({ neckY: 69, hl: 30, hr: 30, riseL: 34, riseR: 34 })} fill={suit} />
          <path d="M 50 68 L 43 77 L 47.4 120 L 52.6 120 L 57 77 Z" fill={chemise} />
          <path
            d="M 45 69.6 C 40 73.4 36.6 80 35.8 88.2 C 35.4 93 36 98.6 37 104 L 42 102.6 C 40.8 96.6 40.6 90.4 41.8 84.6 C 42.6 80.6 44.2 76.4 46.6 73.4 Z"
            fill={lighten(suit, 0.14)}
          />
          <path
            d="M 55 69.6 C 60 73.4 63.4 80 64.2 88.2 C 64.6 93 64 98.6 63 104 L 58 102.6 C 59.2 96.6 59.4 90.4 58.2 84.6 C 57.4 80.6 55.8 76.4 53.4 73.4 Z"
            fill={darken(suit, 0.16)}
          />
          <path d="M 58.6 82 L 61 85 L 58.6 88 L 56.2 85 Z" fill={lighten(k.P.accent2, 0.15)} />
        </g>
      );
    },
    HeadFront: (k) => (
      <g>
        <path
          d="M 34.6 40 C 33 25.6 40.4 17.2 50 17.2 C 59.6 17.2 67 25.6 65.4 40 C 64.6 34.4 62.6 29.4 58.6 26.2 C 55.4 23.6 52.6 22.6 50 22.6 C 47.4 22.6 44.6 23.6 41.4 26.2 C 37.4 29.4 35.4 34.4 34.6 40 Z"
          fill={k.hair}
        />
        <path d="M 50 22.6 L 50 18" stroke={lighten(k.hair, 0.3)} strokeWidth="0.9" opacity="0.6" />
        <path d="M 44.6 24 C 41.4 26.6 38.6 30.6 37 35.4" fill="none" stroke={lighten(k.hair, 0.24)} strokeWidth="1.1" opacity="0.6" />
        <path d="M 35 40 C 35 44.6 35.4 48 36.2 50.6" fill="none" stroke={k.hair} strokeWidth="2.2" strokeLinecap="round" />
        <path d="M 65 40 C 65 44.6 64.6 48 63.8 50.6" fill="none" stroke={darken(k.hair, 0.2)} strokeWidth="2.2" strokeLinecap="round" />
      </g>
    ),
    Props: (k) => {
      const bois = darken(k.P.terre, 0.35);
      const phone = '#22282c';
      return (
        <g>
          <ellipse cx="70" cy="105" rx="14" ry="3.4" fill={INK} opacity="0.28" />
          <g transform="translate(70 102.4) rotate(-8)">
            <rect x="-11" y="-6" width="22" height="12" rx="2" fill={phone} />
            <rect x="-8.4" y="-3.8" width="5" height="3" rx="1.1" fill={lighten(phone, 0.22)} />
            <circle cx="-6.4" cy="-2.3" r="0.9" fill={darken(phone, 0.5)} />
            <path d="M -11 -3 C -11 -5 -9.6 -6 -8 -6" fill="none" stroke={lighten(phone, 0.3)} strokeWidth="0.8" opacity="0.7" />
          </g>
          <rect x="-2" y="106" width="104" height="14" fill={bois} />
          <rect x="-2" y="106" width="104" height="2.2" fill={lighten(bois, 0.32)} />
          <Hand x="32" y="104" r="8" s="1.15" fill={k.skin} shade={k.skinE} />
          <Arm d="M 26 90 C 26 96 29 101 32 103" fill={k.acc} w={9} />
        </g>
      );
    },
  },

  // Épaules très carrées, gilet haute visibilité à bandes, casque calé sous le bras, plans roulés.
  karim: {
    geo: { headW: 15.4, headH: 21, jaw: 9, tilt: 0 },
    bust: { neckY: 70, hl: 34, hr: 35, riseL: 32, riseR: 30 },
    hairColor: '#241c18',
    Body: (k) => {
      const chemise = '#5c6b70';
      const gilet = k.acc;
      const bande = '#dfe3e4';
      const vestClip = k.id('vest');
      const panels =
        'M 43.6 71 C 38 72.6 32 76 28.6 80 L 25.6 120 L 45.6 120 L 44 84 Z ' +
        'M 56.4 71 C 62 72.6 68 76 71.4 80 L 74.4 120 L 54.4 120 L 56 84 Z';
      return (
        <g>
          <path d={bustPath({ neckY: 70, hl: 34, hr: 35, riseL: 32, riseR: 30 })} fill={chemise} />
          <path d="M 50 70 L 42.6 77 L 47 84 L 50 76.6 L 53 84 L 57.4 77 Z" fill={darken(chemise, 0.28)} />
          <clipPath id={vestClip}>
            <path d={panels} />
          </clipPath>
          <path d={panels} fill={gilet} />
          <g clipPath={`url(#${vestClip})`}>
            <rect x="22" y="93" width="56" height="4.4" fill={bande} opacity="0.92" />
            <rect x="22" y="102.6" width="56" height="4.4" fill={bande} opacity="0.92" />
            <rect x="32.6" y="70" width="4.4" height="50" fill={bande} opacity="0.75" />
            <rect x="63" y="70" width="4.4" height="50" fill={bande} opacity="0.75" />
            <path d="M 56 70 L 56 120" stroke={darken(gilet, 0.3)} strokeWidth="0.9" />
          </g>
          <path d="M 43.6 71 L 44 84" fill="none" stroke={edge(gilet, 0.3)} strokeWidth="0.8" />
        </g>
      );
    },
    HeadFront: (k) => (
      <g>
        <path
          d="M 34.6 38 C 33.6 24.4 40.6 17.8 50 17.8 C 59.4 17.8 66.4 24.4 65.4 38 C 63.6 30.4 58.6 26.2 50 26.2 C 41.4 26.2 36.4 30.4 34.6 38 Z"
          fill={k.hair}
        />
        <path d="M 40 24.6 C 45.6 21.4 55 21.4 60.4 25" fill="none" stroke={lighten(k.hair, 0.28)} strokeWidth="1.1" opacity="0.55" />
      </g>
    ),
    Beard: (k) => (
      <path
        d="M 37.6 47.6 C 37.2 53 39.8 57.4 44.2 59.4 C 47.8 61 52.2 61 55.8 59.4 C 60.2 57.4 62.8 53 62.4 47.6 C 60.8 52.8 56.6 55.2 50 55.2 C 43.4 55.2 39.2 52.8 37.6 47.6 Z"
        fill={k.hair}
        opacity="0.32"
      />
    ),
    Moustache: (k) => (
      <path
        d="M 42.6 51 C 45.6 49 47.8 50 50 51 C 52.2 50 54.4 49 57.4 51 C 54.6 53.4 52.4 52.6 50 52.2 C 47.6 52.6 45.4 53.4 42.6 51 Z"
        fill={k.hair}
        opacity="0.65"
      />
    ),
    Props: (k) => {
      const casque = '#ece6d2';
      const papier = '#e2dcc8';
      return (
        <g>
          {/* casque calé sous le bras gauche : dôme + bord marqué, l'avant-bras passe par-dessus */}
          <g transform="translate(19 107) rotate(9)">
            <path d="M -10.4 2.6 C -10.4 -6.6 -5.2 -11.6 0 -11.6 C 5.2 -11.6 10.4 -6.6 10.4 2.6 Z" fill={casque} />
            <path d="M -13.6 2.6 C -13.6 5.8 13.6 5.8 13.6 2.6 C 13.6 0.6 -13.6 0.6 -13.6 2.6 Z" fill={darken(casque, 0.2)} />
            <path d="M 0 -11.6 L 0 2.6" stroke={darken(casque, 0.24)} strokeWidth="1.6" />
            <path d="M -7.6 -4.6 C -4.6 -8.6 4.6 -8.6 7.6 -4.6" fill="none" stroke={lighten(casque, 0.5)} strokeWidth="1.3" opacity="0.7" />
            <path d="M -11 3.6 C -9.4 8.6 -6 11.6 -2.6 12" fill="none" stroke={darken(k.acc, 0.35)} strokeWidth="1.2" strokeLinecap="round" />
          </g>
          <Arm d="M 32 82 C 25.6 86.6 21.6 91.6 20.6 96.6" fill="#5c6b70" w={9.4} />
          {/* rouleau de plans */}
          <g transform="translate(79 96) rotate(-25)">
            <rect x="-4.6" y="-16" width="9.2" height="32" rx="3.6" fill={papier} />
            <ellipse cx="0" cy="-16" rx="4.6" ry="2" fill={darken(papier, 0.28)} />
            <path d="M -2.6 -13 L -2.6 13" stroke={darken(papier, 0.2)} strokeWidth="0.8" opacity="0.7" />
            <rect x="-5.2" y="-3" width="10.4" height="4.4" fill={darken(k.acc, 0.1)} />
          </g>
          <Arm d="M 68 84 C 73 88 76.6 92 77.6 96" fill="#5c6b70" w={8.6} />
          <Hand x="76" y="98" r="-26" fill={k.skin} shade={k.skinE} />
        </g>
      );
    },
  },

  // Épaules basses et voûtées, calotte claire, longue barbe blanche, filet maillé sur l'épaule.
  khaled: {
    geo: { headW: 15.2, headH: 21.4, jaw: 8.6, tilt: 2 },
    bust: { neckY: 71, hl: 29, hr: 30, riseL: 20, riseR: 17 },
    ears: false,
    hairColor: '#ddd8cc',
    browW: 2.8,
    mouthDy: 0.4,
    Defs: (k) => (
      <pattern
        id={k.id('net')}
        width="5"
        height="5"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(24)"
      >
        <path d="M 0 0 L 5 0 M 0 0 L 0 5" stroke={lighten(k.P.pierre, 0.5)} strokeWidth="0.7" fill="none" />
      </pattern>
    ),
    Body: (k) => {
      const gal = lighten(k.acc, 0.4);
      return (
        <g>
          <path d={bustPath({ neckY: 71, hl: 29, hr: 30, riseL: 20, riseR: 17 })} fill={gal} />
          <path d="M 50 71.6 C 45 71.6 41.4 74.4 40.6 78.6 C 44 76 56 76 59.4 78.6 C 58.6 74.4 55 71.6 50 71.6 Z" fill={darken(gal, 0.24)} />
          <rect x="48.4" y="78" width="3.2" height="34" fill={darken(gal, 0.14)} />
          {[84, 92, 100].map((y) => (
            <circle key={y} cx="50" cy={y} r="1.1" fill={darken(gal, 0.4)} opacity="0.7" />
          ))}
          <path d="M 30 112 C 32 104 33.6 96 34 90" fill="none" stroke={darken(gal, 0.22)} strokeWidth="1.2" opacity="0.55" />
        </g>
      );
    },
    HeadFront: (k) => {
      const calotte = '#e8e4d8';
      return (
        <g>
          <path
            d="M 35.4 27.6 C 36 19.4 42.4 14.4 50 14.4 C 57.6 14.4 64 19.4 64.6 27.6 C 60 25 55.4 23.6 50 23.6 C 44.6 23.6 40 25 35.4 27.6 Z"
            fill={calotte}
          />
          <path d="M 37.6 24.4 C 42 20.6 58 20.6 62.4 24.4" fill="none" stroke={darken(calotte, 0.2)} strokeWidth="0.9" opacity="0.7" />
          <path d="M 50 14.4 L 50 23" stroke={darken(calotte, 0.16)} strokeWidth="0.8" opacity="0.5" />
          <path d="M 34.8 35 C 34.4 30.6 35.2 27.6 36.4 25.6 C 38 29 38 32.6 37.4 37 Z" fill={k.hair} />
          <path d="M 65.2 35 C 65.6 30.6 64.8 27.6 63.6 25.6 C 62 29 62 32.6 62.6 37 Z" fill={darken(k.hair, 0.14)} />
        </g>
      );
    },
    Beard: (k) => (
      <g>
        <path
          d="M 36 44 C 34.6 56 37.6 67.6 43.2 73.6 C 46.8 77.4 53.2 77.4 56.8 73.6 C 62.4 67.6 65.4 56 64 44 C 62.4 52 58 55.6 50 55.6 C 42 55.6 37.6 52 36 44 Z"
          fill={k.hair}
        />
        <path d="M 41.6 62 C 45.6 67 54.4 67 58.4 62" fill="none" stroke={darken(k.hair, 0.18)} strokeWidth="0.9" opacity="0.5" />
        <path d="M 44 48 C 46 54 54 54 56 48" fill="none" stroke={darken(k.hair, 0.12)} strokeWidth="0.8" opacity="0.4" />
      </g>
    ),
    Moustache: (k) => (
      <path
        d="M 40.6 51 C 44.6 48 47.6 49.4 50 50.8 C 52.4 49.4 55.4 48 59.4 51 C 56 54.8 52.8 53.2 50 52.6 C 47.2 53.2 44 54.8 40.6 51 Z"
        fill={darken(k.hair, 0.06)}
      />
    ),
    Props: (k) => {
      const corde = darken(k.P.pierre, 0.28);
      const filet =
        'M 59.6 70 C 70 70.6 78.6 79 82.6 90.6 C 85.6 99.6 86.6 110 84.6 120 L 59 120 C 61.6 108 61.4 92 57.4 78.6 Z';
      return (
        <g>
          <path d={filet} fill={lighten(k.P.pierre, 0.2)} opacity="0.38" />
          <path d={filet} fill={`url(#${k.id('net')})`} opacity="0.95" />
          <path d={filet} fill="none" stroke={edge(k.P.pierre, 0.3)} strokeWidth="0.9" opacity="0.7" />
          <path d="M 56.6 70.6 C 65 68 74.6 74 79 82.6" fill="none" stroke={corde} strokeWidth="2.2" strokeLinecap="round" />
          <g fill={darken('#c9564a', 0.05)} opacity="0.85">
            <ellipse cx="79.6" cy="98" rx="2.4" ry="1.5" transform="rotate(-24 79.6 98)" />
            <ellipse cx="83.4" cy="110" rx="2.4" ry="1.5" transform="rotate(-16 83.4 110)" />
            <ellipse cx="70.6" cy="86" rx="2.2" ry="1.4" transform="rotate(-32 70.6 86)" />
          </g>
        </g>
      );
    },
  },

  // Grand châle drapé qui descend jusqu'aux angles bas du cadre (silhouette trapézoïdale),
  // poignée de terre blanchie tenue dans les mains en coupe.
  fatma: {
    geo: { headW: 14.8, headH: 20.6, jaw: 8, tilt: -2 },
    bust: { neckY: 70, hl: 30, hr: 30, riseL: 24, riseR: 24 },
    ears: false,
    hairColor: '#332822',
    Body: (k) => {
      const robe = darken(k.acc, 0.36);
      return (
        <g>
          <path d={bustPath({ neckY: 70, hl: 30, hr: 30, riseL: 24, riseR: 24 })} fill={robe} />
          <path d="M 50 70 C 43.6 70 39.4 73.6 38.6 79 C 43 76 57 76 61.4 79 C 60.6 73.6 56.4 70 50 70 Z" fill={darken(robe, 0.25)} />
          <g fill={lighten(k.P.accent2, 0.15)} opacity="0.9">
            {[[44, 82], [50, 84], [56, 82], [47, 88], [53, 88]].map(([x, y]) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="1.1" />
            ))}
          </g>
        </g>
      );
    },
    HeadFront: (k) => {
      const chale = k.acc;
      const dome =
        'M 50 12.4 C 33.4 12.4 27 25.4 27.4 41.4 C 27.8 52 29.4 60 27.6 68 ' +
        'C 24.6 80 21.4 98 22.6 120 L 77.4 120 C 78.6 98 75.4 80 72.4 68 ' +
        'C 70.6 60 72.2 52 72.6 41.4 C 73 25.4 66.6 12.4 50 12.4 Z';
      // L'ouverture est une « clé » : le visage, puis une colonne jusqu'au bas du cadre,
      // pour laisser voir la robe et les mains sous le châle.
      const opening =
        'M 50 24.6 C 40 24.6 37.8 33.4 38 41.4 C 38.2 50.4 41.4 58 46 60.6 ' +
        'C 42 64.6 39.4 70.6 38.6 78.6 C 40 92 40 106 39.6 120 L 60.4 120 ' +
        'C 60 106 60 92 61.4 78.6 C 60.6 70.6 58 64.6 54 60.6 ' +
        'C 58.6 58 61.8 50.4 62 41.4 C 62.2 33.4 60 24.6 50 24.6 Z';
      return (
        <g>
          <path d={`${dome} ${opening}`} fillRule="evenodd" fill={chale} />
          <path
            d="M 50 24.6 C 40 24.6 37.8 33.4 38 41.4 L 41.2 41.4 C 41 34.4 43 27.6 50 27.6 C 57 27.6 59 34.4 58.8 41.4 L 62 41.4 C 62.2 33.4 60 24.6 50 24.6 Z"
            fill={darken(chale, 0.24)}
          />
          <path d="M 31 74 C 28.6 90 27 106 27.4 120" fill="none" stroke={darken(chale, 0.22)} strokeWidth="1.2" opacity="0.7" />
          <path d="M 69 74 C 71.4 90 73 106 72.6 120" fill="none" stroke={darken(chale, 0.3)} strokeWidth="1.2" opacity="0.7" />
          <path d="M 34.6 20 C 39 15.6 44 13.2 50 12.6" fill="none" stroke={lighten(chale, 0.32)} strokeWidth="1.4" strokeLinecap="round" opacity="0.65" />
          <path d="M 27.6 68 C 33 72 36 76 37.6 81" fill="none" stroke={darken(chale, 0.28)} strokeWidth="1" opacity="0.55" />
          <path d="M 72.4 68 C 67 72 64 76 62.4 81" fill="none" stroke={darken(chale, 0.34)} strokeWidth="1" opacity="0.55" />
        </g>
      );
    },
    Props: (k) => {
      const terre = '#eceadf'; // terre blanchie par le sel — volontairement plus clair que la peau
      return (
        <g>
          <path
            d="M 38.6 96.6 C 40.6 92 46 89.6 50 89.6 C 54 89.6 59.4 92 61.4 96.6 C 62.6 101 57.6 105.4 50 105.4 C 42.4 105.4 37.4 101 38.6 96.6 Z"
            fill={k.skin}
          />
          <path
            d="M 38.6 96.6 C 40.6 92 46 89.6 50 89.6 L 50 105.4 C 42.4 105.4 37.4 101 38.6 96.6 Z"
            fill={k.skinL}
            opacity="0.5"
          />
          {/* séparations des doigts : sans elles, les mains en coupe se lisent comme un bol */}
          <g stroke={k.skinE} strokeWidth="0.75" strokeLinecap="round" opacity="0.7" fill="none">
            <path d="M 50 92 L 50 105" />
            <path d="M 43.6 95.6 L 42.4 104" />
            <path d="M 56.4 95.6 L 57.6 104" />
            <path d="M 40.6 99.6 C 44 101.6 56 101.6 59.4 99.6" />
          </g>
          <ellipse cx="50" cy="94.6" rx="10.2" ry="3.4" fill={darken(terre, 0.45)} opacity="0.35" />
          <path d="M 39.4 94.8 C 42.2 86.6 57.8 86.6 60.6 94.8 C 53.4 91.6 46.6 91.6 39.4 94.8 Z" fill={terre} />
          <path d="M 43.6 91.6 C 46.6 90 53.4 90 56.4 91.6" fill="none" stroke={darken(terre, 0.22)} strokeWidth="0.7" opacity="0.75" />
          <g fill={lighten(terre, 0.3)}>
            <circle cx="45.4" cy="90.6" r="0.7" />
            <circle cx="52.6" cy="89.6" r="0.6" />
            <circle cx="56.4" cy="92" r="0.55" />
          </g>
          {/* grains qui filent entre les doigts */}
          <g fill={terre} opacity="0.9">
            <circle cx="46.4" cy="108.6" r="0.95" />
            <circle cx="52.6" cy="112.4" r="0.8" />
            <circle cx="48.4" cy="116.4" r="0.65" />
            <circle cx="54.4" cy="118" r="0.5" />
          </g>
        </g>
      );
    },
  },

  // Uniforme à pattes d'épaule, radio à l'épaule (antenne = pic reconnaissable), lampe frontale relevée.
  tarek: {
    geo: { headW: 15.2, headH: 21, jaw: 8.8, tilt: 0 },
    bust: { neckY: 70, hl: 33, hr: 33, riseL: 33, riseR: 33 },
    hairColor: '#241c18',
    Body: (k) => {
      const uni = k.acc;
      return (
        <g>
          <path d={bustPath({ neckY: 70, hl: 33, hr: 33, riseL: 33, riseR: 33 })} fill={uni} />
          <path d="M 50 70 L 41.4 76.6 L 45.6 81 L 50 74.6 Z" fill={darken(uni, 0.3)} />
          <path d="M 50 70 L 58.6 76.6 L 54.4 81 L 50 74.6 Z" fill={darken(uni, 0.4)} />
          <rect x="48.4" y="74" width="3.2" height="46" fill={darken(uni, 0.24)} />
          <path d="M 33 78.6 L 45 74.4 L 45.6 79 L 34 83.4 Z" fill={lighten(uni, 0.18)} />
          <path d="M 67 78.6 L 55 74.4 L 54.4 79 L 66 83.4 Z" fill={darken(uni, 0.16)} />
          <rect x="55.4" y="89" width="15.2" height="12" rx="1.2" fill={darken(uni, 0.16)} />
          <rect x="54.8" y="87.6" width="16.4" height="3.8" rx="1.2" fill={darken(uni, 0.3)} />
          <rect x="30" y="92" width="15" height="4.4" rx="1" fill={lighten(uni, 0.42)} />
          <g stroke={darken(uni, 0.45)} strokeWidth="0.8" opacity="0.75">
            <path d="M 32 94.2 L 43 94.2" />
          </g>
        </g>
      );
    },
    HeadFront: (k) => {
      const sangle = '#2b2a28';
      const lampe = '#d6d0bc';
      return (
        <g>
          <path
            d="M 35 36.6 C 34.4 24.2 41.4 18.2 50 18.2 C 58.6 18.2 65.6 24.2 65 36.6 C 63 29.6 57.6 26.2 50 26.2 C 42.4 26.2 37 29.6 35 36.6 Z"
            fill={k.hair}
          />
          <path
            d="M 34.4 30.6 C 38 25 43.4 22.2 50 22.2 C 56.6 22.2 62 25 65.6 30.6 L 64.2 34.8 C 60.8 29.8 56 27 50 27 C 44 27 39.2 29.8 35.8 34.8 Z"
            fill={sangle}
          />
          <g transform="translate(48.8 23) rotate(-16)">
            <rect x="-6.4" y="-5.6" width="12.8" height="7.8" rx="2" fill={darken(lampe, 0.45)} />
            <circle cx="0" cy="-1.8" r="3" fill={lampe} />
            <circle cx="0" cy="-1.8" r="1.4" fill={lighten(k.P.accent2, 0.55)} />
            <rect x="-6.4" y="1" width="12.8" height="1.6" fill={darken(lampe, 0.6)} />
          </g>
        </g>
      );
    },
    Props: (k) => {
      const radio = '#2a2e30';
      return (
        <g>
          <g transform="translate(34.4 84) rotate(-8)">
            <rect x="-4.8" y="-7.4" width="9.6" height="14.8" rx="1.8" fill={radio} />
            <rect x="-3.2" y="-5" width="6.4" height="3.4" rx="0.7" fill={lighten(k.P.accent2, 0.2)} />
            <circle cx="0" cy="2.6" r="1.3" fill={lighten(radio, 0.35)} />
            <rect x="-2.6" y="5" width="5.2" height="1.2" rx="0.6" fill={lighten(radio, 0.25)} />
            <path d="M -2.8 -7.4 L -5 -19.4" stroke={radio} strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="-5.2" cy="-20.2" r="1.1" fill={radio} />
            <path d="M 4.4 -5.6 C 8.4 -7 9.6 -3 7.6 -0.6 C 9.6 1.8 8.4 5.8 4.4 4.4" fill="none" stroke={radio} strokeWidth="1.2" opacity="0.85" />
          </g>
        </g>
      );
    },
  },

  // Casquette souple à visière + queue-de-cheval basse, gilet Croissant-Rouge, brassard, pointage.
  nour: {
    geo: { headW: 14.6, headH: 20.2, jaw: 7.8, tilt: -2 },
    bust: { neckY: 69, hl: 27, hr: 28, riseL: 24, riseR: 23 },
    ears: false,
    hairColor: '#2e2018',
    HeadBack: (k) => (
      <g>
        <path
          d="M 57.4 42.6 C 65.6 45 70.6 53 71 62.4 C 71.4 71.6 68.4 79.6 64.6 85.4 L 57.4 81.4 C 61 76 63.6 69.4 63.2 62.6 C 62.8 54.6 60.4 47.4 55.6 43.6 Z"
          fill={k.hair}
        />
        <path d="M 61 49 C 65.6 53.6 67.6 60 67.4 66.6" fill="none" stroke={lighten(k.hair, 0.22)} strokeWidth="1.1" opacity="0.6" />
        <rect x="55" y="41.6" width="6.6" height="4.4" rx="2" transform="rotate(22 58.3 43.8)" fill={darken(k.acc, 0.1)} />
      </g>
    ),
    Body: (k) => {
      const tee = '#e8e2d4';
      const gilet = k.acc;
      const panels =
        'M 43.4 71 C 38.6 72.6 33.4 75.4 30.4 79 L 27.4 120 L 45.4 120 L 44 84 Z ' +
        'M 56.6 71 C 61.4 72.6 66.6 75.4 69.6 79 L 72.6 120 L 54.6 120 L 56 84 Z';
      return (
        <g>
          <path d={bustPath({ neckY: 69, hl: 27, hr: 28, riseL: 24, riseR: 23 })} fill={tee} />
          <path d="M 50 69 C 46.6 69 44.4 71 43.4 74 C 46 76.4 54 76.4 56.6 74 C 55.6 71 53.4 69 50 69 Z" fill={darken(tee, 0.2)} />
          <path d={panels} fill={gilet} />
          <path d="M 30.4 79 L 44 84" fill="none" stroke={darken(gilet, 0.3)} strokeWidth="0.8" opacity="0.7" />
          <rect x="29.4" y="110" width="16" height="2.6" fill={lighten(gilet, 0.55)} opacity="0.8" />
          <rect x="56" y="110" width="16" height="2.6" fill={lighten(gilet, 0.4)} opacity="0.7" />
          {/* emblème du Croissant-Rouge, haut sur le panneau gauche : dégagé du porte-bloc,
              du brassard et de l'avant-bras */}
          <g transform="translate(40 85) scale(0.5)">
            <path d="M 0 -6.4 A 7.2 7.2 0 1 0 0 6.4 A 6.6 6.6 0 1 1 0 -6.4 Z" fill="#f5efe2" />
          </g>
          {/* brassard */}
          <path d="M 26.4 84.6 C 29.6 83 33.6 82.2 36.2 82.4 L 36.6 90.4 C 33.6 90 29.6 90.8 26.6 92.4 Z" fill="#f5efe2" />
          <g transform="translate(31.4 87) scale(0.3)">
            <path d="M 0 -6.4 A 7.2 7.2 0 1 0 0 6.4 A 6.6 6.6 0 1 1 0 -6.4 Z" fill={darken(k.acc, 0.1)} />
          </g>
        </g>
      );
    },
    HeadFront: (k) => {
      const cap = darken(k.acc, 0.34);
      return (
        <g>
          <path
            d="M 36 30 C 39.6 23.4 46.6 20.4 53.6 21.4 C 48.6 23.4 44.4 26.4 41.4 31.2 C 39.6 34.2 38.6 37.4 38.2 40.8 C 37 37.4 36 33.6 36 30 Z"
            fill={k.hair}
          />
          <path
            d="M 64 30 C 63.6 34 63 37.6 61.8 40.8 C 61.4 36.6 60.4 32.6 58.4 29.4 C 60.4 29.4 62.4 29.6 64 30 Z"
            fill={darken(k.hair, 0.18)}
          />
          <path
            d="M 34.4 26.4 C 35.4 17.6 42 12.4 50 12.4 C 58 12.4 64.6 17.6 65.6 26.4 C 60 22.4 55.4 20.8 50 20.8 C 44.6 20.8 39.2 22.4 34.4 26.4 Z"
            fill={cap}
          />
          <path d="M 33.6 25 C 38.4 21 61.6 21 66.4 25 C 63.2 29.6 56 31.6 50 31.6 C 44 31.6 36.8 29.6 33.6 25 Z" fill={darken(cap, 0.2)} />
          <circle cx="50" cy="13" r="1.5" fill={lighten(cap, 0.25)} />
          <path d="M 39.6 16.6 C 44.6 13.6 55.4 13.6 60.4 16.6" fill="none" stroke={lighten(cap, 0.3)} strokeWidth="1" opacity="0.6" />
        </g>
      );
    },
    Props: (k) => {
      const bois = darken(k.P.terre, 0.1);
      const papier = '#f0ead9';
      return (
        <g>
          <Arm d="M 34 92 C 38 99 42.6 104 47 106" fill={k.acc} w={8.6} />
          <g transform="translate(62 102) rotate(11)">
            <rect x="-12" y="-16" width="24" height="32" rx="1.8" fill={bois} />
            <rect x="-9.6" y="-13" width="19.2" height="27" rx="1" fill={papier} />
            <rect x="-5" y="-18" width="10" height="4.6" rx="1.4" fill={lighten(bois, 0.4)} />
            <g stroke={darken(papier, 0.45)} strokeWidth="0.9" strokeLinecap="round" opacity="0.65">
              {[-8.4, -3.4, 1.6, 6.6].map((y) => (
                <path key={y} d={`M -3.4 ${y} L 7.4 ${y}`} />
              ))}
            </g>
            <g stroke={darken(k.acc, 0.05)} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none">
              {[-8.4, -3.4, 1.6].map((y) => (
                <path key={y} d={`M -7.6 ${y} L -6.2 ${y + 1.6} L -3.8 ${y - 1.8}`} />
              ))}
            </g>
          </g>
          <Hand x="50" y="108" r="18" s="1.05" fill={k.skin} shade={k.skinE} />
        </g>
      );
    },
  },
};

/* ------------------------------------------------------------ portrait générique */
// Repli documenté (§3.2) quand le locuteur n'a pas de fiche : silhouette générique par
// tranche d'âge + initiales, générée en SVG. Exercé par ex. au nœud M6 (représentant Aqua Atlas).

function initialsOf(src) {
  if (!src) return '?';
  const words = String(src)
    .replace(/[_\-.]+/g, ' ')
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .split(/\s+/)
    .filter(Boolean);
  const letters = words.slice(0, 2).map((w) => w[0].toUpperCase());
  return letters.join('') || '?';
}

function hashOf(s) {
  let h = 0;
  for (let i = 0; i < String(s).length; i += 1) h = (h * 31 + String(s).charCodeAt(i)) | 0;
  return Math.abs(h);
}

const AGE_SHAPES = {
  // jeune : crâne petit, épaules étroites et hautes, port légèrement penché, touffe.
  jeune: {
    head: 'M 50 22.6 C 42.4 22.6 37.2 28.6 37.2 36.6 C 37.2 45.6 42.8 53.8 50 53.8 C 57.2 53.8 62.8 45.6 62.8 36.6 C 62.8 28.6 57.6 22.6 50 22.6 Z',
    extra: 'M 42.6 25.6 C 43.6 18.6 53.6 16.4 58.6 21.6 C 54 19.6 47.4 20.6 44.6 24 Z',
    bust: { neckY: 58, hl: 22.6, hr: 23.6, riseL: 24, riseR: 25 },
    lean: -2.5,
  },
  // adulte : épaules très larges et carrées, port droit, nuque pleine.
  adulte: {
    head: 'M 50 18.6 C 40.4 18.6 34.2 25.6 34.2 35.4 C 34.2 46.4 41.2 56 50 56 C 58.8 56 65.8 46.4 65.8 35.4 C 65.8 25.6 59.6 18.6 50 18.6 Z',
    extra: null,
    bust: { neckY: 58.6, hl: 35, hr: 35, riseL: 44, riseR: 44 },
    lean: 0,
  },
  // aîné : épaules tombantes, buste porté en avant, calotte.
  aine: {
    head: 'M 52.6 21.6 C 43.6 21.6 37.6 28.4 37.6 37 C 37.6 47 44.4 56 52.6 56 C 60.8 56 66.6 47 66.6 37 C 66.6 28.4 61.6 21.6 52.6 21.6 Z',
    extra: 'M 39.4 31 C 40.4 23.4 46.6 19 53 19 C 59.4 19 64.6 23.4 65.6 31 C 61.6 27.8 57 26.4 52.6 26.4 C 48.2 26.4 43.2 27.8 39.4 31 Z',
    bust: { neckY: 60.6, hl: 26, hr: 27.6, riseL: 11, riseR: 8 },
    lean: 3,
  },
};

function bracketFor(id, age) {
  if (typeof age === 'number') return age < 30 ? 'jeune' : age < 58 ? 'adulte' : 'aine';
  return ['jeune', 'adulte', 'aine'][hashOf(id || 'anonyme') % 3];
}

function GenericBust({ bracket, initials, ids, animate }) {
  const shape = AGE_SHAPES[bracket] || AGE_SHAPES.adulte;
  const sil = '#78848c';
  return (
    <g>
      <rect x="0" y="0" width={VB_W} height={VB_H} fill={`url(#${ids('bg')})`} />
      <circle cx="50" cy="40" r="42" fill={`url(#${ids('halo')})`} />
      {/* le translate reste sur un groupe externe : la classe animée pilote `transform` en CSS */}
      <g transform={`translate(${shape.lean} 0)`}>
        <g className={`cc-figure${animate ? ' is-breathing' : ''}`}>
          <path d={bustPath({ ...shape.bust, bottom: VB_H })} fill={sil} />
          <path d="M 44.2 44 L 44.2 62 L 55.8 62 L 55.8 44 Z" fill={sil} />
          <path d={shape.head} fill={sil} />
          {shape.extra && <path d={shape.extra} fill={lighten(sil, 0.16)} />}
          {/* liseré de lumière côté éclairé — même direction que les portraits nommés */}
          <path d={shape.head} fill="none" stroke={lighten(sil, 0.4)} strokeWidth="0.9" opacity="0.4" />
        </g>
      </g>
      <text
        x="50"
        y="97"
        textAnchor="middle"
        fontFamily="'Georgia','Times New Roman',serif"
        fontSize="22"
        letterSpacing="2.6"
        fill="#f0ece2"
        opacity="0.92"
      >
        {initials}
      </text>
      <text
        x="50"
        y="108"
        textAnchor="middle"
        fontFamily="system-ui,-apple-system,'Segoe UI',sans-serif"
        fontSize="5"
        letterSpacing="1.3"
        fill="#f0ece2"
        opacity="0.55"
      >
        INTERVENANT
      </text>
    </g>
  );
}

/* ------------------------------------------------------------------- composant */

/**
 * Portrait vectoriel d'un personnage du casting.
 *
 * @param characterId  clé dans CHARACTERS ; inconnue ou absente => silhouette générique + initiales
 * @param expression   'neutre' | 'preoccupe' | 'ferme' | 'soulage' | 'complice'
 * @param size         largeur en px (la hauteur suit le ratio portrait 5:6)
 * @param animate      respiration / clignement / entrée (toujours coupés si prefers-reduced-motion)
 * @param reactionPulse impulsion d'emphase : chaque passage à true relance un pop de 120ms
 * @param className    classes additionnelles sur le conteneur
 * Props optionnelles (repli) : fallbackName, fallbackAge — améliorent la silhouette générique.
 */
export default function Portrait({
  characterId,
  expression = 'neutre',
  size = 320,
  animate = true,
  reactionPulse = false,
  className,
  fallbackName,
  fallbackAge,
}) {
  const rawUid = useId();
  const uid = useMemo(() => `cc${rawUid.replace(/[^a-zA-Z0-9]/g, '')}`, [rawUid]);
  const id = useMemo(() => (n) => `${uid}-${n}`, [uid]);

  const ch = (characterId && CHARACTERS[characterId]) || null;

  // Décalages aléatoires par instance : deux portraits affichés côte à côte ne clignent
  // ni ne respirent jamais en cadence.
  const rnd = useMemo(
    () => ({
      blinkDur: 4 + Math.random() * 3, // 4 -> 7 s
      blinkDelay: Math.random() * 3.5,
      breatheDur: 2.7 + Math.random() * 0.7,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [characterId]
  );

  // Pop d'emphase : on retire la classe, on force un reflow, on la remet — seule technique
  // qui redémarre l'animation de façon fiable quand la prop repasse à true.
  const popRef = useRef(null);
  useEffect(() => {
    const el = popRef.current;
    if (!el || !reactionPulse || !animate) return undefined;
    el.classList.remove('is-pop');
    // eslint-disable-next-line no-unused-expressions
    void el.offsetWidth;
    el.classList.add('is-pop');
    const done = () => el.classList.remove('is-pop');
    el.addEventListener('animationend', done, { once: true });
    return () => el.removeEventListener('animationend', done);
  }, [reactionPulse, animate, characterId]);

  const expr = EXPR_PARAMS[expression] ? expression : 'neutre';
  const ex = EXPR_PARAMS[expr];

  const view = useMemo(() => {
    if (!ch) return null;
    const P = PALETTES[ch.pays] || PALETTES.maroc;
    const look = LOOKS[ch.id] || LOOKS[ch.silhouette] || LOOKS.yousra;
    const g = { ...BASE_GEO, ...(look.geo || {}) };
    const bust = { ...BASE_BUST, ...(look.bust || {}) };
    const idx = Math.min(P.peau.length, Math.max(1, ch.carnation || 1)) - 1;
    const skin = P.peau[idx];
    const acc = ch.accent || P.accent;
    return {
      P, look, g, bust, acc,
      skin,
      skinL: lighten(skin, 0.2),
      skinD: darken(skin, 0.17),
      skinE: edge(skin, 0.36),
      skinLid: mix(skin, darken(skin, 0.2), 0.55),
      sclera: mix(skin, '#fffaf0', 0.78),
      iris: darken(mix('#4a3020', acc, 0.22), 0.28),
      hair: look.hairColor || '#2a2018',
      lash: darken(look.hairColor || '#2a2018', 0.15),
      brow: darken(look.hairColor || '#2a2018', 0.06),
      lip: darken(mix(skin, '#8a3a30', 0.55), 0.12),
      lipSoft: mix(skin, '#b05a4a', 0.4),
    };
  }, [ch]);

  const wrapStyle = {
    width: size,
    height: Math.round((size * VB_H) / VB_W),
    ...(animate
      ? {
          '--cc-blink-dur': `${rnd.blinkDur.toFixed(2)}s`,
          '--cc-blink-delay': `${rnd.blinkDelay.toFixed(2)}s`,
          '--cc-breathe-dur': `${rnd.breatheDur.toFixed(2)}s`,
        }
      : null),
  };

  const label = ch
    ? `${ch.nom} — ${ch.role} (expression : ${expr})`
    : `Intervenant sans portrait — silhouette générique (${initialsOf(fallbackName || characterId)})`;

  const bgA = ch ? mix(view.P.fond, view.P.ciel[2], 0.55) : '#343b40';
  const bgB = ch ? darken(view.P.fond, 0.3) : '#20262a';
  const haloC = ch ? view.acc : '#8fa3ad';

  return (
    <div className={['cc-portrait', className].filter(Boolean).join(' ')} style={wrapStyle}>
      {/* Le re-montage par `key` relance l'animation d'entrée à chaque changement de locuteur. */}
      <div
        key={`${characterId || 'anon'}|${animate ? 1 : 0}`}
        className={`cc-portrait__enter${animate ? ' is-enter' : ''}`}
      >
        <div ref={popRef} className="cc-portrait__pop">
          <svg
            className="cc-portrait__svg"
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="xMidYMid slice"
            role="img"
            aria-label={label}
            style={{ isolation: 'isolate' }}
          >
            <defs>
              <clipPath id={id('frame')}>
                <rect x="0" y="0" width={VB_W} height={VB_H} rx="10" />
              </clipPath>
              <linearGradient id={id('bg')} x1="0" y1="0" x2="0.35" y2="1">
                <stop offset="0%" stopColor={bgA} />
                <stop offset="100%" stopColor={bgB} />
              </linearGradient>
              <radialGradient id={id('halo')} cx="0.42" cy="0.34" r="0.7">
                <stop offset="0%" stopColor={haloC} stopOpacity="0.42" />
                <stop offset="60%" stopColor={haloC} stopOpacity="0.12" />
                <stop offset="100%" stopColor={haloC} stopOpacity="0" />
              </radialGradient>
              <radialGradient id={id('vignette')} cx="0.5" cy="0.44" r="0.78">
                <stop offset="55%" stopColor={INK} stopOpacity="0" />
                <stop offset="100%" stopColor={INK} stopOpacity="0.5" />
              </radialGradient>
              {/* Nappe de lumière unique : même angle que les décors (LIGHT_ANGLE_DEG). */}
              <linearGradient id={id('light')} x1={LIGHT_VEC.x1} y1={LIGHT_VEC.y1} x2={LIGHT_VEC.x2} y2={LIGHT_VEC.y2}>
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
                <stop offset="46%" stopColor="#808080" stopOpacity="0" />
                <stop offset="100%" stopColor="#0e0a06" stopOpacity="0.8" />
              </linearGradient>
              {view && (
                <linearGradient id={id('skin')} x1={LIGHT_VEC.x1} y1={LIGHT_VEC.y1} x2={LIGHT_VEC.x2} y2={LIGHT_VEC.y2}>
                  <stop offset="0%" stopColor={view.skinL} />
                  <stop offset="58%" stopColor={view.skin} />
                  <stop offset="100%" stopColor={view.skinD} />
                </linearGradient>
              )}
              {view && view.look.Defs
                ? view.look.Defs({ id, P: view.P, acc: view.acc })
                : null}
              {/* Grain partagé de la bible de style. L'id est global : plusieurs portraits
                  déclarent un filtre strictement identique, le navigateur résout la première
                  définition — inoffensif. Approche retenue : plutôt que de filtrer toute
                  l'illustration (coûteux, et recalculé à chaque image de la respiration), on
                  applique le filtre à un rectangle transparent posé en dernier : le résultat
                  est le bruit seul, une couche statique jamais recalculée. */}
              <GrainDefs />
            </defs>

            <g clipPath={`url(#${id('frame')})`} style={{ isolation: 'isolate' }}>
              {ch && view ? (
                <>
                  <rect x="0" y="0" width={VB_W} height={VB_H} fill={`url(#${id('bg')})`} />
                  <circle cx="50" cy="40" r="46" fill={`url(#${id('halo')})`} />
                  <Figure k={{ ...view, ex, id, animate }} />
                </>
              ) : (
                <GenericBust
                  bracket={bracketFor(characterId, fallbackAge)}
                  initials={initialsOf(fallbackName || characterId)}
                  ids={id}
                  animate={animate}
                />
              )}
              <rect
                x="0"
                y="0"
                width={VB_W}
                height={VB_H}
                fill={`url(#${id('light')})`}
                style={{ mixBlendMode: 'soft-light' }}
              />
              <rect x="0" y="0" width={VB_W} height={VB_H} fill={`url(#${id('vignette')})`} />
              <g filter={`url(#${GRAIN_FILTER_ID})`} opacity="0.9">
                <rect x="0" y="0" width={VB_W} height={VB_H} fill={INK} fillOpacity="0" />
              </g>
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}

/** Assemblage d'un buste nommé : décor -> cou -> vêtement -> tête (coiffe/visage) -> accessoires. */
function Figure({ k }) {
  const { g, bust, look, id } = k;
  const neckClip = id('neck');
  return (
    <g className={`cc-figure${k.animate ? ' is-breathing' : ''}`}>
      {look.Scene ? look.Scene(k) : null}

      <clipPath id={neckClip}>
        <path d={neckPath(g, bust)} />
      </clipPath>
      <path d={neckPath(g, bust)} fill={k.skinD} />
      <g clipPath={`url(#${neckClip})`}>
        <path
          d={`M ${g.cx - g.neckHalf - 1} ${g.headCy + g.headH - 9} C ${g.cx - 4} ${g.headCy + g.headH - 1} ${g.cx + 4} ${g.headCy + g.headH - 1} ${g.cx + g.neckHalf + 1} ${g.headCy + g.headH - 9} L ${g.cx + g.neckHalf + 1} ${g.headCy + g.headH + 3} L ${g.cx - g.neckHalf - 1} ${g.headCy + g.headH + 3} Z`}
          fill={darken(k.skin, 0.34)}
          opacity="0.75"
        />
      </g>

      {look.Body ? look.Body(k) : null}

      <g transform={`rotate(${g.tilt} ${g.cx} ${g.headCy + g.headH + 6})`}>
        {look.HeadBack ? look.HeadBack(k) : null}
        <path d={headPath(g)} fill={`url(#${id('skin')})`} />
        <path d={headPath(g)} fill="none" stroke={k.skinE} strokeWidth="0.85" opacity="0.45" />
        {/* accroche de lumière sur la tempe éclairée */}
        <ellipse
          cx={g.cx - g.headW * 0.42}
          cy={g.headCy - g.headH * 0.42}
          rx={g.headW * 0.3}
          ry={g.headH * 0.24}
          fill={k.skinL}
          opacity="0.35"
          transform={`rotate(-24 ${g.cx - g.headW * 0.42} ${g.headCy - g.headH * 0.42})`}
        />
        <Face k={k} />
        {look.HeadFront ? look.HeadFront(k) : null}
      </g>

      {look.Props ? look.Props(k) : null}
    </g>
  );
}
