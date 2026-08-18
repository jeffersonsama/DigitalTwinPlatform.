import React, { useMemo } from 'react';
import QRCodeImage from '../ui/QRCodeImage.jsx';
import VoteBars from '../ui/VoteBars.jsx';
import WorldMap from '../ui/WorldMap.jsx';
import { S1_PHASES, S1_PHASE_INFO, nextS1Phase, prevS1Phase } from './s1Phases.js';
import { CRISE_OPTIONS, CASCADE_A, INTERVENTIONS, MAILLON_LE_PLUS_SOUS_ESTIME } from './s1.js';

// Le QR pointe vers la route publique /crisis-city/join (pas la page admin courante, qui exige
// une connexion) — voir app/crisis-city/join/page.tsx.
function joinUrl(code) {
  const url = new URL(window.location.href);
  url.pathname = '/crisis-city/join';
  url.search = `?code=${code}`;
  return url.toString();
}

function tally(values) {
  const counts = new Map();
  for (const v of values) counts.set(v, (counts.get(v) || 0) + 1);
  return counts;
}

export default function AnimateurS1({ session, responses, presence = [], setPhase }) {
  const phase = session.phase;
  const info = S1_PHASE_INFO[phase];
  const ancrageResponses = useMemo(() => responses.filter((r) => r.manche === 'ancrage'), [responses]);
  const manche1Responses = useMemo(() => responses.filter((r) => r.manche === 'manche1'), [responses]);
  const manche2Responses = useMemo(() => responses.filter((r) => r.manche === 'manche2'), [responses]);

  return (
    <div className="animateur-screen">
      <div className="animateur-header">
        <div>
          <span className="animateur-jeu-label">JEU S1 · RÉACTION EN CHAÎNE</span>
          <h1>{info.titre}</h1>
          <span className="animateur-minutage">{info.minutage}</span>
        </div>
        <div className="animateur-code-badge">Code : <strong>{session.code}</strong></div>
      </div>

      <div className="animateur-script">
        <span className="animateur-script-label">Script (aide-mémoire)</span>
        <p>« {info.script} »</p>
      </div>

      <div className="animateur-body">
        {phase === 'lobby' && (
          <div className="animateur-lobby">
            <QRCodeImage text={joinUrl(session.code)} size={260} />
            <p className="muted">Scannez pour rejoindre — ou allez sur l'URL avec le code {session.code}</p>
          </div>
        )}

        {phase === 'ancrage' && (
          <div className="animateur-aggregate">
            <h3>La carte se remplit en direct — {presence.length} connecté·e·s</h3>
            <WorldMap participants={presence} />
            <div className="animateur-columns">
              <div>
                <h4>Crises</h4>
                <VoteBars
                  items={CRISE_OPTIONS.map((c) => ({ label: c, count: tally(ancrageResponses.map((r) => r.payload.crise)).get(c) || 0 }))}
                  total={ancrageResponses.length}
                />
              </div>
            </div>
          </div>
        )}

        {phase === 'manche1' && (
          <div className="animateur-aggregate">
            <h3>Compteur de participation</h3>
            <p className="animateur-big-number">{manche1Responses.length}</p>
            <p className="muted">cascades soumises — règle : 4 cartes, 1 piège parmi les 12.</p>
          </div>
        )}

        {phase === 'revelation1' && (
          <div className="animateur-aggregate">
            <h3>La cascade de référence</h3>
            <ol className="animateur-cascade-reveal">
              {CASCADE_A.filter((c) => c.rangsAcceptes.includes(1) || c.rangsAcceptes.includes(2) || c.rangsAcceptes.includes(3) || c.rangsAcceptes.includes(4))
                .sort((a, b) => Math.min(...a.rangsAcceptes) - Math.min(...b.rangsAcceptes))
                .map((c) => (
                  <li key={c.id} className={c.id === MAILLON_LE_PLUS_SOUS_ESTIME ? 'highlight' : ''}>
                    <strong>Rang {Math.min(...c.rangsAcceptes)}</strong> — {c.texte}
                    <span className="muted"> {c.note}</span>
                  </li>
                ))}
            </ol>
            <h4>Histogramme des effets les plus choisis</h4>
            <VoteBars
              items={CASCADE_A.map((c) => ({
                label: c.texte,
                count: manche1Responses.filter((r) => r.payload.selected?.includes(c.id)).length,
                highlight: c.id === MAILLON_LE_PLUS_SOUS_ESTIME,
              })).sort((a, b) => b.count - a.count)}
              total={manche1Responses.length}
            />
          </div>
        )}

        {phase === 'manche2' && (
          <div className="animateur-aggregate">
            <h3>Répartition des votes</h3>
            <p className="animateur-big-number">{manche2Responses.length}</p>
            <p className="muted">Une seule intervention par participant — le budget est unique.</p>
          </div>
        )}

        {phase === 'revelation2' && (
          <div className="animateur-aggregate">
            <h3>Le levier gagnant</h3>
            <p className="animateur-winner">
              {INTERVENTIONS.find((i) => i.gagnant).label} — {INTERVENTIONS.find((i) => i.gagnant).verdict}
            </p>
            <VoteBars
              items={INTERVENTIONS.map((i) => ({
                label: i.label,
                count: manche2Responses.filter((r) => r.payload.interventionId === i.id).length,
                highlight: i.gagnant,
              }))}
              total={manche2Responses.length}
            />
          </div>
        )}

        {phase === 'cloture' && (
          <div className="animateur-aggregate">
            <h3>Synthèse de salle</h3>
            {(() => {
              const total = manche1Responses.length || 1;
              const piegeDetecte = manche1Responses.filter((r) => !r.payload.selected?.includes(9)).length;
              const pct = Math.round((piegeDetecte / total) * 100);
              return <p className="animateur-big-number">{pct}%</p>;
            })()}
            <p className="muted">de la salle a évité le piège de la carte 9.</p>
            <p>Badge distribué : « Cartographe du chaos » (+60 XP passerelle Crisis City).</p>
          </div>
        )}
      </div>

      <div className="animateur-nav">
        <button className="btn-secondary" disabled={phase === S1_PHASES[0]} onClick={() => setPhase(prevS1Phase(phase))}>
          ← Phase précédente
        </button>
        <button className="btn-primary" disabled={phase === S1_PHASES[S1_PHASES.length - 1]} onClick={() => setPhase(nextS1Phase(phase))}>
          Phase suivante →
        </button>
      </div>
    </div>
  );
}
