/**
 * Outil "faits structures" — interroge directement les tables Prisma deja
 * reelles du projet (ProgramSession, Speaker), sans nouvelle base de donnees.
 *
 * Rappel du principe qui justifie cet outil separe du vector store (cf.
 * cahier des charges section 10.3) : un horaire ou un nom n'a qu'une seule
 * bonne reponse. Un vector store ne garantit qu'une proximite semantique,
 * insuffisante pour ce type de question — confirme par la confusion mesuree
 * entre "Session 1" et "Session 2" lors du test du cache.
 *
 * Regle stricte imposee par les tests : si aucune ligne ne correspond, l'outil
 * retourne `found: false` explicitement. Le prompt systeme de l'orchestrateur
 * doit alors dire honnetement que l'information n'est pas disponible, jamais
 * estimer une valeur — c'est la correction directe de la faille observee chez
 * gpt-oss-120b (horaire invente sans aucune donnee).
 */
import { prisma } from '@/lib/db'
import { computeSessionStatus } from '@/lib/program'

export interface SessionFact {
  title: string
  day: string
  time: string
  duration: string
  track: string
  room: string
  speakerName: string | null
  status: 'done' | 'live' | 'upcoming'
}

export interface SessionSearchResult {
  found: boolean
  sessions: SessionFact[]
}

/**
 * Recherche des sessions par correspondance textuelle sur le titre ou la piste
 * (track). Utilise `contains`/insensitive plutot qu'une egalite stricte car le
 * LLM appelle cet outil avec du texte libre ("session sur l'eau", "keynote"...),
 * pas avec un identifiant exact.
 */
export async function findSessions(query: string): Promise<SessionSearchResult> {
  const rows = await prisma.programSession.findMany({
    where: {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { track: { contains: query, mode: 'insensitive' } },
      ],
    },
    include: { speaker: true, day: true },
    orderBy: { startsAt: 'asc' },
  })

  const sessions: SessionFact[] = rows.map((s) => ({
    title: s.title,
    day: s.day?.label ?? s.dayId,
    time: s.time,
    duration: s.duration,
    track: s.track,
    room: s.room,
    speakerName: s.speaker?.name ?? null,
    status: computeSessionStatus(s.startsAt, s.endsAt),
  }))

  return { found: sessions.length > 0, sessions }
}

/** Retourne la liste complete du programme, triee chronologiquement — utile
 * quand la question porte sur "le programme" en general plutot que sur une
 * session precise. */
export async function listFullProgram(): Promise<SessionFact[]> {
  const rows = await prisma.programSession.findMany({
    include: { speaker: true, day: true },
    orderBy: { startsAt: 'asc' },
  })
  return rows.map((s) => ({
    title: s.title,
    day: s.day?.label ?? s.dayId,
    time: s.time,
    duration: s.duration,
    track: s.track,
    room: s.room,
    speakerName: s.speaker?.name ?? null,
    status: computeSessionStatus(s.startsAt, s.endsAt),
  }))
}

export interface SpeakerFact {
  name: string
  role: string
  sessionTitles: string[]
}

export interface SpeakerSearchResult {
  found: boolean
  speakers: SpeakerFact[]
}

/** Recherche un orateur par nom (correspondance partielle). */
export async function findSpeaker(nameQuery: string): Promise<SpeakerSearchResult> {
  const rows = await prisma.speaker.findMany({
    where: { name: { contains: nameQuery, mode: 'insensitive' } },
    include: { sessions: true },
  })

  const speakers: SpeakerFact[] = rows.map((s) => ({
    name: s.name,
    role: s.role,
    sessionTitles: (s.sessions ?? []).map((sess) => sess.title),
  }))

  return { found: speakers.length > 0, speakers }
}

/**
 * Definitions des outils au format attendu par l'API Groq (function calling),
 * a passer telles quelles a `chatCompletion({ tools: structuredFactsTools })`.
 */
export const structuredFactsTools = [
  {
    type: 'function' as const,
    function: {
      name: 'find_sessions',
      description:
        "Recherche des sessions du programme du forum par titre ou theme (ex: 'eau', 'keynote', 'ouverture'). " +
        "Retourne l'horaire exact, la salle, l'orateur et le statut (en direct / termine / a venir).",
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Mot-cle ou theme de la session recherchee' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'list_full_program',
      description: 'Retourne le programme complet du forum, trie par ordre chronologique.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'find_speaker',
      description: "Recherche un orateur par nom et retourne son role et les sessions auxquelles il participe.",
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: "Nom (ou partie du nom) de l'orateur recherche" },
        },
        required: ['name'],
      },
    },
  },
]
