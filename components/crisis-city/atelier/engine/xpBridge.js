// Passerelle Crisis City — Document n°5, section 1.2 : « chaque jeu terminé crédite 60 XP + un
// badge de session ; les 4 badges = badge Jour 1 complet ». Réutilise exactement la même carrière
// que le jeu principal (engine/persistence.js) — un seul profil de progression par compte.
// `loadProgress`/`saveProgress` sont asynchrones (server actions) : `awardAtelierCompletion`
// l'est donc aussi désormais — ses appelants (atelier/games/ParticipantS{1,2,3,4}.jsx) l'attendent.
import { loadProgress, saveProgress, totalXp } from '../../engine/persistence.js';
import { gradePourXp } from '../../engine/xp.js';

const ATELIER_BADGE_IDS = ['atelier_s1', 'atelier_s2', 'atelier_s3', 'atelier_s4'];

export async function awardAtelierCompletion(jeuId, badgeId) {
  const progress = await loadProgress();
  const xpKey = `ATELIER_${jeuId.toUpperCase()}_COMPLETE`;
  const alreadyDone = progress.xpEvents[xpKey] !== undefined;

  const before = totalXp(progress);
  if (!alreadyDone) {
    progress.xpEvents[xpKey] = 60;
  }
  progress.badgesEarned[badgeId] = progress.badgesEarned[badgeId] || { earnedAt: new Date().toISOString() };

  const allFour = ATELIER_BADGE_IDS.every((id) => progress.badgesEarned[id]);
  const jour1AlreadyEarned = !!progress.badgesEarned.jour1_complet;
  if (allFour && !jour1AlreadyEarned) {
    progress.badgesEarned.jour1_complet = { earnedAt: new Date().toISOString() };
  }

  await saveProgress(progress);
  const after = totalXp(progress);

  return {
    xpAwarded: alreadyDone ? 0 : 60,
    totalXp: after,
    grade: gradePourXp(after),
    leveledUp: gradePourXp(after).index > gradePourXp(before).index ? gradePourXp(after) : null,
    jour1Complet: allFour && !jour1AlreadyEarned,
  };
}
