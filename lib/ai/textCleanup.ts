/**
 * Nettoyage du texte genere par le modele avant affichage a l'utilisateur.
 *
 * Necessite reelle, decouverte en test de production (16/08) : certains
 * modeles "a raisonnement visible" (Qwen3.6-27b notamment, mais le risque
 * n'est pas propre a un seul modele) peuvent laisser fuiter leur
 * raisonnement interne (balises <think>...</think>) ou une tentative
 * d'appel d'outil ratee, ecrite en texte brut plutot que structuree
 * correctement, directement dans la reponse finale. Ce filet de securite
 * s'applique quel que soit le modele configure — la defense ne doit pas
 * reposer uniquement sur "on a choisi un modele fiable".
 */

/**
 * Retire les blocs de raisonnement interne et les traces d'appel d'outil
 * mal formees d'un texte, sans jamais planter si le texte n'en contient pas.
 */
export function stripReasoningArtifacts(text: string): string {
  let cleaned = text

  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '')
  cleaned = cleaned.replace(/<think>[\s\S]*$/gi, '')

  cleaned = cleaned.replace(/<tool_call>[\s\S]*?<\/tool_call>/gi, '')
  cleaned = cleaned.replace(/<tool_call>[\s\S]*$/gi, '')

  return cleaned.trim()
}

const OPEN_TAGS = ['<think>', '<tool_call>']
const CLOSE_TAGS = ['</think>', '</tool_call>']
const LONGEST_TAG_LENGTH = Math.max(...OPEN_TAGS.map((t) => t.length), ...CLOSE_TAGS.map((t) => t.length))

/**
 * Filtre un flux de morceaux de texte (streaming) pour ne JAMAIS laisser
 * passer un bloc <think>...</think> ou <tool_call>...</tool_call> vers le
 * client, meme si ce bloc est coupe entre plusieurs morceaux recus.
 */
export async function* filterReasoningStream(
  stream: AsyncGenerator<string, void, unknown>,
): AsyncGenerator<string, void, unknown> {
  let buffer = ''
  let suppressing = false

  for await (const delta of stream) {
    buffer += delta

    let progressed = true
    while (progressed) {
      progressed = false

      if (!suppressing) {
        let earliestIdx = -1
        for (const tag of OPEN_TAGS) {
          const idx = buffer.indexOf(tag)
          if (idx !== -1 && (earliestIdx === -1 || idx < earliestIdx)) earliestIdx = idx
        }

        if (earliestIdx === -1) {
          const safeLength = Math.max(0, buffer.length - LONGEST_TAG_LENGTH)
          if (safeLength > 0) {
            yield buffer.slice(0, safeLength)
            buffer = buffer.slice(safeLength)
          }
        } else {
          if (earliestIdx > 0) yield buffer.slice(0, earliestIdx)
          buffer = buffer.slice(earliestIdx)
          suppressing = true
          progressed = true
        }
      } else {
        let closeIdx = -1
        let matchedLength = 0
        for (const tag of CLOSE_TAGS) {
          const idx = buffer.indexOf(tag)
          if (idx !== -1 && (closeIdx === -1 || idx < closeIdx)) {
            closeIdx = idx
            matchedLength = tag.length
          }
        }

        if (closeIdx === -1) {
          const keepFrom = Math.max(0, buffer.length - (LONGEST_TAG_LENGTH - 1))
          buffer = buffer.slice(keepFrom)
        } else {
          buffer = buffer.slice(closeIdx + matchedLength)
          suppressing = false
          progressed = true
        }
      }
    }
  }

  if (!suppressing && buffer) yield buffer
}