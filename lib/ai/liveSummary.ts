/**
 * Pipeline de resume de session live — implementation du schema valide dans
 * docs/AI_ARCHITECTURE.md (section "Pipeline de la session live").
 *
 * Stockage du buffer : en memoire (Map par sessionId), comme pour le cache
 * semantique. A remplacer par un stockage partage (Redis, ou une table
 * Postgres dediee) avant une mise en production reelle avec plusieurs
 * instances serverless — une Map en memoire ne survit pas a un redemarrage
 * de fonction et n'est pas partagee entre instances paralleles.
 *
 * Consigne anti-invention (le point le plus important de ce fichier) : le
 * test de resume a montre que gpt-oss-120b et gpt-oss-20b ajoutent chacun des
 * decisions qui n'ont jamais ete prononcees dans le transcript reel — un
 * risque grave pour un compte-rendu de session officiel, car l'invention
 * passe inapercue. Le prompt ci-dessous l'interdit explicitement.
 */
import { aiConfig } from '@/lib/ai/config'
import { chatCompletion } from '@/lib/ai/clients/llm'

export interface TranscriptSegment {
  timestampMs: number
  text: string
}

interface SessionBuffer {
  segments: TranscriptSegment[]
  /** Horodatage du DERNIER SEGMENT traite par le cycle automatique (pas
   * l'heure "actuelle" au moment du traitement). Utiliser l'heure actuelle ici
   * creerait une collision possible si un segment est ajoute et le curseur
   * avance dans la meme milliseconde (constate en test) — le segment serait
   * alors retraite au cycle suivant. En ancrant le curseur sur le dernier
   * segment reellement traite, avec un filtre strictement superieur, ce risque
   * disparait quelle que soit la resolution de l'horloge. */
  lastProcessedSegmentAt: number
}

const buffers = new Map<string, SessionBuffer>()

function getOrCreateBuffer(sessionId: string): SessionBuffer {
  let buffer = buffers.get(sessionId)
  if (!buffer) {
    buffer = { segments: [], lastProcessedSegmentAt: 0 }
    buffers.set(sessionId, buffer)
  }
  return buffer
}

/** Ajoute un segment transcrit au buffer d'une session. A appeler par le
 * pipeline STT (Whisper/Groq ou autre candidat retenu) au fil de l'eau. */
export function appendTranscriptSegment(sessionId: string, text: string): void {
  const buffer = getOrCreateBuffer(sessionId)
  buffer.segments.push({ timestampMs: Date.now(), text })
}

/** Lecture du buffer depuis un instant donne (inclusif) — utilisee par le
 * resume a la demande, qui n'a pas besoin de suivre un curseur d'avancement. */
function readSince(sessionId: string, sinceMs: number): string {
  const buffer = getOrCreateBuffer(sessionId)
  return buffer.segments
    .filter((s) => s.timestampMs >= sinceMs)
    .map((s) => s.text)
    .join(' ')
}

/**
 * Fenetre glissante des X dernieres millisecondes — utilisee par la branche
 * "Resources en direct" (lib/ai/tools/liveResources.ts) pour faire remonter
 * les documents lies a ce qui vient d'etre dit, en continu. Contrairement au
 * cycle automatique, cette fonction ne fait AVANCER aucun curseur : chaque
 * appel relit simplement les X dernieres secondes depuis maintenant, donc
 * deux appels rapproches peuvent legitimement se chevaucher.
 */
export function getRecentTranscriptWindow(sessionId: string, windowMs: number): string {
  const buffer = getOrCreateBuffer(sessionId)
  const cutoff = Date.now() - windowMs
  return buffer.segments
    .filter((s) => s.timestampMs >= cutoff)
    .map((s) => s.text)
    .join(' ')
}

export interface SessionSummary {
  keyPoints: string[]
  decisions: string[]
  generatedAt: number
}

const SUMMARY_SYSTEM_PROMPT = `Tu resumes une session en direct d'un forum. A partir du transcript fourni, produis :
- "keyPoints" : les idees cles reellement exprimees par l'orateur (pas une liste generique de sujets abordes).
- "decisions" : les decisions ou recommandations concretes explicitement annoncees.

Regle stricte : n'inclus JAMAIS une decision, un chiffre ou une recommandation qui n'est pas litteralement present dans le transcript fourni. Si aucune decision n'a ete annoncee, retourne une liste vide plutot que d'en inventer une.

Reponds uniquement en JSON strict au format : {"keyPoints": ["..."], "decisions": ["..."]}`

async function generateSummaryFromText(transcript: string): Promise<SessionSummary> {
  if (!transcript.trim()) {
    return { keyPoints: [], decisions: [], generatedAt: Date.now() }
  }

  const result = await chatCompletion({
    model: aiConfig.llm.fallbackModel(), // haut volume attendu -> modele rapide/economique
    messages: [
      { role: 'system', content: SUMMARY_SYSTEM_PROMPT },
      { role: 'user', content: `Transcript :\n\n${transcript}` },
    ],
    temperature: 0,
  })

  try {
    const parsed = JSON.parse(result.message.content)
    return {
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
      decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
      generatedAt: Date.now(),
    }
  } catch {
    // Le modele n'a pas respecte le format JSON demande — on retourne un
    // resume vide plutot que de propager une erreur de parsing a l'utilisateur.
    return { keyPoints: [], decisions: [], generatedAt: Date.now() }
  }
}

/**
 * Cycle automatique : a appeler toutes les aiConfig.liveSummary.autoCycleMinutes
 * minutes (via un cron / scheduled function cote infrastructure). Traite
 * strictement les segments arrives apres le dernier segment deja traite, puis
 * avance le curseur sur l'horodatage de ce dernier segment (voir le
 * commentaire de SessionBuffer pour pourquoi ce n'est pas Date.now()).
 */
export async function runAutomaticSummaryCycle(sessionId: string): Promise<SessionSummary> {
  const buffer = getOrCreateBuffer(sessionId)
  const newSegments = buffer.segments.filter((s) => s.timestampMs > buffer.lastProcessedSegmentAt)
  const transcript = newSegments.map((s) => s.text).join(' ')

  const summary = await generateSummaryFromText(transcript)

  if (newSegments.length > 0) {
    buffer.lastProcessedSegmentAt = newSegments[newSegments.length - 1].timestampMs
  }

  return summary
}

/**
 * Resume a la demande : meme logique d'extraction que le cycle automatique,
 * mais declenchee par l'utilisateur et n'affecte PAS le curseur du cycle
 * automatique (celui-ci continue independamment, comme specifie).
 *
 * @param sinceMs par defaut, resume depuis le debut de la session ; on peut
 * passer le timestamp du dernier resume automatique pour ne couvrir que le
 * plus recent.
 */
export async function runOnDemandSummary(sessionId: string, sinceMs = 0): Promise<SessionSummary> {
  const transcript = readSince(sessionId, sinceMs)
  return generateSummaryFromText(transcript)
}

/** Reservee aux tests. */
export function _resetBuffersForTests(): void {
  buffers.clear()
}
