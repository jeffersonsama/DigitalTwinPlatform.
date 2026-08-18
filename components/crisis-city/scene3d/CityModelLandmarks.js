// Correspondance entre les lieux de dialogue (LANDMARKS, cf. CityGenerator.js) et les nœuds
// nommés de la maquette maquette-ville.glb. La maquette est une ville générique (pas
// spécifique Maroc/Égypte) : seul "hopital" a un équivalent direct, le reste est un
// rapprochement sémantique le plus proche (ex. "radio" -> le clocher, seule tour fine
// disponible).
//
// Depuis le Doc n°6 (pivot 2.0), Al-Wasl est UNE ville : les 14 lieux des deux anciens
// scénarios coexistent tous sur la même carte en permanence (aplati, plus de nesting par pays —
// c'est `activeLieux`/`doneLieux`, dérivés du module en cours dans App.jsx, qui décident lesquels
// sont cliquables maintenant). CONSÉQUENCE IMPORTANTE : deux lieux ne peuvent plus jamais
// partager le même nœud de maquette, même si un seul est "actif" à la fois — leurs hitbox
// coexistent toujours physiquement, et un raycast sur une position partagée résout vers un lieu
// arbitraire (bug vérifié : clic sur centre_operationnel résolvant en cellule_crise). D'où les
// nœuds distincts choisis ci-dessous pour `centre_operationnel` et `delta_agricole`, qui
// reprenaient par erreur (spec par-pays d'origine, jamais testée en coexistence) le même nœud que
// `cellule_crise`/`palmeraie`.
//
// Pour les noms dupliqués dans la maquette (ex. 3 "batiment_public" distincts), THREE.GLTFLoader
// désambiguïse automatiquement en suffixant "_1", "_2"... à la 2e, 3e occurrence — d'où les noms
// ci-dessous parfois suffixés, pour ne pas faire pointer deux lieux différents sur le même bâtiment.
export const LANDMARK_NODES = {
  agence_bassin: 'batiment_public',
  palmeraie: 'etang_du_parc',
  radio: 'clocher',
  cellule_crise: 'place_centrale',
  parvis_commune: 'place_du_marche',
  bureau_coordinateur: 'rectorat',
  hopital: 'hopital',
  conseil_communal: 'batiment_public_1',
  centre_operationnel: 'promenade',
  ezbet: 'ponton',
  digue_est: 'place_de_la_mer',
  ecole_refuge: 'ecole_de_la_plage',
  delta_agricole: 'halle_commerciale',
  conseil_gouvernorat: 'batiment_public_2',
  // Module CANICULE (Doc n°6 §4.3) : 'tour' est un gratte-ciel générique de la maquette, répété
  // ~110 fois en remplissage du centre-ville — jamais utilisé comme repère jusqu'ici. Zéro
  // production 3D nécessaire pour ce nouveau lieu.
  centre_moderne: 'tour',
};
