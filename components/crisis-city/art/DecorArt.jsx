// Décors de scène — Document n°4, §4.1 (2.5D : fond / milieu / avant), §4.2 (les 14 lieux),
// §4.3 (variante de crise = un filtre, sauf la digue qui gagne une vraie seconde composition)
// et §4.4 (couches d'effets : pluie, poussière, néon, gyrophare).
//
// Parti pris (cf. art/styleBible.jsx, partagé avec art/PortraitArt.jsx) : « théâtre d'ombres
// géométrique ». Aucune image, aucune dépendance : chaque lieu est une illustration vectorielle
// paramétrique, faite d'aplats et de silhouettes, mise en volume par une nappe de lumière
// directionnelle unique (LIGHT_ANGLE_DEG) posée en `soft-light` par-dessus toute la scène — donc
// exactement la même lumière que les portraits qui s'affichent devant.
//
// Objectif de lecture : reconnaître le lieu au premier coup d'œil, même flouté derrière une
// boîte de dialogue. Chaque décor a donc sa propre géométrie (couloir en perspective pour
// l'hôpital, hémicycle courbe pour le conseil, plan large pour la palmeraie, cadrage bas et
// écrasé pour la digue) et jamais un « gabarit de pièce » recoloré.

import { useEffect, useId, useMemo, useRef } from 'react';
import { DECORS } from '../data/decors.js';
import { PALETTES, LIGHT_ANGLE_DEG, GRAIN_FILTER_ID, GrainDefs, crisisFilterCss } from './styleBible.jsx';
import './DecorArt.css';

const VB_W = 320;
const VB_H = 180; // 16:9 — le 1920×1080 du document, en unités de viewBox.
const MAX_PARALLAX_PX = 14; // §4.1 : déplacement maximal, en pixels écran.

/* ------------------------------------------------------------------ couleurs */

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

/** Palette de travail dérivée d'un pays : couleurs de matière + les trois opérateurs
 *  (éclaircir / assombrir / contour implicite) que toutes les scènes utilisent. */
const KITS = {};
function kitFor(pays) {
  if (KITS[pays]) return KITS[pays];
  const P = PALETTES[pays] || PALETTES.maroc;
  const ink = mix(P.fond, '#0a0708', 0.45); // jamais de noir pur : l'encre est teintée pays
  const glow = pays === 'egypte' ? '#eaf6f8' : '#fff3dc';
  const lt = (c, t = 0.2) => mix(c, glow, t);
  const dk = (c, t = 0.28) => mix(c, ink, t);
  const ed = (c, t = 0.45) => desat(mix(c, ink, t), 0.3);
  const K = {
    P, pays, ink, glow, lt, dk, ed,
    sky0: P.ciel[0], sky1: P.ciel[1], sky2: P.ciel[2],
    accent: P.accent, accent2: P.accent2, terre: P.terre, pierre: P.pierre,
    wall: mix(P.pierre, P.terre, 0.34),
    floor: mix(P.terre, ink, 0.42),
    wood: mix(P.terre, ink, 0.3),
    metal: desat(mix(P.pierre, '#9aa6ab', 0.6), 0.45),
    glass: mix(P.accent, ink, 0.5),
    screen: mix(P.accent, glow, 0.28),
    paper: mix(P.pierre, glow, 0.62),
    sil: mix(ink, P.fond, 0.28),
    sea: mix(P.accent, ink, 0.34),
    // Un vert franchement végétal (l'accent2 égyptien tire sur le cyan : il ferait
    // des palmiers turquoise) et une eau bleutée pour les maquettes et l'irrigation.
    vegetal: pays === 'egypte' ? mix(P.accent2, '#4f6b2c', 0.68) : P.accent2,
    eau: pays === 'egypte' ? P.accent : mix(P.accent2, '#2f6f92', 0.62),
  };
  KITS[pays] = K;
  return K;
}

/** Vecteur de dégradé dérivé de LIGHT_ANGLE_DEG — identique à celui des portraits. */
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

/** Générateur pseudo-aléatoire déterministe : une graine => toujours la même composition. */
function rnd(seed) {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/* -------------------------------------------------------- briques réutilisables */

/** Dégradé orienté par la lumière commune. */
function LightGrad({ id, from, to, mid }) {
  return (
    <linearGradient id={id} x1={LIGHT_VEC.x1} y1={LIGHT_VEC.y1} x2={LIGHT_VEC.x2} y2={LIGHT_VEC.y2}>
      <stop offset="0%" stopColor={from} />
      {mid ? <stop offset="52%" stopColor={mid} /> : null}
      <stop offset="100%" stopColor={to} />
    </linearGradient>
  );
}

/** Palme (une seule moitié : la fonction Palm en pose deux rangées symétriques). */
function Frond({ len, thick, fill }) {
  const d = `M 0 0 C ${(len * 0.34).toFixed(2)} ${(-thick).toFixed(2)} ${(len * 0.72).toFixed(2)} ${(-thick * 0.78).toFixed(2)} ${len.toFixed(2)} ${(-thick * 0.12).toFixed(2)} C ${(len * 0.7).toFixed(2)} ${(thick * 0.85).toFixed(2)} ${(len * 0.34).toFixed(2)} ${(thick * 1.02).toFixed(2)} 0 ${(thick * 0.55).toFixed(2)} Z`;
  return <path d={d} fill={fill} />;
}

/** Palmier dattier : tronc légèrement penché + couronne de 12 palmes. */
function Palm({ x, y, h, C, tone = 0, lean = 0.08 }) {
  const w = Math.max(0.7, h * 0.045);
  const dx = h * lean;
  const top = y - h;
  const trunk = C.dk(C.terre, 0.3 + tone * 0.25);
  const leaf = C.dk(C.vegetal, tone * 0.4);
  const leafD = C.dk(leaf, 0.32);
  const L = h * 0.44;
  const angles = [-66, -32, -6, 18, 46, 76];
  return (
    <g>
      <path
        d={`M ${x - w} ${y} C ${x - w * 0.5} ${y - h * 0.55} ${x + dx - w * 1.1} ${y - h * 0.82} ${x + dx - w * 0.85} ${top} L ${x + dx + w * 0.85} ${top} C ${x + dx + w * 1.1} ${y - h * 0.82} ${x + w * 0.6} ${y - h * 0.55} ${x + w} ${y} Z`}
        fill={trunk}
      />
      <g transform={`translate(${x + dx} ${top})`}>
        {angles.map((a, i) => (
          <g key={`r${i}`} transform={`rotate(${a})`}>
            <Frond len={L * (i % 2 ? 0.86 : 1)} thick={L * 0.26} fill={i % 2 ? leafD : leaf} />
          </g>
        ))}
        {angles.map((a, i) => (
          <g key={`l${i}`} transform={`scale(-1,1) rotate(${a})`}>
            <Frond len={L * (i % 2 ? 0.9 : 0.96)} thick={L * 0.25} fill={i % 2 ? leaf : leafD} />
          </g>
        ))}
        <circle cx="0" cy="0" r={L * 0.11} fill={C.dk(leaf, 0.5)} />
      </g>
    </g>
  );
}

/** Foule en silhouette (§3 : les foules sont toujours des silhouettes, jamais des visages). */
function Crowd({ x0, x1, y, n, seed, fill, rim, s = 1, arms = 0 }) {
  const r = rnd(seed);
  const people = [];
  for (let i = 0; i < n; i += 1) {
    const x = x0 + ((x1 - x0) * (i + r() * 0.8)) / n;
    const sc = s * (0.84 + r() * 0.34);
    const hh = 15 * sc;
    const hr = 3.3 * sc;
    const sw = 7.2 * sc;
    const raised = i % Math.max(1, Math.round(n / Math.max(1, arms))) === 0 && arms > 0;
    people.push(
      <g key={i}>
        {rim ? (
          <>
            <circle cx={x - hr * 0.22} cy={y - hh - hr * 0.6} r={hr + 0.55} fill={rim} opacity="0.4" />
            <path
              d={`M ${x - sw - 0.5} ${y} L ${x - sw - 0.5} ${y - hh * 0.6} C ${x - sw - 0.5} ${y - hh} ${x + sw + 0.5} ${y - hh} ${x + sw + 0.5} ${y - hh * 0.6} L ${x + sw + 0.5} ${y} Z`}
              fill={rim}
              opacity="0.28"
            />
          </>
        ) : null}
        {raised ? (
          <path
            d={`M ${x + sw * 0.55} ${y - hh * 0.5} L ${x + sw * 0.2} ${y - hh * 1.5} L ${x + sw * 0.75} ${y - hh * 1.55} L ${x + sw * 1.05} ${y - hh * 0.45} Z`}
            fill={fill}
          />
        ) : null}
        <path
          d={`M ${x - sw} ${y} L ${x - sw} ${y - hh * 0.58} C ${x - sw} ${y - hh * 0.98} ${x - hr * 1.5} ${y - hh * 0.88} ${x - hr * 1.15} ${y - hh * 1.02} L ${x + hr * 1.15} ${y - hh * 1.02} C ${x + hr * 1.5} ${y - hh * 0.88} ${x + sw} ${y - hh * 0.98} ${x + sw} ${y - hh * 0.58} L ${x + sw} ${y} Z`}
          fill={fill}
        />
        <circle cx={x} cy={y - hh - hr * 0.5} r={hr} fill={fill} />
      </g>
    );
  }
  return <g>{people}</g>;
}

/** Silhouette assise vue de dos (opérateurs radio, personnel en salle). */
function SeatedBack({ x, y, s = 1, fill, casque }) {
  const hr = 3.6 * s;
  const bw = 8.4 * s;
  const bh = 13 * s;
  return (
    <g>
      <path d={`M ${x - bw} ${y} L ${x - bw * 0.82} ${y - bh * 0.72} C ${x - bw * 0.7} ${y - bh} ${x + bw * 0.7} ${y - bh} ${x + bw * 0.82} ${y - bh * 0.72} L ${x + bw} ${y} Z`} fill={fill} />
      <circle cx={x} cy={y - bh - hr * 0.55} r={hr} fill={fill} />
      {casque ? (
        <path d={`M ${x - hr - 1} ${y - bh - hr * 0.7} A ${hr + 1} ${hr + 1} 0 0 1 ${x + hr + 1} ${y - bh - hr * 0.7}`} fill="none" stroke={fill} strokeWidth={1.1 * s} />
      ) : null}
    </g>
  );
}

/** Écran / panneau lumineux : cadre sombre + dalle en dégradé + reflet oblique. */
function Panneau({ x, y, w, h, C, id, tone = 0, r = 1.4, children }) {
  return (
    <g>
      <rect x={x - 1.4} y={y - 1.4} width={w + 2.8} height={h + 2.8} rx={r + 1} fill={C.dk(C.metal, 0.55)} />
      <rect x={x} y={y} width={w} height={h} rx={r} fill={C.dk(C.glass, 0.2 + tone * 0.2)} />
      {children}
      <path d={`M ${x} ${y + h} L ${x + w * 0.42} ${y} L ${x + w * 0.62} ${y} L ${x + w * 0.12} ${y + h} Z`} fill={C.glow} opacity="0.05" />
      <rect x={x} y={y} width={w} height={h} rx={r} fill="none" stroke={C.lt(C.glass, 0.35)} strokeWidth="0.4" opacity="0.5" />
    </g>
  );
}

/** Courbe de mesure (hydrogramme, marégramme…) tracée dans un cadre donné. */
function Courbe({ x, y, w, h, C, color, seed = 3, n = 12, drop = 0.5, width = 1.1 }) {
  const r = rnd(seed);
  const pts = [];
  for (let i = 0; i <= n; i += 1) {
    const t = i / n;
    pts.push([x + w * t, y + h * (0.22 + drop * t + (r() - 0.5) * 0.26)]);
  }
  const d = pts.map((p, i) => `${i ? 'L' : 'M'} ${p[0].toFixed(1)} ${Math.max(y + 1, Math.min(y + h - 1, p[1])).toFixed(1)}`).join(' ');
  return (
    <g>
      <path d={`${d} L ${x + w} ${y + h} L ${x} ${y + h} Z`} fill={color} opacity="0.16" />
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinejoin="round" strokeLinecap="round" />
    </g>
  );
}

/** Histogramme compact pour les dalles de données. */
function Barres({ x, y, w, h, C, color, n = 7, seed = 11 }) {
  const r = rnd(seed);
  const bw = w / (n * 1.6);
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const bh = h * (0.25 + r() * 0.7);
        return <rect key={i} x={x + i * bw * 1.6} y={y + h - bh} width={bw} height={bh} fill={color} opacity={0.55 + (i % 3) * 0.15} />;
      })}
    </g>
  );
}

/** Lignes de texte suggérées (documents, listes, panneaux) — jamais de vrai texte. */
function Lignes({ x, y, w, n = 5, gap = 3, C, color, opacity = 0.5, seed = 5 }) {
  const r = rnd(seed);
  return (
    <g>
      {Array.from({ length: n }, (_, i) => (
        <rect key={i} x={x} y={y + i * gap} width={w * (0.55 + r() * 0.45)} height={gap * 0.34} rx={gap * 0.17} fill={color} opacity={opacity} />
      ))}
    </g>
  );
}

/** Horloge murale. */
function Horloge({ cx, cy, r, C, hh = -0.6, mm = 0.9, cadran }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={C.dk(C.metal, 0.5)} />
      <circle cx={cx} cy={cy} r={r * 0.86} fill={cadran || C.paper} />
      <line x1={cx} y1={cy} x2={cx + Math.cos(hh) * r * 0.44} y2={cy + Math.sin(hh) * r * 0.44} stroke={C.ed(C.wood, 0.6)} strokeWidth={r * 0.14} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={cx + Math.cos(mm) * r * 0.68} y2={cy + Math.sin(mm) * r * 0.68} stroke={C.ed(C.wood, 0.6)} strokeWidth={r * 0.1} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={r * 0.1} fill={C.accent} />
    </g>
  );
}

/** Château d'eau (repère visuel d'Aïn Sarra, visible depuis l'hôpital et le bureau). */
function ChateauEau({ x, y, s = 1, fill }) {
  return (
    <g fill={fill}>
      <path d={`M ${x - 9 * s} ${y - 26 * s} L ${x + 9 * s} ${y - 26 * s} L ${x + 7 * s} ${y - 18 * s} L ${x - 7 * s} ${y - 18 * s} Z`} />
      <rect x={x - 2 * s} y={y - 19 * s} width={4 * s} height={19 * s} />
      <path d={`M ${x - 6 * s} ${y} L ${x - 2.4 * s} ${y - 18 * s} L ${x - 0.8 * s} ${y - 18 * s} L ${x - 3.4 * s} ${y} Z`} />
      <path d={`M ${x + 6 * s} ${y} L ${x + 2.4 * s} ${y - 18 * s} L ${x + 0.8 * s} ${y - 18 * s} L ${x + 3.4 * s} ${y} Z`} />
      <rect x={x - 6 * s} y={y - 10 * s} width={12 * s} height={1.2 * s} />
    </g>
  );
}

/** Chaise vue de dos (dossier + pied central), utilisée dans plusieurs intérieurs. */
function Chaise({ x, y, s = 1, fill, dk }) {
  return (
    <g>
      <rect x={x - 8 * s} y={y - 18 * s} width={16 * s} height={11 * s} rx={2.4 * s} fill={fill} />
      <rect x={x - 1.6 * s} y={y - 8 * s} width={3.2 * s} height={6 * s} fill={dk} />
      <path d={`M ${x - 7 * s} ${y} L ${x + 7 * s} ${y} L ${x + 5 * s} ${y - 2 * s} L ${x - 5 * s} ${y - 2 * s} Z`} fill={dk} />
    </g>
  );
}

/* ================================================================== LES DÉCORS
 * Chaque décor expose ses trois couches. `k` = { id, C, fx, crise }.
 * Les clés de couche reprennent exactement les indications de data/decors.js.
 * ============================================================================ */

