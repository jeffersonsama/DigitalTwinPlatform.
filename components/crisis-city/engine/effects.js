// Application des effets (ressources, marqueurs, déblocages, mécaniques conditionnelles).
// Toute mutation d'état passe par ici — testable unitairement (directive 3.1).

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function resourceDef(scenario, code) {
  return scenario.ressources.find((r) => r.code === code);
}

// Un choix est-il visible / grisé ? Retourne { available, reason }.
export function optionAvailability(scenario, option, state) {
  const cond = option.conditions;
  if (!cond) return { available: true };
  if (cond.marqueurs && !cond.marqueurs.every((m) => state.marqueurs.includes(m))) {
    return { available: false, reason: option.noteVerrouillage || 'Condition non remplie.' };
  }
  if (cond.marqueursAbsents && cond.marqueursAbsents.some((m) => state.marqueurs.includes(m))) {
    return { available: false, reason: 'Verrouillé par une décision précédente.' };
  }
  if (cond.ressourceMin) {
    for (const [code, min] of Object.entries(cond.ressourceMin)) {
      if ((state.resources[code] ?? 0) < min) {
        return { available: false, reason: option.noteVerrouillage || `Nécessite ${code} ≥ ${min}.` };
      }
    }
  }
  return { available: true };
}

// Un noeud "informé" additionnel n'apparaît que si sa condition est remplie ET
// qu'il n'est pas simplement grisé (les options grisées restent visibles ailleurs).
export function visibleOptions(scenario, node, state) {
  return node.options
    .map((option, index) => ({ option, index, ...optionAvailability(scenario, option, state) }))
    .filter(({ option, available }) => available || !option.conditions?.hideIfLocked);
}

function applyDelta(scenario, resources, code, delta, marqueurs) {
  const def = resourceDef(scenario, code);
  if (!def) return resources;
  let d = delta;
  // Mécanique nommée : la dette de confiance (M1-C, Maroc) réduit de moitié les gains de confiance.
  if (code === 'CONF' && d > 0 && marqueurs.includes('dette_confiance')) {
    d = Math.round(d / 2);
  }
  let next = clamp((resources[code] ?? 0) + d, def.min, def.max);
  // Mécanique nommée : la promesse brisée (M5-C, Maroc) plafonne la confiance à 50.
  if (code === 'CONF' && marqueurs.includes('promesse_brisee')) {
    next = Math.min(next, 50);
  }
  return { ...resources, [code]: next };
}

// Applique un choix : retourne le nouvel état partiel (resources, marqueurs, recurringEffects,
// pendingActEnd, competencesGain) sans muter l'état d'entrée.
export function applyChoice(scenario, node, option, state) {
  let resources = { ...state.resources };
  let marqueurs = [...state.marqueurs];
  let pendingActEnd = [...state.pendingActEnd];
  let recurringEffects = [...state.recurringEffects];

  for (const effet of option.effets || []) {
    if (effet.quand === 'finActe') {
      pendingActEnd.push({ ressource: effet.ressource, delta: effet.delta });
      continue;
    }
    resources = applyDelta(scenario, resources, effet.ressource, effet.delta, marqueurs);
    if (effet.reduitSi && marqueurs.includes(effet.reduitSi.marqueur)) {
      // Coût réduit (co-financement) — appliqué comme un bonus compensatoire immédiat.
      resources = applyDelta(scenario, resources, effet.ressource, effet.reduitSi.delta, marqueurs);
    }
  }

  // Tirage aléatoire narratif : n'affecte JAMAIS le score de compétence (règle d'or 5.2),
  // uniquement le récit et éventuellement des ressources marquées comme incertaines.
  let tirageResultat = null;
  if (option.tirage) {
    const reussi = Math.random() < option.tirage.proba;
    tirageResultat = reussi ? 'reussi' : 'echoue';
    const suiteEffets = reussi ? option.tirage.siReussi : option.tirage.siEchoue;
    for (const effet of suiteEffets || []) {
      resources = applyDelta(scenario, resources, effet.ressource, effet.delta, marqueurs);
    }
  }

  for (const m of option.marqueurs || []) {
    if (!marqueurs.includes(m)) marqueurs.push(m);
  }

  if (option.recurrent) {
    recurringEffects.push({
      ressource: option.recurrent.ressource,
      delta: option.recurrent.delta,
      delaiRestant: option.recurrent.delai || 0,
    });
  }

  return { resources, marqueurs, pendingActEnd, recurringEffects, tirageResultat };
}

// Fait avancer les effets récurrents (fuites réparées, aquifère fossile...) d'un cran :
// appelé à chaque résolution de nœud suivante.
export function tickRecurring(scenario, resources, recurringEffects) {
  let nextResources = { ...resources };
  const next = recurringEffects.map((eff) => {
    if (eff.delaiRestant > 0) {
      return { ...eff, delaiRestant: eff.delaiRestant - 1 };
    }
    nextResources = applyDelta(scenario, nextResources, eff.ressource, eff.delta, []);
    return eff;
  });
  return { resources: nextResources, recurringEffects: next };
}

// Applique les effets différés programmés pour la fin de l'acte (promesses non tenues, etc.)
export function applyPendingActEnd(scenario, resources, pendingActEnd, marqueurs) {
  let next = { ...resources };
  for (const effet of pendingActEnd) {
    next = applyDelta(scenario, next, effet.ressource, effet.delta, marqueurs);
  }
  return next;
}

export function checkDefeat(scenario, resources) {
  for (const regle of scenario.defaite || []) {
    const v = resources[regle.ressource];
    if (regle.op === '<=' && v <= regle.valeur) return regle.texte;
    if (regle.op === '<' && v < regle.valeur) return regle.texte;
  }
  return null;
}
