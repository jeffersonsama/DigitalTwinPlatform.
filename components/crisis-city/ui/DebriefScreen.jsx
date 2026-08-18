import React, { useEffect, useMemo, useRef, useState } from 'react';
import { computeScores, computeProfile, keyMoments, COMPETENCES } from '../engine/scoring.js';
import { XP_BAREME } from '../engine/xp.js';
import { HomeLink } from './Screens.jsx';

const SIZE = 240;
const CENTER = SIZE / 2;
const RADIUS = SIZE / 2 - 30;

// Le « parcours idéal du scénario » (5.4) : non pas la perfection, mais le meilleur chemin
// défendable — sert de repère visuel en pointillé, pas de barème caché.
const PARCOURS_IDEAL = { C1: 85, C2: 85, C3: 82, C4: 85, C5: 88 };

function axisPoint(index, total, value100) {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  const r = (value100 / 100) * RADIUS;
  return [CENTER + r * Math.cos(angle), CENTER + r * Math.sin(angle)];
}

function polygonPoints(values) {
  return COMPETENCES.map((c, i) => axisPoint(i, COMPETENCES.length, values[c]).join(',')).join(' ');
}

// Radar tracé en 1,5 s, axe par axe (Document n°4, ch.7) : le profil final se révèle après un
// court suspense plutôt que d'apparaître d'un bloc.
function useAnimatedRadar(target, durationMs = 1500) {
  const [values, setValues] = useState(() => {
    const zero = {};
    COMPETENCES.forEach((c) => { zero[c] = 0; });
    return zero;
  });
  const rafRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    startRef.current = null;
    function tick(ts) {
      if (startRef.current === null) startRef.current = ts;
      const t = Math.min(1, (ts - startRef.current) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = {};
      COMPETENCES.forEach((c) => { next[c] = target[c] * eased; });
      setValues(next);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    }
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setValues(target);
      return undefined;
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(target)]);

  return values;
}

function Radar({ normalized }) {
  const animated = useAnimatedRadar(normalized);
  const gridLevels = [20, 40, 60, 80, 100];
  return (
    <svg width={SIZE} height={SIZE} className="radar-svg">
      {gridLevels.map((lvl) => (
        <polygon
          key={lvl}
          points={COMPETENCES.map((_, i) => axisPoint(i, COMPETENCES.length, lvl).join(',')).join(' ')}
          className="radar-grid"
        />
      ))}
      {COMPETENCES.map((c, i) => {
        const [x, y] = axisPoint(i, COMPETENCES.length, 100);
        return <line key={c} x1={CENTER} y1={CENTER} x2={x} y2={y} className="radar-axis" />;
      })}
      <polygon points={polygonPoints(PARCOURS_IDEAL)} className="radar-ideal" />
      <polygon points={polygonPoints(animated)} className="radar-shape" />
      {COMPETENCES.map((c, i) => {
        const [x, y] = axisPoint(i, COMPETENCES.length, 118);
        return (
          <text key={c} x={x} y={y} textAnchor="middle" className="radar-label">
            {c}
          </text>
        );
      })}
    </svg>
  );
}

const ODD_LABELS = {
  6: 'Eau propre', 2: 'Faim zéro', 11: 'Villes durables', 13: 'Climat', 1: 'Pauvreté',
  3: 'Santé', 7: 'Énergie propre',
};

const OPEN_QUESTIONS = {
  maroc: "Fallait-il tolérer les forages illégaux le temps d'une saison pour préserver la paix sociale, quitte à aggraver la pénurie ?",
  egypte: "Fallait-il respecter le refus d'évacuer d'Ezbet El-Sayadin, même au risque de vies humaines ?",
  canicule: "Fallait-il consacrer le budget à climatiser quelques bâtiments dès cette année plutôt qu'à un plan de végétalisation qui ne protégera la ville que dans cinq ans ?",
};

export default function DebriefScreen({ scenario, history, knowledgeCardsIds, knowledgeCards, openQuestionAnswered, onSubmitOpenAnswer, onContinue }) {
  const { normalized, labels } = useMemo(() => computeScores(scenario.id, history), [scenario.id, history]);
  const profile = useMemo(() => computeProfile(normalized), [normalized]);
  const moments = useMemo(() => keyMoments(history, 3), [history]);
  const [openAnswer, setOpenAnswer] = useState('');
  const wordCount = openAnswer.trim() ? openAnswer.trim().split(/\s+/).length : 0;

  return (
    <div className="screen debrief-screen">
      <HomeLink />
      <h1>Bilan final — {scenario.ville}</h1>

      <div className="debrief-grid">
        <div className="debrief-radar-block">
          <Radar normalized={normalized} />
          <p className="muted radar-caption">En pointillé : le meilleur chemin défendable du scénario.</p>
          <ul className="radar-legend">
            {COMPETENCES.map((c) => (
              <li key={c}><strong>{c}</strong> — {labels[c]} : {normalized[c]}/100</li>
            ))}
          </ul>
        </div>

        <div className="debrief-profile-block debrief-profile-reveal">
          <h2>{profile.nom}</h2>
          <p>{profile.retour}</p>
          <div className="debrief-odd">
            <h3>ODD mobilisés</h3>
            <div className="odd-chips">
              {scenario.sdg.map((n) => (
                <span key={n} className="odd-chip">ODD {n} · {ODD_LABELS[n]}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="debrief-moments">
        <h2>Trois moments-clés</h2>
        {moments.map((m, i) => (
          <div key={i} className="debrief-moment">
            <div className="debrief-moment-titre">{m.nodeTitre}</div>
            <div className="debrief-moment-choix">{m.optionLabel}</div>
            <div className="debrief-moment-suite muted">{m.suite}</div>
          </div>
        ))}
      </div>

      <div className="debrief-cards">
        <h2>Cartes de savoir débloquées ({knowledgeCardsIds.length}/10)</h2>
        <div className="collection-grid">
          {knowledgeCardsIds.map((id) => {
            const card = knowledgeCards[id];
            return card ? (
              <div key={id} className="knowledge-card">
                <div className="knowledge-card-title">{card.titre}</div>
                <p className="knowledge-card-principe">{card.principe}</p>
              </div>
            ) : null;
          })}
        </div>
      </div>

      <div className="debrief-question">
        <h2>Question ouverte <span className="muted">(non notée — {XP_BAREME.QUESTION_OUVERTE.xp} XP si ≥ 15 mots)</span></h2>
        <p>{OPEN_QUESTIONS[scenario.id]}</p>
        <textarea
          value={openAnswer}
          onChange={(e) => setOpenAnswer(e.target.value)}
          placeholder="Votre réponse (matière à discussion collective)…"
          rows={3}
          disabled={openQuestionAnswered}
        />
        {!openQuestionAnswered ? (
          <button
            className="btn-secondary"
            disabled={wordCount < 15}
            onClick={() => onSubmitOpenAnswer(openAnswer)}
          >
            Enregistrer ma réflexion {wordCount > 0 && wordCount < 15 ? `(${wordCount}/15 mots)` : ''}
          </button>
        ) : (
          <p className="muted">✓ Réflexion enregistrée — matière à discussion en atelier.</p>
        )}
      </div>

      <button className="btn-primary" onClick={onContinue}>Continuer vers l'engagement 30/60/90</button>
    </div>
  );
}
