import { describe, it, expect } from 'vitest'
import * as yaml from 'js-yaml'
import { chunkText, parseDocument, chunkIdToQdrantPointId } from '@/lib/ai/ingestion/chunking'

describe('chunkText', () => {
  it('regroupe plusieurs petits paragraphes en un seul chunk sous la taille cible', () => {
    const body = 'Premier paragraphe court.\n\nDeuxieme paragraphe court aussi.'
    const chunks = chunkText('DOC1', body)
    expect(chunks).toHaveLength(1)
    expect(chunks[0].text).toContain('Premier paragraphe')
    expect(chunks[0].text).toContain('Deuxieme paragraphe')
    expect(chunks[0].chunkId).toBe('DOC1-chunk1')
  })

  it('cree plusieurs chunks quand le texte total depasse largement la taille cible', () => {
    const longParagraph = 'Phrase repetee pour remplir. '.repeat(40) // ~1200 caracteres
    const body = [longParagraph, longParagraph, longParagraph].join('\n\n')
    const chunks = chunkText('DOC2', body)
    expect(chunks.length).toBeGreaterThan(1)
    // Chaque chunk doit rester un texte complet, jamais une phrase coupee au milieu
    for (const chunk of chunks) {
      expect(chunk.text.trim().length).toBeGreaterThan(0)
    }
  })

  it('fusionne un dernier paragraphe trop court avec le chunk precedent plutot que de le laisser isole', () => {
    const body = 'Un paragraphe de taille normale qui remplit une bonne partie du chunk cible ici.\n\nFin.'
    const chunks = chunkText('DOC3', body)
    expect(chunks).toHaveLength(1)
    expect(chunks[0].text).toContain('Fin.')
  })

  it('retourne un tableau vide pour un corps vide', () => {
    expect(chunkText('DOC4', '')).toEqual([])
  })

  it('genere des identifiants de chunk stables et sequentiels', () => {
    const body = Array.from({ length: 5 }, (_, i) => `Paragraphe numero ${i} avec un peu de contenu.`).join('\n\n')
    const chunks = chunkText('DOC5', body)
    chunks.forEach((chunk, i) => {
      expect(chunk.chunkId).toBe(`DOC5-chunk${i + 1}`)
    })
  })
})

describe('parseDocument', () => {
  const VALID_DOC = `---
id_document: YKF26-TEST-001
titre: Document de test
confidentialite: public
type: ressource_thematique
session_associee: session_1_awareness
---

Corps du document ici.

Deuxieme paragraphe.`

  it('extrait correctement le frontmatter et le corps', () => {
    const parsed = parseDocument(VALID_DOC, (s) => yaml.load(s))
    expect(parsed.frontmatter.id_document).toBe('YKF26-TEST-001')
    expect(parsed.frontmatter.confidentialite).toBe('public')
    expect(parsed.body).toContain('Corps du document ici.')
  })

  it("leve une erreur explicite si le frontmatter est absent (pas d'ingestion silencieuse d'un document mal forme)", () => {
    expect(() => parseDocument('Pas de frontmatter du tout.', (s) => yaml.load(s))).toThrow(/frontmatter valide/)
  })

  it('leve une erreur si un champ obligatoire manque (confidentialite)', () => {
    const invalid = `---\nid_document: X\ntype: test\n---\nCorps.`
    expect(() => parseDocument(invalid, (s) => yaml.load(s))).toThrow(/obligatoires/)
  })
})

describe('chunkIdToQdrantPointId', () => {
  it('produit toujours le meme entier pour le meme chunkId (idempotence de la re-ingestion)', () => {
    const id1 = chunkIdToQdrantPointId('YKF26-BIO-FA-chunk1')
    const id2 = chunkIdToQdrantPointId('YKF26-BIO-FA-chunk1')
    expect(id1).toBe(id2)
  })

  it('produit un entier different pour un chunkId different', () => {
    const id1 = chunkIdToQdrantPointId('YKF26-BIO-FA-chunk1')
    const id2 = chunkIdToQdrantPointId('YKF26-BIO-FA-chunk2')
    expect(id1).not.toBe(id2)
  })

  it('produit toujours un entier non negatif dans les limites securisees de JavaScript', () => {
    const id = chunkIdToQdrantPointId('YKF26-THM-001-chunk7')
    expect(Number.isInteger(id)).toBe(true)
    expect(id).toBeGreaterThanOrEqual(0)
    expect(id).toBeLessThanOrEqual(Number.MAX_SAFE_INTEGER)
  })
})
