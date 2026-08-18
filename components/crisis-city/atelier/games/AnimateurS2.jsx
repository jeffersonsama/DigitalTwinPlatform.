import React, { useMemo } from 'react';
import QRCodeImage from '../ui/QRCodeImage.jsx';
import VoteBars from '../ui/VoteBars.jsx';
import { S2_PHASES, S2_PHASE_INFO, nextS2Phase, prevS2Phase } from './s2Phases.js';
import { SITUATIONS, MINI_PROJETS, PROFILS_PORTE_ENTREE } from './s2.js';

// Le QR pointe vers la route publique /crisis-city/join (pas la page admin courante, qui exige
// une connexion) — voir app/crisis-city/join/page.tsx.
function joinUrl(code) {
  const url = new URL(window.location.href);
  url.pathname = '/crisis-city/join';
  url.search = `?code=${code}`;
  return url.toString();
}

export default function AnimateurS2({ session, responses, setPhase }) {
  const phase = session.phase;
  const info = S2_PHASE_INFO[phase];
  const m1 = useMemo(() => responses.filter((r) => r.manche === 'manche1'), [responses]);
  const m2 = useMemo(() => responses.filter((r) => r.manche === 'manche2'), [responses]);
  const m3 = useMemo(() => responses.filter((r) => r.manche === 'manche3'), [responses]);

  return (
    <div className="animateur-screen">
      <div className="animateur-header">
        <div>
          <span className="animateur-jeu-label">JEU S2 · 53001 EN MAIN</span>
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
            <p className="muted">Gardez la carte de référence 53001 sous la main pour la distribuer.</p>
          </div>
        )}

        {phase === 'manche1' && (
          <div className="animateur-aggregate">
            <h3>Compteur de participation</h3>
            <p className="animateur-big-number">{m1.length}</p>
          </div>
        )}

        {phase === 'revelation1' && (
          <div className="animateur-aggregate">
            <h3>Corrigé situation par situation</h3>
            {SITUATIONS.map((s) => {
              const total = m1.length || 1;
              const correct = m1.filter((r) => r.payload.reponses?.some((x) => x.situationId === s.id && x.familleChoisie === s.famille)).length;
              return (
                <div key={s.id} className="s2-situation-corrige">
                  <strong>{s.id}. {s.texte}</strong> → <span className="highlight">{s.famille}</span>
                  <span className="muted"> — {Math.round((correct / total) * 100)}% ont trouvé</span>
                </div>
              );
            })}
          </div>
        )}

        {phase === 'manche2' && (
          <div className="animateur-aggregate">
            <h3>Compteur de participation</h3>
            <p className="animateur-big-number">{m2.length}</p>
          </div>
        )}

        {phase === 'revelation2' && (
          <div className="animateur-aggregate">
            <h3>Le lien démontrable : activité → effet mesurable → cible</h3>
            {MINI_PROJETS.map((p) => {
              const total = m2.length || 1;
              const correct = m2.filter((r) => {
                const entry = r.payload.reponses?.find((x) => x.projetId === p.id);
                return entry && entry.oddChoisis.length === 2 && p.vrais.every((v) => entry.oddChoisis.includes(v));
              }).length;
              return (
                <div key={p.id} className="s2-situation-corrige">
                  <strong>{p.nom}</strong> — ODD {p.vrais.join(' + ')} · piège ODD {p.piege}
                  <span className="muted"> — {Math.round((correct / total) * 100)}% ont évité le piège</span>
                </div>
              );
            })}
          </div>
        )}

        {phase === 'manche3' && (
          <div className="animateur-aggregate">
            <h3>Répartition des profils déclarés</h3>
            <VoteBars
              items={PROFILS_PORTE_ENTREE.map((p) => ({ label: p.label, count: m3.filter((r) => r.payload.profilId === p.id).length }))}
              total={m3.length}
            />
          </div>
        )}

        {phase === 'cloture' && (
          <div className="animateur-aggregate">
            <h3>Synthèse de salle</h3>
            <p className="animateur-big-number">{m3.filter((r) => r.payload.score > 0).length}/{m3.length || 0}</p>
            <p className="muted">ont identifié le premier pas réaliste pour leur profil.</p>
            <p>Badge distribué : « Permis 53001 » (+60 XP passerelle Crisis City).</p>
          </div>
        )}
      </div>

      <div className="animateur-nav">
        <button className="btn-secondary" disabled={phase === S2_PHASES[0]} onClick={() => setPhase(prevS2Phase(phase))}>← Phase précédente</button>
        <button className="btn-primary" disabled={phase === S2_PHASES[S2_PHASES.length - 1]} onClick={() => setPhase(nextS2Phase(phase))}>Phase suivante →</button>
      </div>
    </div>
  );
}
