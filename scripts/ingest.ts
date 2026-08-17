/**
 * Script d'ingestion — lit les documents de data/knowledge-base/, les decoupe,
 * les tague avec les metadonnees du schema valide, calcule leurs embeddings,
 * et les indexe dans Qdrant.
 *
 * C'est la piece qui manquait completement au pipeline RAG avant ce fichier
 * (voir l'audit dans la conversation de ce projet). A executer avec :
 *
 *   npx tsx scripts/ingest.ts
 *
 * Necessite GEMINI_API_KEY, QDRANT_URL, QDRANT_API_KEY dans .env — ce
 * script echoue explicitement si l'une d'elles manque, plutot que d'ingerer
 * partiellement en silence.
 */
import 'dotenv/config'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import * as yaml from 'js-yaml'
import { parseDocument, chunkText, chunkIdToQdrantPointId } from '../lib/ai/ingestion/chunking'
import { embedText } from '../lib/ai/clients/embeddings'
import { upsertForumChunk, createCollectionIfNeeded, createPayloadIndexIfNeeded, type ForumChunkPayload } from '../lib/ai/clients/vectorstore'

const KB_DIR = join(process.cwd(), 'data', 'knowledge-base')

async function main() {
  const files = readdirSync(KB_DIR).filter((f) => f.endsWith('.md'))

  if (files.length === 0) {
    console.log(`Aucun document trouve dans ${KB_DIR} — rien a ingerer.`)
    return
  }

  console.log(`${files.length} document(s) trouve(s). Preparation de la collection Qdrant...`)
  // La collection elle-meme doit exister AVANT toute creation d'index ou tout
  // envoi de point — sans quoi Qdrant renvoie "Collection ... doesn't exist"
  // des le premier chunk (erreur reelle rencontree lors du premier test).
  await createCollectionIfNeeded()
  // Les champs sur lesquels on filtre en recherche (searchForumDocuments) doivent
  // avoir un index explicite AVANT la premiere recherche filtree — sinon Qdrant
  // renvoie une erreur 400 (comportement verifie en test, voir vectorstore.ts).
  await createPayloadIndexIfNeeded('sessionAssociee')
  await createPayloadIndexIfNeeded('confidentialite')

  let totalChunks = 0
  let totalErrors = 0

  for (const file of files) {
    const raw = readFileSync(join(KB_DIR, file), 'utf-8')

    let parsed
    try {
      parsed = parseDocument(raw, (s) => yaml.load(s))
    } catch (error) {
      console.error(`  [ECHEC] ${file} — ${(error as Error).message}`)
      totalErrors++
      continue
    }

    const { frontmatter, body } = parsed

    if (frontmatter.confidentialite === 'restreint') {
      // Rappel du principe pose dans le cahier des charges (section 4.1) : les
      // donnees restreintes ne transitent jamais par le vector store partage.
      console.log(`  [IGNORE] ${file} — confidentialite 'restreint', ne doit pas etre indexe ici.`)
      continue
    }

    const chunks = chunkText(frontmatter.id_document, body)
    console.log(`  ${file} -> ${chunks.length} chunk(s)`)

    for (const chunk of chunks) {
      try {
        const vector = await embedText(chunk.text)
        const payload: ForumChunkPayload = {
          passageId: chunk.chunkId,
          texte: chunk.text,
          sessionAssociee: frontmatter.session_associee ?? 'transverse',
          confidentialite: frontmatter.confidentialite,
          langue: frontmatter.langue ?? 'fr',
          typeDocument: frontmatter.type,
        }
        await upsertForumChunk({ id: chunkIdToQdrantPointId(chunk.chunkId), vector, payload })
        totalChunks++
      } catch (error) {
        console.error(`    [ECHEC chunk ${chunk.chunkId}] ${(error as Error).message}`)
        totalErrors++
      }
    }
  }

  console.log(`\nTermine : ${totalChunks} chunk(s) indexe(s), ${totalErrors} erreur(s).`)
  if (totalErrors > 0) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error('Erreur fatale du script d\'ingestion :', error)
  process.exit(1)
})