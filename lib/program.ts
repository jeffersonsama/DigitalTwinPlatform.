export type SessionStatus = 'done' | 'live' | 'upcoming'

export function computeSessionStatus(startsAt: Date, endsAt: Date): SessionStatus {
  const now = Date.now()
  if (now < startsAt.getTime()) return 'upcoming'
  if (now > endsAt.getTime()) return 'done'
  return 'live'
}
