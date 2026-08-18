/**
 * Decoupage (chunking) des documents en passages indexables.
 *
 * Etape du pipeline RAG qui manquait completement avant ce fichier — les
 * "25 passages" utilises dans les tests d'embeddings (cf.
 * YKF2026_Kit_Test_Technique.xlsx) etaient ecrits a la main, pas produits par
 * du code. Ici, le decoupage est reel et applique aux vrais documents de
 * data/knowledge-base/.
 *
 * Strategie retenue : decoupage par paragraphe, avec regroupement glouton
 * jusqu'a une taille cible — volontairement simple (pas de chevauchement
 * glissant token-par-token) car nos documents sources sont deja des syntheses
 * courtes et structurees, pas des textes bruts de plusieurs dizaines de pages.
 * A revisiter si des documents plus longs et moins structures sont ingeres
 * plus tard (concept notes completes, rapports PDF bruts).
 */

import { createHash } from 'node:crypto'
export interface DocumentFrontmatter {
  id_document: string
  titre: string
  source_responsable?: string
  lien_source?: string
  confidentialite: 'public' | 'usage_interne' | 'restreint'
  date_recuperation?: string
  type: string
  session_associee?: string
  langue?: string
}

export function chunkIdToQdrantPointId(chunkId: string): number {
  const hash = createHash('sha256').update(chunkId).digest()
  return hash.readUIntBE(0, 6)
}

export interface ParsedDocument {
  frontmatter: DocumentFrontmatter
  body: string
}

const TARGET_CHUNK_SIZE = 800 // caracteres, pas tokens — approximation suffisante a ce stade
const MIN_CHUNK_SIZE = 100 // evite de creer un chunk quasi-vide pour un dernier paragraphe court

export interface Chunk {
  /** Identifiant stable : id_document + index du chunk, pour un upsert idempotent. */
  chunkId: string
  text: string
}

/**
 * Regroupe les paragraphes d'un texte en chunks d'environ TARGET_CHUNK_SIZE
 * caracteres. Un paragraphe individuel plus grand que la cible devient son
 * propre chunk plutot que d'etre tronque (on ne coupe jamais une phrase au
 * milieu — mieux vaut un chunk un peu trop grand qu'une information coupee).
 */
export function chunkText(documentId: string, body: string): Chunk[] {
  const paragraphs = body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)

  const chunks: string[] = []
  let current = ''

  for (const paragraph of paragraphs) {
    if (current.length === 0) {
      current = paragraph
      continue
    }

    if (current.length + paragraph.length + 2 <= TARGET_CHUNK_SIZE) {
      current += '\n\n' + paragraph
    } else {
      chunks.push(current)
      current = paragraph
    }
  }

  if (current.length > 0) {
    // Evite un dernier chunk trop court en le fusionnant au precedent si possible.
    if (chunks.length > 0 && current.length < MIN_CHUNK_SIZE) {
      chunks[chunks.length - 1] += '\n\n' + current
    } else {
      chunks.push(current)
    }
  }

  return chunks.map((text, index) => ({
    chunkId: `${documentId}-chunk${index + 1}`,
    text,
  }))
}

/**
 * Parse un document au format frontmatter YAML + corps Markdown, exactement
 * le format des fichiers deja recuperes dans data/knowledge-base/.
 */
export function parseDocument(raw: string, yamlParser: (s: string) => unknown): ParsedDocument {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) {
    throw new Error("Document sans frontmatter valide (attendu : '---\\n...\\n---\\n<corps>').")
  }

  const [, frontmatterRaw, body] = match
  const frontmatter = yamlParser(frontmatterRaw) as DocumentFrontmatter

  if (!frontmatter.id_document || !frontmatter.confidentialite || !frontmatter.type) {
    throw new Error(
      `Frontmatter incomplet : id_document, confidentialite et type sont obligatoires. Recu : ${JSON.stringify(frontmatter)}`,
    )
  }

  return { frontmatter, body: body.trim() }
}
