// Réactions de mise en scène — Document n°4, section 6.2 : chaque option gagne
// reaction:{expr, ligne, fx}. Gardé séparé de data/scenarios.js à dessein : ce fichier est pur
// habillage de présentation, il ne touche à aucune mécanique de jeu (effets, compétences,
// scoring restent exclusivement dans scenarios.js).
//
// expr ∈ EXPRESSIONS (data/characters.js) — état du portrait pendant 1,5 s avant le flash.
// fx   ∈ { 'neons', 'pluie', 'gyrophare', 'lumiere', null } — effet de couche du décor (4.3/6.2).
import { NODE_RECOGNITION } from './memoire.js';

export const REACTIONS = {
  // --- MAROC ---------------------------------------------------------------
  M1: [
    { expr: 'soulage', ligne: "Enfin quelqu'un qui regarde les chiffres avant de parler.", fx: null },
    { expr: 'ferme', ligne: "Vous décrétez. Moi je vous donnais les moyens de choisir.", fx: 'lumiere' },
    { expr: 'preoccupe', ligne: "« Sous contrôle »... vous n'avez pas vu les mêmes courbes que moi.", fx: null },
  ],
  M2: [
    { expr: 'ferme', ligne: "Vous envoyez la gendarmerie sur des gens qui nourrissent la ville.", fx: null },
    { expr: 'soulage', ligne: "Un pacte, pas un procès. On peut travailler comme ça.", fx: null },
    { expr: 'preoccupe', ligne: "Une saison de plus... vous repoussez, vous ne réglez pas.", fx: null },
  ],
  M3: [
    { expr: 'soulage', ligne: "Des chiffres publics valent mieux qu'un démenti. Merci.", fx: null },
    { expr: 'ferme', ligne: "Un communiqué sec, et la rumeur repart de plus belle.", fx: null },
    { expr: 'preoccupe', ligne: "Le silence de la commune va faire le tour du souk avant ce soir.", fx: null },
  ],
  M4: [
    { expr: 'soulage', ligne: "Un calendrier affiché, identique pour tous — ça, ça s'explique.", fx: null },
    { expr: 'ferme', ligne: "Le centre respire, la périphérie étouffe. Ça se voit, ça.", fx: 'lumiere' },
    { expr: 'soulage', ligne: "Réparer au lieu de couper — enfin une bonne nouvelle sur cette carte.", fx: null },
  ],
  M5: [
    { expr: 'soulage', ligne: "Un siège, un mandat. On reste, et on travaille.", fx: null },
    { expr: 'ferme', ligne: "Vous dispersez des jeunes qui demandaient juste à être reçus.", fx: null },
    { expr: 'preoccupe', ligne: "« D'ici un mois »... vous venez de signer une dette que vous ne pourrez pas payer.", fx: null },
  ],
  M6: [
    { expr: 'soulage', ligne: "Huit semaines, prix affiché. C'est un outil, pas une soumission.", fx: null },
    { expr: 'preoccupe', ligne: "Vingt-cinq ans sur une nappe fossile... vous venez d'hypothéquer la suite.", fx: 'lumiere' },
    { expr: 'ferme', ligne: "Le principe, oui. Mais qui va boire, ce soir, dans les quartiers oubliés ?", fx: null },
  ],
  M7: [
    { expr: 'soulage', ligne: "L'hôpital d'abord, et vous avez pris le temps d'appeler. On respire.", fx: null },
    { expr: 'ferme', ligne: "Deux citernes pour trois urgences partagées en trois — personne n'est sauvé.", fx: 'neons' },
    { expr: 'ferme', ligne: "Vous avez laissé le lait passer devant les patients. Notez-le.", fx: 'neons' },
  ],
  M8: [
    { expr: 'soulage', ligne: "Réutiliser, économiser, faire payer le superflu — enfin un plan qui tient.", fx: null },
    { expr: 'preoccupe', ligne: "Beau ruban à couper. La nappe, elle, ne remonte pas.", fx: null },
    { expr: 'preoccupe', ligne: "Sensibiliser, oui — mais le réseau perd 35 %, pas 10.", fx: null },
  ],
  M9: [
    { expr: 'soulage', ligne: "Un comité, une revue chaque année — ça, ça va rester.", fx: null },
    { expr: 'ferme', ligne: "Un rapport dans un tiroir n'a jamais protégé personne.", fx: null },
    { expr: 'ferme', ligne: "« Les gens se souviendront »... non. Ils partiront, et on recommencera à zéro.", fx: null },
  ],

  // --- ÉGYPTE ----------------------------------------------------------------
  E1: [
    { expr: 'soulage', ligne: "Une alerte qui explique le pourcentage plutôt que de le cacher — ça, ça marche.", fx: null },
    { expr: 'ferme', ligne: "Attendre 36 h, c'est payer tout au prix fort après.", fx: null },
    { expr: 'preoccupe', ligne: "Toute la ville dehors pour dix-huit mille personnes exposées... on a tout dispersé.", fx: null },
  ],
  E2: [
    { expr: 'soulage', ligne: "Nos propres gardiens, notre propre navette. Là, on part tranquilles.", fx: null },
    { expr: 'ferme', ligne: "Vous nous faites partir de force — la moitié du quartier va se cacher.", fx: null },
    { expr: 'preoccupe', ligne: "Respecter notre refus, oui. Mais qui viendra nous chercher cette nuit ?", fx: null },
  ],
  E3: [
    { expr: 'ferme', ligne: "Le secteur Est tient. Le port s'en sortira avec des pompes, pas avec des vies.", fx: null },
    { expr: 'preoccupe', ligne: "Vous protégez les entrepôts. Ezbet, lui, prend la mer de plein fouet.", fx: 'pluie' },
    { expr: 'ferme', ligne: "Je vous l'ai dit en français et en arabe : bricoler les trois, c'est perdre les trois.", fx: null },
  ],
  E4: [
    { expr: 'soulage', ligne: "Le bus, la station, et les pêcheurs pour Ezbet — chacun sa mission, personne d'oublié.", fx: null },
    { expr: 'ferme', ligne: "Deux équipes sur une image, et l'hôpital s'inonde derrière nous.", fx: 'gyrophare' },
    { expr: 'preoccupe', ligne: "Le calcul froid, très bien — mais le bus, on l'a laissé filmer sa propre dérive.", fx: 'pluie' },
  ],
  E5: [
    { expr: 'soulage', ligne: "Un mandat clair, et cent vingt bras de plus. Le refuge respire enfin.", fx: null },
    { expr: 'ferme', ligne: "Vous nous renvoyez pour un badge, pendant que le gymnase déborde.", fx: null },
    { expr: 'preoccupe', ligne: "Deux toits, aucun registre commun — on va chercher du monde toute la nuit.", fx: null },
  ],
  E6: [
    { expr: 'soulage', ligne: "La vanne fermée, filmée par les bons messagers — la rumeur n'a pas tenu une heure.", fx: null },
    { expr: 'ferme', ligne: "Vous coupez le réseau, et la rumeur devient une certitude.", fx: null },
    { expr: 'preoccupe', ligne: "« On gère les vies d'abord »... la rumeur vient d'en devenir une, de vie à gérer.", fx: null },
  ],
  E7: [
    { expr: 'soulage', ligne: "Du sel, on ne revient pas — mais on peut vivre avec, autrement.", fx: null },
    { expr: 'preoccupe', ligne: "L'indemnité paiera surtout le billet pour Le Caire.", fx: null },
    { expr: 'ferme', ligne: "« Pas votre mandat »... et pendant ce temps, mes enfants font leurs valises.", fx: null },
  ],
  E8: [
    { expr: 'soulage', ligne: "Des dunes, des roselières, une règle de zonage — ça coûte moins cher qu'un ruban.", fx: null },
    { expr: 'preoccupe', ligne: "Une digue somptueuse. Et derrière, on recommence déjà à construire.", fx: null },
    { expr: 'soulage', ligne: "Vous nous suivez jusque-là. La confiance, ça se rembourse, alors.", fx: null },
  ],
  E9: [
    { expr: 'soulage', ligne: "Sirènes, exercice, statut pour les volontaires — la prochaine nuit sera plus courte.", fx: null },
    { expr: 'preoccupe', ligne: "Une sirène sans un voisin pour aider derrière — ça avertit, ça ne sauve qu'à moitié.", fx: null },
    { expr: 'ferme', ligne: "« On verra l'an prochain »... la mer, elle, ne prend pas de rendez-vous.", fx: null },
  ],

  // --- CANICULE (module, Doc n°6 §4.3) -----------------------------------------
  N1: [
    { expr: 'soulage', ligne: "Coûteux, désorganisant, et exactement ce qu'il fallait faire aujourd'hui plutôt que demain.", fx: null },
    { expr: 'preoccupe', ligne: "Attendre la certitude, c'est attendre que la fenêtre pour agir à bas coût se referme.", fx: null },
    { expr: 'ferme', ligne: "« Vague estivale classique »... vous venez de désarmer les gens face à une vraie menace.", fx: 'lumiere' },
  ],
  N2: [
    { expr: 'soulage', ligne: "Anticiper coûte cher, mais jamais autant que de compter les lits qui manquent.", fx: null },
    { expr: 'ferme', ligne: "Un budget refusé pendant une alerte sanitaire, ça ne se lit pas comme de la rigueur.", fx: 'neons' },
    { expr: 'soulage', ligne: "Un compromis raisonnable — tant que la vague ne dure pas trop longtemps.", fx: null },
  ],
  N3: [
    { expr: 'soulage', ligne: "Cette semaine, pour une fois, le quartier qu'on oublie d'habitude passe en premier.", fx: null },
    { expr: 'ferme', ligne: "« Chacun chez soi climatisé »... vous venez de décider qui, dans cette ville, ne compte pas.", fx: null },
    { expr: 'preoccupe', ligne: "De l'eau en bouteille, c'est un geste. Ce n'est pas une protection.", fx: null },
  ],
  N4: [
    { expr: 'soulage', ligne: "Un calendrier public, identique pour tous — ça s'explique, même un soir de coupure.", fx: null },
    { expr: 'ferme', ligne: "Le centre garde la lumière, la périphérie l'obscurité. Tout le monde compare son quartier ce soir.", fx: 'lumiere' },
    { expr: 'preoccupe', ligne: "Laisser le réseau décider à votre place, avec l'hôpital sur la table du hasard...", fx: 'neons' },
  ],
  N5: [
    { expr: 'soulage', ligne: "Le calendrier prend du retard. Personne ne s'effondre ce soir pour le rattraper.", fx: null },
    { expr: 'soulage', ligne: "Un compromis opérationnel — la « nuit fraîche » n'existe plus vraiment, mais on encadre.", fx: null },
    { expr: 'ferme', ligne: "Le calendrier de livraison contre des corps en surchauffe. Notez lequel vous avez choisi.", fx: null },
  ],
  N6: [
    { expr: 'soulage', ligne: "Des chiffres publics, tout de suite — la rumeur meurt de preuves, pas d'autorité.", fx: null },
    { expr: 'ferme', ligne: "Un démenti sans preuve, pour qui doute déjà, ça ressemble à un aveu.", fx: null },
    { expr: 'preoccupe', ligne: "Le silence a un coût qui se mesure en gens qui évitent l'eau et se déshydratent.", fx: null },
  ],
  N7: [
    { expr: 'soulage', ligne: "Personne ne vous remerciera cet été. Dans cinq ans, tout le monde le fera.", fx: null },
    { expr: 'preoccupe', ligne: "De la fraîcheur pour qui franchit ces portes — et une charge de plus pour tous les autres.", fx: null },
    { expr: 'preoccupe', ligne: "Diviser un budget déjà insuffisant en deux ne satisfait personne pleinement, mais ne tranche rien non plus.", fx: null },
  ],
  N8: [
    { expr: 'soulage', ligne: "Un mandat réel, pas seulement de la reconnaissance verbale — ça change tout sur le terrain.", fx: null },
    { expr: 'preoccupe', ligne: "Un registre sans les moyens de le tenir à jour devient vite une liste qu'on consulte trop tard.", fx: null },
    { expr: 'ferme', ligne: "Les morts invisibles sont d'abord des gens que personne n'avait la charge officielle de chercher.", fx: null },
  ],
  N9: [
    { expr: 'soulage', ligne: "Un comité, une revue chaque année — ça, ça va rester après vous.", fx: null },
    { expr: 'ferme', ligne: "Un rapport dans un tiroir n'a jamais protégé personne de la canicule suivante.", fx: null },
    { expr: 'ferme', ligne: "« On verra l'an prochain »... le dôme, lui, ne prend pas de rendez-vous non plus.", fx: null },
  ],
};

