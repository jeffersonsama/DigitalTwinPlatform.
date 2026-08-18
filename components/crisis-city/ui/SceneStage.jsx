import React, { useEffect, useState } from 'react';
import Decor from '../art/DecorArt.jsx';
import Portrait from '../art/PortraitArt.jsx';
import { resolveEntree, NODE_PERSONNAGE } from '../data/reactions.js';
import { NODE_DECOR, DECORS } from '../data/decors.js';
import { CHARACTERS } from '../data/characters.js';
import { NODE_DETAILS } from '../data/plansFins.js';
import { figureForCharacter, resolveFigureName } from '../data/packs.js';
import EntreeSequence from './EntreeSequence.jsx';
import DetailInsert from './DetailInsert.jsx';
import './SceneStage.css';

// PLAN SCÈNE — Document n°4, section 2 et 6.2 ; entrée dans le lieu étendue par le Livre de
// prompts n°2 (Document n°4-quinquies). Le théâtre des décisions : plan d'approche → plan de
// seuil (§0.1, 1,2 s, skippable) → décor illustré du lieu + portrait du PNJ + boîte de dialogue
// (décor → personnage → dialogue, 950 ms, skippable) → réaction au choix (expression + effet de
// couche, 1,5 s) AVANT le flash pédagogique. Le moteur (gameReducer) ignore tout ceci : `reaction`
// est une donnée purement présentée par App.jsx, jamais consommée par la logique de jeu.
export default function SceneStage({ node, crisisActive, reaction, reactionTrigger, tension, onSkipEntrance, children, pack, marqueurs }) {
  const [planDone, setPlanDone] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    setPlanDone(false);
    setEntered(false);
  }, [node.id]);

  useEffect(() => {
    if (!planDone) return undefined;
    const t = setTimeout(() => setEntered(true), 20);
    return () => clearTimeout(t);
  }, [planDone, node.id]);

  const decorId = NODE_DECOR[node.id];
  const personnageId = NODE_PERSONNAGE[node.id];
  const character = personnageId ? CHARACTERS[personnageId] : null;
  const decorMeta = decorId ? DECORS[decorId] : null;

  // Casting localisable par pack (Doc n°6 §J5) : seul le rôle PRINCIPAL d'une figure est
  // renommable — un second rôle (ex. Brahim sur M2) garde son nom de base, cf. figures.js.
  const figure = character ? figureForCharacter(character.id) : null;
  const displayName = figure ? resolveFigureName(pack, figure.id) : character?.nom;
  const displayFonction = figure ? figure.fonction : character?.role;

  // Mémoire inter-modules (Doc n°6 §5.3) : une reconnaissance (marqueur hérité d'un module
  // précédent) prime sur l'entrée par défaut tant qu'aucun choix n'a été fait sur ce nœud.
  const entree = resolveEntree(node.id, marqueurs);
  const expression = reaction ? reaction.expr : entree.expr;
  const recognitionLigne = !reaction ? entree.ligne : null;
  const fx = reaction?.fx;

  function skip() {
    setPlanDone(true);
    setEntered(true);
    onSkipEntrance?.();
  }

  return (
    <div
      className={`scene-stage ${entered ? 'is-entered' : 'is-entering'} ${tension ? 'is-tense' : ''}`}
      onClick={(e) => {
        // Le trajet/l'entrée est "coupable" (5.4) : un clic hors dialogue le termine aussitôt.
        if (!planDone || !entered) skip();
      }}
    >
      {!planDone && <EntreeSequence lieu3d={node.lieu3d} onDone={() => setPlanDone(true)} />}

      <div className="scene-stage-decor">
        <Decor
          decorId={decorId}
          crisisActive={crisisActive}
          fallbackLabel={node.lieu3d}
        />
        {fx && <div className={`scene-fx scene-fx-${fx}`} aria-hidden="true" />}
        {tension && <div className="scene-fx scene-fx-tension" aria-hidden="true" />}
      </div>

      <div className="scene-stage-portrait">
        <Portrait
          characterId={personnageId}
          expression={expression}
          reactionPulse={!!reaction}
          fallbackName={!character ? decorMeta?.titre : undefined}
        />
        {character && (
          <div className="scene-stage-figure-caption">
            <strong>{displayName}</strong>
            <span>{displayFonction}</span>
          </div>
        )}
        {reaction?.ligne && (
          <div className="scene-reaction-ligne" role="status">« {reaction.ligne} »</div>
        )}
        {recognitionLigne && (
          <div className="scene-reaction-ligne scene-recognition-ligne" role="status">« {recognitionLigne} »</div>
        )}
      </div>

      <DetailInsert details={NODE_DETAILS[node.id]} trigger={reactionTrigger} />

      <div className="scene-stage-dialogue">{children}</div>
    </div>
  );
}
