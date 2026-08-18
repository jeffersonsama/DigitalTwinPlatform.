import React, { useEffect, useRef, useState } from 'react';
import { SITUATIONS, FAMILLES, MINI_PROJETS, PROFILS_PORTE_ENTREE, scoreManche1, scoreManche2, scoreManche3, totalScoreSur10 } from './s2.js';
import { awardAtelierCompletion } from '../engine/xpBridge.js';

const SITUATION_SECONDS = 20;

export default function ParticipantS2({ session, submitResponse }) {
  const phase = session.phase;

  // Manche 1
  const [situIndex, setSituIndex] = useState(0);
  const [reponsesM1, setReponsesM1] = useState([]);
  const [manche1Done, setManche1Done] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(SITUATION_SECONDS);
  const [m1Score, setM1Score] = useState(null);

  useEffect(() => {
    if (phase !== 'manche1' || manche1Done) return undefined;
    setSecondsLeft(SITUATION_SECONDS);
    const interval = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, situIndex, manche1Done]);

  useEffect(() => {
    if (phase === 'manche1' && secondsLeft === 0 && !manche1Done) {
      answerSituation(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  function answerSituation(familleChoisie) {
    const situation = SITUATIONS[situIndex];
    const next = [...reponsesM1, { situationId: situation.id, familleChoisie }];
    setReponsesM1(next);
    if (situIndex + 1 < SITUATIONS.length) {
      setSituIndex(situIndex + 1);
    } else {
      const score = scoreManche1(next);
      setM1Score(score);
      submitResponse('manche1', { reponses: next, score });
      setManche1Done(true);
    }
  }

  // Manche 2
  const [projetIndex, setProjetIndex] = useState(0);
  const [oddChoisis, setOddChoisis] = useState([]);
  const [reponsesM2, setReponsesM2] = useState([]);
  const [manche2Done, setManche2Done] = useState(false);
  const [m2Score, setM2Score] = useState(null);

  function toggleOdd(id) {
    setOddChoisis((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  }

  function confirmProjet() {
    const projet = MINI_PROJETS[projetIndex];
    const next = [...reponsesM2, { projetId: projet.id, oddChoisis }];
    setReponsesM2(next);
    setOddChoisis([]);
    if (projetIndex + 1 < MINI_PROJETS.length) {
      setProjetIndex(projetIndex + 1);
    } else {
      const score = scoreManche2(next);
      setM2Score(score);
      submitResponse('manche2', { reponses: next, score });
      setManche2Done(true);
    }
  }

  // Manche 3
  const [profilId, setProfilId] = useState(null);
  const [choixId, setChoixId] = useState(null);
  const [manche3Done, setManche3Done] = useState(false);
  const [m3Score, setM3Score] = useState(null);

  function submitManche3() {
    const score = scoreManche3(profilId, choixId);
    setM3Score(score);
    submitResponse('manche3', { profilId, choixId, score });
    setManche3Done(true);
  }

  const awardedRef = useRef(false);
  const [xpResult, setXpResult] = useState(null);
  useEffect(() => {
    if (phase === 'cloture' && !awardedRef.current) {
      awardedRef.current = true;
      awardAtelierCompletion('s2', 'atelier_s2').then(setXpResult);
    }
  }, [phase]);

  if (phase === 'lobby') {
    return (
      <div className="participant-wait">
        <h2>Sortez votre carte de référence 53001.</h2>
        <p className="muted">Ce jeu se joue AVEC elle — c'est la règle.</p>
      </div>
    );
  }

  if (phase === 'manche1') {
    if (manche1Done) return <div className="participant-wait"><h2>Envoyé.</h2><p className="muted">En attente de la révélation…</p></div>;
    const situation = SITUATIONS[situIndex];
    return (
      <div className="participant-form">
        <div className="s2-timer">{secondsLeft}s</div>
        <h2>Situation {situIndex + 1}/6</h2>
        <p className="s2-situation-texte">« {situation.texte} »</p>
        <div className="s2-familles">
          {FAMILLES.map((f) => (
            <button key={f} className="s2-famille-option" onClick={() => answerSituation(f)}>{f}</button>
          ))}
        </div>
      </div>
    );
  }

  if (phase === 'revelation1') {
    return (
      <div className="participant-reveal">
        <h2>Vos réponses, comparées</h2>
        <ol className="s2-revelation-list">
          {reponsesM1.map((r) => {
            const situation = SITUATIONS.find((s) => s.id === r.situationId);
            const ok = situation.famille === r.familleChoisie;
            return (
              <li key={r.situationId} className={ok ? 'ok' : 'faux'}>
                <strong>{situation.texte}</strong>
                <br />Vous : {r.familleChoisie || '(temps écoulé)'} {ok ? '✓' : `— correct : ${situation.famille}`}
                <div className="muted">{situation.note}</div>
              </li>
            );
          })}
        </ol>
        {m1Score !== null && <p className="muted">{m1Score}/6 bonnes familles.</p>}
      </div>
    );
  }

  if (phase === 'manche2') {
    if (manche2Done) return <div className="participant-wait"><h2>Envoyé.</h2><p className="muted">En attente de la révélation…</p></div>;
    const projet = MINI_PROJETS[projetIndex];
    return (
      <div className="participant-form">
        <h2>Projet {projetIndex + 1}/4</h2>
        <p className="s2-situation-texte">{projet.nom}</p>
        <p className="muted">Choisissez les 2 ODD réellement servis :</p>
        <div className="s2-odd-grid">
          {projet.odd.map((id) => (
            <button
              key={id}
              className={`s2-odd-option ${oddChoisis.includes(id) ? 'chosen' : ''}`}
              disabled={!oddChoisis.includes(id) && oddChoisis.length >= 2}
              onClick={() => toggleOdd(id)}
            >
              ODD {id} · {projet.legende[id]}
            </button>
          ))}
        </div>
        <button className="btn-primary" disabled={oddChoisis.length !== 2} onClick={confirmProjet}>Valider</button>
      </div>
    );
  }

  if (phase === 'revelation2') {
    return (
      <div className="participant-reveal">
        <h2>Le lien démontrable</h2>
        <p className="muted">activité → effet mesurable → cible ODD.</p>
        <ol className="s2-revelation-list">
          {reponsesM2.map((r) => {
            const projet = MINI_PROJETS.find((p) => p.id === r.projetId);
            const exact = r.oddChoisis.length === 2 && projet.vrais.every((v) => r.oddChoisis.includes(v));
            return (
              <li key={r.projetId} className={exact ? 'ok' : 'faux'}>
                <strong>{projet.nom}</strong>
                <br />Vrais : ODD {projet.vrais.join(' + ')} {exact ? '✓' : '— vous aviez : ODD ' + r.oddChoisis.join(' + ')}
                <div className="muted">{projet.piegeNote}</div>
              </li>
            );
          })}
        </ol>
        {m2Score !== null && <p className="muted">{m2Score}/4 projets correctement lus.</p>}
      </div>
    );
  }

  if (phase === 'manche3') {
    if (manche3Done) return <div className="participant-wait"><h2>Envoyé.</h2><p className="muted">En attente de la clôture…</p></div>;
    if (!profilId) {
      return (
        <div className="participant-form">
          <h2>Quel est votre profil ?</h2>
          {PROFILS_PORTE_ENTREE.map((p) => (
            <button key={p.id} className="intervention-option" onClick={() => setProfilId(p.id)}>{p.label}</button>
          ))}
        </div>
      );
    }
    const profil = PROFILS_PORTE_ENTREE.find((p) => p.id === profilId);
    return (
      <div className="participant-form">
        <h2>{profil.label} — votre premier pas ?</h2>
        {profil.options.map((o) => (
          <button
            key={o.id}
            className={`intervention-option ${choixId === o.id ? 'chosen' : ''}`}
            onClick={() => setChoixId(o.id)}
          >
            {o.texte}
          </button>
        ))}
        <button className="btn-primary" disabled={!choixId} onClick={submitManche3}>Valider</button>
      </div>
    );
  }

  if (phase === 'cloture') {
    const profil = profilId ? PROFILS_PORTE_ENTREE.find((p) => p.id === profilId) : null;
    const score = totalScoreSur10(m1Score || 0, m2Score || 0, m3Score || 0);
    return (
      <div className="participant-cloture">
        <h2>Littératie 53001 : {score}/10</h2>
        {profil && <p className="muted">{m3Score ? '✓ ' : '✗ '}{profil.note}</p>}
        {xpResult && (
          <div className="participant-xp-award">
            {xpResult.xpAwarded > 0 && <p>+{xpResult.xpAwarded} XP</p>}
            <p>Badge débloqué : « Permis 53001 »</p>
            {xpResult.jour1Complet && <p className="highlight">🏆 Badge « Jour 1 complet » débloqué !</p>}
          </div>
        )}
        <p className="muted">La Session 3 vous attend.</p>
      </div>
    );
  }

  return null;
}
