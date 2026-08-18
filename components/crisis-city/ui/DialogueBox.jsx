import React, { useEffect, useRef, useState } from 'react';
import { visibleOptions } from '../engine/effects.js';
import { sfx } from '../audio/sfx.js';

// Boîte de dialogue : réplique, options, navigation clavier 1/2/3 (directive 3.1),
// minuteur visuel pour les nœuds « temps compté » (acte 2 égyptien, directive 3.2 respectée :
// jamais plus de 4 options affichées, dont au plus une conditionnelle).
//
// `disabled` : vrai pendant la réaction de 1,5 s qui suit un choix (Document n°4, 6.2) — le
// minuteur se fige et les entrées sont ignorées, en attendant que App.jsx applique réellement
// le choix auprès du réducteur.
export default function DialogueBox({ scenario, node, state, onChoose, disabled, onTimerTick }) {
  const options = visibleOptions(scenario, node, state);
  const hasTimer = !!node.timerSec;
  const [secondsLeft, setSecondsLeft] = useState(node.timerSec || null);
  const intervalRef = useRef(null);
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const alertPlayedRef = useRef(false);

  useEffect(() => {
    if (!hasTimer) return undefined;
    setSecondsLeft(node.timerSec);
    alertPlayedRef.current = false;
    intervalRef.current = setInterval(() => {
      if (disabledRef.current) return;
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current);
          sfx.timeout();
          const defaultIndex = node.optionParDefaut ?? 0;
          onChoose(defaultIndex, true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node.id]);

  useEffect(() => {
    onTimerTick?.(hasTimer ? secondsLeft : null);
    if (hasTimer && secondsLeft === 15 && !alertPlayedRef.current) {
      alertPlayedRef.current = true;
      sfx.alerte();
    }
  }, [secondsLeft, hasTimer, onTimerTick]);

  useEffect(() => {
    if (disabled && intervalRef.current) clearInterval(intervalRef.current);
  }, [disabled]);

  useEffect(() => {
    function onKey(e) {
      if (disabledRef.current) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= options.length) {
        const opt = options[n - 1];
        if (opt.available) { sfx.choix(); onChoose(opt.index); }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [options, onChoose]);

  return (
    <div className={`dialogue-box ${disabled ? 'is-resolving' : ''}`} role="dialog" aria-label={node.titre}>
      {hasTimer && (
        <div className={`dialogue-timer ${secondsLeft <= 15 ? 'urgent' : ''}`}>
          ⏱ {secondsLeft}s — décidez maintenant
        </div>
      )}
      <div className="dialogue-header">
        <h3>{node.titre}</h3>
      </div>
      <p className="dialogue-contexte">{node.contexte}</p>
      <p className="dialogue-replique">« {node.replique} »</p>
      <div className="dialogue-options">
        {options.map(({ option, index, available, reason }) => (
          <button
            key={index}
            className={`dialogue-option ${available ? '' : 'locked'}`}
            disabled={!available || disabled}
            onClick={() => { if (available && !disabled) { sfx.choix(); onChoose(index); } }}
            title={!available ? reason : undefined}
          >
            <span className="dialogue-option-num">{index + 1}</span>
            <span className="dialogue-option-label">{option.label}</span>
            {!available && <span className="dialogue-option-reason">{reason}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
