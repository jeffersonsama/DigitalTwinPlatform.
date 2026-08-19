// Barème centralisé du système XP/certifications (docs/xp-certification-system.md). Toute valeur
// touchée pour de l'équilibrage passe par ce fichier plutôt que d'être éparpillée dans les
// actions/heartbeat qui la consomment.

export const XP = {
  LOGIN_DAILY: 15,
  LOGIN_STREAK_BONUS: 10,
  LOGIN_STREAK_DAYS: 3,
  SHARE_INTENT: 5,
  SHARE_REFERRAL_BONUS: 20,
  CONNECTION_ACCEPTED: 10,
  CONNECTION_DAILY_CAP: 5,
  FIRST_MESSAGE_BONUS: 5,
  FIRST_MESSAGE_WINDOW_HOURS: 48,
  RESOURCE_READ: 10,
  RESOURCE_DIVERSITY_BONUS: 15,
  POSTER_PUBLISHED: 20,
  ATELIER_WORKSHOP: 60,
} as const

export const PRESENCE = {
  // Cadence attendue du heartbeat client (components/shell/presence-heartbeat.tsx) — les seuils
  // ci-dessous en dérivent, mais le serveur ne fait jamais confiance à l'intervalle déclaré par
  // le client : il recalcule l'écoulé réel entre deux battements (plafonné) à chaque appel.
  HEARTBEAT_INTERVAL_SECONDS: 60,
  MAX_ELAPSED_SECONDS_PER_TICK: 90,
  PANEL_SECONDS_PER_XP: 120, // 30 XP/h
  GENERAL_SECONDS_PER_XP: 360, // 10 XP/h
  GENERAL_DAILY_XP_CAP: 60,
  RESOURCE_READ_THRESHOLD_SECONDS: 90,
} as const

export const PANEL_ATTENDANCE_RATIO = 0.7
export const PARTICIPATION_THRESHOLD_RATIO = 0.75
export const COURSERA_XP_THRESHOLD = 1000
