import React, { useMemo } from 'react';
import QRCodeImage from '../ui/QRCodeImage.jsx';
import VoteBars from '../ui/VoteBars.jsx';
import { S3_PHASES, S3_PHASE_INFO, nextS3Phase, prevS3Phase } from './s3Phases.js';
import { DOSSIERS, CRISE_OPTIONS } from './s3.js';

// Le QR pointe vers la route publique /crisis-city/join (pas la page admin courante, qui exige
// une connexion) — voir app/crisis-city/join/page.tsx.
function joinUrl(code) {
  const url = new URL(window.location.href);
  url.pathname = '/crisis-city/join';
  url.search = `?code=${code}`;
  return url.toString();
}

const VERDICT_LABEL = { financer: 'FINANCER', ecarter: 'ÉCARTER', hesiter: 'HÉSITER' };

export default function AnimateurS3({ session, responses, setPhase }) {
  const phase = session.phase;
  const info = S3_PHASE_INFO[phase];
  const ancrage = useMemo(() => responses.filter((r) => r.manche === 'ancrage'), [responses]);
  const votes = useMemo(() => responses.filter((r) => r.manche === 'vote'), [responses]);
  const manche2 = useMemo(() => responses.filter((r) => r.manche === 'manche2'), [responses]);

  return (
    <div className="animateur-screen">
      <div className="animateur-header">
        <div>
          <span className="animateur-jeu-label">JEU S3 · LE COMITÉ D'INVESTISSEMENT</span>
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
          </div>
        )}

        {phase === 'ancrage' && (
          <div className="animateur-aggregate">
            <h3>{ancrage.length} réponses</h3>
            <VoteBars
              items={CRISE_OPTIONS.map((c) => ({ label: c, count: ancrage.filter((r) => r.payload.crise === c).length }))}
              total={ancrage.length}
            />
          </div>
        )}

        {phase === 'vote' && (
          <div className="animateur-aggregate">
            <h3>Portefeuilles engagés</h3>
            <p className="animateur-big-number">{votes.length}</p>
          </div>
        )}

        {phase === 'audit' && (
          <div className="animateur-aggregate">
            <h3>Le portefeuille de la salle</h3>
            <VoteBars
              items={DOSSIERS.map((d) => ({
                label: `${d.nom} (${VERDICT_LABEL[d.verdict]})`,
                count: votes.filter((r) => r.payload.finances?.includes(d.id)).length,
                highlight: d.verdict === 'financer',
              }))}
              total={votes.length}
            />
            <p className="muted">Le dossier « SDG Champions » est le plus financé malgré son washing pur — c'est le point du débrief.</p>
          </div>
        )}

        {phase === 'manche2' && (
          <div className="animateur-aggregate">
            <h3>Compteur de participation</h3>
            <p className="animateur-big-number">{manche2.length}</p>
          </div>
        )}

        {phase === 'cloture' && (
          <div className="animateur-aggregate">
            <h3>Synthèse</h3>
            <p className="animateur-big-number">
              {votes.filter((r) => !r.payload.finances?.includes('sdg_champions')).length}/{votes.length || 0}
            </p>
            <p className="muted">ont évité de financer le washing pur.</p>
            <p>Badge distribué : « Détecteur de washing » (+60 XP passerelle Crisis City).</p>
          </div>
        )}
      </div>

      <div className="animateur-nav">
        <button className="btn-secondary" disabled={phase === S3_PHASES[0]} onClick={() => setPhase(prevS3Phase(phase))}>← Phase précédente</button>
        <button className="btn-primary" disabled={phase === S3_PHASES[S3_PHASES.length - 1]} onClick={() => setPhase(nextS3Phase(phase))}>Phase suivante →</button>
      </div>
    </div>
  );
}
