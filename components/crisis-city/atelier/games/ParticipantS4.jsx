import React, { useEffect, useRef, useState } from 'react';
import { backend } from '../engine/backend.js';
import { RADAR_QUESTIONS, emptyEngagement, engagementComplet, computeTargets } from './s4.js';
import { awardAtelierCompletion } from '../engine/xpBridge.js';

export default function ParticipantS4({ session, participant, submitResponse }) {
  const phase = session.phase;

  // --- Écriture ---
  const [engagement, setEngagement] = useState(emptyEngagement());
  const [prenom, setPrenom] = useState('');
  const [ecritureDone, setEcritureDone] = useState(false);

  function updateField(field, value) {
    setEngagement((prev) => ({ ...prev, [field]: value }));
  }

  function submitEcriture() {
    submitResponse('engagement', { ...engagement, prenom });
    setEcritureDone(true);
  }

  // --- Banc d'essai ---
  const [targets, setTargets] = useState(null);
  const [targetEngagements, setTargetEngagements] = useState({});
  const [targetIndex, setTargetIndex] = useState(0);
  const [radarReponses, setRadarReponses] = useState({});
  const [encouragement, setEncouragement] = useState('');
  const [avisEnvoyes, setAvisEnvoyes] = useState(0);

  useEffect(() => {
    if (phase !== 'banc_essai' || targets !== null) return;
    let cancelled = false;
    (async () => {
      const participants = await backend.fetchParticipants(session.id);
      const computed = computeTargets(participants, participant.id);
      const engagements = await backend.fetchResponses(session.id, 'engagement');
      const map = {};
      for (const id of computed) {
        const row = engagements.find((r) => r.participant_id === id);
        if (row) map[id] = row.payload;
      }
      if (!cancelled) {
        setTargets(computed);
        setTargetEngagements(map);
      }
    })();
    return () => { cancelled = true; };
  }, [phase, targets, session.id, participant.id]);

  function submitAvis() {
    const targetId = targets[targetIndex];
    submitResponse(`avis${targetIndex + 1}`, { cible: targetId, reponses: radarReponses, encouragement });
    setRadarReponses({});
    setEncouragement('');
    setAvisEnvoyes((n) => n + 1);
    setTargetIndex((i) => i + 1);
  }

  const radarComplet = RADAR_QUESTIONS.every((q) => radarReponses[q.id]) && encouragement.trim().length > 0;

  // --- Retour et durcissement ---
  const [avisRecus, setAvisRecus] = useState(null);
  const [revision, setRevision] = useState(null);
  const [retourDone, setRetourDone] = useState(false);

  useEffect(() => {
    if (phase !== 'retour' || avisRecus !== null) return;
    let cancelled = false;
    (async () => {
      const all = await backend.fetchResponses(session.id);
      const recus = all.filter((r) => r.manche.startsWith('avis') && r.payload.cible === participant.id);
      if (!cancelled) {
        setAvisRecus(recus);
        setRevision({ ...engagement });
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, avisRecus, session.id, participant.id]);

  function submitRetour() {
    const revised = JSON.stringify(revision) !== JSON.stringify(engagement);
    submitResponse('engagement_v2', { ...revision, revised });
    setRetourDone(true);
  }

  // --- Signature ---
  const [optIn, setOptIn] = useState(true);
  const [signatureDone, setSignatureDone] = useState(false);

  function submitSignature() {
    submitResponse('signature', { optIn, prenom });
    setSignatureDone(true);
  }

  const awardedRef = useRef(false);
  const [xpResult, setXpResult] = useState(null);
  useEffect(() => {
    if (phase === 'cloture' && !awardedRef.current) {
      awardedRef.current = true;
      awardAtelierCompletion('s4', 'atelier_s4').then(setXpResult);
    }
  }, [phase]);

  if (phase === 'lobby') {
    return (
      <div className="participant-wait">
        <h2>Votre gabarit 30/60/90 vous attend.</h2>
        <p className="muted">Petit et daté bat grand et vague.</p>
      </div>
    );
  }

  if (phase === 'ecriture') {
    if (ecritureDone) return <div className="participant-wait"><h2>Engagement envoyé.</h2><p className="muted">En attente du banc d'essai…</p></div>;
    return (
      <div className="participant-form s4-gabarit">
        <h2>Votre engagement 30 / 60 / 90</h2>
        <label>Prénom (optionnel, pour le jumelage final)
          <input value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Prénom" />
        </label>
        <label>Verbe d'action — un verbe faisable par VOUS
          <input value={engagement.verbe} onChange={(e) => updateField('verbe', e.target.value)} placeholder="Cartographier · organiser · réparer · certifier · réunir" />
        </label>
        <label>Objet précis — quoi, où, combien
          <input value={engagement.objet} onChange={(e) => updateField('objet', e.target.value)} placeholder="les 8 points d'eau du campus" />
        </label>
        <label>Partenaire nommé — une personne ou structure identifiable
          <input value={engagement.partenaire} onChange={(e) => updateField('partenaire', e.target.value)} placeholder="Mme K., service technique" />
        </label>
        <label>Preuve datée — ce qui existera et que quelqu'un pourra voir
          <input value={engagement.preuve} onChange={(e) => updateField('preuve', e.target.value)} placeholder="carte publiée le 15/10" />
        </label>
        <button className="btn-primary" disabled={!engagementComplet(engagement)} onClick={submitEcriture}>Envoyer</button>
      </div>
    );
  }

  if (phase === 'banc_essai') {
    if (targets === null) return <div className="atelier-loading">Chargement…</div>;
    if (targets.length === 0) {
      return (
        <div className="participant-wait">
          <h2>Pas assez de participants pour un banc d'essai croisé.</h2>
          <p className="muted">Mode démo solo — attendez la phase suivante.</p>
        </div>
      );
    }
    if (targetIndex >= targets.length) {
      return <div className="participant-wait"><h2>{avisEnvoyes} avis envoyés.</h2><p className="muted">En attente du retour…</p></div>;
    }
    const targetId = targets[targetIndex];
    const targetEngagement = targetEngagements[targetId];
    return (
      <div className="participant-form s4-radar">
        <h2>Avis {targetIndex + 1}/{targets.length}</h2>
        {targetEngagement ? (
          <div className="s4-engagement-preview">
            <p><strong>{targetEngagement.verbe}</strong> {targetEngagement.objet}</p>
            <p className="muted">avec {targetEngagement.partenaire} — preuve : {targetEngagement.preuve}</p>
          </div>
        ) : <p className="muted">(engagement en cours de rédaction par ce pair)</p>}
        {RADAR_QUESTIONS.map((q) => (
          <div key={q.id} className="s4-radar-question">
            <p>{q.texte}</p>
            <div className="s4-radar-choices">
              {['oui', 'presque', 'non'].map((v) => (
                <button
                  key={v}
                  className={`s4-radar-choice ${radarReponses[q.id] === v ? 'chosen' : ''}`}
                  onClick={() => setRadarReponses((prev) => ({ ...prev, [q.id]: v }))}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        ))}
        <label>Une ligne d'encouragement (obligatoire)
          <textarea value={encouragement} onChange={(e) => setEncouragement(e.target.value)} rows={2} placeholder="On teste les plans, jamais les personnes." />
        </label>
        <button className="btn-primary" disabled={!radarComplet} onClick={submitAvis}>Envoyer mon avis</button>
      </div>
    );
  }

  if (phase === 'retour') {
    if (avisRecus === null || revision === null) return <div className="atelier-loading">Chargement…</div>;
    if (retourDone) return <div className="participant-wait"><h2>Engagement durci.</h2><p className="muted">En attente de la signature…</p></div>;
    return (
      <div className="participant-form s4-retour">
        <h2>{avisRecus.length} avis reçus</h2>
        {avisRecus.map((r) => (
          <div key={r.id} className="s4-avis-recu">
            <div className="s4-radar-summary">
              {RADAR_QUESTIONS.map((q) => (
                <span key={q.id} className={`s4-radar-tag ${r.payload.reponses?.[q.id]}`}>{r.payload.reponses?.[q.id]}</span>
              ))}
            </div>
            <p className="muted">« {r.payload.encouragement} »</p>
          </div>
        ))}
        <h3>Durcissez votre engagement</h3>
        <label>Verbe d'action<input value={revision.verbe} onChange={(e) => setRevision({ ...revision, verbe: e.target.value })} /></label>
        <label>Objet précis<input value={revision.objet} onChange={(e) => setRevision({ ...revision, objet: e.target.value })} /></label>
        <label>Partenaire nommé<input value={revision.partenaire} onChange={(e) => setRevision({ ...revision, partenaire: e.target.value })} /></label>
        <label>Preuve datée<input value={revision.preuve} onChange={(e) => setRevision({ ...revision, preuve: e.target.value })} /></label>
        <button className="btn-primary" disabled={!engagementComplet(revision)} onClick={submitRetour}>Valider mon engagement durci</button>
      </div>
    );
  }

  if (phase === 'signature') {
    if (signatureDone) return <div className="participant-wait"><h2>Signé.</h2><p className="muted">Allez à la rencontre de vos pairs.</p></div>;
    return (
      <div className="participant-form s4-signature">
        <h2>Votre engagement final</h2>
        <div className="s4-engagement-preview">
          <p><strong>{revision?.verbe}</strong> {revision?.objet}</p>
          <p className="muted">avec {revision?.partenaire} — preuve : {revision?.preuve}</p>
        </div>
        <label className="s4-checkbox">
          <input type="checkbox" checked={optIn} onChange={(e) => setOptIn(e.target.checked)} />
          Je veux apparaître au mur des engagements et être présenté(e) à mes voisins de crise
        </label>
        {optIn && targets?.length > 0 && (
          <div className="s4-voisins">
            <h3>Vos voisins de crise</h3>
            {targets.map((id) => {
              const e = targetEngagements[id];
              return (
                <div key={id} className="s4-voisin-card">
                  <p>{e ? `« ${e.verbe} ${e.objet} »` : 'engagement en cours'}</p>
                  <p className="muted">Retrouvez-vous dans la salle et échangez un contact.</p>
                </div>
              );
            })}
          </div>
        )}
        <button className="btn-primary" onClick={submitSignature}>Signer</button>
      </div>
    );
  }

  if (phase === 'cloture') {
    return (
      <div className="participant-cloture">
        <h2>Votre engagement est signé.</h2>
        {xpResult && (
          <div className="participant-xp-award">
            {xpResult.xpAwarded > 0 && <p>+{xpResult.xpAwarded} XP</p>}
            <p>Badge débloqué : « Bâtisseur du Jour 1 »</p>
            {xpResult.jour1Complet && <p className="highlight">🏆 Badge « Jour 1 complet » débloqué !</p>}
          </div>
        )}
        <p className="muted">Retrouvez cet engagement dans votre bilan Crisis City.</p>
      </div>
    );
  }

  return null;
}
