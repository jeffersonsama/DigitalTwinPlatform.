import { randomBytes } from 'node:crypto'

// Alphabet sans O/0 ni I/1 pour éviter les confusions à la lecture/saisie manuelle du code.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 8

export function generateReferralCode(): string {
  const bytes = randomBytes(CODE_LENGTH)
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i++) code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length]
  return code
}
