import React, { useState } from 'react';
import { generateCommitment, computeScores, computeProfile } from '../engine/scoring.js';
import { GRADES, gradePourXp } from '../engine/xp.js';
import { KNOWLEDGE_CARDS } from '../data/knowledgeCards.js';
import { SCENARIOS } from '../data/scenarios.js';
import KnowledgeCardView from './KnowledgeCard.jsx';
import GradeBadge from './GradeBadge.jsx';

// Grade minimal pour affronter le module bonus Canicule — cf. GRADES[CANICULE_GRADE_INDEX] dans
// engine/xp.js (« Directeur de cellule »). Un seul point de vérité pour la condition ET son
// libellé, pour ne jamais désynchroniser le verrou de son texte affiché.
const CANICULE_GRADE_INDEX = 6;

// Retour à l'accueil de la plateforme — réutilisé sur tous les écrans hors exploration (qui,
// eux, ont ce lien dans le HUD, cf. HUD.jsx) puisque le jeu n'a pas d'AppShell/rail de navigation.
export function HomeLink() {
  return <a href="/" className="screen-home-link">← Retour à l'accueil</a>;
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

export function TitleScreen({ onStart, xp, onOpenCareer, pack, packIds, packAutoDetected, onCyclePack }) {
  return (
    <div className="screen title-screen">
      <HomeLink />
      <h1 className="title-logo">CRISIS CITY</h1>
      <p className="title-sub">Jeu sérieux de gestion de crise — Youth Knowledge Forum 2026</p>
      <p className="title-baseline">« Navigating Crises to Achieve Sustainability »</p>
      <button className="btn-primary" onClick={onStart}>Commencer</button>
      {/* Doc n°6 §J5 : choix invité du pack (pas de compte joueur, cf. Fondations) — change les
          noms/couleurs affichés dans toute la session, jamais les mécaniques. La couleur civique
          peut déjà venir d'une détection automatique du pays (géolocalisation IP) — le libellé
          "détecté" l'indique avant que le joueur n'ait rien choisi lui-même. */}
      {packIds && packIds.length > 1 && (
        <button className="btn-secondary title-pack-select" onClick={onCyclePack}>
          Ville : {pack?.nom || 'Ville neutre'}{packAutoDetected ? ' (détecté)' : ''} ▾
        </button>
      )}
      {xp > 0 && (
        <div className="title-progress">
          <GradeBadge xp={xp} />
          <button className="btn-secondary" onClick={onOpenCareer}>Écran Carrière</button>
        </div>
      )}
      <p className="title-atelier-link"><a href="?atelier=menu">Animateur ? Accéder aux jeux d'après-session (Jour 1)</a></p>
    </div>
  );
}

// Doc n°6 (pivot 2.0) : on ne choisit plus "un pays à visiter" mais une crise à affronter dans
// Al-Wasl, la ville-monde — chaque carte est un module joué sur la même carte, pas une ville
// distincte (le nom technique `onSelect(scenarioId)` reste un détail d'implémentation invisible
// du joueur). Rendu data-driven depuis SCENARIOS : un futur 4e module (Crue éclair, Crise de
// l'information...) apparaît sans toucher ce composant.
export function CountrySelectScreen({ onSelect, xp }) {
  const grade = gradePourXp(xp || 0);
  return (
    <div className="screen country-select-screen">
      <HomeLink />
      <h1>Al-Wasl a besoin de vous</h1>
      <p className="muted">Une seule ville. Quelle crise affrontez-vous ?</p>
      <div className="country-cards">
        {Object.values(SCENARIOS).map((scenario) => {
          const [nomCrise, sousTitre] = scenario.titre.split(' — ');
          const locked = scenario.id === 'canicule' && grade.index < CANICULE_GRADE_INDEX;
          if (locked) {
            return (
              <div key={scenario.id} className="country-card is-locked">
                <h2>{nomCrise}</h2>
                <p className="muted">{capitalize(sousTitre)}</p>
                <p className="muted">🔒 Débloqué au grade {GRADES[CANICULE_GRADE_INDEX].titre}</p>
              </div>
            );
          }
          return (
            <button key={scenario.id} className="country-card" onClick={() => onSelect(scenario.id)}>
              <h2>{nomCrise}</h2>
              <p className="muted">{capitalize(sousTitre)}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function BriefingScreen({ scenario, acte, acteIndex, dossierConsulted, onConsultDossier, onStartAct }) {
  return (
    <div className="screen briefing-screen">
      <HomeLink />
      <h1>{acte.titre}</h1>
      <p className="briefing-soustitre">{acte.soustitre}</p>
      {acteIndex === 0 && <p className="briefing-contexte">{scenario.contexte}</p>}
      <p className="briefing-intro">{acte.intro}</p>
      <button className="btn-secondary dossier-btn" onClick={onConsultDossier} disabled={dossierConsulted}>
        {dossierConsulted ? '✓ Dossier de données consulté' : 'Consulter le dossier de données'}
      </button>
      <button className="btn-primary" onClick={onStartAct}>Entrer dans la ville</button>
    </div>
  );
}

export function FeedbackScreen({ lastResult, defeatText, onContinue }) {
  return (
    <div className="screen feedback-screen">
      <h2>{lastResult.nodeTitre}</h2>
      <p className="feedback-choice">Vous avez choisi : « {lastResult.optionLabel} »</p>
      <div className="feedback-flash">
        <span className="feedback-flash-label">Ce que cela enseigne</span>
        <p>{lastResult.feedback}</p>
      </div>
      {lastResult.suite && <p className="feedback-suite">{lastResult.suite}</p>}
      {lastResult.tirageResultat && (
        <p className="muted">Issue de l'incertitude : {lastResult.tirageResultat === 'reussi' ? 'favorable' : 'défavorable'} — cela ne change rien à l'évaluation de votre décision.</p>
      )}
      {lastResult.timedOut && (
        <p className="muted">⏱ Temps écoulé — l'option par défaut a été appliquée. En crise, ne pas décider est une décision.</p>
      )}
      {lastResult.nouvellesCartes?.length > 0 && (
        <div className="feedback-cards">
          {lastResult.nouvellesCartes.map((id) => (
            <KnowledgeCardView key={id} card={KNOWLEDGE_CARDS[id]} justUnlocked />
          ))}
        </div>
      )}
      {defeatText && <p className="defeat-text">{defeatText} La crise continue malgré tout — le débrief sera complet.</p>}
      <button className="btn-primary" onClick={onContinue}>Continuer</button>
    </div>
  );
}

export function ActDebriefScreen({ scenario, acte, acteIndex, resources, onNextAct }) {
  const isLast = acteIndex === scenario.actes.length - 1;
  return (
    <div className="screen act-debrief-screen">
      <HomeLink />
      <p className="gouverneur-label">Le gouverneur (voix off)</p>
      <h1>Fin de {acte.titre}</h1>
      <div className="act-debrief-indicateurs">
        {scenario.ressources.map((r) => (
          <div key={r.code} className="act-debrief-indicateur">
            <span>{r.nom}</span>
            <strong>{resources[r.code]}</strong>
          </div>
        ))}
      </div>
      <p className="act-debrief-commentaire">
        {isLast
          ? "Votre mission touche à sa fin. Voyons ce qu'elle dit de vous."
          : "L'acte suivant vous attend — les décisions prises ici vous suivront."}
      </p>
      <button className="btn-primary" onClick={onNextAct}>
        {isLast ? 'Voir le bilan final' : 'Acte suivant'}
      </button>
    </div>
  );
}

export function CommitmentScreen({ scenario, history, onRestartSame, onPlayOther, onEnd, onShare }) {
  const { normalized } = computeScores(scenario.id, history);
  const profile = computeProfile(normalized);
  const template = generateCommitment(profile.nom);
  const [j30, setJ30] = useState(template.j30);
  const [j60, setJ60] = useState(template.j60);
  const [j90, setJ90] = useState(template.j90);
  const [copied, setCopied] = useState(false);

  function copy() {
    const text = `Mon engagement (${profile.nom}) — Crisis City / YKF 2026\n30 jours : ${j30}\n60 jours : ${j60}\n90 jours : ${j90}`;
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      onShare();
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="screen commitment-screen">
      <HomeLink />
      <h1>Votre engagement 30 / 60 / 90 jours</h1>
      <p className="muted">Éditez-le librement — c'est le pont entre le jeu et le réel.</p>
      <label>30 jours<textarea value={j30} onChange={(e) => setJ30(e.target.value)} rows={2} /></label>
      <label>60 jours<textarea value={j60} onChange={(e) => setJ60(e.target.value)} rows={2} /></label>
      <label>90 jours<textarea value={j90} onChange={(e) => setJ90(e.target.value)} rows={2} /></label>
      <div className="commitment-actions">
        <button className="btn-secondary" onClick={copy}>{copied ? 'Copié — partagé !' : 'Copier'}</button>
      </div>
      <div className="commitment-nav">
        <button className="btn-secondary" onClick={onRestartSame}>Rejouer ce scénario</button>
        {/* Doc n°6 : plus de bascule binaire "l'autre pays" — on retourne au choix de crise,
            qui liste maintenant tous les modules disponibles (cf. CountrySelectScreen). */}
        <button className="btn-secondary" onClick={onPlayOther}>Choisir une autre crise</button>
        <button className="btn-primary" onClick={onEnd}>Terminer</button>
      </div>
    </div>
  );
}

export function EndScreen({ onRestart, xp, onOpenCareer }) {
  return (
    <div className="screen end-screen">
      <HomeLink />
      <h1>Merci d'avoir joué CRISIS CITY</h1>
      <p>L'XP mesure l'engagement, les compétences mesurent les décisions.</p>
      <div className="title-progress">
        <GradeBadge xp={xp} />
        <button className="btn-secondary" onClick={onOpenCareer}>Écran Carrière</button>
      </div>
      <button className="btn-primary" onClick={onRestart}>Retour à l'écran-titre</button>
      <p className="title-atelier-link"><a href="?atelier=menu">Animateur ? Accéder aux jeux d'après-session (Jour 1)</a></p>
    </div>
  );
}
