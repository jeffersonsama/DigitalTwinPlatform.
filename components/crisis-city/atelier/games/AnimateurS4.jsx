import React, { useMemo } from 'react';
import QRCodeImage from '../ui/QRCodeImage.jsx';
import { S4_PHASES, S4_PHASE_INFO, nextS4Phase, prevS4Phase } from './s4Phases.js';

// Le QR pointe vers la route publique /crisis-city/join (pas la page admin courante, qui exige
// une connexion) — voir app/crisis-city/join/page.tsx.
function joinUrl(code) {
  const url = new URL(window.location.href);
  url.pathname = '/crisis-city/join';
  url.search = `?code=${code}`;
  return url.toString();
}

export default function AnimateurS4({ session, responses, setPhase }) {
  const phase = session.phase;
  const info = S4_PHASE_INFO[phase];
  const engagements = useMemo(() => responses.filter((r) => r.manche === 'engagement'), [responses]);
  const avis = useMemo(() => responses.filter((r) => r.manche.startsWith('avis')), [responses]);
  const revisions = useMemo(() => responses.filter((r) => r.manche === 'engagement_v2'), [responses]);
  const signatures = useMemo(() => responses.filter((r) => r.manche === 'signature'), [responses]);

  return (
    <div className="animateur-screen">
      <div className="animateur-header">
        <div>
          <span className="animateur-jeu-label">JEU S4 · LE BANC D'ESSAI DES 90 JOURS</span>
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

        {phase === 'ecriture' && (
          <div className="animateur-aggregate">
            <h3>Engagements rédigés</h3>
            <p className="animateur-big-number">{engagements.length}</p>
          </div>
        )}

        {phase === 'banc_essai' && (
          <div className="animateur-aggregate">
            <h3>Avis envoyés au banc d'essai</h3>
            <p className="animateur-big-number">{avis.length}</p>
            <p className="muted">Cible : ~2 avis par engagement.</p>
          </div>
        )}

        {phase === 'retour' && (
          <div className="animateur-aggregate">
            <h3>Engagements durcis</h3>
            <p className="animateur-big-number">{revisions.length}</p>
            <p className="muted">
              dont {revisions.filter((r) => r.payload.revised).length} révisés suite au banc d'essai — c'est LA preuve que le banc d'essai sert.
            </p>
          </div>
        )}

        {phase === 'signature' && (
          <div className="animateur-aggregate">
            <h3>Signatures</h3>
            <p className="animateur-big-number">{signatures.length}</p>
            <p className="muted">{signatures.filter((r) => r.payload.optIn).length} au mur des engagements et prêts pour le jumelage.</p>
          </div>
        )}

        {phase === 'cloture' && (
          <div className="animateur-aggregate">
            <h3>Synthèse du Jour 1</h3>
            <p className="animateur-big-number">
              {revisions.length ? Math.round((revisions.filter((r) => r.payload.revised).length / revisions.length) * 100) : 0}%
            </p>
            <p className="muted">de taux de révision après banc d'essai.</p>
            <p>Badge distribué : « Bâtisseur du Jour 1 » (+60 XP passerelle Crisis City).</p>
          </div>
        )}
      </div>

      <div className="animateur-nav">
        <button className="btn-secondary" disabled={phase === S4_PHASES[0]} onClick={() => setPhase(prevS4Phase(phase))}>← Phase précédente</button>
        <button className="btn-primary" disabled={phase === S4_PHASES[S4_PHASES.length - 1]} onClick={() => setPhase(nextS4Phase(phase))}>Phase suivante →</button>
      </div>
    </div>
  );
}
