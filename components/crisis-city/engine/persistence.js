// Persistance de la progression XP/grades/badges — un enregistrement par compte
// (prisma.crisisCityProfile, voir lib/actions/crisis-city.ts), plus du localStorage anonyme par
// appareil : chaque joueur a sa propre carrière, plutôt qu'un profil partagé par PC.
//
// `loadProgress`/`saveProgress` sont désormais asynchrones (appels réseau vers les server
// actions) mais gardent la même interface publique que la version localStorage d'origine — c'est
// exactement la bascule que ce module annonçait déjà : « la bascule vers un backend remplacera ce
// module sans changer son interface publique ».
import { getCrisisCityProgress, saveCrisisCityProgress } from '@/lib/actions/crisis-city';

export function emptyProgress() {
  return {
    xpEvents: {}, // clé unique -> montant XP (la somme des valeurs = XP total)
    // Les cartes de savoir débloquées au moins une fois se retrouvent nativement dans les clés
    // xpEvents ("CARTE_DEBLOQUEE:<id>") — pas besoin d'une liste séparée à faire vivre en double.
    badgesEarned: {}, // badgeId -> { earnedAt, variant }
    scenarios: {}, // scenarioId -> { firstCompletedAt, lastPlayedAt, epilogueViews, openQuestionDone, lastHistoryKey }
  };
}

export async function loadProgress() {
  try {
    const progress = await getCrisisCityProgress();
    return { ...emptyProgress(), ...progress };
  } catch (e) {
    // Hors-ligne ou session expirée : on continue avec un profil vide plutôt que de bloquer le
    // jeu ; la prochaine sauvegarde réussie repartira du bon état côté serveur.
    return emptyProgress();
  }
}

export async function saveProgress(progress) {
  try {
    await saveCrisisCityProgress(progress);
  } catch (e) {
    // Échec réseau ponctuel : pas de filet local ici (le compte fait foi) — la sauvegarde
    // suivante (prochain événement XP) réessaiera avec l'état à jour.
  }
}

export function totalXp(progress) {
  return Object.values(progress.xpEvents).reduce((a, b) => a + b, 0);
}

export function unlockedCardIdsEver(progress) {
  return Object.keys(progress.xpEvents)
    .filter((k) => k.startsWith('CARTE_DEBLOQUEE:'))
    .map((k) => k.split(':')[1]);
}
