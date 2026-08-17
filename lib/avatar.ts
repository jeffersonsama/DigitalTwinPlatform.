// Delegate avatars — a fixed, curated set of illustrated avatars (Avataaars
// style, generated once via scripts/generate-avatars.mjs into public/avatars/)
// instead of plain text initials. `User.avatar` stores one of these ids;
// existing/seeded users without a choice get a deterministic default so the
// same person always sees the same avatar until they pick one themselves.
const AVATAR_COUNT = 30

export const AVATAR_IDS = Array.from({ length: AVATAR_COUNT }, (_, i) => String(i + 1).padStart(2, '0'))

export function avatarSrc(id: string): string {
  return `/avatars/avatar-${id}.svg`
}

function hash(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

/** Deterministic fallback so the same person always gets the same avatar
 * until they explicitly pick one via Edit Profile. */
export function defaultAvatarId(seed: string): string {
  return AVATAR_IDS[hash(seed) % AVATAR_IDS.length]
}

export function resolveAvatarId(user: { id: string; avatar?: string | null }): string {
  return user.avatar || defaultAvatarId(user.id)
}

export function resolveAvatar(user: { id: string; avatar?: string | null }): string {
  return avatarSrc(resolveAvatarId(user))
}
