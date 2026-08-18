// Paliers de niveau du Passeport — remplace le calcul aujourd'hui absent (prisma/seed.ts se
// contente de poser des valeurs figées). Recalculé à chaque octroi d'XP par awardXp().
interface LevelTier {
  level: number
  levelTitle: string
  minXp: number
}

const LEVELS: LevelTier[] = [
  { level: 1, levelTitle: 'Newcomer', minXp: 0 },
  { level: 2, levelTitle: 'Engaged Delegate', minXp: 300 },
  { level: 3, levelTitle: 'Active Contributor', minXp: 800 },
  { level: 4, levelTitle: 'Resilience Builder', minXp: 1500 },
  { level: 5, levelTitle: 'Forum Champion', minXp: 2500 },
  { level: 6, levelTitle: 'ICESCO Ambassador', minXp: 4000 },
]

export function computeLevel(xp: number): { level: number; levelTitle: string; xpMax: number } {
  let current = LEVELS[0]
  let next: LevelTier | undefined
  for (const tier of LEVELS) {
    if (xp >= tier.minXp) current = tier
  }
  next = LEVELS.find((tier) => tier.minXp > current.minXp)
  return { level: current.level, levelTitle: current.levelTitle, xpMax: next ? next.minXp : current.minXp + 1000 }
}