const SCENES_MAROC = {
  /* --- ma_agence : salle de réunion technique de l'agence de bassin ------------ */
  ma_agence: {
    defs: (k) => (
      <>
        <LightGrad id={k.id('carte')} from={k.C.lt(k.C.paper, 0.15)} to={k.C.dk(k.C.paper, 0.22)} />
        <LightGrad id={k.id('maq')} from={k.C.lt(k.C.pierre, 0.25)} to={k.C.dk(k.C.pierre, 0.4)} />
      </>
    ),
    fond: (k) => {
      const { C, id } = k;
      return (
        <g>
          <rect x="-12" y="-10" width="344" height="200" fill={`url(#${id('wall')})`} />
          {/* faux plafond + trois luminaires encastrés */}
          <rect x="-12" y="-10" width="344" height="30" fill={C.dk(C.wall, 0.42)} />
          <rect x="-12" y="19" width="344" height="1.2" fill={C.dk(C.wall, 0.62)} />
          {[62, 160, 258].map((x) => (
            <g key={x}>
              <rect x={x - 26} y="8" width="52" height="5" rx="2" fill={C.lt(C.glow, 0.1)} opacity="0.85" />
              <ellipse cx={x} cy="30" rx="46" ry="24" fill={`url(#${id('halo')})`} opacity="0.5" />
            </g>
          ))}
          {/* fenêtre haute côté rue : la ville poussiéreuse au loin */}
          <rect x="6" y="40" width="42" height="62" rx="1.5" fill={C.dk(C.metal, 0.35)} />
          <rect x="8.5" y="42.5" width="37" height="57" fill={`url(#${id('sky')})`} />
          <path d="M 8.5 92 L 16 92 L 16 80 L 24 80 L 24 86 L 33 86 L 33 74 L 41 74 L 41 90 L 45.5 90 L 45.5 99.5 L 8.5 99.5 Z" fill={C.dk(C.terre, 0.5)} opacity="0.8" />
          <rect x="26" y="42.5" width="1.6" height="57" fill={C.dk(C.metal, 0.35)} />
          {/* sol + plinthe */}
          <rect x="-12" y="128" width="344" height="62" fill={`url(#${id('floor')})`} />
          <rect x="-12" y="126" width="344" height="2.4" fill={C.dk(C.wall, 0.55)} />
          {/* porte du fond */}
          <rect x="268" y="46" width="38" height="80" rx="1" fill={C.dk(C.wood, 0.25)} />
          <rect x="271" y="49" width="32" height="74" fill={C.dk(C.wood, 0.45)} />
          <circle cx="276" cy="88" r="1.6" fill={C.lt(C.metal, 0.3)} />
        </g>
      );
    },
    milieu: (k) => {
      const { C, id } = k;
      return (
        <g>
          {/* trois cartes du bassin encadrées : courbes de niveau + réseau hydro + périmètre */}
          {[62, 128].map((x, n) => (
            <g key={x}>
              <rect x={x} y="40" width="58" height="46" rx="1" fill={C.dk(C.wood, 0.2)} />
              <rect x={x + 2.5} y="42.5" width="53" height="41" fill={`url(#${id('carte')})`} />
              {[0, 1, 2, 3].map((i) => (
                <path
                  key={i}
                  d={`M ${x + 4} ${52 + i * 7 + n * 2} Q ${x + 18} ${44 + i * 7} ${x + 30} ${53 + i * 6} T ${x + 53} ${50 + i * 7}`}
                  fill="none"
                  stroke={C.ed(C.terre, 0.35)}
                  strokeWidth="0.5"
                  opacity="0.55"
                />
              ))}
              <path d={`M ${x + 6} ${44} Q ${x + 22} ${58} ${x + 18} ${70} T ${x + 34} ${83}`} fill="none" stroke={C.accent} strokeWidth="1.3" opacity="0.9" />
              {n === 1 ? (
                <path d={`M ${x + 12} ${50} L ${x + 44} ${48} L ${x + 48} ${72} L ${x + 16} ${76} Z`} fill="none" stroke={C.dk('#b4443a', 0.05)} strokeWidth="0.8" strokeDasharray="2.5 2" />
              ) : null}
            </g>
          ))}
          {/* écran de projection : courbes de débit projetées */}
          <rect x="196" y="34" width="76" height="56" rx="0.8" fill={C.dk(C.metal, 0.6)} />
          <rect x="198" y="36" width="72" height="52" fill={C.lt(C.paper, 0.25)} opacity="0.94" />
          <line x1="203" y1="82" x2="266" y2="82" stroke={C.ed(C.pierre, 0.5)} strokeWidth="0.5" />
          <line x1="203" y1="41" x2="203" y2="82" stroke={C.ed(C.pierre, 0.5)} strokeWidth="0.5" />
          <Courbe x={203} y={41} w={63} h={41} C={C} color={C.accent} seed={19} drop={0.55} />
          <Courbe x={203} y={41} w={63} h={41} C={C} color={C.dk(C.accent2, 0.1)} seed={7} drop={0.2} width={0.8} />
          {/* faisceau du vidéoprojecteur */}
          <path d="M 236 26 L 272 34 L 272 90 L 236 26 Z" fill={C.glow} opacity="0.05" />
          {/* deux chaises derrière la table */}
          <Chaise x={96} y={140} s={1.1} fill={C.dk(C.wood, 0.4)} dk={C.dk(C.wood, 0.6)} />
          <Chaise x={214} y={142} s={1.15} fill={C.dk(C.wood, 0.45)} dk={C.dk(C.wood, 0.62)} />
        </g>
      );
    },
    avant: (k) => {
      const { C, id } = k;
      return (
        <g>
          {/* la grande table, arête vive au premier plan */}
          <path d="M -14 150 L 334 150 L 334 194 L -14 194 Z" fill={C.dk(C.wood, 0.5)} />
          <path d="M -14 146 L 334 146 L 334 152 L -14 152 Z" fill={`url(#${id('bois')})`} />
          {/* maquette du barrage posée au centre : retenue, voûte, vallée */}
          <g>
            <rect x="104" y="132" width="112" height="15" rx="1.5" fill={C.dk(C.pierre, 0.55)} />
            {/* la retenue, en amont : une lame d'eau au-dessus de la crête */}
            <path d="M 118 106 L 202 106 L 196 92 L 124 92 Z" fill={C.dk(C.eau, 0.28)} />
            <path d="M 126 101 L 194 101 L 191 95 L 129 95 Z" fill={C.lt(C.eau, 0.3)} opacity="0.7" />
            {/* les deux versants de la vallée, qui referment la retenue */}
            <path d="M 104 132 L 132 132 L 140 100 L 114 88 Z" fill={C.dk(C.terre, 0.35)} />
            <path d="M 216 132 L 188 132 L 180 100 L 206 88 Z" fill={C.dk(C.terre, 0.2)} />
            {/* la voûte du barrage */}
            <path d="M 132 132 L 188 132 L 182 104 L 138 104 Z" fill={`url(#${id('maq')})`} />
            <path d="M 136 104 L 184 104 L 184 107.4 L 136 107.4 Z" fill={C.lt(C.pierre, 0.45)} />
            <path d="M 132 132 L 138 104 L 145 104 L 141 132 Z" fill={C.dk(C.pierre, 0.3)} opacity="0.6" />
          </g>
          {/* rouleaux de plans, dossier et gobelet */}
          <g transform="translate(18 0)">
            <rect x="0" y="138" width="46" height="8" rx="4" fill={C.lt(C.paper, 0.1)} />
            <rect x="0" y="138" width="46" height="3" rx="1.5" fill={C.lt(C.paper, 0.35)} />
            <ellipse cx="46" cy="142" rx="2.4" ry="4" fill={C.dk(C.paper, 0.28)} />
            <rect x="6" y="131" width="44" height="7" rx="3.5" fill={C.paper} opacity="0.92" />
          </g>
          <g transform="translate(250 0)">
            <rect x="0" y="128" width="34" height="18" rx="1" fill={C.paper} opacity="0.9" transform="rotate(-3 17 137)" />
            <Lignes x={4} y={132} w={26} n={4} gap={3} C={C} color={C.ed(C.pierre, 0.4)} opacity={0.35} seed={9} />
            <path d="M 44 146 L 46 130 L 54 130 L 56 146 Z" fill={C.lt(C.paper, 0.3)} />
          </g>
        </g>
      );
    },
  },

  /* --- ma_palmeraie : plein air, rangées de palmiers et goutte-à-goutte -------- */
  ma_palmeraie: {
    defs: (k) => (
      <>
        <linearGradient id={k.id('sable')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={k.C.lt(k.C.terre, 0.34)} />
          <stop offset="100%" stopColor={k.C.dk(k.C.terre, 0.34)} />
        </linearGradient>
      </>
    ),
    fond: (k) => {
      const { C, id } = k;
      return (
        <g>
          <rect x="-12" y="-10" width="344" height="200" fill={`url(#${id('sky')})`} />
          <circle cx="72" cy="34" r="15" fill={C.glow} opacity="0.28" />
          <circle cx="72" cy="34" r="7" fill={C.glow} opacity="0.5" />
          {/* trois lignes de crêtes sèches, de plus en plus contrastées */}
          <path d="M -12 84 L 34 62 L 68 74 L 108 54 L 150 76 L 196 58 L 240 78 L 286 64 L 332 82 L 332 120 L -12 120 Z" fill={C.dk(C.pierre, 0.42)} opacity="0.55" />
          <path d="M -12 96 L 42 78 L 92 92 L 138 74 L 184 94 L 232 80 L 280 96 L 332 86 L 332 126 L -12 126 Z" fill={C.dk(C.terre, 0.42)} opacity="0.8" />
          <path d="M -12 104 L 58 96 L 112 106 L 176 94 L 236 106 L 300 98 L 332 104 L 332 132 L -12 132 Z" fill={C.dk(C.terre, 0.25)} />
          {/* ksar lointain, une ligne de murs crénelés */}
          <g fill={C.dk(C.terre, 0.5)} opacity="0.7">
            <rect x="232" y="88" width="34" height="10" />
            <rect x="236" y="83" width="5" height="6" />
            <rect x="248" y="81" width="5" height="8" />
            <rect x="259" y="84" width="5" height="5" />
          </g>
          <rect x="-12" y="104" width="344" height="86" fill={`url(#${id('sable')})`} />
        </g>
      );
    },
    milieu: (k) => {
      const { C } = k;
      return (
        <g>
          {/* rangée lointaine, petite et désaturée */}
          {[10, 42, 74, 106, 138, 170, 202, 234, 266, 298].map((x, i) => (
            <Palm key={`f${x}`} x={x + (i % 2) * 5} y={112} h={20 + (i % 3) * 3} C={C} tone={0.6} lean={0.05} />
          ))}
          <rect x="-12" y="110" width="344" height="4" fill={C.dk(C.terre, 0.42)} opacity="0.5" />
          {/* rangée intermédiaire */}
          {[4, 52, 100, 150, 200, 248, 300].map((x, i) => (
            <Palm key={`m${x}`} x={x} y={132} h={34 + (i % 3) * 5} C={C} tone={0.25} lean={i % 2 ? -0.07 : 0.09} />
          ))}
          {/* forage : abri, tête de pompe, cuve sur pieds */}
          <g transform="translate(240 0)">
            <rect x="0" y="112" width="26" height="20" rx="1" fill={C.dk(C.pierre, 0.35)} />
            <path d="M -2 112 L 28 112 L 24 106 L 2 106 Z" fill={C.dk(C.pierre, 0.55)} />
            <rect x="30" y="98" width="3" height="34" fill={C.dk(C.metal, 0.3)} />
            <rect x="24" y="94" width="16" height="7" rx="1.4" fill={C.metal} />
            <circle cx="41" cy="97.5" r="3.2" fill={C.dk(C.metal, 0.45)} />
            <rect x="42" y="103" width="2" height="29" fill={C.dk(C.metal, 0.4)} />
            <ellipse cx="12" cy="119" rx="6" ry="4" fill={C.dk(C.terre, 0.55)} opacity="0.5" />
          </g>
          {/* diguettes de terre entre les parcelles */}
          <path d="M -12 138 Q 90 130 200 140 T 332 136 L 332 144 Q 200 148 90 138 T -12 146 Z" fill={C.dk(C.terre, 0.4)} opacity="0.55" />
        </g>
      );
    },
    avant: (k) => {
      const { C } = k;
      return (
        <g>
          {/* deux palmiers de cadrage, coupés par le bord */}
          <Palm x={-6} y={192} h={96} C={C} tone={-0.1} lean={0.12} />
          <Palm x={330} y={196} h={104} C={C} tone={-0.05} lean={-0.1} />
          {/* sol craquelé, sur lequel courent les rampes */}
          <path d="M -14 168 L 334 164 L 334 194 L -14 194 Z" fill={C.dk(C.terre, 0.45)} />
          {/* réseau de goutte-à-goutte : deux rampes en perspective + goutteurs */}
          {[
            { y: 160, w: 1.5, o: 1 },
            { y: 182, w: 2.2, o: 1 },
          ].map((p, r) => (
            <g key={r}>
              <path d={`M -14 ${p.y - 4} Q 150 ${p.y + 3} 334 ${p.y - 6}`} fill="none" stroke={C.dk(C.terre, 0.5)} strokeWidth={p.w + 1.6} opacity="0.28" />
              <path d={`M -14 ${p.y - 6} Q 150 ${p.y + 1} 334 ${p.y - 8}`} fill="none" stroke={C.dk(C.sil, 0.2)} strokeWidth={p.w} strokeLinecap="round" />
              {[6, 46, 86, 126, 166, 206, 246, 286, 320].map((x, i) => (
                <g key={x}>
                  <rect x={x - 1.2} y={p.y - 7.6 + (i % 3) * 0.4} width="2.4" height="2.6" rx="0.8" fill={C.dk(C.sil, 0.1)} />
                  <ellipse cx={x} cy={p.y - 1 + (i % 2) * 1.5} rx={0.9 + r * 0.3} ry={1.5 + r * 0.4} fill={C.lt(C.eau, 0.3)} opacity="0.85" />
                  <ellipse cx={x} cy={p.y + 4} rx={4.2 + r * 1.4} ry={1.5} fill={C.dk(C.terre, 0.55)} opacity="0.45" />
                </g>
              ))}
            </g>
          ))}
          {/* craquelures du premier plan */}
          {[
            'M 10 178 L 30 186 L 22 194',
            'M 74 172 L 88 182 L 78 194',
            'M 150 174 L 158 188 L 172 192',
            'M 232 172 L 244 182 L 236 194',
            'M 292 176 L 306 186',
          ].map((d, i) => (
            <path key={i} d={d} fill="none" stroke={C.dk(C.terre, 0.68)} strokeWidth="0.9" opacity="0.7" />
          ))}
        </g>
      );
    },
  },

  /* --- ma_radio : studio, console et vitre de régie ---------------------------- */
  ma_radio: {
    defs: (k) => (
      <>
        <LightGrad id={k.id('console')} from={k.C.lt(k.C.metal, 0.1)} to={k.C.dk(k.C.metal, 0.55)} />
        <pattern id={k.id('mousse')} width="14" height="14" patternUnits="userSpaceOnUse">
          <rect width="14" height="14" fill={k.C.dk(k.C.wall, 0.5)} />
          <path d="M 0 0 L 7 7 L 0 14 Z" fill={k.C.dk(k.C.wall, 0.68)} />
          <path d="M 14 0 L 7 7 L 14 14 Z" fill={k.C.dk(k.C.wall, 0.34)} />
        </pattern>
      </>
    ),
    fond: (k) => {
      const { C, id } = k;
      return (
        <g>
          <rect x="-12" y="-10" width="344" height="200" fill={C.dk(C.wall, 0.55)} />
          {/* mousse acoustique en pointes de diamant sur tout le mur */}
          <rect x="-12" y="-10" width="344" height="130" fill={`url(#${id('mousse')})`} opacity="0.9" />
          <rect x="-12" y="118" width="344" height="72" fill={`url(#${id('floor')})`} />
          {/* vitre de régie : le technicien et la baie d'équipements derrière */}
          <g>
            <rect x="172" y="24" width="136" height="80" rx="2" fill={C.dk(C.metal, 0.42)} />
            <rect x="176" y="28" width="128" height="72" fill={C.dk(C.glass, 0.42)} />
            <g opacity="0.85">
              <rect x="266" y="42" width="30" height="58" rx="1" fill={C.dk(C.sil, 0.15)} />
              {[46, 54, 62, 70, 78, 86].map((y) => (
                <g key={y}>
                  <rect x="269" y={y} width="24" height="5" rx="1" fill={C.dk(C.sil, 0.3)} />
                  <circle cx="290" cy={y + 2.5} r="1" fill={C.accent} opacity="0.9" />
                </g>
              ))}
              <SeatedBack x={212} y={100} s={1.25} fill={C.dk(C.sil, 0.12)} casque />
              <rect x="186" y="86" width="58" height="14" rx="1" fill={C.dk(C.sil, 0.3)} />
              <rect x="196" y="74" width="20" height="12" rx="1" fill={C.lt(C.glass, 0.35)} opacity="0.7" />
            </g>
            <path d="M 176 100 L 226 28 L 250 28 L 200 100 Z" fill={C.glow} opacity="0.07" />
            <rect x="176" y="28" width="128" height="72" fill="none" stroke={C.lt(C.metal, 0.2)} strokeWidth="0.6" opacity="0.6" />
          </g>
        </g>
      );
    },
    milieu: (k) => {
      const { C, id } = k;
      return (
        <g>
          {/* console de mixage vue de trois quarts : plan incliné + tranches de faders */}
          <path d="M 12 128 L 214 128 L 226 176 L -2 176 Z" fill={`url(#${id('console')})`} />
          <path d="M 12 128 L 214 128 L 216 134 L 10 134 Z" fill={C.lt(C.metal, 0.28)} />
          <path d="M 10 134 L 216 134 L 222 158 L 4 158 Z" fill={C.dk(C.metal, 0.62)} />
          {Array.from({ length: 12 }, (_, i) => {
            const x = 18 + i * 16.6;
            const x2 = x + (i - 5.5) * 0.9;
            return (
              <g key={i}>
                <rect x={x2} y="138" width="12" height="18" rx="1" fill={C.dk(C.metal, 0.78)} />
                <rect x={x2 + 5} y="140" width="2" height="14" rx="1" fill={C.dk(C.ink, 0.1)} />
                <rect x={x2 + 3.2} y={143 + (i % 4) * 2.6} width="5.6" height="2.6" rx="0.8" fill={C.lt(C.pierre, 0.2)} />
                {[0, 1, 2].map((r) => (
                  <circle key={r} cx={x2 + 6} cy={136 - r * 0} r="0" fill="none" />
                ))}
              </g>
            );
          })}
          {/* rangée de potentiomètres et voyants sur le bandeau haut */}
          {Array.from({ length: 14 }, (_, i) => (
            <g key={i}>
              <circle cx={20 + i * 14.4} cy={131} r="2.1" fill={C.dk(C.metal, 0.3)} />
              <line x1={20 + i * 14.4} y1={131} x2={20 + i * 14.4 + (i % 3) - 1} y2={129} stroke={C.lt(C.pierre, 0.5)} strokeWidth="0.6" />
              <circle cx={20 + i * 14.4} cy={124} r="1" fill={i % 4 === 0 ? '#c9503f' : C.accent} opacity="0.85" />
            </g>
          ))}
          {/* deux enceintes de contrôle sur pied */}
          {[{ x: 24, s: 1 }, { x: 268, s: 1.1 }].map((sp) => (
            <g key={sp.x}>
              <path d={`M ${sp.x - 12 * sp.s} ${104} L ${sp.x + 12 * sp.s} ${104} L ${sp.x + 10 * sp.s} ${126} L ${sp.x - 10 * sp.s} ${126} Z`} fill={C.dk(C.wood, 0.35)} />
              <circle cx={sp.x} cy={113 * 1} r={6 * sp.s} fill={C.dk(C.ink, 0.12)} />
              <circle cx={sp.x} cy={113} r={2.4 * sp.s} fill={C.dk(C.metal, 0.35)} />
              <circle cx={sp.x} cy={122} r={2.4 * sp.s} fill={C.dk(C.ink, 0.12)} />
            </g>
          ))}
          {/* bras perche + micro de plateau */}
          <g>
            <path d="M 258 108 L 214 96 L 176 112" fill="none" stroke={C.dk(C.metal, 0.5)} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="258" cy="108" r="2.6" fill={C.dk(C.metal, 0.35)} />
            <g transform="rotate(28 176 112)">
              <rect x="171" y="110" width="10" height="16" rx="5" fill={C.dk(C.metal, 0.2)} />
              <rect x="172.4" y="112" width="7.2" height="9" rx="3.6" fill={C.dk(C.ink, 0.16)} />
            </g>
          </g>
        </g>
      );
    },
    avant: (k) => {
      const { C, id } = k;
      return (
        <g>
          {/* enseigne ON AIR suspendue — cible du scintillement néon */}
          <g>
            <line x1="126" y1="-4" x2="126" y2="10" stroke={C.dk(C.metal, 0.4)} strokeWidth="1.2" />
            <line x1="194" y1="-4" x2="194" y2="10" stroke={C.dk(C.metal, 0.4)} strokeWidth="1.2" />
            <rect x="108" y="8" width="104" height="30" rx="3" fill={C.dk(C.metal, 0.62)} />
            <g className={k.fx.neon ? 'cc-fx-neon' : undefined}>
              <rect x="112" y="12" width="96" height="22" rx="2" fill="#8f2f24" opacity="0.55" />
              <rect x="112" y="12" width="96" height="22" rx="2" fill="none" stroke="#e2705a" strokeWidth="1.1" />
              <text
                x="160"
                y="27.5"
                textAnchor="middle"
                fill="#ffd9c8"
                style={{ font: '700 12px ui-sans-serif, system-ui, sans-serif', letterSpacing: '2.4px' }}
              >
                ON AIR
              </text>
              <ellipse cx="160" cy="23" rx="66" ry="24" fill={`url(#${id('halo')})`} opacity="0.45" />
            </g>
          </g>
          {/* horloge de studio, à droite de l'enseigne */}
          <Horloge cx={278} cy={26} r={15} C={C} hh={-1.3} mm={0.55} cadran={C.dk(C.paper, 0.12)} />
          {/* micro de premier plan avec bonnette et filtre anti-pop, coupé par le bord */}
          <g transform="translate(4 0)">
            <path d="M 26 194 L 26 150 Q 26 140 38 138" fill="none" stroke={C.dk(C.metal, 0.45)} strokeWidth="3.4" strokeLinecap="round" />
            <g transform="rotate(-16 44 134)">
              <rect x="34" y="112" width="22" height="34" rx="11" fill={C.dk(C.metal, 0.28)} />
              <ellipse cx="45" cy="126" rx="9" ry="12" fill={C.dk(C.ink, 0.2)} />
              {[118, 123, 128, 133].map((y) => (
                <line key={y} x1="37" y1={y} x2="53" y2={y} stroke={C.dk(C.metal, 0.5)} strokeWidth="0.7" opacity="0.6" />
              ))}
            </g>
            <ellipse cx="72" cy="134" rx="12" ry="18" fill={C.lt(C.glass, 0.4)} opacity="0.22" />
            <ellipse cx="72" cy="134" rx="12" ry="18" fill="none" stroke={C.dk(C.metal, 0.35)} strokeWidth="1.4" />
          </g>
          {/* casque accroché au bord droit */}
          <g transform="translate(300 96)">
            <path d="M 0 12 A 13 13 0 0 1 26 12" fill="none" stroke={C.dk(C.sil, 0.05)} strokeWidth="3" />
            <rect x="-4" y="10" width="9" height="15" rx="4" fill={C.dk(C.sil, 0.02)} />
            <rect x="21" y="10" width="9" height="15" rx="4" fill={C.dk(C.sil, 0.12)} />
          </g>
        </g>
      );
    },
  },

  /* --- ma_cellule : open space de crise, écrans muraux et tableaux blancs ------ */
  ma_cellule: {
    defs: (k) => (
      <>
        <LightGrad id={k.id('tb')} from={k.C.lt(k.C.paper, 0.3)} to={k.C.dk(k.C.paper, 0.14)} />
      </>
    ),
    fond: (k) => {
      const { C, id } = k;
      return (
        <g>
          <rect x="-12" y="-10" width="344" height="200" fill={`url(#${id('wall')})`} />
          <rect x="-12" y="-10" width="344" height="18" fill={C.dk(C.wall, 0.5)} />
          {/* dalles de plafond éclairées */}
          {[30, 100, 170, 240, 310].map((x) => (
            <rect key={x} x={x - 26} y="2" width="52" height="4" rx="1.4" fill={C.glow} opacity="0.55" />
          ))}
          <rect x="-12" y="132" width="344" height="58" fill={`url(#${id('floor')})`} />
          {/* mur d'écrans : réseau d'eau, courbes, jauges */}
          <Panneau x={20} y={24} w={112} h={70} C={C} id={id}>
            <g>
              {/* carte du réseau : conduites + nœuds + réservoir */}
              <path d="M 30 84 L 52 66 L 78 70 L 96 52 L 122 58" fill="none" stroke={C.accent2} strokeWidth="1.3" opacity="0.9" />
              <path d="M 52 66 L 48 44 L 70 34" fill="none" stroke={C.accent} strokeWidth="1.3" opacity="0.9" />
              <path d="M 78 70 L 86 86 L 112 88" fill="none" stroke={C.accent} strokeWidth="1" opacity="0.7" />
              {[[52, 66], [78, 70], [96, 52], [48, 44], [86, 86]].map((p, i) => (
                <circle key={i} cx={p[0]} cy={p[1]} r="2.2" fill={i === 3 ? '#d8624c' : C.lt(C.accent2, 0.4)} />
              ))}
              <rect x="64" y="28" width="12" height="7" rx="1" fill={C.lt(C.accent, 0.3)} opacity="0.8" />
            </g>
          </Panneau>
          <Panneau x={140} y={24} w={78} h={44} C={C} id={id}>
            <Courbe x={146} y={28} w={66} h={36} C={C} color={C.accent2} seed={31} drop={0.6} />
          </Panneau>
          <Panneau x={140} y={74} w={78} h={20} C={C} id={id}>
            <Barres x={146} y={78} w={66} h={12} C={C} color={C.accent} n={9} seed={5} />
          </Panneau>
          <Panneau x={226} y={24} w={74} h={70} C={C} id={id}>
            <g>
              <circle cx="263" cy="52" r="20" fill="none" stroke={C.dk(C.glass, 0.3)} strokeWidth="4.5" />
              <path d="M 263 32 A 20 20 0 0 1 279 60" fill="none" stroke={C.accent} strokeWidth="4.5" strokeLinecap="round" />
              <Lignes x={236} y={78} w={54} n={3} gap={4.5} C={C} color={C.lt(C.glass, 0.55)} opacity={0.4} seed={17} />
            </g>
          </Panneau>
        </g>
      );
    },
    milieu: (k) => {
      const { C, id } = k;
      const board = (x, y, w, h, seed) => (
        <g>
          <rect x={x} y={y} width={w} height={h} rx="1" fill={C.dk(C.metal, 0.5)} />
          <rect x={x + 2} y={y + 2} width={w - 4} height={h - 4} fill={`url(#${id('tb')})`} />
          <path d={`M ${x + 8} ${y + h - 12} L ${x + w * 0.3} ${y + 12} L ${x + w * 0.55} ${y + h * 0.55} L ${x + w - 10} ${y + 10}`} fill="none" stroke={C.dk(C.accent, 0.1)} strokeWidth="1.2" strokeLinejoin="round" />
          <rect x={x + w * 0.55} y={y + 8} width={16} height={11} rx="1" fill="none" stroke={C.ed(C.terre, 0.2)} strokeWidth="0.8" />
          <path d={`M ${x + w * 0.55} ${y + 26} l 14 0 l -3 -3 m 3 3 l -3 3`} fill="none" stroke={C.ed(C.terre, 0.2)} strokeWidth="0.8" />
          <Lignes x={x + 8} y={y + h - 22} w={w * 0.38} n={3} gap={4} C={C} color={C.ed(C.pierre, 0.25)} opacity={0.45} seed={seed} />
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={x + w - 26 + (i % 2) * 11} y={y + h - 26 + Math.floor(i / 2) * 11} width="9" height="9" rx="0.6" fill={i % 3 === 0 ? '#d9a253' : C.lt(C.accent2, 0.35)} opacity="0.8" />
          ))}
          {/* pieds du chevalet */}
          <path d={`M ${x + 10} ${y + h} L ${x + 4} ${y + h + 18} M ${x + w - 10} ${y + h} L ${x + w - 4} ${y + h + 18}`} stroke={C.dk(C.metal, 0.45)} strokeWidth="1.8" fill="none" />
        </g>
      );
      return (
        <g>
          {board(6, 98, 104, 44, 3)}
          {board(206, 100, 104, 44, 21)}
          {/* postes de travail intermédiaires, silhouettes debout */}
          <SeatedBack x={140} y={148} s={1.15} fill={C.dk(C.sil, 0.02)} />
          <SeatedBack x={176} y={150} s={1.2} fill={C.dk(C.sil, 0.1)} casque />
          <rect x="118" y="146" width="86" height="4" rx="1" fill={C.dk(C.wood, 0.45)} />
        </g>
      );
    },
    avant: (k) => {
      const { C, id } = k;
      return (
        <g>
          {/* bord de bureau au premier plan */}
          <path d="M -14 156 L 334 152 L 334 194 L -14 194 Z" fill={C.dk(C.wood, 0.52)} />
          <path d="M -14 152 L 334 148 L 334 156 L -14 160 Z" fill={`url(#${id('bois')})`} />
          {/* téléphone de crise, combiné décroché posé à plat */}
          <g transform="translate(30 0)">
            <rect x="0" y="140" width="44" height="16" rx="2" fill={C.dk(C.sil, 0.02)} />
            <rect x="4" y="143" width="22" height="10" rx="1" fill={C.dk(C.metal, 0.6)} />
            {[0, 1, 2].map((r) => (
              <g key={r}>
                {[0, 1, 2].map((c) => (
                  <rect key={c} x={6 + c * 6.5} y={145 + r * 2.6} width="4.4" height="1.8" rx="0.5" fill={C.lt(C.metal, 0.25)} opacity="0.7" />
                ))}
              </g>
            ))}
            <rect x="28" y="130" width="26" height="9" rx="4.5" fill={C.dk(C.sil, 0.08)} transform="rotate(-8 41 134)" />
            <path d="M 30 148 q 8 6 16 0 q 8 -6 16 0 q 8 6 14 -2" fill="none" stroke={C.dk(C.sil, 0.05)} strokeWidth="1.5" />
          </g>
          {/* gobelets de café abandonnés */}
          {[{ x: 106, s: 1 }, { x: 124, s: 0.85 }, { x: 262, s: 1.05 }].map((g) => (
            <g key={g.x}>
              <path d={`M ${g.x - 5 * g.s} ${140} L ${g.x + 5 * g.s} ${140} L ${g.x + 3.6 * g.s} ${156} L ${g.x - 3.6 * g.s} ${156} Z`} fill={C.lt(C.paper, 0.25)} />
              <rect x={g.x - 5.4 * g.s} y={139} width={10.8 * g.s} height={2.4} rx="1" fill={C.dk(C.paper, 0.3)} />
              <rect x={g.x - 4.6 * g.s} y={146} width={9.2 * g.s} height={3} fill={C.dk(C.accent, 0.25)} opacity="0.5" />
            </g>
          ))}
          {/* papiers épars et ordinateur portable de dos */}
          <g>
            <rect x="150" y="150" width="46" height="16" rx="1" fill={C.paper} opacity="0.85" transform="rotate(-5 173 158)" />
            <rect x="166" y="156" width="44" height="15" rx="1" fill={C.lt(C.paper, 0.2)} opacity="0.9" transform="rotate(6 188 163)" />
            <Lignes x={156} y={154} w={34} n={3} gap={3.4} C={C} color={C.ed(C.pierre, 0.35)} opacity={0.3} seed={13} />
          </g>
          <g transform="translate(286 0)">
            <path d="M 0 152 L 34 152 L 30 128 L 4 128 Z" fill={C.dk(C.metal, 0.55)} />
            <path d="M 3 150 L 31 150 L 28 131 L 6 131 Z" fill={C.dk(C.metal, 0.72)} />
            <rect x="-4" y="152" width="42" height="4" rx="1.4" fill={C.dk(C.metal, 0.4)} />
          </g>
          {/* lampe de bureau, cône de lumière rasante */}
          <g transform="translate(-4 0)">
            <path d="M 14 156 L 22 118" stroke={C.dk(C.metal, 0.35)} strokeWidth="2" fill="none" />
            <path d="M 12 118 L 36 112 L 32 124 L 16 126 Z" fill={C.dk(C.metal, 0.25)} />
            <path d="M 16 126 L 32 124 L 62 176 L -6 176 Z" fill={C.glow} opacity="0.09" />
          </g>
        </g>
      );
    },
  },
  /* --- ma_parvis : place minérale, façade institutionnelle, foule à contre-jour -- */
  ma_parvis: {
    defs: (k) => (
      <>
        <LightGrad id={k.id('facade')} from={k.C.lt(k.C.pierre, 0.3)} to={k.C.dk(k.C.pierre, 0.34)} />
        <linearGradient id={k.id('dalle')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={k.C.dk(k.C.pierre, 0.46)} />
          <stop offset="100%" stopColor={k.C.dk(k.C.pierre, 0.2)} />
        </linearGradient>
      </>
    ),
    fond: (k) => {
      const { C, id } = k;
      return (
        <g>
          <rect x="-12" y="-10" width="344" height="200" fill={`url(#${id('sky')})`} />
          {/* façade : socle, arcade, corniche, fronton, drapeau */}
          <rect x="18" y="30" width="284" height="92" fill={`url(#${id('facade')})`} />
          <rect x="18" y="30" width="284" height="6" fill={C.lt(C.pierre, 0.42)} />
          <rect x="18" y="42" width="284" height="3" fill={C.dk(C.pierre, 0.4)} opacity="0.6" />
          <path d="M 120 30 L 160 12 L 200 30 Z" fill={C.lt(C.pierre, 0.34)} />
          <path d="M 116 30 L 204 30 L 204 34 L 116 34 Z" fill={C.dk(C.pierre, 0.3)} />
          <circle cx="160" cy="25" r="5" fill={C.accent} opacity="0.85" />
          <circle cx="160" cy="25" r="2.2" fill={C.dk(C.terre, 0.4)} />
          {/* rangée de fenêtres hautes */}
          {[34, 62, 90, 118, 202, 230, 258, 286].map((x) => (
            <g key={x}>
              <rect x={x - 7} y="50" width="14" height="20" rx="6.5" fill={C.dk(C.glass, 0.4)} />
              <rect x={x - 7} y="50" width="14" height="20" rx="6.5" fill="none" stroke={C.dk(C.pierre, 0.32)} strokeWidth="1.1" />
            </g>
          ))}
          {/* arcade : sept arcs plein cintre */}
          {Array.from({ length: 7 }, (_, i) => {
            const x = 34 + i * 40;
            return (
              <g key={i}>
                <path d={`M ${x} 122 L ${x} 100 A 14 14 0 0 1 ${x + 28} 100 L ${x + 28} 122 Z`} fill={C.dk(C.pierre, 0.72)} />
                <path d={`M ${x - 3} 122 L ${x - 3} 100 A 17 17 0 0 1 ${x + 31} 100 L ${x + 31} 122`} fill="none" stroke={C.dk(C.pierre, 0.22)} strokeWidth="2.6" />
              </g>
            );
          })}
          {/* mât et drapeau */}
          <rect x="12" y="18" width="2" height="104" fill={C.dk(C.metal, 0.35)} />
          <path d="M 14 22 L 44 26 L 42 34 L 14 40 Z" fill="#a8352c" opacity="0.9" />
          {/* marches */}
          {[0, 1, 2].map((i) => (
            <rect key={i} x={12 - i * 6} y={122 + i * 4} width={296 + i * 12} height="4.4" fill={C.dk(C.pierre, 0.3 - i * 0.06)} />
          ))}
          <rect x="-12" y="134" width="344" height="56" fill={`url(#${id('dalle')})`} />
        </g>
      );
    },
    milieu: (k) => {
      const { C } = k;
      return (
        <g>
          {/* dallage en perspective : joints qui fuient vers la façade */}
          {[-60, 0, 60, 120, 180, 240, 300, 360, 420].map((x) => (
            <path key={x} d={`M ${x} 194 L ${160 + (x - 160) * 0.28} 134`} stroke={C.dk(C.pierre, 0.5)} strokeWidth="0.7" opacity="0.4" fill="none" />
          ))}
          {[138, 146, 158, 174, 194].map((y, i) => (
            <line key={y} x1="-14" y1={y} x2="334" y2={y} stroke={C.dk(C.pierre, 0.5)} strokeWidth={0.5 + i * 0.15} opacity="0.32" />
          ))}
          {/* banderoles tendues entre deux mâts */}
          <g>
            <rect x="42" y="58" width="2.4" height="76" fill={C.dk(C.metal, 0.4)} />
            <rect x="276" y="58" width="2.4" height="76" fill={C.dk(C.metal, 0.4)} />
            <path d="M 44 62 Q 160 76 278 62 L 278 78 Q 160 92 44 78 Z" fill="#b6533a" opacity="0.9" />
            <path d="M 44 68 Q 160 82 278 68" fill="none" stroke={C.lt('#b6533a', 0.5)} strokeWidth="1.6" opacity="0.6" />
            <path d="M 44 74 Q 160 88 278 74" fill="none" stroke={C.lt('#b6533a', 0.5)} strokeWidth="1.1" opacity="0.45" />
          </g>
          {/* bassin de fontaine à sec, à gauche */}
          <g transform="translate(20 0)">
            <ellipse cx="26" cy="144" rx="30" ry="9" fill={C.dk(C.pierre, 0.45)} />
            <ellipse cx="26" cy="142" rx="26" ry="7" fill={C.dk(C.terre, 0.5)} />
            <rect x="24" y="128" width="4" height="14" fill={C.dk(C.pierre, 0.3)} />
            <ellipse cx="26" cy="128" rx="8" ry="3" fill={C.dk(C.pierre, 0.28)} />
          </g>
          {/* bornes basses alignées */}
          {[92, 120, 148, 176, 204, 232, 260].map((x) => (
            <g key={x}>
              <rect x={x - 2.4} y="128" width="4.8" height="14" rx="2.2" fill={C.dk(C.metal, 0.45)} />
              <rect x={x - 2.4} y="128" width="4.8" height="2.4" rx="1.2" fill={C.lt(C.metal, 0.2)} />
            </g>
          ))}
          {/* première nappe de foule, plus loin et plus claire */}
          <Crowd x0={-10} x1={332} y={150} n={22} seed={71} fill={C.dk(C.sil, 0.18)} rim={C.lt(C.accent, 0.35)} s={0.78} />
        </g>
      );
    },
    avant: (k) => {
      const { C, crise, decor } = k;
      const dense = crise && decor.variante && decor.variante.densiteFoule > 1;
      return (
        <g>
          {/* foule à contre-jour : silhouettes pleines, liseré chaud sur les épaules */}
          <Crowd x0={-16} x1={336} y={176} n={dense ? 20 : 13} seed={17} fill={C.dk(C.sil, 0.05)} rim={C.lt(C.accent, 0.5)} s={1.3} arms={dense ? 4 : 1} />
          {dense ? (
            <>
              <Crowd x0={-16} x1={336} y={188} n={16} seed={53} fill={C.dk(C.ink, 0.02)} rim={C.lt(C.accent, 0.3)} s={1.55} arms={3} />
              {/* drapeaux et pancartes brandis au-dessus de la foule */}
              {[46, 128, 226, 292].map((x, i) => (
                <g key={x}>
                  <rect x={x} y="118" width="1.8" height="60" fill={C.dk(C.sil, 0.05)} />
                  <path d={`M ${x + 1.8} 118 q 14 ${i % 2 ? 5 : -4} 26 1 l 0 12 q -12 5 -26 1 Z`} fill={i % 2 ? '#a8352c' : C.dk(C.accent2, 0.1)} opacity="0.92" />
                </g>
              ))}
            </>
          ) : null}
          {/* deux pancartes tenues à bout de bras */}
          {[86, 246].map((x, i) => (
            <g key={x}>
              <rect x={x} y="132" width="2" height="46" fill={C.dk(C.sil, 0.02)} />
              <g transform={`rotate(${i ? 5 : -6} ${x} 130)`}>
                <rect x={x - 17} y="112" width="36" height="22" rx="1.4" fill={C.lt(C.paper, 0.1)} opacity="0.9" />
                <Lignes x={x - 13} y={117} w={28} n={3} gap={4.6} C={C} color={C.ed(C.terre, 0.2)} opacity={0.6} seed={i * 9 + 3} />
              </g>
            </g>
          ))}
        </g>
      );
    },
  },

  /* --- ma_bureau : bureau du coordinateur, dossier Aqua Atlas ouvert ----------- */
  ma_bureau: {
    defs: (k) => (
      <>
        <LightGrad id={k.id('page')} from={k.C.lt(k.C.paper, 0.42)} to={k.C.dk(k.C.paper, 0.1)} />
      </>
    ),
    fond: (k) => {
      const { C, id } = k;
      return (
        <g>
          <rect x="-12" y="-10" width="344" height="200" fill={`url(#${id('wall')})`} />
          <rect x="-12" y="128" width="344" height="62" fill={`url(#${id('floor')})`} />
          <rect x="-12" y="126" width="344" height="2.4" fill={C.dk(C.wall, 0.55)} />
          {/* grande fenêtre sur la ville poussiéreuse */}
          <g>
            <rect x="146" y="18" width="164" height="104" rx="1.5" fill={C.dk(C.wood, 0.35)} />
            <rect x="150" y="22" width="156" height="96" fill={`url(#${id('sky')})`} />
            {/* silhouette urbaine : toits, minaret, château d'eau */}
            <g fill={C.dk(C.terre, 0.45)} opacity="0.85">
              <path d="M 150 96 L 172 96 L 172 78 L 190 78 L 190 88 L 208 88 L 208 70 L 224 70 L 224 92 L 246 92 L 246 80 L 266 80 L 266 96 L 306 96 L 306 118 L 150 118 Z" />
              <rect x="196" y="44" width="8" height="34" />
              <path d="M 194 44 L 206 44 L 200 34 Z" />
            </g>
            <ChateauEau x={284} y={96} s={0.8} fill={C.dk(C.terre, 0.55)} />
            <rect x="150" y="96" width="156" height="22" fill={C.dk(C.terre, 0.25)} opacity="0.35" />
            {/* store vénitien à demi baissé */}
            {Array.from({ length: 7 }, (_, i) => (
              <rect key={i} x="150" y={22 + i * 5.4} width="156" height="3.4" fill={C.dk(C.paper, 0.25)} opacity="0.62" />
            ))}
            <rect x="226" y="22" width="2.4" height="96" fill={C.dk(C.wood, 0.35)} />
            <path d="M 150 118 L 190 22 L 214 22 L 174 118 Z" fill={C.glow} opacity="0.07" />
          </g>
          {/* rai de lumière au sol */}
          <path d="M 150 128 L 306 128 L 262 190 L 62 190 Z" fill={C.glow} opacity="0.06" />
        </g>
      );
    },
    milieu: (k) => {
      const { C } = k;
      return (
        <g>
          {/* étagère à classeurs */}
          <g transform="translate(8 0)">
            <rect x="0" y="34" width="88" height="72" rx="1" fill={C.dk(C.wood, 0.42)} />
            <rect x="3" y="37" width="82" height="66" fill={C.dk(C.wood, 0.62)} />
            {[40, 62, 84].map((y, row) => (
              <g key={y}>
                <rect x="3" y={y + 20} width="82" height="2.4" fill={C.dk(C.wood, 0.3)} />
                {Array.from({ length: 9 }, (_, i) => (
                  <rect
                    key={i}
                    x={6 + i * 8.8}
                    y={y + (i % 3) * 1.2}
                    width={7}
                    height={20 - (i % 3) * 1.2}
                    fill={[C.accent, C.accent2, C.terre, C.pierre][(i + row) % 4]}
                    opacity="0.72"
                  />
                ))}
              </g>
            ))}
          </g>
          <Horloge cx={124} cy={44} r={12} C={C} hh={-2.1} mm={1.2} />
          {/* bureau et fauteuil */}
          <path d="M 22 126 L 262 126 L 274 154 L 8 154 Z" fill={C.dk(C.wood, 0.34)} />
          <path d="M 22 126 L 262 126 L 264 131 L 20 131 Z" fill={C.lt(C.wood, 0.24)} />
          <rect x="34" y="154" width="8" height="26" fill={C.dk(C.wood, 0.55)} />
          <rect x="238" y="154" width="8" height="26" fill={C.dk(C.wood, 0.55)} />
          <Chaise x={200} y={126} s={1.4} fill={C.dk(C.sil, 0.14)} dk={C.dk(C.sil, 0.02)} />
          {/* lampe articulée */}
          <g transform="translate(48 0)">
            <ellipse cx="6" cy="126" rx="10" ry="3.4" fill={C.dk(C.metal, 0.45)} />
            <path d="M 6 124 L 14 100 L 34 92" fill="none" stroke={C.dk(C.metal, 0.35)} strokeWidth="2" />
            <path d="M 30 86 L 46 92 L 40 104 L 26 96 Z" fill={C.dk(C.metal, 0.2)} />
            <path d="M 27 98 L 41 104 L 78 152 L 18 148 Z" fill={C.glow} opacity="0.1" />
          </g>
          {/* verre et tasse sur le bureau */}
          <g transform="translate(224 0)">
            <path d="M 0 112 L 12 112 L 10 126 L 2 126 Z" fill={C.lt(C.glass, 0.5)} opacity="0.35" />
            <path d="M 1 119 L 11 119 L 10 126 L 2 126 Z" fill={C.accent} opacity="0.3" />
          </g>
        </g>
      );
    },
    avant: (k) => {
      const { C, id } = k;
      return (
        <g>
          {/* dossier Aqua Atlas ouvert, plein cadre en bas */}
          <g transform="rotate(-3 160 168)">
            <path d="M 44 146 L 160 140 L 276 146 L 292 196 L 28 196 Z" fill={C.dk(C.paper, 0.42)} />
            <path d="M 50 148 L 158 143 L 158 194 L 36 194 Z" fill={`url(#${id('page')})`} />
            <path d="M 270 148 L 162 143 L 162 194 L 284 194 Z" fill={`url(#${id('page')})`} />
            <path d="M 158 143 L 162 143 L 162 194 L 158 194 Z" fill={C.dk(C.paper, 0.3)} opacity="0.7" />
            {/* page de gauche : titre, filets de texte, pastille bleue « Aqua Atlas » */}
            <rect x="58" y="152" width="46" height="5" rx="1.4" fill={C.dk(C.accent, 0.15)} opacity="0.8" />
            <circle cx="140" cy="156" r="6.4" fill={C.accent} opacity="0.85" />
            <path d="M 140 151 q 4.4 4.2 0 8.4 q -4.4 -4.2 0 -8.4 Z" fill={C.lt(C.glass, 0.7)} opacity="0.85" />
            <Lignes x={58} y={164} w={88} n={7} gap={4.2} C={C} color={C.ed(C.pierre, 0.3)} opacity={0.34} seed={23} />
            {/* page de droite : schéma de bassin + courbe */}
            <g>
              <rect x="176" y="150" width="92" height="26" rx="1" fill={C.lt(C.glass, 0.75)} opacity="0.35" />
              <path d="M 180 172 Q 200 156 222 166 T 264 158" fill="none" stroke={C.accent} strokeWidth="1.4" />
              <path d="M 180 174 L 264 174" stroke={C.ed(C.pierre, 0.3)} strokeWidth="0.6" />
              <Lignes x={176} y={180} w={90} n={4} gap={4.2} C={C} color={C.ed(C.pierre, 0.3)} opacity={0.3} seed={41} />
            </g>
          </g>
          {/* stylo posé en travers et lunettes */}
          <path d="M 214 152 L 268 168 L 264 173 L 210 157 Z" fill={C.dk(C.accent, 0.2)} transform="rotate(2 240 162)" />
          <path d="M 262 166 L 272 170 L 268 175 Z" fill={C.dk(C.ink, 0.05)} />
          <g transform="translate(28 138) rotate(-9)">
            <circle cx="10" cy="10" r="8" fill="none" stroke={C.dk(C.metal, 0.3)} strokeWidth="1.6" />
            <circle cx="32" cy="8" r="8" fill="none" stroke={C.dk(C.metal, 0.3)} strokeWidth="1.6" />
            <path d="M 18 9 q 3 -3 6 -1" fill="none" stroke={C.dk(C.metal, 0.3)} strokeWidth="1.4" />
          </g>
        </g>
      );
    },
  },

  /* --- ma_hopital : couloir de nuit en perspective centrale ------------------- */
  ma_hopital: {
    defs: (k) => (
      <>
        <linearGradient id={k.id('murG')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={k.C.dk(k.C.wall, 0.62)} />
          <stop offset="100%" stopColor={k.C.dk(k.C.wall, 0.24)} />
        </linearGradient>
        <linearGradient id={k.id('murD')} x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor={k.C.dk(k.C.wall, 0.7)} />
          <stop offset="100%" stopColor={k.C.dk(k.C.wall, 0.3)} />
        </linearGradient>
        <linearGradient id={k.id('solC')} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={k.C.dk(k.C.floor, 0.35)} />
          <stop offset="100%" stopColor={k.C.lt(k.C.floor, 0.22)} />
        </linearGradient>
      </>
    ),
    fond: (k) => {
      const { C, id } = k;
      return (
        <g>
          <rect x="-12" y="-10" width="344" height="200" fill={C.dk(C.wall, 0.6)} />
          {/* boîte du couloir : plafond, deux murs, sol, mur de fond */}
          <path d="M -14 -8 L 128 58 L 212 58 L 334 -8 Z" fill={C.dk(C.wall, 0.72)} />
          <path d="M -14 -8 L 128 58 L 128 126 L -14 190 Z" fill={`url(#${id('murG')})`} />
          <path d="M 334 -8 L 212 58 L 212 126 L 334 190 Z" fill={`url(#${id('murD')})`} />
          <path d="M -14 190 L 128 126 L 212 126 L 334 190 Z" fill={`url(#${id('solC')})`} />
          <rect x="128" y="58" width="84" height="68" fill={C.dk(C.wall, 0.45)} />
          {/* joints de dalles au sol, convergents */}
          {[0.2, 0.42, 0.62, 0.8].map((t, i) => (
            <path
              key={i}
              d={`M ${-14 + (128 + 14) * t} ${190 - (190 - 126) * t} L ${334 - (334 - 212) * t} ${190 - (190 - 126) * t}`}
              stroke={C.dk(C.floor, 0.5)}
              strokeWidth={1.4 - i * 0.28}
              opacity="0.4"
              fill="none"
            />
          ))}
          {/* fenêtre du fond : nuit, lune, château d'eau */}
          <g>
            <rect x="142" y="66" width="56" height="42" rx="1" fill={C.dk(C.metal, 0.5)} />
            <rect x="144" y="68" width="52" height="38" fill={`url(#${id('skyNuit')})`} />
            <circle cx="184" cy="78" r="4.4" fill={C.glow} opacity="0.55" />
            <ChateauEau x={160} y={106} s={0.62} fill={C.dk(C.ink, 0.12)} />
            <rect x="168" y="68" width="1.6" height="38" fill={C.dk(C.metal, 0.5)} />
            <rect x="144" y="86" width="52" height="1.6" fill={C.dk(C.metal, 0.5)} />
          </g>
          {/* main courante des deux côtés */}
          <path d="M -14 150 L 128 104 L 128 108 L -14 158 Z" fill={C.dk(C.metal, 0.3)} opacity="0.75" />
          <path d="M 334 150 L 212 104 L 212 108 L 334 158 Z" fill={C.dk(C.metal, 0.3)} opacity="0.75" />
        </g>
      );
    },
    milieu: (k) => {
      const { C } = k;
      // interpolation le long des murs fuyants : t = 0 au fond, 1 au bord du cadre
      const wallL = (t) => ({ x: 128 - 142 * t, top: 58 - 66 * t, bot: 126 + 64 * t });
      const wallR = (t) => ({ x: 212 + 122 * t, top: 58 - 66 * t, bot: 126 + 64 * t });
      const panel = (a, b, f0, f1, fill) =>
        `M ${a.x} ${a.top + (a.bot - a.top) * f0} L ${b.x} ${b.top + (b.bot - b.top) * f0} L ${b.x} ${b.top + (b.bot - b.top) * f1} L ${a.x} ${a.top + (a.bot - a.top) * f1} Z`;
      const dGa = wallL(0.16);
      const dGb = wallL(0.46);
      const dDa = wallR(0.14);
      const dDb = wallR(0.52);
      return (
        <g>
          {/* portes de chambres, mur gauche */}
          <path d={panel(dGa, dGb, 0.12, 0.94, null)} fill={C.dk(C.wood, 0.4)} />
          <path d={panel(wallL(0.19), wallL(0.43), 0.16, 0.9, null)} fill={C.dk(C.wood, 0.2)} />
          {/* portes battantes du bloc, mur droit : deux hublots ronds */}
          <path d={panel(dDa, dDb, 0.08, 0.96, null)} fill={C.dk(C.accent2, 0.35)} />
          <path d={panel(wallR(0.17), wallR(0.32), 0.12, 0.92, null)} fill={C.dk(C.accent2, 0.2)} />
          <path d={panel(wallR(0.34), wallR(0.49), 0.12, 0.92, null)} fill={C.dk(C.accent2, 0.26)} />
          <ellipse cx="246" cy="78" rx="5" ry="7" fill={C.lt(C.glass, 0.55)} opacity="0.5" />
          <ellipse cx="272" cy="72" rx="6" ry="9" fill={C.lt(C.glass, 0.55)} opacity="0.5" />
          {/* brancard proche, à gauche : matelas, châssis, roues */}
          <g>
            <rect x="16" y="122" width="102" height="10" rx="3" fill={C.lt(C.paper, 0.18)} />
            <rect x="16" y="130" width="102" height="5" rx="1.6" fill={C.dk(C.metal, 0.4)} />
            <rect x="22" y="112" width="26" height="12" rx="4" fill={C.lt(C.paper, 0.35)} />
            <rect x="12" y="108" width="7" height="28" rx="2" fill={C.dk(C.metal, 0.3)} />
            <rect x="114" y="112" width="6" height="24" rx="2" fill={C.dk(C.metal, 0.3)} />
            <path d="M 26 135 L 26 152 M 106 135 L 106 152" stroke={C.dk(C.metal, 0.42)} strokeWidth="2.6" />
            <circle cx="26" cy="155" r="3.4" fill={C.dk(C.ink, 0.1)} />
            <circle cx="106" cy="155" r="3.4" fill={C.dk(C.ink, 0.1)} />
          </g>
          {/* brancard lointain, à droite */}
          <g opacity="0.9">
            <rect x="222" y="106" width="54" height="5.6" rx="1.8" fill={C.lt(C.paper, 0.1)} />
            <rect x="222" y="111" width="54" height="3" rx="1" fill={C.dk(C.metal, 0.45)} />
            <rect x="226" y="100" width="14" height="6.4" rx="2" fill={C.lt(C.paper, 0.28)} />
            <path d="M 228 114 L 228 124 M 268 114 L 268 124" stroke={C.dk(C.metal, 0.5)} strokeWidth="1.6" />
            <circle cx="228" cy="126" r="2" fill={C.dk(C.ink, 0.12)} />
            <circle cx="268" cy="126" r="2" fill={C.dk(C.ink, 0.12)} />
          </g>
          {/* pied à perfusion */}
          <g transform="translate(196 0)">
            <rect x="0" y="86" width="1.8" height="44" fill={C.dk(C.metal, 0.3)} />
            <path d="M -6 130 L 8 130 M 1 130 L 1 134" stroke={C.dk(C.metal, 0.35)} strokeWidth="1.4" />
            <path d="M -2 88 L 6 88 L 5 100 L -1 100 Z" fill={C.lt(C.glass, 0.6)} opacity="0.45" />
          </g>
        </g>
      );
    },
    avant: (k) => {
      const { C, id } = k;
      return (
        <g>
          {/* tubes néon du plafond, en enfilade (cible du scintillement) */}
          <g className={k.fx.neon ? 'cc-fx-neon' : undefined}>
            {[
              { y: 10, w: 68, h: 6 },
              { y: 32, w: 42, h: 4 },
              { y: 47, w: 26, h: 2.6 },
            ].map((t) => (
              <g key={t.y}>
                <rect x={170 - t.w / 2} y={t.y} width={t.w} height={t.h} rx={t.h / 2} fill={C.glow} opacity="0.9" />
                <ellipse cx="170" cy={t.y + t.h / 2} rx={t.w * 0.95} ry={t.h * 3.4} fill={`url(#${id('halo')})`} opacity="0.5" />
              </g>
            ))}
          </g>
          {/* signalétique bleue suspendue */}
          <g>
            <line x1="34" y1="0" x2="34" y2="14" stroke={C.dk(C.metal, 0.4)} strokeWidth="1.2" />
            <line x1="104" y1="0" x2="104" y2="14" stroke={C.dk(C.metal, 0.4)} strokeWidth="1.2" />
            <rect x="20" y="14" width="98" height="30" rx="2" fill={C.dk(C.accent, 0.28)} />
            <rect x="22" y="16" width="94" height="26" rx="1.4" fill={C.dk('#1f6f9c', 0.12)} />
            <path d="M 100 29 L 84 20 L 84 25 L 62 25 L 62 33 L 84 33 L 84 38 Z" fill={C.lt(C.glass, 0.85)} opacity="0.9" />
            <Lignes x={28} y={22} w={30} n={3} gap={6} C={C} color={C.lt(C.glass, 0.85)} opacity={0.7} seed={7} />
          </g>
          {/* distributeur mural, côté droit */}
          <g transform="translate(292 0)">
            <rect x="0" y="96" width="16" height="26" rx="2" fill={C.lt(C.paper, 0.1)} />
            <rect x="3" y="100" width="10" height="12" rx="1" fill={C.lt(C.glass, 0.5)} opacity="0.5" />
            <rect x="5" y="122" width="6" height="4" rx="1" fill={C.dk(C.metal, 0.3)} />
          </g>
          {/* montants sombres qui encadrent le couloir (profondeur) */}
          <path d="M -14 -8 L 16 -8 L 4 190 L -14 190 Z" fill={C.dk(C.ink, 0.06)} opacity="0.55" />
          <path d="M 334 -8 L 306 -8 L 316 190 L 334 190 Z" fill={C.dk(C.ink, 0.06)} opacity="0.55" />
        </g>
      );
    },
  },

  /* --- ma_conseil : hémicycle communal, drapeaux, maquette du plan ------------- */
  ma_conseil: {
    defs: (k) => (
      <>
        <LightGrad id={k.id('boiserie')} from={k.C.lt(k.C.wood, 0.18)} to={k.C.dk(k.C.wood, 0.42)} />
      </>
    ),
    fond: (k) => {
      const { C, id } = k;
      return (
        <g>
          <rect x="-12" y="-10" width="344" height="200" fill={C.dk(C.wall, 0.44)} />
          {/* boiserie du fond, lattes verticales */}
          <rect x="-12" y="24" width="344" height="86" fill={`url(#${id('boiserie')})`} />
          {Array.from({ length: 24 }, (_, i) => (
            <rect key={i} x={-12 + i * 14.4} y="24" width="1.4" height="86" fill={C.dk(C.wood, 0.6)} opacity="0.5" />
          ))}
          <rect x="-12" y="20" width="344" height="5" fill={C.dk(C.wood, 0.68)} />
          <rect x="-12" y="108" width="344" height="4" fill={C.dk(C.wood, 0.68)} />
          {/* emblème */}
          <circle cx="160" cy="52" r="16" fill={C.dk(C.accent, 0.12)} />
          <circle cx="160" cy="52" r="12.4" fill={C.dk(C.wood, 0.5)} />
          <path d="M 160 42 l 3.2 6.6 7.2 1 -5.2 5.1 1.2 7.2 -6.4 -3.4 -6.4 3.4 1.2 -7.2 -5.2 -5.1 7.2 -1 Z" fill={C.accent} opacity="0.9" />
          {/* deux drapeaux de part et d'autre */}
          {[{ x: 96, c: '#a8352c', dir: 1 }, { x: 224, c: C.dk(C.accent2, 0.05), dir: -1 }].map((f) => (
            <g key={f.x}>
              <rect x={f.x} y="28" width="2.2" height="82" fill={C.dk(C.metal, 0.35)} />
              <path
                d={`M ${f.x + (f.dir > 0 ? 2 : 0)} 32 q ${f.dir * 16} 6 ${f.dir * 30} 1 l 0 30 q ${f.dir * -14} 5 ${f.dir * -30} -1 Z`}
                fill={f.c}
                opacity="0.92"
              />
              <path d={`M ${f.x + f.dir * 4} 34 q ${f.dir * 14} 6 ${f.dir * 24} 2`} fill="none" stroke={C.glow} strokeWidth="1" opacity="0.2" />
            </g>
          ))}
          <rect x="-12" y="110" width="344" height="80" fill={`url(#${id('floor')})`} />
        </g>
      );
    },
    milieu: (k) => {
      const { C, id } = k;
      const tier = (y, rx, ry, h, fill, top) => (
        <g>
          <path d={`M ${160 - rx} ${y} Q 160 ${y + ry} ${160 + rx} ${y} L ${160 + rx} ${y + h} Q 160 ${y + ry + h} ${160 - rx} ${y + h} Z`} fill={fill} />
          <path d={`M ${160 - rx} ${y} Q 160 ${y + ry} ${160 + rx} ${y}`} fill="none" stroke={top} strokeWidth="1.6" />
        </g>
      );
      const seats = (y, rx, ry, n, s, fill, seed) => {
        const r = rnd(seed);
        return (
          <g>
            {Array.from({ length: n }, (_, i) => {
              const t = (i + 0.5) / n;
              const x = 160 - rx + 2 * rx * t;
              const yy = y + ry * 4 * t * (1 - t);
              return (
                <g key={i}>
                  <rect x={x - 6 * s} y={yy - 13 * s} width={12 * s} height={13 * s} rx={2 * s} fill={fill} />
                  {r() > 0.45 ? <circle cx={x} cy={yy - 17 * s} r={3.2 * s} fill={C.dk(C.sil, 0.06)} /> : null}
                </g>
              );
            })}
          </g>
        );
      };
      return (
        <g>
          {/* écran de projection et faisceau, à gauche */}
          <rect x="14" y="34" width="62" height="46" rx="1" fill={C.dk(C.metal, 0.55)} />
          <rect x="16" y="36" width="58" height="42" fill={C.lt(C.paper, 0.2)} opacity="0.9" />
          <Barres x={22} y={44} w={46} h={28} C={C} color={C.accent} n={6} seed={29} />
          <path d="M 132 92 L 76 40 L 76 78 Z" fill={C.glow} opacity="0.07" />
          <rect x="128" y="88" width="16" height="7" rx="1.6" fill={C.dk(C.metal, 0.4)} />
          {/* hémicycle : trois gradins courbes + occupants en silhouette */}
          <g transform="translate(0 -16)">
          {seats(104, 74, 6, 9, 0.78, C.dk(C.wood, 0.5), 3)}
          {tier(106, 78, 8, 12, C.dk(C.wood, 0.34), C.lt(C.wood, 0.2))}
          {seats(122, 104, 8, 11, 0.92, C.dk(C.wood, 0.46), 11)}
          {tier(124, 108, 10, 14, C.dk(C.wood, 0.24), C.lt(C.wood, 0.28))}
          {seats(142, 138, 10, 12, 1.06, C.dk(C.wood, 0.4), 23)}
          {tier(144, 142, 12, 18, C.dk(C.wood, 0.14), C.lt(C.wood, 0.34))}
          {/* pupitre central avec micro col-de-cygne */}
          <g>
            <path d="M 142 96 L 178 96 L 182 124 L 138 124 Z" fill={C.dk(C.wood, 0.2)} />
            <path d="M 142 96 L 178 96 L 179 100 L 141 100 Z" fill={C.lt(C.wood, 0.3)} />
            <path d="M 160 96 q 6 -8 12 -9" fill="none" stroke={C.dk(C.metal, 0.35)} strokeWidth="1.2" />
            <ellipse cx="173" cy="86" rx="2.4" ry="1.6" fill={C.dk(C.metal, 0.2)} />
          </g>
          </g>
        </g>
      );
    },
    avant: (k) => {
      const { C, id } = k;
      return (
        <g>
          {/* table de présentation au premier plan */}
          <path d="M -14 158 L 334 158 L 334 194 L -14 194 Z" fill={C.dk(C.wood, 0.55)} />
          <path d="M -14 154 L 334 154 L 334 160 L -14 160 Z" fill={`url(#${id('bois')})`} />
          {/* maquette du plan quinquennal : socle, îlots bâtis, voirie, château d'eau */}
          <g transform="translate(48 61) scale(0.7)">
            <path d="M 60 156 L 250 156 L 262 136 L 72 136 Z" fill={C.dk(C.pierre, 0.5)} />
            <path d="M 72 136 L 262 136 L 258 132 L 76 132 Z" fill={C.lt(C.pierre, 0.25)} />
            <path d="M 86 156 L 246 138 L 250 141 L 92 156 Z" fill={C.dk(C.terre, 0.3)} opacity="0.7" />
            {[
              { x: 92, w: 16, h: 20 },
              { x: 114, w: 12, h: 13 },
              { x: 132, w: 18, h: 26 },
              { x: 156, w: 14, h: 16 },
              { x: 176, w: 20, h: 22 },
              { x: 202, w: 12, h: 12 },
              { x: 220, w: 16, h: 18 },
            ].map((b) => (
              <g key={b.x}>
                <rect x={b.x} y={136 - b.h} width={b.w} height={b.h} fill={C.lt(C.pierre, 0.2)} />
                <rect x={b.x} y={136 - b.h} width={b.w * 0.34} height={b.h} fill={C.dk(C.pierre, 0.3)} opacity="0.55" />
                <rect x={b.x} y={136 - b.h} width={b.w} height="2" fill={C.lt(C.pierre, 0.45)} />
              </g>
            ))}
            <ChateauEau x={244} y={136} s={0.5} fill={C.lt(C.pierre, 0.12)} />
            {[100, 140, 186, 226].map((x) => (
              <g key={x}>
                <rect x={x} y="128" width="1" height="8" fill={C.dk(C.accent2, 0.2)} />
                <circle cx={x + 0.5} cy="127" r="2" fill={C.dk(C.accent2, 0.05)} />
              </g>
            ))}
          </g>
          {/* chevalet de synthèse posé contre la table */}
          <g transform="translate(266 0) rotate(-4 30 160)">
            <rect x="0" y="118" width="58" height="42" rx="1.4" fill={C.lt(C.paper, 0.15)} />
            <rect x="0" y="118" width="58" height="7" fill={C.dk(C.accent, 0.15)} />
            <Barres x={6} y={130} w={46} h={22} C={C} color={C.accent2} n={5} seed={37} />
          </g>
          {/* carafe et verre */}
          <g transform="translate(20 0)">
            <path d="M 4 132 q 10 6 10 14 l 0 10 l -20 0 l 0 -10 q 0 -8 10 -14 Z" fill={C.lt(C.glass, 0.6)} opacity="0.4" />
            <path d="M -6 146 l 20 0 l 0 10 l -20 0 Z" fill={C.accent} opacity="0.28" />
            <rect x="20" y="144" width="9" height="12" rx="1" fill={C.lt(C.glass, 0.7)} opacity="0.35" />
          </g>
        </g>
      );
    },
  },
};

const SCENES_EGYPTE = {
  /* --- eg_centre : centre opérationnel, mur d'écrans côtiers ------------------- */
  eg_centre: {
    defs: (k) => (
      <>
        <LightGrad id={k.id('pupitre')} from={k.C.lt(k.C.metal, 0.08)} to={k.C.dk(k.C.metal, 0.6)} />
      </>
    ),
    fond: (k) => {
      const { C, id } = k;
      return (
        <g>
          <rect x="-12" y="-10" width="344" height="200" fill={C.dk(C.wall, 0.66)} />
          <rect x="-12" y="-10" width="344" height="14" fill={C.dk(C.wall, 0.8)} />
          {[40, 120, 200, 280].map((x) => (
            <rect key={x} x={x - 30} y="2" width="60" height="2.6" rx="1.2" fill={C.glow} opacity="0.45" />
          ))}
          <rect x="-12" y="126" width="344" height="64" fill={`url(#${id('floor')})`} />
          {/* grande dalle : carte côtière avec trait de côte, isobathes, digue soulignée */}
          <Panneau x={16} y={16} w={150} h={82} C={C} id={id}>
            <g>
              <path d="M 20 96 Q 60 82 74 62 T 112 30 L 162 18 L 162 96 Z" fill={C.dk(C.terre, 0.35)} opacity="0.7" />
              <path d="M 20 96 Q 60 82 74 62 T 112 30 L 162 18" fill="none" stroke={C.lt(C.accent2, 0.35)} strokeWidth="1.4" />
              {[10, 20, 30].map((d, i) => (
                <path key={d} d={`M ${20 - d * 0.2} ${96 - d * 0.4} Q ${56 - d * 0.5} ${80 - d * 0.7} ${70 - d} ${58 - d * 0.5} T ${106 - d * 1.1} ${26 - d * 0.3}`} fill="none" stroke={C.lt(C.accent, 0.15)} strokeWidth="0.55" opacity={0.5 - i * 0.1} />
              ))}
              {/* le trait rouge de la digue Est */}
              <path d="M 74 62 L 96 44" stroke="#d8624c" strokeWidth="2.4" strokeLinecap="round" />
              {[[42, 88], [92, 42], [130, 26]].map((p, i) => (
                <circle key={i} cx={p[0]} cy={p[1]} r="2" fill={C.lt(C.accent2, 0.6)} opacity="0.9" />
              ))}
            </g>
          </Panneau>
          {/* dalle météo : cyclone en spirale + isobares */}
          <Panneau x={176} y={16} w={126} h={56} C={C} id={id}>
            <g opacity="0.92">
              {[0, 1, 2, 3].map((i) => (
                <path
                  key={i}
                  d={`M ${239 + 6 + i * 7} ${44} a ${6 + i * 7} ${5 + i * 5.5} 0 1 1 ${-(12 + i * 14)} 0 a ${6 + i * 7} ${5 + i * 5.5} 0 1 1 ${(12 + i * 14) * 0.9} ${-2 - i}`}
                  fill="none"
                  stroke={C.lt(C.accent2, 0.3 - i * 0.06)}
                  strokeWidth={1.4 - i * 0.2}
                  opacity={0.9 - i * 0.16}
                />
              ))}
              <circle cx="239" cy="44" r="2.6" fill="#d8624c" />
            </g>
          </Panneau>
          {/* deux petites dalles de données */}
          <Panneau x={176} y={78} w={60} h={20} C={C} id={id}>
            <Barres x={180} y={82} w={52} h={12} C={C} color={C.accent2} n={8} seed={19} />
          </Panneau>
          <Panneau x={242} y={78} w={60} h={20} C={C} id={id}>
            <Courbe x={246} y={80} w={52} h={16} C={C} color={C.lt(C.accent, 0.4)} seed={9} drop={0.35} width={0.9} />
          </Panneau>
        </g>
      );
    },
    milieu: (k) => {
      const { C, id } = k;
      return (
        <g>
          {/* rangée arrière de postes */}
          <g opacity="0.92">
            <path d="M 24 128 L 296 128 L 300 138 L 20 138 Z" fill={C.dk(C.metal, 0.62)} />
            {[54, 106, 158, 210, 262].map((x, i) => (
              <g key={x}>
                <SeatedBack x={x} y={128} s={0.92} fill={C.dk(C.sil, 0.06)} casque={i % 2 === 0} />
                <rect x={x - 11} y="114" width="22" height="13" rx="1.2" fill={C.dk(C.glass, 0.15)} />
                <rect x={x - 9.4} y="115.4" width="18.8" height="10.2" fill={C.dk(C.accent, 0.3)} opacity="0.8" />
                <Lignes x={x - 8} y={117} w={16} n={2} gap={3.4} C={C} color={C.lt(C.accent2, 0.5)} opacity={0.45} seed={i + 3} />
              </g>
            ))}
          </g>
          {/* poste radio de la rangée avant : émetteur, antenne, combiné */}
          <g transform="translate(206 0)">
            <rect x="0" y="132" width="46" height="20" rx="2" fill={C.dk(C.metal, 0.42)} />
            <rect x="4" y="136" width="22" height="11" rx="1" fill={C.dk(C.accent, 0.25)} opacity="0.85" />
            {[0, 1, 2].map((r) => (
              <g key={r}>
                {[0, 1, 2].map((c) => (
                  <circle key={c} cx={32 + c * 5} cy={137 + r * 5} r="1.6" fill={C.lt(C.metal, 0.2)} opacity="0.8" />
                ))}
              </g>
            ))}
            <path d="M 42 132 L 48 108" stroke={C.dk(C.metal, 0.3)} strokeWidth="1.2" />
            <circle cx="48" cy="106" r="1.6" fill="#d8624c" opacity="0.9" />
          </g>
          {/* fenêtre étroite sur la nuit, à droite : c'est là que la pluie se voit */}
          <g>
            <rect x="300" y="30" width="22" height="96" rx="1" fill={C.dk(C.metal, 0.5)} />
            <rect x="303" y="33" width="17" height="90" fill={`url(#${id('skyNuit')})`} />
            <rect x="303" y="76" width="17" height="1.6" fill={C.dk(C.metal, 0.5)} />
          </g>
        </g>
      );
    },
    avant: (k) => {
      const { C } = k;
      return (
        <g>
          {/* poutre de premier plan avec les horloges des fuseaux */}
          <path d="M -14 -8 L 334 -8 L 334 12 L -14 12 Z" fill={C.dk(C.wall, 0.86)} />
          <path d="M -14 12 L 334 12 L 334 15 L -14 15 Z" fill={C.dk(C.ink, 0.08)} opacity="0.6" />
          {[
            { x: 30, hh: -1.9, mm: 2.4 },
            { x: 84, hh: -0.4, mm: 1.1 },
            { x: 138, hh: 1.2, mm: -0.8 },
            { x: 192, hh: 2.6, mm: 0.3 },
          ].map((h) => (
            <g key={h.x}>
              <rect x={h.x - 1} y="12" width="2" height="6" fill={C.dk(C.metal, 0.4)} />
              <Horloge cx={h.x} cy={28} r={9.5} C={C} hh={h.hh} mm={h.mm} cadran={C.dk(C.paper, 0.2)} />
              <rect x={h.x - 9} y="39" width="18" height="2.6" rx="1.2" fill={C.dk(C.metal, 0.35)} opacity="0.7" />
            </g>
          ))}
          {/* pupitre de commandement au premier plan, micro col-de-cygne */}
          <path d="M -14 152 L 334 148 L 334 194 L -14 194 Z" fill={`url(#${k.id('pupitre')})`} />
          <path d="M -14 148 L 334 144 L 334 152 L -14 156 Z" fill={C.lt(C.metal, 0.12)} />
          <g transform="translate(52 0)">
            <path d="M 0 150 q 4 -22 26 -26" fill="none" stroke={C.dk(C.metal, 0.3)} strokeWidth="1.8" />
            <ellipse cx="28" cy="123" rx="4" ry="2.8" fill={C.dk(C.metal, 0.15)} transform="rotate(-18 28 123)" />
            <ellipse cx="0" cy="151" rx="8" ry="3" fill={C.dk(C.metal, 0.45)} />
          </g>
          <g transform="translate(236 0)">
            <rect x="0" y="150" width="52" height="22" rx="2" fill={C.dk(C.metal, 0.52)} />
            {Array.from({ length: 10 }, (_, i) => (
              <rect key={i} x={4 + (i % 5) * 9.6} y={154 + Math.floor(i / 5) * 8} width="7.4" height="5.4" rx="1" fill={C.lt(C.metal, 0.14)} opacity="0.75" />
            ))}
            <rect x="58" y="146" width="26" height="9" rx="4.4" fill={C.dk(C.sil, 0.1)} transform="rotate(-7 71 150)" />
          </g>
        </g>
      );
    },
  },

  /* --- eg_port : ruelle d'Ezbet, barques tirées au sec ------------------------ */
  eg_port: {
    defs: (k) => (
      <>
        <linearGradient id={k.id('merP')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={k.C.lt(k.C.sea, 0.32)} />
          <stop offset="100%" stopColor={k.C.dk(k.C.sea, 0.18)} />
        </linearGradient>
        <LightGrad id={k.id('mur')} from={k.C.lt(k.C.pierre, 0.42)} to={k.C.dk(k.C.pierre, 0.3)} />
        <pattern id={k.id('filet')} width="7" height="7" patternUnits="userSpaceOnUse">
          <path d="M 0 0 L 7 7 M 7 0 L 0 7" stroke={k.C.dk(k.C.paper, 0.34)} strokeWidth="0.6" fill="none" opacity="0.75" />
        </pattern>
      </>
    ),
    fond: (k) => {
      const { C, id } = k;
      return (
        <g>
          <rect x="-12" y="-10" width="344" height="200" fill={`url(#${id('sky')})`} />
          <circle cx="248" cy="30" r="13" fill={C.glow} opacity="0.3" />
          {/* mer au fond, ligne d'horizon très haute */}
          <rect x="-12" y="72" width="344" height="42" fill={`url(#${id('merP')})`} />
          <rect x="-12" y="72" width="344" height="1.6" fill={C.lt(C.sea, 0.5)} opacity="0.6" />
          {[78, 84, 92, 102].map((y, i) => (
            <line key={y} x1="-12" y1={y} x2="332" y2={y} stroke={C.lt(C.sea, 0.35)} strokeWidth={0.5 + i * 0.2} opacity={0.28 - i * 0.04} />
          ))}
          {/* deux bateaux au large + digue lointaine */}
          <g fill={C.dk(C.sea, 0.5)} opacity="0.75">
            <path d="M 60 72 L 76 72 L 73 76 L 63 76 Z" />
            <path d="M 66 72 L 66 64 L 72 72 Z" />
            <path d="M 196 74 L 208 74 L 206 77 L 198 77 Z" />
          </g>
          <rect x="-12" y="70" width="150" height="3" fill={C.dk(C.pierre, 0.3)} opacity="0.55" />
          <rect x="-12" y="108" width="344" height="82" fill={C.dk(C.terre, 0.28)} />
        </g>
      );
    },
    milieu: (k) => {
      const { C, id } = k;
      const maison = (x, y, w, h, tone) => (
        <g>
          <rect x={x} y={y} width={w} height={h} fill={`url(#${id('mur')})`} opacity={1 - tone * 0.25} />
          <rect x={x} y={y} width={w} height={2.6} fill={C.lt(C.pierre, 0.5)} />
          <rect x={x} y={y} width={w * 0.3} height={h} fill={C.dk(C.pierre, 0.3)} opacity="0.35" />
          <rect x={x - 1.6} y={y - 2.6} width={w + 3.2} height={3.2} fill={C.dk(C.pierre, 0.18)} />
        </g>
      );
      return (
        <g>
          {/* front bâti bas, deux profondeurs, avec une trouée sur la mer */}
          {maison(-14, 58, 62, 60, 0.5)}
          {maison(50, 66, 44, 52, 0.3)}
          {maison(96, 52, 40, 66, 0.1)}
          {/* la ruelle : trouée entre les maisons */}
          {maison(180, 60, 52, 58, 0.2)}
          {maison(234, 70, 44, 48, 0.42)}
          {maison(278, 56, 56, 62, 0.05)}
          {/* fenêtres et portes */}
          {[
            [8, 78], [28, 78], [62, 84], [80, 84], [106, 70], [122, 70],
            [190, 76], [210, 76], [244, 86], [292, 74], [312, 74],
          ].map((p, i) => (
            <g key={i}>
              <rect x={p[0]} y={p[1]} width="10" height="13" rx="1" fill={C.dk(C.glass, 0.3)} />
              <rect x={p[0]} y={p[1]} width="10" height="13" rx="1" fill="none" stroke={C.lt(C.pierre, 0.35)} strokeWidth="1" />
            </g>
          ))}
          <rect x="150" y="86" width="18" height="32" rx="1" fill={C.dk(C.accent, 0.3)} />
          {/* minaret derrière les toits */}
          <g transform="translate(140 0)">
            <rect x="0" y="20" width="12" height="48" fill={C.lt(C.pierre, 0.3)} />
            <rect x="-2" y="34" width="16" height="3" fill={C.dk(C.pierre, 0.25)} />
            <path d="M 0 20 L 12 20 L 6 8 Z" fill={C.dk(C.pierre, 0.2)} />
            <circle cx="6" cy="6" r="1.8" fill={C.accent} />
          </g>
          {/* réservoirs et paraboles sur les toits */}
          {[{ x: 24, y: 58 }, { x: 116, y: 52 }, { x: 200, y: 60 }, { x: 296, y: 56 }].map((t) => (
            <g key={t.x}>
              <rect x={t.x} y={t.y - 9} width="13" height="9" rx="2" fill={C.dk(C.metal, 0.28)} />
              <rect x={t.x + 4} y={t.y - 12} width="5" height="3.4" fill={C.dk(C.metal, 0.4)} />
            </g>
          ))}
          {[{ x: 72, y: 66 }, { x: 250, y: 70 }].map((d) => (
            <g key={d.x}>
              <path d={`M ${d.x} ${d.y} a 7 7 0 0 1 10 -5 l -4 9 Z`} fill={C.lt(C.pierre, 0.4)} />
              <line x1={d.x + 6} y1={d.y - 4} x2={d.x + 6} y2={d.y + 4} stroke={C.dk(C.metal, 0.3)} strokeWidth="1" />
            </g>
          ))}
          {/* corde à linge tendue au-dessus de la ruelle */}
          <path d="M 136 74 Q 168 90 200 76" fill="none" stroke={C.dk(C.paper, 0.4)} strokeWidth="0.8" />
          {[146, 158, 170, 182, 193].map((x, i) => {
            const y = 74 + 16 * (1 - Math.pow((x - 168) / 32, 2)) * 0.9;
            const cols = ['#c8d8dc', '#7bc4c4', '#d9a253', '#a8352c', '#e8e2d4'];
            return <path key={x} d={`M ${x - 4} ${y} l 9 0 l -1 ${9 + (i % 3) * 3} l -7 0 Z`} fill={cols[i]} opacity="0.8" />;
          })}
        </g>
      );
    },
    avant: (k) => {
      const { C, id } = k;
      const barque = (x, y, s, rot, hull, tone) => (
        <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
          <path d="M -46 0 Q -34 20 0 21 Q 34 20 46 0 Q 24 8 0 8 Q -24 8 -46 0 Z" fill={hull} />
          <path d="M -46 0 Q -34 20 0 21 Q 34 20 46 0 L 42 -2 Q 30 15 0 16 Q -30 15 -42 -2 Z" fill={C.lt(hull, 0.35)} opacity="0.75" />
          <path d="M -30 4 L -28 -10 L -24 -10 L -25 5 Z" fill={C.dk(hull, 0.35)} />
          <rect x="-14" y="2" width="28" height="2.6" rx="1.2" fill={C.dk(hull, 0.45)} opacity={0.8 - tone * 0.3} />
          <path d="M 6 2 L 34 -22" stroke={C.dk(C.wood, 0.2)} strokeWidth="2" strokeLinecap="round" />
        </g>
      );
      return (
        <g>
          {/* filets suspendus à une potence, côté gauche */}
          <g>
            <rect x="18" y="86" width="3" height="76" fill={C.dk(C.wood, 0.35)} />
            <rect x="18" y="86" width="86" height="3" fill={C.dk(C.wood, 0.35)} />
            <path d="M 21 89 L 102 89 L 98 132 Q 74 146 60 130 Q 44 148 24 128 Z" fill={`url(#${id('filet')})`} />
            <path d="M 21 89 L 102 89 L 98 132 Q 74 146 60 130 Q 44 148 24 128 Z" fill={C.lt(C.paper, 0.15)} opacity="0.12" />
            {[36, 58, 82].map((x) => (
              <circle key={x} cx={x} cy={126 + ((x / 11) % 7)} r="3" fill={C.accent} opacity="0.65" />
            ))}
          </g>
          {/* deux barques tirées au sec */}
          {barque(96, 154, 1.15, -6, C.dk(C.accent, 0.05), 0)}
          {barque(238, 168, 1.35, 4, C.dk(C.pierre, 0.28), 0.4)}
          {/* casiers, bouées et cordage */}
          <g transform="translate(276 0)">
            <rect x="0" y="126" width="26" height="16" rx="1.4" fill={C.dk(C.wood, 0.28)} />
            <rect x="4" y="112" width="26" height="15" rx="1.4" fill={C.dk(C.wood, 0.16)} />
            {[0, 1, 2].map((i) => (
              <line key={i} x1={2 + i * 8} y1="126" x2={2 + i * 8} y2="142" stroke={C.dk(C.wood, 0.5)} strokeWidth="1" />
            ))}
            <circle cx="38" cy="134" r="7" fill="none" stroke="#d8624c" strokeWidth="3.4" opacity="0.85" />
          </g>
          <path d="M 140 176 q 18 -8 34 -1 q 16 7 30 -3" fill="none" stroke={C.dk(C.paper, 0.35)} strokeWidth="1.6" opacity="0.75" />
          {/* bande de sable et galets au tout premier plan */}
          <path d="M -14 178 Q 160 168 334 180 L 334 194 L -14 194 Z" fill={C.dk(C.terre, 0.42)} />
        </g>
      );
    },
  },
  /* --- eg_digue : crête d'enrochements, mer d'huile (version calme) ----------- */
  eg_digue: {
    defs: (k) => (
      <>
        <linearGradient id={k.id('huile')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={k.C.dk(k.C.sea, 0.1)} />
          <stop offset="100%" stopColor={k.C.dk(k.C.sea, 0.42)} />
        </linearGradient>
      </>
    ),
    fond: (k) => {
      const { C, id } = k;
      return (
        <g>
          <rect x="-12" y="-10" width="344" height="200" fill={`url(#${id('sky')})`} />
          {/* ciel lourd, bancs de nuages plats et bas */}
          {[
            { y: 22, o: 0.3, s: 1 },
            { y: 40, o: 0.22, s: 1.4 },
            { y: 56, o: 0.16, s: 0.8 },
          ].map((c, i) => (
            <path
              key={i}
              d={`M -20 ${c.y} q 40 ${-8 * c.s} 92 -2 q 46 ${-9 * c.s} 96 3 q 52 ${-7 * c.s} 108 -4 l 0 ${12 * c.s} q -60 6 -110 1 q -54 6 -100 -1 q -48 5 -86 2 Z`}
              fill={C.dk(C.pierre, 0.25)}
              opacity={c.o}
            />
          ))}
          {/* mer d'huile : à peine des reflets horizontaux */}
          <rect x="-12" y="74" width="344" height="70" fill={`url(#${id('huile')})`} />
          <rect x="-12" y="74" width="344" height="1.4" fill={C.lt(C.sea, 0.55)} opacity="0.5" />
          {[80, 86, 94, 104, 116, 130].map((y, i) => (
            <path key={y} d={`M ${-12 + i * 9} ${y} q 70 ${i % 2 ? 1.6 : -1.6} 150 0 t 190 0`} fill="none" stroke={C.lt(C.sea, 0.45)} strokeWidth={0.5 + i * 0.16} opacity={0.2 + i * 0.03} />
          ))}
          {/* cargo au mouillage + balise au loin */}
          <g fill={C.dk(C.sea, 0.55)} opacity="0.7">
            <path d="M 200 74 L 244 74 L 240 79 L 204 79 Z" />
            <rect x="216" y="66" width="8" height="8" />
            <rect x="228" y="69" width="3" height="5" />
          </g>
          <g transform="translate(292 0)">
            <path d="M 0 74 L 6 74 L 5 56 L 1 56 Z" fill={C.dk(C.pierre, 0.4)} />
            <circle cx="3" cy="54" r="2.2" fill={C.accent2} opacity="0.7" />
          </g>
        </g>
      );
    },
    milieu: (k) => {
      const { C } = k;
      const crest = (x) => 122 - (x / 320) * 26;
      return (
        <g>
          {/* clapot au pied de la digue */}
          <path d={`M -14 ${crest(-14) + 4} Q 80 ${crest(80) + 10} 174 ${crest(174) + 3} T 334 ${crest(334) + 6} L 334 144 L -14 144 Z`} fill={C.dk(C.sea, 0.5)} opacity="0.55" />
          {/* parapet et crête */}
          <path d={`M -14 ${crest(-14)} L 334 ${crest(334)} L 334 ${crest(334) + 9} L -14 ${crest(-14) + 9} Z`} fill={C.dk(C.pierre, 0.34)} />
          <path d={`M -14 ${crest(-14)} L 334 ${crest(334)} L 334 ${crest(334) + 2.6} L -14 ${crest(-14) + 2.6} Z`} fill={C.lt(C.pierre, 0.3)} />
          {/* le massif d'enrochements */}
          <Enrochement x0={-16} x1={336} crest={(x) => crest(x) + 8} depth={64} C={C} seed={31} n={78} />
          {/* poteaux et main courante le long de la crête */}
          {[10, 74, 138, 202, 266, 326].map((x) => (
            <rect key={x} x={x} y={crest(x) - 16} width="2.4" height="17" fill={C.dk(C.metal, 0.34)} />
          ))}
          <path d={`M 10 ${crest(10) - 14} L 326 ${crest(326) - 14}`} stroke={C.dk(C.metal, 0.3)} strokeWidth="1.4" fill="none" />
        </g>
      );
    },
    avant: (k) => {
      const { C } = k;
      return (
        <g>
          {/* muret de sacs de sable, en cours d'empilement */}
          <Sandbags x={-6} y={178} cols={7} rows={5} C={C} seed={5} />
          <Sandbags x={104} y={190} cols={5} rows={2} C={C} seed={9} tone={0.12} />
          {/* palette de sacs vides et piquet de balisage */}
          <g transform="translate(140 0)">
            <rect x="0" y="170" width="34" height="6" rx="1" fill={C.dk(C.wood, 0.3)} />
            <path d="M 2 170 q 8 -9 16 -3 q 8 -6 14 3 Z" fill={C.dk(C.paper, 0.35)} />
            <rect x="42" y="140" width="2" height="42" fill={C.dk(C.metal, 0.3)} />
            <path d="M 44 142 l 16 4 l -16 5 Z" fill="#d8624c" opacity="0.9" />
          </g>
          {/* engin de chantier, à droite */}
          <Engin x={252} y={178} s={1.05} C={C} />
        </g>
      );
    },
  },

  /* --- eg_digue (variante tempête) : seconde composition, §4.3 ---------------- */
  eg_digue__tempete: {
    defs: (k) => (
      <>
        <linearGradient id={k.id('cielT')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={k.C.dk(k.C.sky2, 0.55)} />
          <stop offset="62%" stopColor={k.C.dk(k.C.sky2, 0.18)} />
          <stop offset="100%" stopColor={k.C.dk(k.C.sea, 0.34)} />
        </linearGradient>
        <linearGradient id={k.id('merT')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={k.C.dk(k.C.sea, 0.45)} />
          <stop offset="100%" stopColor={k.C.dk(k.C.sea, 0.72)} />
        </linearGradient>
        <radialGradient id={k.id('ecume')} cx="0.5" cy="0.55" r="0.5">
          <stop offset="0%" stopColor={k.C.glow} stopOpacity="0.95" />
          <stop offset="65%" stopColor={k.C.glow} stopOpacity="0.4" />
          <stop offset="100%" stopColor={k.C.glow} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={k.id('faisceau')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe9b8" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#ffe9b8" stopOpacity="0" />
        </linearGradient>
      </>
    ),
    fond: (k) => {
      const { C, id } = k;
      return (
        <g>
          <rect x="-12" y="-10" width="344" height="200" fill={`url(#${id('cielT')})`} />
          {/* masses nuageuses lourdes, superposées, avec une déchirure claire */}
          {[
            { y: 4, h: 34, o: 0.85, t: 0.62 },
            { y: 20, h: 30, o: 0.7, t: 0.48 },
            { y: 40, h: 26, o: 0.55, t: 0.34 },
          ].map((c, i) => (
            <path
              key={i}
              d={`M -24 ${c.y} q 44 ${16 + i * 4} 96 6 q 50 ${18 - i * 3} 104 4 q 48 ${14 + i * 2} 116 -4 l 0 ${-c.h - 30} l -320 0 Z`}
              fill={C.dk(C.sky2, c.t)}
              opacity={c.o}
              transform={`translate(0 ${c.h})`}
            />
          ))}
          <path d="M 168 30 q 30 6 62 -2 q -26 12 -62 8 Z" fill={C.lt(C.sky1, 0.35)} opacity="0.3" />
          {/* mer démontée : chevrons de houle jusqu'à l'horizon */}
          <rect x="-12" y="66" width="344" height="80" fill={`url(#${id('merT')})`} />
          {[
            { y: 70, a: 4, w: 0.5, o: 0.3 },
            { y: 78, a: 6, w: 0.8, o: 0.36 },
            { y: 88, a: 9, w: 1.1, o: 0.42 },
            { y: 100, a: 12, w: 1.5, o: 0.5 },
          ].map((h, i) => (
            <g key={h.y}>
              <path
                d={`M -20 ${h.y} q 26 ${-h.a} 52 0 t 52 0 t 52 0 t 52 0 t 52 0 t 52 0`}
                fill="none"
                stroke={C.lt(C.sea, 0.5)}
                strokeWidth={h.w}
                opacity={h.o}
              />
              {i > 1
                ? [10, 92, 178, 262].map((x) => (
                    <ellipse key={x} cx={x + i * 9} cy={h.y - h.a * 0.4} rx={9 + i * 2} ry={2.2 + i * 0.5} fill={C.glow} opacity={0.12 + i * 0.05} />
                  ))
                : null}
            </g>
          ))}
          {/* embruns au ras de l'horizon */}
          <rect x="-12" y="64" width="344" height="10" fill={C.glow} opacity="0.09" />
        </g>
      );
    },
    milieu: (k) => {
      const { C, id } = k;
      const crest = (x) => 126 - (x / 320) * 24;
      return (
        <g>
          {/* la houle vient buter contre la digue : elle monte plus haut qu'au calme */}
          <g className="cc-fx-vagues">
            <path
              d={`M -20 ${crest(-20) - 2} Q 40 ${crest(40) - 22} 104 ${crest(104) - 6} Q 168 ${crest(168) - 26} 232 ${crest(232) - 8} Q 296 ${crest(296) - 22} 344 ${crest(344) - 4} L 344 152 L -20 152 Z`}
              fill={C.dk(C.sea, 0.55)}
            />
            <path
              d={`M -20 ${crest(-20) + 2} Q 40 ${crest(40) - 16} 104 ${crest(104) - 1} Q 168 ${crest(168) - 20} 232 ${crest(232) - 3} Q 296 ${crest(296) - 16} 344 ${crest(344) + 1}`}
              fill="none"
              stroke={C.glow}
              strokeWidth="2"
              opacity="0.45"
            />
          </g>
          {/* massif d'enrochements, mouillé et plus sombre */}
          <Enrochement x0={-16} x1={336} crest={(x) => crest(x) + 6} depth={62} C={C} seed={31} n={78} mouille />
          <path d={`M -14 ${crest(-14)} L 334 ${crest(334)} L 334 ${crest(334) + 8} L -14 ${crest(-14) + 8} Z`} fill={C.dk(C.pierre, 0.55)} />
          <path d={`M -14 ${crest(-14)} L 334 ${crest(334)} L 334 ${crest(334) + 2.2} L -14 ${crest(-14) + 2.2} Z`} fill={C.lt(C.pierre, 0.12)} opacity="0.7" />
          {/* paquets d'écume qui explosent par-dessus la crête */}
          {[
            { x: 34, y: 108, r: 30, cls: 'cc-fx-ecume' },
            { x: 132, y: 96, r: 40, cls: 'cc-fx-ecume--2' },
            { x: 238, y: 88, r: 32, cls: 'cc-fx-ecume' },
            { x: 306, y: 82, r: 24, cls: 'cc-fx-ecume--2' },
          ].map((f) => (
            <g key={f.x} className={f.cls}>
              <ellipse cx={f.x} cy={f.y} rx={f.r} ry={f.r * 0.72} fill={`url(#${id('ecume')})`} />
              <path
                d={`M ${f.x - f.r * 0.8} ${f.y + f.r * 0.4} q ${f.r * 0.3} ${-f.r * 0.9} ${f.r * 0.8} ${-f.r * 0.7} q ${f.r * 0.25} ${-f.r * 0.55} ${f.r * 0.7} ${-f.r * 0.1} q ${f.r * 0.4} ${f.r * 0.15} ${f.r * 0.3} ${f.r * 0.8} Z`}
                fill={C.glow}
                opacity="0.5"
              />
            </g>
          ))}
          {/* mât d'éclairage de chantier et son faisceau */}
          <g transform="translate(196 0)">
            <rect x="0" y="44" width="3.4" height="96" fill={C.dk(C.metal, 0.45)} />
            <rect x="-8" y="38" width="20" height="7" rx="1.6" fill={C.dk(C.metal, 0.3)} />
            <g className={k.fx.neon ? 'cc-fx-neon' : undefined}>
              <rect x="-6" y="40" width="16" height="3.4" fill="#ffe9b8" opacity="0.9" />
              <path d="M -8 45 L 12 45 L 54 176 L -46 176 Z" fill={`url(#${k.id('faisceau')})`} />
            </g>
          </g>
        </g>
      );
    },
    avant: (k) => {
      const { C } = k;
      return (
        <g>
          {/* merlon de sacs de sable renforcé, bâche et piquets */}
          <Sandbags x={-14} y={186} cols={9} rows={6} C={C} seed={5} tone={0.18} />
          <path d="M -14 150 Q 40 140 92 152 L 96 176 Q 40 168 -14 178 Z" fill={C.dk(C.accent2, 0.45)} opacity="0.85" />
          <path d="M -14 150 Q 40 140 92 152" fill="none" stroke={C.lt(C.accent2, 0.2)} strokeWidth="1.6" opacity="0.6" />
          {[6, 40, 76].map((x) => (
            <g key={x}>
              <rect x={x} y="142" width="2.2" height="34" fill={C.dk(C.wood, 0.3)} />
              <path d={`M ${x + 2} 143 l 10 3 l -10 3 Z`} fill="#d8624c" opacity="0.85" />
            </g>
          ))}
          <Sandbags x={106} y={192} cols={5} rows={3} C={C} seed={17} tone={0.06} />
          {/* engin de chantier phares allumés + gyrophare de cabine */}
          <Engin x={254} y={180} s={1.15} C={C} feux />
          {/* embruns qui balaient le premier plan */}
          <g className="cc-fx-vagues--lent" opacity="0.5">
            <path d="M -20 178 q 50 -16 108 -4 q 54 11 104 -6 q 42 -14 96 -2 l 0 34 l -308 0 Z" fill={C.glow} opacity="0.16" />
            <path d="M -20 188 q 60 -12 118 -2 q 58 9 112 -6" fill="none" stroke={C.glow} strokeWidth="2.4" opacity="0.3" />
          </g>
        </g>
      );
    },
  },

  /* --- eg_ecole : gymnase transformé en refuge -------------------------------- */
  eg_ecole: {
    defs: (k) => (
      <>
        <LightGrad id={k.id('parquet')} from={k.C.lt(k.C.terre, 0.5)} to={k.C.dk(k.C.terre, 0.2)} />
      </>
    ),
    fond: (k) => {
      const { C, id } = k;
      return (
        <g>
          <rect x="-12" y="-10" width="344" height="200" fill={`url(#${id('wall')})`} />
          {/* charpente et bandeau de fenêtres hautes */}
          <path d="M -14 -8 L 160 -8 L 334 -8 L 334 8 L -14 8 Z" fill={C.dk(C.wall, 0.55)} />
          {[40, 110, 180, 250, 316].map((x) => (
            <path key={x} d={`M ${x - 30} 8 L ${x} -6 L ${x + 30} 8`} fill="none" stroke={C.dk(C.metal, 0.4)} strokeWidth="1.6" opacity="0.6" />
          ))}
          {[16, 78, 140, 202, 264].map((x) => (
            <g key={x}>
              <rect x={x} y="16" width="44" height="24" rx="1.4" fill={C.dk(C.metal, 0.45)} />
              <rect x={x + 2} y="18" width="40" height="20" fill={C.lt(C.glass, 0.42)} opacity="0.45" />
              <rect x={x + 21} y="18" width="1.6" height="20" fill={C.dk(C.metal, 0.45)} />
            </g>
          ))}
          {/* espalier à gauche, panier de basket à droite */}
          <g transform="translate(6 0)">
            <rect x="0" y="52" width="3" height="72" fill={C.dk(C.wood, 0.28)} />
            <rect x="34" y="52" width="3" height="72" fill={C.dk(C.wood, 0.28)} />
            {Array.from({ length: 8 }, (_, i) => (
              <rect key={i} x="0" y={56 + i * 9} width="37" height="3" rx="1.4" fill={C.dk(C.wood, 0.16)} />
            ))}
          </g>
          <g transform="translate(258 0)">
            <rect x="0" y="44" width="42" height="28" rx="1.4" fill={C.lt(C.paper, 0.2)} />
            <rect x="0" y="44" width="42" height="28" rx="1.4" fill="none" stroke={C.dk(C.accent, 0.2)} strokeWidth="1.4" />
            <rect x="13" y="56" width="16" height="12" fill="none" stroke={C.dk(C.accent, 0.2)} strokeWidth="1.2" />
            <ellipse cx="21" cy="76" rx="9" ry="3" fill="none" stroke="#d8624c" strokeWidth="1.6" />
            <path d="M 14 77 l 3 8 l 8 0 l 3 -8" fill="none" stroke={C.lt(C.paper, 0.1)} strokeWidth="0.9" opacity="0.6" />
          </g>
          {/* sol de gymnase et lignes de terrain */}
          <rect x="-12" y="124" width="344" height="66" fill={`url(#${id('parquet')})`} />
          <path d="M -14 150 Q 160 138 334 152" fill="none" stroke={C.lt(C.paper, 0.15)} strokeWidth="1.6" opacity="0.35" />
          <path d="M 60 190 A 90 46 0 0 1 260 190" fill="none" stroke={C.lt(C.paper, 0.15)} strokeWidth="1.6" opacity="0.28" />
        </g>
      );
    },
    milieu: (k) => {
      const { C } = k;
      const lit = (x, y, s, cover) => (
        <g>
          <path d={`M ${x - 26 * s} ${y} L ${x + 26 * s} ${y} L ${x + 22 * s} ${y - 7 * s} L ${x - 22 * s} ${y - 7 * s} Z`} fill={C.lt(C.paper, 0.18)} />
          <path d={`M ${x - 22 * s} ${y - 7 * s} L ${x + 22 * s} ${y - 7 * s} L ${x + 20 * s} ${y - 9.4 * s} L ${x - 20 * s} ${y - 9.4 * s} Z`} fill={C.lt(C.paper, 0.42)} />
          <path d={`M ${x + 2 * s} ${y - 7 * s} L ${x + 22 * s} ${y - 7 * s} L ${x + 20 * s} ${y - 10 * s} L ${x + 1 * s} ${y - 10 * s} Z`} fill={cover} opacity="0.85" />
          <rect x={x - 20 * s} y={y - 11 * s} width={11 * s} height={4 * s} rx={2 * s} fill={C.lt(C.paper, 0.6)} />
          <rect x={x - 24 * s} y={y} width={2.4 * s} height={6 * s} fill={C.dk(C.metal, 0.4)} />
          <rect x={x + 22 * s} y={y} width={2.4 * s} height={6 * s} fill={C.dk(C.metal, 0.4)} />
        </g>
      );
      const cols = [C.dk(C.accent, 0.15), '#a8352c', C.dk(C.accent2, 0.25), C.dk(C.terre, 0.1)];
      return (
        <g>
          {/* panneaux d'affichage punaisés */}
          <g transform="translate(58 0)">
            <rect x="0" y="52" width="76" height="46" rx="1.4" fill={C.dk(C.wood, 0.3)} />
            <rect x="3" y="55" width="70" height="40" fill={C.dk(C.terre, 0.16)} />
            <rect x="3" y="55" width="70" height="7" fill={C.dk(C.accent, 0.2)} />
            {[0, 1, 2, 3, 4].map((i) => (
              <g key={i} transform={`rotate(${(i % 2 ? 2 : -2)} ${10 + (i % 3) * 22} ${70 + Math.floor(i / 3) * 14})`}>
                <rect x={6 + (i % 3) * 22} y={66 + Math.floor(i / 3) * 14} width="18" height="12" fill={C.lt(C.paper, 0.35)} opacity="0.9" />
                <circle cx={15 + (i % 3) * 22} cy={66 + Math.floor(i / 3) * 14} r="1.2" fill={C.accent} />
              </g>
            ))}
          </g>
          {/* rangées de lits de camp qui fuient vers le fond */}
          {[
            { y: 118, s: 0.62, xs: [40, 96, 152, 208, 264] },
            { y: 134, s: 0.82, xs: [24, 92, 160, 228, 296] },
            { y: 156, s: 1.05, xs: [10, 92, 174, 256] },
          ].map((row, ri) => (
            <g key={row.y}>
              {row.xs.map((x, i) => (
                <g key={x}>{lit(x, row.y, row.s, cols[(i + ri) % cols.length])}</g>
              ))}
            </g>
          ))}
          {/* caisses de ravitaillement empilées à droite */}
          <g transform="translate(286 0)">
            <rect x="0" y="106" width="34" height="18" rx="1" fill={C.dk(C.terre, 0.12)} />
            <rect x="4" y="90" width="30" height="16" rx="1" fill={C.dk(C.terre, 0.02)} />
            <rect x="2" y="112" width="30" height="2.4" fill={C.dk(C.accent2, 0.2)} opacity="0.7" />
            <rect x="6" y="96" width="26" height="2.4" fill={C.dk(C.accent2, 0.2)} opacity="0.7" />
          </g>
        </g>
      );
    },
    avant: (k) => {
      const { C, id } = k;
      return (
        <g>
          {/* réglettes fluorescentes suspendues (scintillement) */}
          <g className={k.fx.neon ? 'cc-fx-neon' : undefined}>
            {[70, 172, 274].map((x) => (
              <g key={x}>
                <line x1={x} y1="-6" x2={x} y2="14" stroke={C.dk(C.metal, 0.4)} strokeWidth="1.2" />
                <rect x={x - 34} y="14" width="68" height="7" rx="2" fill={C.dk(C.metal, 0.35)} />
                <rect x={x - 31} y="17" width="62" height="4" rx="2" fill={C.glow} opacity="0.92" />
                <ellipse cx={x} cy="24" rx="54" ry="20" fill={`url(#${id('halo')})`} opacity="0.4" />
              </g>
            ))}
          </g>
          {/* familles en silhouette au premier plan : un groupe assis, un debout */}
          <g fill={C.dk(C.sil, 0.02)}>
            {/* adulte assis sur un lit, enfant contre lui */}
            <g transform="translate(56 0)">
              <path d="M -22 194 L -22 168 q 0 -14 14 -14 q 14 0 14 14 L 6 194 Z" />
              <circle cx="-8" cy="146" r="9" />
              <path d="M 4 176 q 12 -4 16 6 l -2 12 l -16 0 Z" />
              <circle cx="14" cy="166" r="6" />
              <path d="M -26 178 q -10 4 -8 16 l 34 0 l 0 -8 Z" opacity="0.9" />
            </g>
            {/* personne debout portant un ballot */}
            <g transform="translate(266 0)">
              <path d="M -14 194 L -14 154 q 0 -13 13 -13 q 13 0 13 13 L 12 194 Z" />
              <circle cx="-1" cy="132" r="10" />
              <path d="M -20 140 q -16 6 -14 22 l 12 2 l 4 -18 Z" />
              <rect x="-38" y="152" width="26" height="20" rx="6" transform="rotate(-8 -25 162)" />
            </g>
            {/* silhouette accroupie, à mi-cadre */}
            <g transform="translate(160 0)">
              <path d="M -12 194 L -12 176 q 0 -12 12 -12 q 12 0 12 12 L 12 194 Z" opacity="0.9" />
              <circle cx="0" cy="156" r="7.4" opacity="0.9" />
            </g>
          </g>
          {/* pile de couvertures et jerrican d'eau */}
          <g transform="translate(104 0)">
            {[0, 1, 2, 3].map((i) => (
              <rect key={i} x={-2 + (i % 2) * 2} y={176 - i * 6} width="42" height="6" rx="2" fill={[C.dk(C.accent, 0.15), '#a8352c', C.dk(C.accent2, 0.25), C.dk(C.terre, 0.1)][i]} opacity="0.85" />
            ))}
          </g>
          <g transform="translate(206 0)">
            <rect x="0" y="162" width="20" height="26" rx="3" fill={C.lt(C.accent2, 0.25)} opacity="0.8" />
            <rect x="6" y="156" width="8" height="7" rx="2" fill={C.dk(C.accent2, 0.3)} />
            <rect x="2" y="170" width="16" height="10" rx="1.4" fill={C.lt(C.glass, 0.6)} opacity="0.35" />
          </g>
        </g>
      );
    },
  },

  /* --- eg_champs : parcelles du Delta, moitié vertes moitié salées ------------- */
  eg_champs: {
    defs: (k) => (
      <>
        <linearGradient id={k.id('sel')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={k.C.lt(k.C.pierre, 0.62)} />
          <stop offset="100%" stopColor={k.C.lt(k.C.terre, 0.42)} />
        </linearGradient>
        <linearGradient id={k.id('vert')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={k.C.dk(k.C.vegetal, 0.08)} />
          <stop offset="100%" stopColor={k.C.dk(k.C.vegetal, 0.4)} />
        </linearGradient>
        <linearGradient id={k.id('canal')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={k.C.lt(k.C.sea, 0.3)} />
          <stop offset="100%" stopColor={k.C.dk(k.C.sea, 0.35)} />
        </linearGradient>
      </>
    ),
    fond: (k) => {
      const { C, id } = k;
      return (
        <g>
          <rect x="-12" y="-10" width="344" height="200" fill={`url(#${id('sky')})`} />
          {/* Delta : horizon très bas, ciel immense */}
          <ellipse cx="96" cy="26" r="0" />
          <circle cx="96" cy="28" r="16" fill={C.glow} opacity="0.24" />
          <circle cx="96" cy="28" r="7" fill={C.glow} opacity="0.45" />
          {[
            { y: 34, w: 96, x: 168, o: 0.24 },
            { y: 48, w: 130, x: 40, o: 0.18 },
            { y: 58, w: 80, x: 252, o: 0.14 },
          ].map((c) => (
            <path key={c.x} d={`M ${c.x} ${c.y} q ${c.w * 0.2} -8 ${c.w * 0.42} -2 q ${c.w * 0.24} -8 ${c.w * 0.44} 2 q ${c.w * 0.16} 5 ${c.w * 0.14} 6 l ${-c.w} 0 Z`} fill={C.lt(C.pierre, 0.5)} opacity={c.o} />
          ))}
          {/* bande de village + pylônes le long de l'horizon */}
          <rect x="-12" y="86" width="344" height="10" fill={C.dk(C.terre, 0.35)} opacity="0.55" />
          <g fill={C.dk(C.terre, 0.45)} opacity="0.7">
            {[26, 44, 62, 84, 108, 210, 232, 258, 286].map((x, i) => (
              <rect key={x} x={x} y={86 - 4 - (i % 3) * 3} width={10 + (i % 2) * 4} height={10 + (i % 3) * 3} />
            ))}
            <rect x="66" y="70" width="4" height="18" />
            <path d="M 64 70 L 72 70 L 68 62 Z" />
          </g>
          {[128, 168, 200].map((x, i) => (
            <g key={x} opacity={0.55 - i * 0.1}>
              <path d={`M ${x - 5 + i} 88 L ${x} ${72 + i * 4} L ${x + 5 - i} 88`} fill="none" stroke={C.dk(C.pierre, 0.35)} strokeWidth="0.9" />
              <path d={`M ${x - 4} ${78 + i * 3} L ${x + 4} ${78 + i * 3}`} stroke={C.dk(C.pierre, 0.35)} strokeWidth="0.8" />
            </g>
          ))}
          <rect x="-12" y="94" width="344" height="96" fill={C.lt(C.terre, 0.24)} />
        </g>
      );
    },
    milieu: (k) => {
      const { C, id } = k;
      return (
        <g>
          {/* moitié gauche : parcelles encore vertes, rangs qui fuient */}
          <path d="M -14 96 L 150 96 L 128 150 L -14 150 Z" fill={`url(#${id('vert')})`} />
          {Array.from({ length: 13 }, (_, i) => {
            const t = i / 12;
            return (
              <path
                key={i}
                d={`M ${-14 + 164 * t} 97 L ${-14 + 142 * t} 149`}
                stroke={C.dk(C.vegetal, 0.45)}
                strokeWidth={0.8 + t * 0.6}
                opacity="0.5"
                fill="none"
              />
            );
          })}
          {/* moitié droite : parcelles blanchies par le sel */}
          <path d="M 150 96 L 334 96 L 334 152 L 128 150 Z" fill={`url(#${id('sel')})`} />
          {Array.from({ length: 9 }, (_, i) => {
            const r = rnd(i * 37 + 5);
            const x = 156 + i * 20 + r() * 8;
            const y = 104 + r() * 40;
            return <ellipse key={i} cx={x} cy={y} rx={10 + r() * 12} ry={3 + r() * 4} fill={C.lt(C.pierre, 0.8)} opacity={0.35 + r() * 0.3} />;
          })}
          {/* la limite : un chemin de terre en diagonale */}
          <path d="M 150 96 L 128 150 L 142 151 L 162 96 Z" fill={C.dk(C.terre, 0.22)} />
          {/* rangée de dattiers de part et d'autre du chemin */}
          <Palm x={124} y={118} h={40} C={C} tone={0.15} lean={0.06} />
          <Palm x={168} y={112} h={30} C={C} tone={0.35} lean={-0.05} />
          <Palm x={92} y={126} h={48} C={C} tone={0.02} lean={0.09} />
          {/* arbre mort côté sel */}
          <g stroke={C.dk(C.pierre, 0.42)} fill="none" strokeLinecap="round">
            <path d="M 250 132 L 252 106" strokeWidth="2.6" />
            <path d="M 252 116 L 262 106 M 252 112 L 242 102 M 252 122 L 260 118" strokeWidth="1.6" />
          </g>
          {/* petite station de pompage */}
          <g transform="translate(196 0)">
            <rect x="0" y="98" width="24" height="16" fill={C.dk(C.pierre, 0.3)} />
            <path d="M -2 98 L 26 98 L 22 92 L 2 92 Z" fill={C.dk(C.pierre, 0.5)} />
            <rect x="9" y="104" width="7" height="10" fill={C.dk(C.ink, 0.14)} />
            <path d="M 24 106 q 14 2 18 14" fill="none" stroke={C.dk(C.metal, 0.35)} strokeWidth="2.4" />
          </g>
        </g>
      );
    },
    avant: (k) => {
      const { C, id } = k;
      return (
        <g>
          {/* canal d'irrigation en diagonale, béton + eau + croûte de sel */}
          <path d="M -14 138 L 334 156 L 334 176 L -14 166 Z" fill={C.dk(C.pierre, 0.42)} />
          <path d="M -14 144 L 334 162 L 334 172 L -14 160 Z" fill={`url(#${id('canal')})`} />
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M ${-10 + i * 40} ${152 + i * 2} q 60 ${i % 2 ? 3 : -3} 130 ${2 + i}`} fill="none" stroke={C.lt(C.sea, 0.55)} strokeWidth="0.7" opacity="0.4" transform={`translate(${i * 60} 0)`} />
          ))}
          <path d="M -14 138 L 334 156 L 334 160 L -14 142 Z" fill={C.lt(C.pierre, 0.75)} opacity="0.55" />
          <path d="M -14 166 L 334 176 L 334 194 L -14 194 Z" fill={C.dk(C.terre, 0.32)} />
          {/* liseré de sel cristallisé le long de la berge */}
          {Array.from({ length: 22 }, (_, i) => {
            const x = -10 + i * 16;
            const y = 166 + (x + 14) * 0.028;
            return <ellipse key={i} cx={x} cy={y} rx={7 + (i % 3) * 3} ry={2 + (i % 2)} fill={C.lt(C.pierre, 0.85)} opacity={0.5 - (i % 3) * 0.08} />;
          })}
          {/* vanne d'irrigation avec volant */}
          <g transform="translate(38 0)">
            <rect x="0" y="118" width="30" height="30" fill={C.dk(C.pierre, 0.3)} />
            <rect x="4" y="126" width="22" height="22" fill={C.dk(C.metal, 0.42)} />
            <rect x="13" y="100" width="3.4" height="30" fill={C.dk(C.metal, 0.3)} />
            <circle cx="15" cy="100" r="8" fill="none" stroke={C.dk(C.metal, 0.24)} strokeWidth="2.4" />
            <path d="M 7 100 L 23 100 M 15 92 L 15 108" stroke={C.dk(C.metal, 0.24)} strokeWidth="1.6" />
          </g>
          {/* touffes de roseaux sur les berges */}
          {[112, 176, 244, 300].map((x, i) => (
            <g key={x} stroke={C.dk(C.vegetal, 0.14)} strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.85">
              {[-6, -2, 2, 6].map((o, j) => (
                <path key={o} d={`M ${x + o} ${152 + i * 3} q ${o * 0.8} -12 ${o * 1.8 + (j - 1.5) * 3} -20`} />
              ))}
            </g>
          ))}
        </g>
      );
    },
  },

  /* --- eg_conseil : salle du conseil, maquette du littoral --------------------- */
  eg_conseil: {
    defs: (k) => (
      <>
        <LightGrad id={k.id('table')} from={k.C.lt(k.C.wood, 0.22)} to={k.C.dk(k.C.wood, 0.45)} />
        <linearGradient id={k.id('portM')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={k.C.lt(k.C.sea, 0.34)} />
          <stop offset="100%" stopColor={k.C.dk(k.C.sea, 0.28)} />
        </linearGradient>
      </>
    ),
    fond: (k) => {
      const { C, id } = k;
      return (
        <g>
          <rect x="-12" y="-10" width="344" height="200" fill={C.dk(C.wall, 0.5)} />
          {/* plafond et corniche lumineuse */}
          <rect x="-12" y="-10" width="344" height="16" fill={C.dk(C.wall, 0.68)} />
          <rect x="-12" y="6" width="344" height="2.4" fill={C.glow} opacity="0.35" />
          {/* baie vitrée sur le port */}
          <g>
            <rect x="8" y="14" width="304" height="92" fill={C.dk(C.metal, 0.55)} />
            <rect x="12" y="18" width="296" height="84" fill={`url(#${id('sky')})`} />
            <rect x="12" y="66" width="296" height="36" fill={`url(#${id('portM')})`} />
            {/* quai, portiques et conteneurs */}
            <rect x="12" y="62" width="296" height="6" fill={C.dk(C.pierre, 0.35)} />
            {[46, 132, 218].map((x, i) => (
              <g key={x} fill={C.dk(C.metal, 0.28)} opacity={0.9 - i * 0.08}>
                <rect x={x} y="24" width="3.4" height="38" />
                <rect x={x + 44} y="24" width="3.4" height="38" />
                <rect x={x - 6} y="20" width="62" height="5" />
                <rect x={x + 14} y="25" width="14" height="9" />
                <path d={`M ${x + 56} 22 L ${x + 84} 22 L ${x + 84} 25 L ${x + 56} 25 Z`} />
              </g>
            ))}
            {Array.from({ length: 16 }, (_, i) => (
              <rect
                key={i}
                x={20 + (i % 8) * 34}
                y={52 - Math.floor(i / 8) * 7}
                width={30}
                height={6.4}
                fill={['#2e7a8c', '#a8352c', '#6b5a3c', '#7bc4c4'][i % 4]}
                opacity="0.72"
              />
            ))}
            {/* navire et jetée */}
            <g fill={C.dk(C.sea, 0.45)} opacity="0.85">
              <path d="M 196 76 L 268 76 L 262 86 L 202 86 Z" />
              <rect x="228" y="66" width="14" height="10" />
            </g>
            <rect x="12" y="72" width="120" height="3" fill={C.dk(C.pierre, 0.3)} opacity="0.7" />
            {/* meneaux */}
            {[110, 210].map((x) => (
              <rect key={x} x={x} y="18" width="4.4" height="84" fill={C.dk(C.metal, 0.5)} />
            ))}
            <rect x="12" y="58" width="296" height="3" fill={C.dk(C.metal, 0.5)} />
            <path d="M 12 102 L 92 18 L 128 18 L 48 102 Z" fill={C.glow} opacity="0.07" />
          </g>
          <rect x="-12" y="112" width="344" height="78" fill={`url(#${id('floor')})`} />
        </g>
      );
    },
    milieu: (k) => {
      const { C, id } = k;
      return (
        <g>
          {/* deux dossiers de chaise, derrière la table */}
          <Chaise x={72} y={130} s={1.15} fill={C.dk(C.sil, 0.14)} dk={C.dk(C.sil, 0.02)} />
          <Chaise x={252} y={130} s={1.15} fill={C.dk(C.sil, 0.18)} dk={C.dk(C.sil, 0.02)} />
          {/* table de commandement */}
          <path d="M 26 122 L 294 122 Q 320 148 300 168 L 20 168 Q 0 148 26 122 Z" fill={`url(#${id('table')})`} />
          <path d="M 26 122 L 294 122 Q 300 128 300 130 L 20 130 Q 20 128 26 122 Z" fill={C.lt(C.wood, 0.26)} />
          {/* la maquette du littoral posée dessus : mer, trait de côte, digue, bâti */}
          <g>
            <path d="M 62 132 L 262 132 L 276 160 L 48 160 Z" fill={C.dk(C.sea, 0.3)} />
            <path d="M 62 132 Q 108 140 128 134 Q 158 128 186 140 Q 214 150 262 142 L 276 160 L 48 160 L 48 158 Q 56 142 62 132 Z" fill={C.lt(C.terre, 0.34)} />
            <path d="M 62 132 Q 108 140 128 134 Q 158 128 186 140 Q 214 150 262 142" fill="none" stroke={C.lt(C.glow, 0.1)} strokeWidth="1.2" opacity="0.5" />
            {/* la digue Est, en pierre claire, soulignée de rouge */}
            <path d="M 168 136 L 232 128 L 236 132 L 172 140 Z" fill={C.lt(C.pierre, 0.3)} />
            <path d="M 168 136 L 232 128" fill="none" stroke="#d8624c" strokeWidth="1.4" opacity="0.9" />
            {/* îlots bâtis + palmiers miniatures */}
            {[
              { x: 74, w: 8, h: 7 }, { x: 88, w: 6, h: 10 }, { x: 100, w: 9, h: 6 },
              { x: 120, w: 7, h: 9 }, { x: 200, w: 8, h: 7 }, { x: 216, w: 6, h: 11 },
              { x: 240, w: 9, h: 6 },
            ].map((b) => (
              <g key={b.x}>
                <rect x={b.x} y={150 - b.h} width={b.w} height={b.h} fill={C.lt(C.pierre, 0.5)} />
                <rect x={b.x} y={150 - b.h} width={b.w * 0.36} height={b.h} fill={C.dk(C.pierre, 0.28)} opacity="0.5" />
              </g>
            ))}
            {/* épingles de repérage */}
            {[{ x: 150, c: '#d8624c' }, { x: 196, c: C.accent2 }, { x: 246, c: C.accent }].map((p) => (
              <g key={p.x}>
                <rect x={p.x} y="128" width="1" height="14" fill={C.dk(C.metal, 0.3)} />
                <circle cx={p.x + 0.5} cy="127" r="2.6" fill={p.c} />
              </g>
            ))}
          </g>
          {/* suspension au-dessus de la table */}
          <g>
            <line x1="160" y1="8" x2="160" y2="44" stroke={C.dk(C.metal, 0.4)} strokeWidth="1" />
            <path d="M 132 58 L 188 58 L 176 44 L 144 44 Z" fill={C.dk(C.metal, 0.3)} />
            <ellipse cx="160" cy="58" rx="28" ry="4" fill={C.glow} opacity="0.5" />
            <path d="M 132 58 L 188 58 L 236 132 L 84 132 Z" fill={C.glow} opacity="0.07" />
          </g>
        </g>
      );
    },
    avant: (k) => {
      const { C } = k;
      const panneau = (x, y, w, h, rot, header, draw) => (
        <g transform={`rotate(${rot} ${x + w / 2} ${y + h})`}>
          <rect x={x} y={y} width={w} height={h} rx="1.6" fill={C.lt(C.paper, 0.24)} />
          <rect x={x} y={y} width={w} height="9" rx="1.6" fill={header} />
          <rect x={x} y={y} width={w} height={h} rx="1.6" fill="none" stroke={C.dk(C.metal, 0.3)} strokeWidth="1.4" />
          {draw}
          <rect x={x + 6} y={y + h} width="3" height="16" fill={C.dk(C.metal, 0.35)} />
          <rect x={x + w - 9} y={y + h} width="3" height="16" fill={C.dk(C.metal, 0.35)} />
        </g>
      );
      return (
        <g transform="translate(0 20)">
          {/* trois panneaux de stratégie posés au premier plan */}
          {panneau(4, 138, 92, 48, -3, C.dk(C.accent, 0.2), (
            <g>
              <path d="M 14 168 L 40 152 L 66 162 L 88 146" fill="none" stroke={C.dk(C.accent, 0.05)} strokeWidth="1.6" />
              <path d="M 82 146 l 8 -2 l -2 8 Z" fill={C.dk(C.accent, 0.05)} />
              <Lignes x={14} y={154} w={30} n={2} gap={4.4} C={C} color={C.ed(C.pierre, 0.3)} opacity={0.4} seed={5} />
            </g>
          ))}
          {panneau(114, 132, 92, 52, 1, '#a8352c', (
            <g>
              <Barres x={124} y={148} w={72} h={30} C={C} color={C.dk(C.accent2, 0.1)} n={6} seed={13} />
              <line x1="122" y1="160" x2="198" y2="160" stroke="#d8624c" strokeWidth="1" strokeDasharray="3 2" />
            </g>
          ))}
          {panneau(224, 140, 92, 48, 4, C.dk(C.accent2, 0.15), (
            <g>
              <Courbe x={232} y={152} w={76} h={30} C={C} color={C.accent} seed={23} drop={0.4} />
              <circle cx="298" cy="158" r="3" fill="#d8624c" />
            </g>
          ))}
        </g>
      );
    },
  },
};

/* ------------------------------------------------- briques propres à la digue */

/** Un bloc d'enrochement : polygone irrégulier à arêtes franches. */
function rocherPts(cx, cy, rr, r) {
  const n = 5 + Math.floor(r() * 3);
  const pts = [];
  for (let i = 0; i < n; i += 1) {
    const a = (i / n) * Math.PI * 2 + (r() - 0.5) * 0.5;
    const rad = rr * (0.66 + r() * 0.46);
    pts.push(`${(cx + Math.cos(a) * rad).toFixed(1)},${(cy + Math.sin(a) * rad * 0.8).toFixed(1)}`);
  }
  return pts.join(' ');
}

/** Massif d'enrochements sous une ligne de crête donnée (fonction de x). */
function Enrochement({ x0, x1, crest, depth, C, seed = 5, n = 70, mouille = false }) {
  const r = rnd(seed);
  const base = mouille ? C.dk(C.pierre, 0.5) : C.dk(C.pierre, 0.3);
  const rocks = [];
  for (let i = 0; i < n; i += 1) {
    const x = x0 + (x1 - x0) * ((i + r() * 0.9) / n);
    const t = r();
    const y = crest(x) + 4 + t * depth;
    const rr = 4 + t * 8 + r() * 3;
    const tone = 0.1 + t * 0.4 + r() * 0.14;
    rocks.push(
      <g key={i}>
        <polygon points={rocherPts(x, y, rr, r)} fill={C.dk(C.pierre, tone + (mouille ? 0.24 : 0))} />
        <polygon points={rocherPts(x - rr * 0.22, y - rr * 0.3, rr * 0.5, r)} fill={C.lt(C.pierre, mouille ? 0.06 : 0.24)} opacity={0.5 - t * 0.2} />
      </g>
    );
  }
  return (
    <g>
      <path d={`M ${x0} ${crest(x0) + 2} L ${x1} ${crest(x1) + 2} L ${x1} 196 L ${x0} 196 Z`} fill={base} />
      {rocks}
    </g>
  );
}

/** Empilement de sacs de sable, en quinconce et légèrement pyramidal. */
function Sandbags({ x, y, cols, rows, C, seed = 3, tone = 0, w = 15, h = 7 }) {
  const r = rnd(seed);
  const bags = [];
  for (let j = 0; j < rows; j += 1) {
    const nb = Math.max(1, cols - Math.floor(j * 0.7));
    for (let i = 0; i < nb; i += 1) {
      const bx = x + i * (w * 0.94) + (j % 2) * (w * 0.42);
      const by = y - j * (h * 0.92);
      const shade = 0.06 + tone + ((i + j) % 3) * 0.07 + r() * 0.05;
      bags.push(
        <g key={`${j}-${i}`}>
          <rect x={bx} y={by - h} width={w} height={h} rx={h * 0.48} fill={C.dk(C.terre, shade + 0.22)} />
          <rect x={bx} y={by - h} width={w} height={h * 0.5} rx={h * 0.28} fill={C.lt(C.terre, 0.24 - tone * 0.4)} opacity="0.75" />
          <line x1={bx + w * 0.5} y1={by - h * 0.86} x2={bx + w * 0.5} y2={by - h * 0.16} stroke={C.dk(C.terre, shade + 0.4)} strokeWidth="0.6" opacity="0.6" />
        </g>
      );
    }
  }
  return <g>{bags}</g>;
}

/** Engin de chantier (pelle sur chenilles) en silhouette, phares optionnels. */
function Engin({ x, y, s = 1, C, feux = false }) {
  // Jaune d'engin : sans lui, la pelle se confond avec la mer et les enrochements.
  const jaune = mix(C.accent, '#d99b32', 0.72);
  const corps = C.dk(jaune, 0.18);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {feux ? (
        <>
          <path d="M -46 -34 L -96 6 L -96 24 L -40 -22 Z" fill="#ffe9b8" opacity="0.16" />
          <path d="M -46 -28 L -92 14 L -92 26 L -42 -18 Z" fill="#ffe9b8" opacity="0.12" />
        </>
      ) : null}
      {/* flèche et godet */}
      <path d="M -6 -40 L 34 -66 L 40 -58 L 2 -32 Z" fill={C.dk(jaune, 0.28)} />
      <path d="M 34 -66 L 58 -44 L 50 -38 L 28 -58 Z" fill={C.dk(jaune, 0.36)} />
      <path d="M 50 -38 q 12 4 12 16 l -18 2 q -2 -12 -6 -14 Z" fill={C.dk(C.metal, 0.34)} />
      <path d="M 44 -20 l 18 -2 l 1 5 l -19 2 Z" fill={C.lt(C.metal, 0.2)} />
      {/* cabine et capot */}
      <path d="M -34 -14 L -34 -44 q 0 -6 6 -6 L -8 -50 L -8 -14 Z" fill={corps} />
      <path d="M -30 -20 L -30 -42 q 0 -3 3 -3 L -12 -45 L -12 -20 Z" fill={C.dk(C.glass, 0.2)} opacity="0.85" />
      <path d="M -8 -14 L -8 -42 L 24 -42 q 6 0 6 6 L 30 -14 Z" fill={C.dk(jaune, 0.42)} />
      {/* chenilles */}
      <rect x="-46" y="-14" width="88" height="16" rx="8" fill={C.dk(C.ink, 0.1)} />
      <rect x="-40" y="-11" width="76" height="10" rx="5" fill={C.dk(C.metal, 0.5)} />
      {[-34, -20, -6, 8, 22].map((cx) => (
        <circle key={cx} cx={cx} cy="-6" r="3.4" fill={C.dk(C.ink, 0.12)} />
      ))}
      {feux ? (
        <g className="cc-fx-neon">
          <circle cx="-36" cy="-30" r="3" fill="#ffe9b8" opacity="0.95" />
          <rect x="-26" y="-58" width="14" height="7" rx="3" fill="#e06a3a" opacity="0.9" />
        </g>
      ) : null}
    </g>
  );
}

// Module CANICULE (Doc n°6 §4.3) — seul décor vraiment nouveau du pivot, cf. data/decors.js.
// Premier jet volontairement plus simple que les compositions les plus riches de ce fichier :
// silhouette de tours généra à la manière de VilleGenerique (mais plus hautes, fenêtres allumées
// la nuit) + une dalle de contrôle du réseau électrique dans le même esprit que celle de
// eg_centre (Panneau + Courbe + Barres), au lieu d'inventer de nouvelles briques.
const SCENES_CANICULE = {
  al_centre_moderne: {
    fond: (k) => {
      const { C, id } = k;
      const r = rnd(211);
      const tours = [];
      let x = -16;
      while (x < 336) {
        const w = 18 + r() * 22;
        const h = 60 + r() * 90;
        tours.push({ x, w, h, t: r() });
        x += w + 4 + r() * 10;
      }
      return (
        <g>
          <rect x="-12" y="-10" width="344" height="200" fill={`url(#${id('skyNuit')})`} />
          <circle cx="70" cy="34" r="16" fill={C.glow} opacity="0.18" />
          {tours.map((b, i) => (
            <g key={i}>
              <rect x={b.x} y={150 - b.h} width={b.w} height={b.h + 40} fill={C.dk(C.metal, 0.3 + b.t * 0.3)} />
              {Array.from({ length: Math.max(2, Math.round(b.h / 12)) }, (_, row) => (
                <g key={row}>
                  {Array.from({ length: Math.max(1, Math.round(b.w / 8)) }, (_, col) => {
                    const lit = r() > 0.45;
                    return (
                      <rect
                        key={col}
                        x={b.x + 2 + col * 8}
                        y={150 - b.h + 3 + row * 12}
                        width="4.4"
                        height="6.5"
                        fill={lit ? C.glow : C.dk(C.ink, 0.1)}
                        opacity={lit ? 0.85 : 0.5}
                      />
                    );
                  })}
                </g>
              ))}
            </g>
          ))}
          <rect x="-12" y="150" width="344" height="40" fill={C.dk(C.terre, 0.55)} />
        </g>
      );
    },
    milieu: (k) => {
      const { C, id } = k;
      return (
        <g>
          <Panneau x={20} y={20} w={150} h={64} C={C} id={id}>
            <Courbe x={24} y={24} w={142} h={56} C={C} color="#d8624c" seed={44} n={16} drop={0.62} width={1.3} />
            <line x1="24" y1="46" x2="166" y2="46" stroke={C.lt(C.pierre, 0.4)} strokeWidth="0.5" strokeDasharray="2 2" opacity="0.7" />
          </Panneau>
          <Panneau x={182} y={20} w={120} h={64} C={C} id={id}>
            <Barres x={186} y={26} w={112} h={52} C={C} color={C.lt(C.accent2, 0.3)} n={9} seed={17} />
          </Panneau>
          <path d="M 24 128 L 296 128 L 300 138 L 20 138 Z" fill={C.dk(C.metal, 0.6)} />
        </g>
      );
    },
    avant: (k) => {
      const { C } = k;
      return (
        <g>
          <SeatedBack x={158} y={150} s={1.3} fill={C.dk(C.sil, 0.08)} casque />
          <rect x="128" y="140" width="60" height="16" rx="1.5" fill={C.dk(C.metal, 0.45)} />
        </g>
      );
    },
  },
};

const SCENES = { ...SCENES_MAROC, ...SCENES_EGYPTE, ...SCENES_CANICULE };

/* ============================================================ couches d'effets
 * §4.4 : quatre couches légères, activées par l'`effets` du décor (plus celles que
 * la variante de crise ajoute). Tout est en SVG/CSS : ni canvas, ni timer JS.
 * ========================================================================== */

/** Pluie : trois copies d'une tuile de 90 unités, translatées d'exactement une tuile. */
function Pluie({ C, densite = 1 }) {
  const tuile = 90;
  const r = rnd(1279);
  const streaks = [];
  const n = Math.round(46 * densite);
  for (let i = 0; i < n; i += 1) {
    const x = r() * 360 - 22;
    const y = r() * tuile;
    const len = 6 + r() * 10;
    streaks.push({ x, y, len, o: 0.16 + r() * 0.34, w: 0.5 + r() * 0.55 });
  }
  const tile = (dy, key) => (
    <g key={key} transform={`translate(0 ${dy})`}>
      {streaks.map((s, i) => (
        <line
          key={i}
          x1={s.x}
          y1={s.y}
          x2={s.x - s.len * 0.3}
          y2={s.y + s.len}
          stroke={C.lt(C.glass, 0.8)}
          strokeWidth={s.w}
          strokeOpacity={s.o}
          strokeLinecap="round"
        />
      ))}
    </g>
  );
  return <g className="cc-fx-rain">{[-tuile, 0, tuile].map((dy, i) => tile(dy, i))}</g>;
}

/** Poussière : quatre nappes translucides qui dérivent lentement. */
function Poussiere({ id }) {
  const blobs = [
    { x: 58, y: 128, r: 74, c: 0 },
    { x: 208, y: 96, r: 92, c: 1 },
    { x: 286, y: 146, r: 62, c: 2 },
    { x: 138, y: 54, r: 56, c: 1 },
  ];
  return (
    <g className="cc-fx-dust">
      {blobs.map((b, i) => (
        <circle key={i} className={`cc-fx-dust__b cc-fx-dust__b--${b.c}`} cx={b.x} cy={b.y} r={b.r} fill={`url(#${id('haze')})`} />
      ))}
    </g>
  );
}

/** Gyrophare : deux nappes radiales qui pulsent en alternance. */
function Gyrophare({ id }) {
  return (
    <g className="cc-fx-gyro">
      <ellipse className="cc-fx-gyro__a" cx="42" cy="46" rx="150" ry="112" fill={`url(#${id('gyroA')})`} />
      <ellipse className="cc-fx-gyro__b" cx="278" cy="58" rx="156" ry="118" fill={`url(#${id('gyroB')})`} />
    </g>
  );
}

/* ------------------------------------------------------------------- le repli */

/** §1.3 : décor manquant -> silhouette de ville générique, floutée et désaturée. */
function VilleGenerique({ C, id }) {
  const r = rnd(97);
  const tours = [];
  let x = -16;
  while (x < 336) {
    const w = 14 + r() * 26;
    const h = 26 + r() * 62;
    tours.push({ x, w, h, t: r() });
    x += w + 3 + r() * 8;
  }
  return (
    <g>
      <rect x="-12" y="-10" width="344" height="200" fill={`url(#${id('sky')})`} />
      <circle cx="212" cy="42" r="20" fill={C.glow} opacity="0.22" />
      {tours.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={150 - b.h} width={b.w} height={b.h + 40} fill={C.dk(C.terre, 0.3 + b.t * 0.34)} opacity={0.85} />
          {b.t > 0.72 ? <rect x={b.x + b.w * 0.35} y={150 - b.h - 16} width={b.w * 0.3} height={16} fill={C.dk(C.terre, 0.5)} /> : null}
        </g>
      ))}
      <ChateauEau x={62} y={150} s={1.15} fill={C.dk(C.terre, 0.58)} />
      <rect x="-12" y="150" width="344" height="40" fill={C.dk(C.terre, 0.55)} />
      <Palm x={296} y={158} h={54} C={C} tone={0.5} />
    </g>
  );
}

/* ---------------------------------------------------------------- parallaxe */

/** Suit la souris au-dessus du conteneur et pose --cc-dx / --cc-dy (en unités de
 *  viewBox, dérivées de la limite de 14 px écran du document). Coupé si l'utilisateur
 *  demande moins de mouvement ; écouteurs retirés au démontage. */
function useParallax(ref, actif) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !actif || typeof window === 'undefined') return undefined;
    const mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    if (mq && mq.matches) return undefined;

    let raf = 0;
    let dx = 0;
    let dy = 0;
    const pose = () => {
      raf = 0;
      el.style.setProperty('--cc-dx', `${dx.toFixed(2)}px`);
      el.style.setProperty('--cc-dy', `${dy.toFixed(2)}px`);
    };
    const planifie = () => {
      if (!raf) raf = window.requestAnimationFrame(pose);
    };
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const nx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2));
      const ny = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2));
      const parPx = VB_W / r.width; // conversion px écran -> unités de viewBox
      dx = -nx * MAX_PARALLAX_PX * parPx;
      dy = -ny * MAX_PARALLAX_PX * parPx;
      planifie();
    };
    const onLeave = () => {
      dx = 0;
      dy = 0;
      planifie();
    };
    el.addEventListener('pointermove', onMove, { passive: true });
    el.addEventListener('pointerleave', onLeave, { passive: true });
    window.addEventListener('blur', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
      if (raf) window.cancelAnimationFrame(raf);
      el.style.removeProperty('--cc-dx');
      el.style.removeProperty('--cc-dy');
    };
  }, [ref, actif]);
}