// Expression d'entrée par nœud (3.3 : par défaut "préoccupé" — quelques nœuds de clôture
// s'ouvrent plus calmes).
export const NODE_ENTREE = {
  M9: 'neutre', E9: 'neutre', N9: 'neutre',
};

export function entreeExpr(nodeId) {
  return NODE_ENTREE[nodeId] || 'preoccupe';
}

// Mémoire inter-modules (Doc n°6 §5.3) : si un marqueur hérité d'un module précédent (cf.
// gameReducer.js SELECT_COUNTRY) correspond à une reconnaissance connue pour ce nœud
// (data/memoire.js NODE_RECOGNITION), elle prime sur l'entrée par défaut — la ville se souvient
// avant de suivre son script habituel.
export function resolveEntree(nodeId, marqueurs) {
  const recognitions = NODE_RECOGNITION[nodeId];
  const match = recognitions?.find((r) => marqueurs?.includes(r.marqueur));
  if (match) return { expr: match.expr, ligne: match.ligne };
  return { expr: entreeExpr(nodeId), ligne: null };
}

// Personnage principal d'un nœud (le PNJ qui reçoit le joueur) — data/characters.js.
// M6 n'a volontairement pas d'entrée : le représentant d'Aqua Atlas ne fait pas partie du
// casting de 12 personnages nommés (3.2) — repli silhouette générique assumé (règle 1.3).
// M8 : réassigné de 'gouverneur' à 'mona' (Doc n°6, casting fusionné §5.2 — "Le Gouverneur" ne
// fait pas partie des 10 figures récurrentes d'Al-Wasl ; LA POLITIQUE porte l'arbitrage sur un
// plan de relèvement communal, cohérent avec son rôle transverse).
// N1-N9 (module Canicule, Doc n°6 §4.3) : Yousra ouvre (N1, météo-santé) et ferme (N9, boucle
// institutionnelle) comme elle le fait déjà M1/M4/M7 côté Sécheresse ; Salma sur N8 est nommée
// explicitement par le document ("brigades de visite (Salma/le personnage jeunesse)").
export const NODE_PERSONNAGE = {
  M1: 'yousra', M2: 'brahim', M3: 'leila', M4: 'yousra', M5: 'salma',
  M7: 'yousra', M8: 'mona', M9: 'salma',
  E1: 'tarek', E2: 'khaled', E3: 'karim', E4: 'tarek', E5: 'nour',
  E6: 'nour', E7: 'fatma', E8: 'mona', E9: 'tarek',
  N1: 'yousra', N2: 'tarek', N3: 'nour', N4: 'karim', N5: 'tarek',
  N6: 'leila', N7: 'mona', N8: 'salma', N9: 'yousra',
};
