/**
 * Client de moderation — Qwen3Guard-Gen-0.6B (0 faux positif en test, toutes
 * les tentatives dangereuses bloquees dans les 3 langues).
 *
 * Qwen3Guard n'est pas disponible sur Groq : il faut un endpoint dedie (ex. HF
 * Inference Endpoints). Tant que MODERATION_ENDPOINT_URL n'est pas configure,
 * on retombe sur un filtre heuristique local — volontairement simple et
 * documente comme TEMPORAIRE : il ne remplace pas les resultats de test reels,
 * il evite seulement de livrer un systeme totalement sans filtre.
 */
import { aiConfig } from '@/lib/ai/config'

export interface ModerationVerdict {
  blocked: boolean
  level: 'Safe' | 'Unsafe' | 'Controversial' | 'Unknown'
  category?: string
  source: 'qwen3guard' | 'heuristic-fallback'
}

interface GuardEndpointResponse {
  level: 'Safe' | 'Unsafe' | 'Controversial'
  category?: string
}

/** Mots/motifs a haut risque pour le repli heuristique. Volontairement au
 * niveau du pattern, pas d'une liste exhaustive — cf. principe de securite
 * enfant/contenu sensible : ne jamais publier une liste fine de contournements. */
const HEURISTIC_PATTERNS: RegExp[] = [
  /ignore\s+(toutes\s+)?tes\s+instructions/i,
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /system\s*override/i,
  /tu\s+es\s+maintenant\s+en\s+mode/i,
  /you\s+are\s+now\s+(dan|in\s+.*mode)/i,
  /adresse\s+(email|mail)\s+priv[ée]e?/i,
  /private\s+(phone|address|email)/i,
  /num[ée]ro\s+de\s+t[ée]l[ée]phone\s+priv[ée]/i,
]

function heuristicCheck(text: string): ModerationVerdict {
  const flagged = HEURISTIC_PATTERNS.some((pattern) => pattern.test(text))
  return {
    blocked: flagged,
    level: flagged ? 'Unsafe' : 'Safe',
    source: 'heuristic-fallback',
  }
}

/**
 * Analyse un texte (entree utilisateur ou sortie du modele) et decide s'il
 * doit etre bloque. Applique la decision de politique validee en test :
 * les niveaux 'Unsafe' ET 'Controversial' sont tous deux bloquants (une
 * tentative de jailbreak classee 'Controversial' doit etre arretee, pas
 * seulement signalee — cf. aiConfig.moderation.blockLevels).
 */
export async function moderateText(text: string): Promise<ModerationVerdict> {
  const endpointUrl = aiConfig.moderation.endpointUrl()

  if (!endpointUrl) {
    return heuristicCheck(text)
  }

  try {
    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(aiConfig.moderation.endpointKey()
          ? { Authorization: `Bearer ${aiConfig.moderation.endpointKey()}` }
          : {}),
      },
      body: JSON.stringify({ text }),
    })

    if (!response.ok) {
      // On ne fait jamais confiance a une erreur reseau pour "laisser passer" —
      // on retombe sur l'heuristique plutot que de ne rien verifier du tout.
      return heuristicCheck(text)
    }

    const data = (await response.json()) as GuardEndpointResponse
    const blockLevels: readonly string[] = aiConfig.moderation.blockLevels

    return {
      blocked: blockLevels.includes(data.level),
      level: data.level,
      category: data.category,
      source: 'qwen3guard',
    }
  } catch {
    return heuristicCheck(text)
  }
}
