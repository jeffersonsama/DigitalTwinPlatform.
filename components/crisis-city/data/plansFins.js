// Livre de prompts n°2 — plans d'approche, de seuil et de détail (Document n°4-quinquies).
// Les plans d'approche/seuil se déduisent directement de `lieu3d` (mêmes identifiants que
// LANDMARKS/LANDMARK_NODES) : pas de table de correspondance nécessaire, juste un gabarit de
// chemin. Seuls les plans de détail sont indexés par nœud, puisqu'un même lieu peut être visité
// par plusieurs nœuds (ex. centre_operationnel pour E1/E4/E6/E9) avec des détails différents.
const PLANS_BASE = '/assets/plans';

export function planApprochePath(lieu3d) {
  return `${PLANS_BASE}/plan_${lieu3d}_approche.webp`;
}

export function planSeuilPath(lieu3d) {
  return `${PLANS_BASE}/plan_${lieu3d}_seuil.webp`;
}

// NODE_DETAILS[nodeId] = [{ img, declencheur }, ...] — `declencheur` vaut `replique_<optionIndex>`
// (0-indexé, déclenché par la réaction au choix, cf. App.jsx `pendingOptionIndex`) ou tout autre
// identifiant que le réducteur de jeu viendrait à exposer plus tard (ex. une conséquence nommée).
// Vide pour l'instant — bonus explicitement facultatif (§Partie 3) : le jeu vit sans, à remplir
// nœud par nœud une fois les visuels livrés et les répliques exactes confirmées par l'auteur.
//
// Exemple donné par le document (à valider avant activation) :
// M7: [
//   { img: 'plan_hopital_detail_1', declencheur: 'replique_2' },
//   { img: 'plan_hopital_detail_2', declencheur: 'consequence_B' },
// ],
export const NODE_DETAILS = {};

export function planDetailPath(img) {
  return `${PLANS_BASE}/${img}.webp`;
}