/* ------------------------------------------------------------------ variantes */

/** Filtre de la variante de crise (4.3). Le décor peut surcharger les trois réglages ;
 *  sinon on retombe sur la palette de crise du pays définie dans la bible de style. */
function filtreVariante(pays, variante) {
  const f = variante && variante.filtre;
  if (!f) return crisisFilterCss(pays, true);
  const t = f.teinte || 0;
  const s = f.saturation || 0;
  const l = f.luminosite || 0;
  return `hue-rotate(${t}deg) saturate(${(1 + s).toFixed(2)}) brightness(${(1 + l).toFixed(2)})`;
}

/* ================================================================ le composant */

/**
 * Décor de scène 2.5D.
 * @param decorId       clé dans DECORS ; inconnue ou absente => repli ville floutée + bandeau
 * @param crisisActive  bascule la variante de crise (filtre + effets, et seconde composition
 *                      pour la digue seule)
 * @param parallax      suivi souris, fond ×0.2 / milieu ×0.5 / avant ×1.0, plafonné à 14 px
 * @param size          largeur en px (la hauteur suit le 16:9) ; sinon le décor remplit son parent
 * @param className     classes additionnelles
 * @param fallbackLabel texte du bandeau quand le décor est absent
 */
export default function Decor({
  decorId,
  crisisActive = false,
  parallax = true,
  size,
  className,
  fallbackLabel,
}) {
  const rawUid = useId();
  const uid = useMemo(() => `cd${rawUid.replace(/[^a-zA-Z0-9]/g, '')}`, [rawUid]);
  const id = useMemo(() => (n) => `${uid}-${n}`, [uid]);

  const hostRef = useRef(null);
  useParallax(hostRef, parallax);

  const decor = (decorId && DECORS[decorId]) || null;
  const pays = (decor && decor.pays) || 'maroc';
  const C = useMemo(() => kitFor(pays), [pays]);
  const variante = decor ? decor.variante : null;

  // La digue est le seul décor à mériter une seconde illustration plutôt qu'un filtre (4.3).
  const secondeCompo = Boolean(decor && crisisActive && variante && variante.secondeComposition);
  const scene = decor ? SCENES[secondeCompo ? `${decor.id}__tempete` : decor.id] || null : null;

  const effets = useMemo(() => {
    if (!decor) return [];
    const base = decor.effets || [];
    const sup = crisisActive && variante && variante.effets ? variante.effets : [];
    return Array.from(new Set([...base, ...sup]));
  }, [decor, crisisActive, variante]);

  const fx = useMemo(
    () => ({
      pluie: effets.includes('pluie'),
      poussiere: effets.includes('poussiere'),
      neon: effets.includes('neon'),
      gyrophare: effets.includes('gyrophare'),
      vagues: effets.includes('vagues'),
    }),
    [effets]
  );

  const k = useMemo(() => ({ id, C, fx, crise: crisisActive, decor }), [id, C, fx, crisisActive, decor]);

  // La digue-tempête EST la variante : lui réappliquer la LUT de crise virerait au sépia
  // un ciel déjà peint en nuit d'orage. Les autres décors, eux, ne changent que de filtre.
  const filtre = crisisActive && decor && !secondeCompo ? filtreVariante(pays, variante) : 'none';
  const gyroA = pays === 'egypte' ? '#3fa9ff' : '#ff9a3c';
  const gyroB = pays === 'egypte' ? '#ff4b4b' : '#ffd08a';

  const wrapStyle = size ? { width: size, height: Math.round((size * VB_H) / VB_W) } : undefined;
  const label = decor
    ? `${decor.titre} — ${decor.contenu}${crisisActive ? ' (variante de crise)' : ''}`
    : `Décor indisponible — vue de ville générique${fallbackLabel ? ` : ${fallbackLabel}` : ''}`;

  const defsCommuns = (
    <>
      <linearGradient id={id('sky')} x1="0" y1="0" x2="0.15" y2="1">
        <stop offset="0%" stopColor={mix(C.sky1, C.sky2, 0.45)} />
        <stop offset="58%" stopColor={C.sky1} />
        <stop offset="100%" stopColor={C.sky0} />
      </linearGradient>
      <linearGradient id={id('skyNuit')} x1="0" y1="0" x2="0.2" y2="1">
        <stop offset="0%" stopColor={C.dk(C.sky2, 0.35)} />
        <stop offset="100%" stopColor={mix(C.sky2, C.sky1, 0.34)} />
      </linearGradient>
      <LightGrad id={id('wall')} from={C.lt(C.wall, 0.2)} to={C.dk(C.wall, 0.42)} mid={C.dk(C.wall, 0.06)} />
      <linearGradient id={id('floor')} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={C.dk(C.floor, 0.3)} />
        <stop offset="100%" stopColor={C.lt(C.floor, 0.12)} />
      </linearGradient>
      <LightGrad id={id('bois')} from={C.lt(C.wood, 0.34)} to={C.dk(C.wood, 0.2)} />
      <radialGradient id={id('halo')} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0%" stopColor={C.glow} stopOpacity="0.55" />
        <stop offset="55%" stopColor={C.glow} stopOpacity="0.16" />
        <stop offset="100%" stopColor={C.glow} stopOpacity="0" />
      </radialGradient>
      <radialGradient id={id('haze')} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0%" stopColor={C.lt(C.pierre, 0.55)} stopOpacity="0.34" />
        <stop offset="60%" stopColor={C.lt(C.pierre, 0.4)} stopOpacity="0.14" />
        <stop offset="100%" stopColor={C.pierre} stopOpacity="0" />
      </radialGradient>
      <radialGradient id={id('gyroA')} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0%" stopColor={gyroA} stopOpacity="0.55" />
        <stop offset="100%" stopColor={gyroA} stopOpacity="0" />
      </radialGradient>
      <radialGradient id={id('gyroB')} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0%" stopColor={gyroB} stopOpacity="0.5" />
        <stop offset="100%" stopColor={gyroB} stopOpacity="0" />
      </radialGradient>
      {/* Nappe de lumière unique — même angle et même mode de fusion que les portraits. */}
      <linearGradient id={id('light')} x1={LIGHT_VEC.x1} y1={LIGHT_VEC.y1} x2={LIGHT_VEC.x2} y2={LIGHT_VEC.y2}>
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
        <stop offset="48%" stopColor="#808080" stopOpacity="0" />
        <stop offset="100%" stopColor="#0e0a06" stopOpacity="0.72" />
      </linearGradient>
      <radialGradient id={id('vign')} cx="0.5" cy="0.48" r="0.76">
        <stop offset="52%" stopColor={C.ink} stopOpacity="0" />
        <stop offset="100%" stopColor={C.ink} stopOpacity="0.55" />
      </radialGradient>
      {/* Grain partagé (bible de style) : appliqué à un rectangle transparent posé en
          dernier — le résultat est le bruit seul, une couche statique jamais recalculée. */}
      <GrainDefs />
      {scene && scene.defs ? scene.defs(k) : null}
    </>
  );

  return (
    <div
      ref={hostRef}
      className={['cc-decor', className].filter(Boolean).join(' ')}
      style={wrapStyle}
      role="img"
      aria-label={label}
    >
      <div className="cc-decor__stage" style={{ filter: filtre }}>
        {scene ? (
          <svg
            className="cc-decor__svg"
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
            style={{ isolation: 'isolate' }}
          >
            <defs>{defsCommuns}</defs>
            <g className="cc-decor__layer cc-decor__layer--fond">{scene.fond(k)}</g>
            <g className="cc-decor__layer cc-decor__layer--milieu">{scene.milieu(k)}</g>
            <g className="cc-decor__layer cc-decor__layer--avant">{scene.avant(k)}</g>
            {fx.poussiere ? <Poussiere id={id} /> : null}
            {fx.pluie ? <Pluie C={C} densite={secondeCompo ? 1.45 : 1} /> : null}
            {fx.gyrophare ? <Gyrophare id={id} /> : null}
            <rect x="0" y="0" width={VB_W} height={VB_H} fill={`url(#${id('light')})`} style={{ mixBlendMode: 'soft-light' }} />
            <rect x="0" y="0" width={VB_W} height={VB_H} fill={`url(#${id('vign')})`} />
            <g filter={`url(#${GRAIN_FILTER_ID})`} opacity="0.9">
              <rect x="0" y="0" width={VB_W} height={VB_H} fill={C.ink} fillOpacity="0" />
            </g>
          </svg>
        ) : (
          <div className="cc-decor__fallback">
            <svg
              className="cc-decor__svg"
              viewBox={`0 0 ${VB_W} ${VB_H}`}
              preserveAspectRatio="xMidYMid slice"
              aria-hidden="true"
            >
              <defs>{defsCommuns}</defs>
              <VilleGenerique C={C} id={id} />
              <rect x="0" y="0" width={VB_W} height={VB_H} fill={`url(#${id('vign')})`} />
            </svg>
            <div className="cc-decor__bandeau">
              {fallbackLabel || (decorId ? String(decorId) : 'Lieu non identifié')}
              <small>décor indisponible</small>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
