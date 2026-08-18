import { describe, it, expect } from 'vitest'
import { extractNumericEntities, evaluateCacheHit } from '@/lib/ai/guardrails'

describe('extractNumericEntities', () => {
  it('extrait les chiffres ecrits en toutes lettres', () => {
    expect(extractNumericEntities('A quelle heure commence la Session 1 ?')).toEqual(new Set(['1']))
  })

  it('extrait les ordinaux francais en toutes lettres', () => {
    expect(extractNumericEntities('Quand demarre la premiere session ?')).toEqual(new Set(['1']))
  })

  it('extrait les ordinaux anglais', () => {
    expect(extractNumericEntities('When does the second session start?')).toEqual(new Set(['2']))
  })

  it('extrait les ordinaux arabes', () => {
    expect(extractNumericEntities('متى تبدأ الجلسة الثالثة؟')).toEqual(new Set(['3']))
  })

  it("retourne un ensemble vide quand aucun chiffre n'est present", () => {
    expect(extractNumericEntities('Qui est le secretaire general des Nations Unies ?')).toEqual(new Set())
  })

  it('cumule plusieurs entites distinctes dans le meme texte', () => {
    expect(extractNumericEntities('Compare la Session 1 et la Session 2')).toEqual(new Set(['1', '2']))
  })
})

describe('evaluateCacheHit — cas reel mesure en test (Qwen3-Embedding-0.6B)', () => {
  const seuil = 0.75

  it('rejette une question DIFFERENTE meme avec une similarite elevee (0.788) — le cas Session 1 vs Session 2', () => {
    const result = evaluateCacheHit(
      'A quelle heure commence la Session 2 ?',
      'A quelle heure commence la Session 1 ?',
      0.788, // similarite mesuree en test — plus haute que certaines vraies reformulations
      seuil,
    )
    expect(result.entitiesMatch).toBe(false)
    expect(result.valid).toBe(false)
  })

  it('accepte une reformulation legitime avec les memes entites et une similarite suffisante', () => {
    const result = evaluateCacheHit(
      "C'est a quelle heure la session 1 du coup ?",
      'A quelle heure commence la Session 1 ?',
      0.856,
      seuil,
    )
    expect(result.entitiesMatch).toBe(true)
    expect(result.valid).toBe(true)
  })

  it('accepte une reformulation utilisant un ordinal plutot que le chiffre (apres normalisation)', () => {
    const result = evaluateCacheHit(
      'Quand demarre la premiere session ?',
      'A quelle heure commence la Session 1 ?',
      0.794,
      seuil,
    )
    expect(result.entitiesMatch).toBe(true)
    expect(result.valid).toBe(true)
  })

  it('rejette si la similarite est insuffisante meme avec les memes entites', () => {
    const result = evaluateCacheHit(
      'Session 1, ca parle de quoi exactement en detail ?',
      'A quelle heure commence la Session 1 ?',
      0.4, // question trop differente sur le fond malgre la meme session citee
      seuil,
    )
    expect(result.entitiesMatch).toBe(true)
    expect(result.valid).toBe(false)
  })
})
