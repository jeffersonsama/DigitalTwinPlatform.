import React, { useEffect, useRef, useState } from 'react';
import { CRISE_OPTIONS } from './s1.js';
import { DOSSIERS, scoreVote, voteScoreSur10, goulotFor, scoreGoulot } from './s3.js';
import { awardAtelierCompletion } from '../engine/xpBridge.js';
import PromotionModal from '../../ui/PromotionModal.jsx';

const VERDICT_LABEL = { financer: 'FINANCER', ecarter: 'ÉCARTER', hesiter: 'HÉSITER' };

export default function ParticipantS3({ session, submitResponse, updateProfil }) {
  const phase = session.phase;

  const [crise, setCrise] = useState('');
  const [ancrageDone, setAncrageDone] = useState(false);

  const [finances, setFinances] = useState([]);
  const [hesitations, setHesitations] = useState([]);
  const [voteDone, setVoteDone] = useState(false);
  const [voteScore, setVoteScore] = useState(null);

  const [goulotChoix, setGoulotChoix] = useState(null);
  const [goulotDone, setGoulotDone] = useState(false);
  const [goulotScore, setGoulotScore] = useState(null);

  const awardedRef = useRef(false);
  const [xpResult, setXpResult] = useState(null);

  useEffect(() => {
    if (phase === 'cloture' && !awardedRef.current) {
      awardedRef.current = true;
      awardAtelierCompletion('s3', 'atelier_s3').then(setXpResult);
    }
  }, [phase]);

  function submitAncrage() {
    submitResponse('ancrage', { crise });
    updateProfil(null, crise);
    setAncrageDone(true);
  }

  function toggleFinance(id) {
    setFinances((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
    setHesitations((prev) => prev.filter((x) => x !== id));
  }

  function toggleHesiter(id) {
    setHesitations((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function submitVote() {
    const score = scoreVote({ finances, hesitations });
    setVoteScore(score);
    submitResponse('vote', { finances, hesitations, score });
    setVoteDone(true);
  }

  function submitGoulot(declinaison) {
    const score = scoreGoulot(declinaison, goulotChoix);
    setGoulotScore(score);
    submitResponse('manche2', { choixId: goulotChoix, score });
    setGoulotDone(true);
  }

  if (phase === 'lobby') {
    return (
      <div className="participant-wait">
        <h2>Vous rejoignez le Fonds Jeunesse &amp; Relèvement.</h2>
        <p className="muted">100 unités, 6 projets, 3 élus.</p>
      </div>
    );
  }

  if (phase === 'ancrage') {
    return (
      <div className="participant-form">
        <h2>Quelle crise vous préoccupe ?</h2>
        <select value={crise} onChange={(e) => setCrise(e.target.value)}>
          <option value="">— choisir —</option>
          {CRISE_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button className="btn-primary" disabled={!crise || ancrageDone} onClick={submitAncrage}>
          {ancrageDone ? 'Envoyé ✓' : 'Envoyer'}
        </button>
      </div>
    );
  }

  if (phase === 'vote') {
    if (voteDone) return <div className="participant-wait"><h2>Portefeuille soumis.</h2><p className="muted">En attente de l'audit…</p></div>;
    return (
      <div className="s3-dossiers">
        <h2>{finances.length}/3 financements engagés</h2>
        {DOSSIERS.map((d) => (
          <div key={d.id} className="s3-dossier-card">
            <h3>{d.nom}</h3>
            <p>{d.pitch}</p>
            <ul className="s3-pieces">{d.pieces.map((p, i) => <li key={i}>{p}</li>)}</ul>
            <div className="s3-dossier-actions">
              <label className="s3-checkbox">
                <input type="checkbox" checked={finances.includes(d.id)}
                  disabled={!finances.includes(d.id) && finances.length >= 3}
                  onChange={() => toggleFinance(d.id)} />
                Financer
              </label>
              {!finances.includes(d.id) && (
                <label className="s3-checkbox muted">
                  <input type="checkbox" checked={hesitations.includes(d.id)} onChange={() => toggleHesiter(d.id)} />
                  Marquer comme hésitation (plutôt qu'écart net)
                </label>
              )}
            </div>
          </div>
        ))}
        <button className="btn-primary" disabled={finances.length !== 3} onClick={submitVote}>
          Engager mes 3 financements
        </button>
      </div>
    );
  }

  if (phase === 'audit') {
    return (
      <div className="participant-reveal">
        <h2>L'audit</h2>
        {DOSSIERS.map((d) => {
          const financed = finances.includes(d.id);
          const bon = (d.verdict === 'financer' && financed) || (d.verdict !== 'financer' && !financed);
          return (
            <div key={d.id} className={`s3-audit-row ${bon ? 'ok' : 'faux'}`}>
              <strong>{d.nom}</strong> — <span className="highlight">{VERDICT_LABEL[d.verdict]}</span>
              {financed && <span className="muted"> (vous l'aviez financé)</span>}
              <p className="muted">{d.signaux}</p>
            </div>
          );
        })}
        {voteScore !== null && <p className="muted">Score de flair : {voteScore} points.</p>}
      </div>
    );
  }

  if (phase === 'manche2') {
    if (goulotDone) return <div className="participant-wait"><h2>Envoyé.</h2><p className="muted">En attente de la clôture…</p></div>;
    const declinaison = goulotFor(crise);
    return (
      <div className="participant-form">
        <h2>{declinaison.titre} — quel investissement débloque le plus de parcours ?</h2>
        {declinaison.options.map((o) => (
          <button key={o.id} className={`intervention-option ${goulotChoix === o.id ? 'chosen' : ''}`} onClick={() => setGoulotChoix(o.id)}>
            {o.texte}
          </button>
        ))}
        <button className="btn-primary" disabled={!goulotChoix} onClick={() => submitGoulot(declinaison)}>Valider</button>
      </div>
    );
  }

  if (phase === 'cloture') {
    const declinaison = goulotFor(crise);
    const chosenOption = declinaison.options.find((o) => o.id === goulotChoix);
    const score = voteScoreSur10(voteScore || 0);
    return (
      <div className="participant-cloture">
        <h2>Flair d'investisseur : {score}/10</h2>
        {chosenOption && <p className="muted">{goulotScore >= 2 ? '✓ ' : goulotScore === 1 ? '~ ' : '✗ '}{chosenOption.lecon}</p>}
        {xpResult && (
          <div className="participant-xp-award">
            {xpResult.xpAwarded > 0 && <p>+{xpResult.xpAwarded} XP</p>}
            <p>Badge débloqué : « Détecteur de washing »</p>
            {xpResult.jour1Complet && <p className="highlight">🏆 Badge « Jour 1 complet » débloqué !</p>}
          </div>
        )}
        {xpResult?.leveledUp && (
          <PromotionModal grade={xpResult.leveledUp} onDismiss={() => setXpResult((r) => r && { ...r, leveledUp: null })} />
        )}
        <p className="muted">La Session 4 vous attend.</p>
      </div>
    );
  }

  return null;
}
