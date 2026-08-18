/**
 * Script d'evaluation reel — mesure precision@k sur le VRAI corpus ingere
 * (data/knowledge-base/), pas sur le corpus jouet de 25 passages ecrit a la
 * main qui a servi aux tests comparatifs initiaux (cf.
 * YKF2026_Kit_Test_Technique.xlsx). C'etait la derniere lacune identifiee a
 * l'audit final de ce projet : l'evaluation avait ete faite, mais jamais sur
 * les donnees reellement utilisees en production.
 *
 * A executer apres npm run ingest :
 *   npx tsx scripts/evaluate.ts
 *
 * Les questions ci-dessous sont construites a partir de faits REELLEMENT
 * presents dans les documents de data/knowledge-base/ (pas inventees) —
 * chacune reference le document source dont elle est tiree, pour tracabilite.
 */
import 'dotenv/config'
import { embedText } from '../lib/ai/clients/embeddings'
import { searchForumDocuments } from '../lib/ai/clients/vectorstore'

interface EvalQuestion {
  question: string
  /** Prefixe attendu dans l'identifiant du chunk source (ex: id_document du
   * frontmatter) — on verifie que le bon DOCUMENT remonte, pas un chunk exact,
   * car le decoupage peut varier legerement d'une execution a l'autre. */
  expectedDocumentId: string
}

const EVAL_QUESTIONS: EvalQuestion[] = [
  { question: "Quel est le taux de chômage des jeunes dans le monde en 2025 ?", expectedDocumentId: 'YKF26-THM-003' },
  { question: 'Combien de jeunes sont en situation de NEET selon l\'OIT ?', expectedDocumentId: 'YKF26-THM-003' },
  { question: "Quel pourcentage du PIB marocain représente l'économie sociale et solidaire ?", expectedDocumentId: 'YKF26-THM-015' },
  { question: "Qu'est-ce que le concept de polycrisis selon Homer-Dixon ?", expectedDocumentId: 'YKF26-THM-001' },
  { question: 'Combien de conflits actifs y a-t-il actuellement selon l\'UNDP ?', expectedDocumentId: 'YKF26-THM-011' },
  { question: 'Quelle est la formation de Nizar Baraka ?', expectedDocumentId: 'YKF26-BIO-NB' },
  { question: 'Quel diplôme a obtenu Fatim-Zahra Ammor ?', expectedDocumentId: 'YKF26-BIO-FA' },
  { question: "Quels facteurs de réussite l'ICESCO cite-t-elle pour ses cinq dernières années ?", expectedDocumentId: 'YKF26-ORG-ICESCO-STRAT' },
]

async function main() {
  console.log(`Evaluation sur ${EVAL_QUESTIONS.length} questions reelles, corpus reellement ingere.\n`)

  let hits = 0
  const details: { question: string; expected: string; found: string[]; ok: boolean }[] = []

  for (const { question, expectedDocumentId } of EVAL_QUESTIONS) {
    const queryVector = await embedText(question)
    const results = await searchForumDocuments({ queryVector, limit: 3 })
    const foundDocIds = results.map((r) => r.payload.passageId.split('-chunk')[0])
    const ok = foundDocIds.includes(expectedDocumentId)

    hits += ok ? 1 : 0
    details.push({ question, expected: expectedDocumentId, found: foundDocIds, ok })

    console.log(`${ok ? 'OK  ' : 'RATE'} ${question}`)
    console.log(`      attendu: ${expectedDocumentId} | trouve: ${foundDocIds.join(', ') || '(rien)'}`)
  }

  const precision = hits / EVAL_QUESTIONS.length
  console.log(`\nPrecision@3 sur le corpus reel : ${(precision * 100).toFixed(0)}% (${hits}/${EVAL_QUESTIONS.length})`)

  if (precision < 0.7) {
    console.warn(
      '\nATTENTION : precision sous 70% sur le corpus reel — a examiner avant de considerer le RAG fiable en production.',
    )
  }
}

main().catch((error) => {
  console.error("Erreur fatale du script d'evaluation :", error)
  process.exit(1)
})
