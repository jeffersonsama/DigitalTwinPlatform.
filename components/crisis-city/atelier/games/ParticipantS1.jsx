import React, { useEffect, useRef, useState } from 'react';
import CascadeBoard from '../ui/CascadeBoard.jsx';
import { CRISE_OPTIONS, CASCADE_A, CHOC_DEPART, INTERVENTIONS, scoreManche1, scoreManche2, totalScoreSur10 } from './s1.js';
import { awardAtelierCompletion } from '../engine/xpBridge.js';
import { COUNTRIES } from '../data/countryGeo.js';
import PromotionModal from '../../ui/PromotionModal.jsx';

const COUNTRY_ENTRIES = Object.entries(COUNTRIES).sort((a, b) => a[1].name.localeCompare(b[1].name, 'fr'));

export default function ParticipantS1({ session, participant, submitResponse, updateProfil }) {
  const phase = session.phase;

  // Pays détecté automatiquement via l'IP à la connexion (voir engine/geoip.js). Repli manuel
  // uniquement si la détection a échoué (participant.pays est alors null).
  const [paysManuel, setPaysManuel] = useState('');
  const pays = participant?.pays || paysManuel;
  const [crise, setCrise] = useState('');
  const [ancrageDone, setAncrageDone] = useState(false);

  const [selected, setSelected] = useState([]);
  const [manche1Done, setManche1Done] = useState(false);
  const [manche1Result, setManche1Result] = useState(null);

  const [interventionId, setInterventionId] = useState(null);
  const [manche2Done, setManche2Done] = useState(false);
  const [manche2Result, setManche2Result] = useState(null);

  const awardedRef = useRef(false);
  const [xpResult, setXpResult] = useState(null);

  useEffect(() => {
    if (phase === 'cloture' && !awardedRef.current) {
      awardedRef.current = true;
      awardAtelierCompletion('s1', 'atelier_s1').then(setXpResult);
    }
  }, [phase]);

  function toggleCard(id) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  }

  function submitAncrage() {
    submitResponse('ancrage', { crise });
    if (paysManuel) updateProfil(paysManuel, crise);
    setAncrageDone(true);
  }

  function submitManche1() {
    const result = scoreManche1(selected);
    setManche1Result(result);
    submitResponse('manche1', { selected, ...result });
    setManche1Done(true);
  }

  function submitManche2() {
    const result = scoreManche2(interventionId);
    setManche2Result(result);
    submitResponse('manche2', { interventionId, ...result });
    setManche2Done(true);
  }

  if (phase === 'lobby') {
    return (
      <div className="participant-wait">
        <h2>Vous êtes dans la salle.</h2>
        <p className="muted">L'animateur va démarrer le jeu — restez sur cet écran.</p>
      </div>
    );
  }

  if (phase === 'ancrage') {
    const detected = participant?.pays ? COUNTRIES[participant.pays] : null;
    return (
      <div className="participant-form">
        <h2>Une question, trente secondes</h2>
        {detected ? (
          <p className="participant-pays-detecte">
            Connecté·e depuis {detected.flag} <strong>{detected.name}</strong>
          </p>
        ) : (
          <label>
            Votre pays <span className="muted">(détection automatique indisponible)</span>
            <select value={paysManuel} onChange={(e) => setPaysManuel(e.target.value)}>
              <option value="">— choisir —</option>
              {COUNTRY_ENTRIES.map(([code, c]) => <option key={code} value={code}>{c.flag} {c.name}</option>)}
            </select>
          </label>
        )}
        <label>
          La crise qui vous préoccupe
          <select value={crise} onChange={(e) => setCrise(e.target.value)}>
            <option value="">— choisir —</option>
            {CRISE_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <button className="btn-primary" disabled={!pays || !crise || ancrageDone} onClick={submitAncrage}>
          {ancrageDone ? 'Envoyé ✓' : 'Envoyer'}
        </button>
      </div>
    );
  }

  if (phase === 'manche1') {
    if (manche1Done) {
      return (
        <div className="participant-wait">
          <h2>Cascade envoyée.</h2>
          <p className="muted">En attente de la révélation…</p>
        </div>
      );
    }
    return (
      <CascadeBoard
        cards={CASCADE_A}
        choc={CHOC_DEPART}
        selected={selected}
        onToggle={toggleCard}
        onSubmit={submitManche1}
        disabled={false}
      />
    );
  }

  if (phase === 'revelation1') {
    return (
      <div className="participant-reveal">
        <h2>Votre cascade, comparée</h2>
        <ol className="cascade-selection-review">
          {selected.map((id, index) => {
            const card = CASCADE_A.find((c) => c.id === id);
            const rangExact = card?.rangsAcceptes.includes(index + 1);
            const isVrai = card?.statut === 'vrai';
            return (
              <li key={id} className={rangExact ? 'ok' : isVrai ? 'proche' : 'faux'}>
                <strong>{index + 1}.</strong> {card?.texte}
                {rangExact && ' — rang exact ✓'}
                {!rangExact && isVrai && ' — vrai, mais pas à ce rang'}
                {!isVrai && ' — écart'}
              </li>
            );
          })}
        </ol>
        {manche1Result && (
          <p className="muted">
            {manche1Result.vraiCount}/4 cartes vraies · {manche1Result.rangExactCount} rangs exacts ·
            {manche1Result.piegeEvite ? ' piège évité ✓' : ' piège choisi ✗'}
          </p>
        )}
      </div>
    );
  }

  if (phase === 'manche2') {
    if (manche2Done) {
      return (
        <div className="participant-wait">
          <h2>Vote envoyé.</h2>
          <p className="muted">En attente de la révélation…</p>
        </div>
      );
    }
    return (
      <div className="participant-form">
        <h2>Une seule intervention — où le budget casse le plus de dominos ?</h2>
        <div className="intervention-options">
          {INTERVENTIONS.map((i) => (
            <button
              key={i.id}
              className={`intervention-option ${interventionId === i.id ? 'chosen' : ''}`}
              onClick={() => setInterventionId(i.id)}
            >
              {i.label}
            </button>
          ))}
        </div>
        <button className="btn-primary" disabled={!interventionId} onClick={submitManche2}>
          Valider mon choix
        </button>
      </div>
    );
  }

  if (phase === 'revelation2') {
    const chosen = INTERVENTIONS.find((i) => i.id === interventionId);
    const gagnant = INTERVENTIONS.find((i) => i.gagnant);
    return (
      <div className="participant-reveal">
        <h2>{manche2Result?.gagnant ? 'Vous aviez le levier gagnant.' : 'Le levier gagnant était ailleurs.'}</h2>
        {chosen && <p><strong>Votre choix :</strong> {chosen.label} — {chosen.verdict}</p>}
        {!manche2Result?.gagnant && <p><strong>Le levier gagnant :</strong> {gagnant.label} — {gagnant.verdict}</p>}
      </div>
    );
  }

  if (phase === 'cloture') {
    const score = totalScoreSur10(manche1Result?.points || 0, manche2Result?.points || 0);
    return (
      <div className="participant-cloture">
        <h2>Lecture systémique : {score}/10</h2>
        <p className="muted">Score privé — jamais en classement (règle 1.2).</p>
        {xpResult && (
          <div className="participant-xp-award">
            {xpResult.xpAwarded > 0 && <p>+{xpResult.xpAwarded} XP</p>}
            <p>Badge débloqué : « Cartographe du chaos »</p>
            {xpResult.jour1Complet && <p className="highlight">🏆 Badge « Jour 1 complet » débloqué !</p>}
          </div>
        )}
        {xpResult?.leveledUp && (
          <PromotionModal grade={xpResult.leveledUp} onDismiss={() => setXpResult((r) => r && { ...r, leveledUp: null })} />
        )}
        <p className="muted">La Session 2 vous attend — gardez votre téléphone à portée.</p>
      </div>
    );
  }

  return null;
}
