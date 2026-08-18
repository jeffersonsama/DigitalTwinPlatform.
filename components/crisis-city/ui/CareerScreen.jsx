import React from 'react';
import { GRADES, gradePourXp } from '../engine/xp.js';
import { BADGES } from '../engine/badges.js';
import { unlockedCardIdsEver, totalXp } from '../engine/persistence.js';
import { KNOWLEDGE_CARDS } from '../data/knowledgeCards.js';
import { SCENARIOS } from '../data/scenarios.js';
import { FIGURES, FIGURE_IDS } from '../data/figures.js';
import { FIGURE_ALLY_MARKERS } from '../data/memoire.js';
import { NODE_PERSONNAGE } from '../data/reactions.js';
import { resolveFigureName } from '../data/packs.js';
import Portrait from '../art/PortraitArt.jsx';

const FIN_LABELS = { standard: 'Fin standard', degradee: 'Fin dégradée' };

function exportJournal(scenarioId, history) {
  const scenario = SCENARIOS[scenarioId];
  const lines = [
    `CRISIS CITY — Journal de partie — ${scenario.ville} · ${scenario.titre}`,
    '',
    ...history.map(
      (h, i) => `${i + 1}. ${h.nodeTitre}\n   → ${h.optionLabel}\n   ${h.feedback}`
    ),
  ];
  return lines.join('\n\n');
}

export default function CareerScreen({ progress, onClose, exportableRuns, completedScenarios, pack }) {
  const xp = totalXp(progress);
  const grade = gradePourXp(xp);
  const unlockedCards = unlockedCardIdsEver(progress);

  function downloadJournal(scenarioId) {
    const text = exportJournal(scenarioId, exportableRuns[scenarioId]);
    navigator.clipboard?.writeText(text);
  }

  // Fiche civile (Doc n°6 §5.3) : "rencontrée"/"alliée" par figure, calculé depuis l'historique
  // et les marqueurs de tous les modules complétés cette session (state.completedScenarios,
  // moteur — cf. gameReducer.js). Pas de jauge numérique : le document n'en précise pas le
  // barème, un état binaire évite d'inventer un score arbitraire.
  const runs = Object.values(completedScenarios || {});
  const seenMarqueurs = runs.flatMap((r) => r.marqueurs || []);
  const metCharacterIds = new Set(runs.flatMap((r) => r.history || []).map((h) => NODE_PERSONNAGE[h.nodeId]).filter(Boolean));

  function figureMet(figure) {
    return metCharacterIds.has(figure.characterId) || (figure.secondaryCharacterId && metCharacterIds.has(figure.secondaryCharacterId));
  }
  function figureAllied(figureId) {
    return (FIGURE_ALLY_MARKERS[figureId] || []).some((m) => seenMarqueurs.includes(m));
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal career-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Écran Carrière</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <section className="career-section">
          <h3>Grades — {xp} XP</h3>
          <ol className="grade-ladder">
            {GRADES.map((g, i) => (
              <li key={g.titre} className={`grade-ladder-item ${i === grade.index ? 'current' : ''} ${i < grade.index ? 'past' : ''}`}>
                <span className="grade-ladder-chevron">{i + 1}</span>
                <span className="grade-ladder-titre">{g.titre}</span>
                <span className="grade-ladder-deblocage">
                  {g.deblocage}
                  {!g.implemente && <em className="muted"> (à venir)</em>}
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="career-section">
          <h3>Badges ({Object.keys(progress.badgesEarned).length}/{BADGES.length})</h3>
          <div className="collection-grid">
            {BADGES.map((b) => {
              const earned = progress.badgesEarned[b.id];
              const hideCondition = b.surprise && !earned;
              return (
                <div key={b.id} className={`badge-card ${earned ? 'earned' : ''}`}>
                  <div className="badge-card-titre">{earned ? b.titre : hideCondition ? '??? à découvrir' : b.titre}</div>
                  {!hideCondition && <p className="badge-card-condition">{b.condition}</p>}
                  {earned && <p className="badge-card-celebre">{b.celebre}</p>}
                </div>
              );
            })}
          </div>
        </section>

        <section className="career-section">
          <h3>Fiche civile — les figures d'Al-Wasl</h3>
          <div className="figure-grid">
            {FIGURE_IDS.map((figureId) => {
              const figure = FIGURES[figureId];
              const met = figureMet(figure);
              const allied = figureAllied(figureId);
              return (
                <div key={figureId} className={`figure-card ${met ? '' : 'locked'}`}>
                  <Portrait characterId={met ? figure.characterId : undefined} size={72} fallbackName={figure.nom} />
                  <div className="figure-card-nom">{met ? resolveFigureName(pack, figureId) : '???'}</div>
                  <div className="figure-card-fonction muted">{figure.fonction}</div>
                  <div className="figure-card-tags">
                    <span className={`figure-tag ${met ? 'yes' : ''}`}>{met ? 'Rencontrée' : 'Pas encore croisée'}</span>
                    {allied && <span className="figure-tag yes">Alliée</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="career-section">
          <h3>Cartes de savoir ({unlockedCards.length}/20)</h3>
          <div className="collection-grid">
            {Object.values(KNOWLEDGE_CARDS).map((c) => {
              const has = unlockedCards.includes(c.id);
              return (
                <div key={c.id} className={`knowledge-card ${has ? '' : 'locked'}`}>
                  <div className="knowledge-card-title">{has ? c.titre : '— à découvrir —'}</div>
                  {has && <p className="knowledge-card-principe">{c.principe}</p>}
                </div>
              );
            })}
          </div>
        </section>

        <section className="career-section">
          <h3>Galerie des fins {grade.index < 1 && <em className="muted">(débloqué au grade 2)</em>}</h3>
          {grade.index >= 1 && (
            <div className="collection-grid">
              {Object.keys(SCENARIOS).map((id) =>
                ['standard', 'degradee'].map((fin) => {
                  const seen = progress.scenarios[id]?.finsVues?.[fin];
                  return (
                    <div key={id + fin} className={`knowledge-card ${seen ? '' : 'locked'}`}>
                      <div className="knowledge-card-title">{SCENARIOS[id].titre.split(' — ')[0]} — {FIN_LABELS[fin]}</div>
                      {!seen && <p className="muted">Non observée</p>}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </section>

        <section className="career-section">
          <h3>Journal de partie {grade.index < 2 && <em className="muted">(débloqué au grade 3)</em>}</h3>
          {grade.index >= 2 && (
            <div className="commitment-actions">
              {Object.keys(SCENARIOS).map((id) =>
                exportableRuns[id] ? (
                  <button key={id} className="btn-secondary" onClick={() => downloadJournal(id)}>
                    Copier le journal — {SCENARIOS[id].titre.split(' — ')[0]}
                  </button>
                ) : null
              )}
              {Object.values(exportableRuns).every((v) => !v) && <p className="muted">Terminez une partie dans cette session pour l'exporter.</p>}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
