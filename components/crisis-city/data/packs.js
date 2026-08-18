// Système de packs — Doc n°6 (pivot 2.0), §3 : un pack change les noms/couleurs affichés SANS
// jamais toucher les mécaniques (dilemmes, effets, textes de nœuds).
//
// `couleurs`/`figures`/`lieux` sont câblés dans le jeu (App.jsx, SceneStage.jsx, City2D.jsx).
// `ambiance`/`props`/`skybox`/`monument` (§3.2 du doc) sont de la MÉTADONNÉE, pas encore
// consommée par le jeu (pas d'infra musique dans src/audio/sfx.js, pas de pipeline de génération
// d'images ni d'asset 3D dans ce dépôt) — elles servent aujourd'hui à `resolvePromptSlots()`
// ci-dessous, qui alimente les gabarits de prompts à slots (chantier "gabarits", cf.
// Livre_prompts_2_gabarits.md). `monument: null` = repli "slot vide élégant" (la fontaine de la
// Grande Place, §8 du doc) tant qu'aucun monument-signature n'a été produit et validé.
//
// LOI 2 du doc : un pack représentant un pays réel ne se publie jamais sans relecteur natif.
// `demo` ci-dessous est donc explicitement FICTIF (noms, couleurs et ambiance inventés, aucune
// ressemblance recherchée avec un pays ICESCO) — il prouve seulement que le mécanisme
// fonctionne, ce n'est pas un pack pays livrable.
import { FIGURES } from './figures.js';
import { CHARACTERS } from './characters.js';
import { LANDMARKS } from '../scene3d/CityGenerator.js';
import { COUNTRY_FLAG_COLORS } from './countryFlags.js';
import { COUNTRIES } from '../atelier/data/countryGeo.js';

export const PACKS = {
  neutre: {
    id: 'neutre',
    nom: 'Ville neutre',
    couleurs: { accent: '#f2705c', accent2: '#2bb8de' }, // valeurs par défaut de index.css — statu quo
    figures: {},
    lieux: {},
    ambiance: { radio_boucle: null, sons_lointains: ['klaxons lointains', 'cloches d\'horloge'], script_enseignes: 'latin' },
    props: { taxi_couleur: 'ochre-red taxi', etals_variant: 'generic market stalls', plateau_the_variant: 'plain tea tray' },
    skybox: { silhouette: 'plaine' },
    monument: null, // repli "slot vide élégant" — la fontaine de la Grande Place, §8 du doc
  },
  demo: {
    id: 'demo',
    nom: 'Pack de démonstration',
    couleurs: { accent: '#7a4fc9', accent2: '#c98f4f' },
    figures: {
      scientifique: 'Dr. Lina Kova',
      doyen: 'Vieux Meno',
      jeune_leader: 'Sana Bréyel',
      journaliste: 'Dara Voss',
      ingenieur: 'ThéoAndrek',
      politique: 'Dr. Ilena Bosk',
      capitaine: 'Cap. Rian Oduya',
      volontaire: 'Meva Lindt',
      commercant: 'Oskar Feddin',
      agricultrice: 'Yara Somtel',
    },
    lieux: {
      hopital: 'Hôpital central',
      agence_bassin: "Agence de l'eau",
      conseil_communal: 'Maison commune',
      centre_operationnel: 'Centre de commandement',
      digue_est: 'Digue orientale',
    },
    ambiance: { radio_boucle: 'boucle synthétique fictive', sons_lointains: ['tramway lointain', 'mouettes'], script_enseignes: 'latin' },
    props: { taxi_couleur: 'violet-and-gold taxi', etals_variant: 'fictional bazaar stalls', plateau_the_variant: 'brass tray with mismatched cups' },
    skybox: { silhouette: 'delta' },
    monument: { id_glb: null, inspiration: 'tour-porte fictive, aucune inspiration patrimoniale réelle', budget_tris: 1500 },
  },
};

export const DEFAULT_PACK_ID = 'neutre';

// Nom affiché d'une figure (repli sur le personnage de base si le pack ne la couvre pas).
export function resolveFigureName(pack, figureId) {
  const override = pack?.figures?.[figureId];
  if (override) return override;
  const figure = FIGURES[figureId];
  return figure ? CHARACTERS[figure.characterId]?.nom : undefined;
}

// Label affiché d'un lieu (repli sur le label de base de LANDMARKS).
export function resolveLieuLabel(pack, lieuId) {
  const override = pack?.lieux?.[lieuId];
  if (override) return override;
  return LANDMARKS.find((l) => l.id === lieuId)?.label;
}

// Retrouve la figure dont le personnage PRINCIPAL (pas le second rôle) est `characterId` —
// utilisé pour savoir si le PNJ d'un nœud a un nom localisable par pack (cf. SceneStage.jsx).
export function figureForCharacter(characterId) {
  return Object.values(FIGURES).find((f) => f.characterId === characterId) || null;
}

// Valeurs des slots de prompt (Doc n°6 §6.2, Livre_prompts_2_gabarits.md) pour un pack donné —
// le pont entre les données de pack et les gabarits de prompts d'image. Repli sur des valeurs
// neutres si le pack ne renseigne pas un champ (`ambiance`/`props`/`skybox` sont optionnels,
// contrairement à `couleurs`/`figures`/`lieux` qui sont câblés dans le jeu).
export function resolvePromptSlots(pack) {
  const neutre = PACKS[DEFAULT_PACK_ID];
  const skybox = pack?.skybox || neutre.skybox;
  const props = pack?.props || neutre.props;
  const ambiance = pack?.ambiance || neutre.ambiance;
  const SKYBOX_LABELS = { plaine: 'flat plain horizon', montagne: 'dry mountain ridgeline', dune: 'dune line', delta: 'flat delta horizon' };
  return {
    SKYBOX_REF: SKYBOX_LABELS[skybox.silhouette] || SKYBOX_LABELS.plaine,
    TAXI_REF: props.taxi_couleur,
    COULEUR_CIVIQUE: (pack?.couleurs || neutre.couleurs).accent, // seul slot déjà branché au jeu réel
    // Toujours neutre ici : l'ambiance lumineuse réelle du jeu suit déjà la crise/le module
    // (CrisisFX, scene.background), jamais le pack — ce slot documente juste la valeur par
    // défaut à utiliser si un jour une vraie génération d'images par pack voit le jour.
    AMBIANCE_LUMIERE: 'warm neutral daylight',
    MONUMENT_SIG: pack?.monument?.inspiration || null, // null = slot vide élégant (fontaine neutre)
    ENSEIGNES_SCRIPT: ambiance.script_enseignes,
  };
}

// Pack construit automatiquement depuis le pays détecté par géolocalisation IP (cf.
// atelier/engine/geoip.js, réutilisé tel quel — App.jsx). Ne touche QUE la couleur civique
// (donnée factuelle et publique, le drapeau officiel) et le nom affiché de la ville — jamais la
// toponymie ni les prénoms des figures (`figures`/`lieux` vides), qui restent gated par la LOI 2
// (validation native obligatoire) tant qu'aucun vrai pack pays n'a été produit pour ce pays.
// Retourne `null` si le pays n'est pas couvert — repli silencieux sur le pack neutre.
export function resolveAutoPack(countryCode) {
  const couleurs = countryCode && COUNTRY_FLAG_COLORS[countryCode];
  if (!couleurs) return null;
  const nomPays = COUNTRIES[countryCode]?.name || countryCode;
  return {
    id: `auto-${countryCode}`,
    nom: `Al-Wasl · vue de ${nomPays}`,
    couleurs,
    figures: {},
    lieux: {},
  };
}
