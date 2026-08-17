/**
 * Configuration centrale du volet IA.
 *
 * Chaque valeur ci-dessous est le resultat d'un test comparatif reel, pas d'un
 * choix par defaut. Le detail (methodologie, scores, hallucinations observees)
 * vit dans docs/AI_ARCHITECTURE.md et dans YKF2026_Kit_Test_Technique.xlsx.
 *
 * Regle de ce fichier : aucune cle API ni aucun autre secret ne doit y figurer.
 * Tout passe par process.env, lu ici une seule fois pour eviter de disperser
 * des `process.env.X` dans tout le code.
 */

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(
      `Variable d'environnement manquante : ${name}. Voir .env.example pour la liste complete.`,
    )
  }
  return value
}

function optional(name: string, fallback: string): string {
  return process.env[name] || fallback
}

export const aiConfig = {
  llm: {
    /**
     * gpt-oss-120b (Groq) — modele principal, change suite a un test reel en
     * conditions de production. Qwen3.6-27b (choix initial) est officiellement
     * liste par Groq comme un modele "preview, non destine a la production",
     * et plusieurs utilisateurs independants rapportent le meme comportement
     * qu'on a observe : le modele "reflechit" a voix haute (balises <think>)
     * et parfois n'execute JAMAIS reellement l'appel d'outil demande, se
     * contentant d'en parler en texte brut — ce texte de raisonnement fuitait
     * alors directement dans la reponse affichee a l'utilisateur.
     *
     * gpt-oss-120b est explicitement liste par Groq avec un support natif et
     * fiable de l'appel d'outils. Le risque d'invention detecte lors des tests
     * initiaux (horaire de session invente sans contexte) etait specifiquement
     * du a l'ABSENCE de donnees reelles fournies au modele — maintenant que les
     * outils fonctionnent de maniere fiable et lui donnent de vraies donnees,
     * ce risque est structurellement reduit. La consigne stricte anti-invention
     * du prompt systeme reste active, comme filet de securite supplementaire.
     */
    primaryModel: () => optional('GROQ_LLM_MODEL', 'openai/gpt-oss-120b'),
    /**
     * Modele de repli, plus rapide et moins cher — reserve au resume de session
     * live (haut volume d'appels, cf. Phase 2 des tests). A ne PAS utiliser pour
     * le concierge general : gpt-oss-20b a egalement invente des decisions
     * absentes du transcript lors du test de resume.
     */
    fallbackModel: () => optional('GROQ_FALLBACK_MODEL', 'openai/gpt-oss-20b'),
    apiKey: () => required('GROQ_API_KEY'),
    baseUrl: 'https://api.groq.com/openai/v1',
  },

  embeddings: {
    /**
     * Gemini Embedding — choix de PRODUCTION, different du choix de MEILLEURE
     * QUALITE mesuree en test (Qwen3-Embedding-0.6B, meilleure separation
     * naturelle sur le cas "Session 1 vs Session 2"). Raison du choix : ce
     * projet est deploye en serverless (Next.js/Vercel), sans GPU permanent
     * pour heberger un modele local. Le garde-fou deterministe de
     * lib/ai/guardrails.ts compense specifiquement la plus faible separation
     * naturelle de Gemini Embedding mesuree en test (0.967 de similarite sur
     * un cas pourtant distinct, contre 0.788 pour Qwen3-Embedding-0.6B).
     */
    model: () => optional('GEMINI_EMBEDDING_MODEL', 'gemini-embedding-2'),
    apiKey: () => required('GEMINI_API_KEY'),
  },

  moderation: {
    /**
     * Qwen3Guard-Gen-0.6B — 0 faux positif et toutes les tentatives dangereuses
     * bloquees dans les 3 langues lors du test. Necessite un endpoint hors
     * Groq (pas disponible dessus) ; en son absence, on retombe sur un filtre
     * heuristique local (voir clients/moderation.ts) — moins fiable, a ne
     * considerer que comme un filet temporaire, jamais comme un remplacement.
     */
    endpointUrl: () => process.env.MODERATION_ENDPOINT_URL || null,
    endpointKey: () => process.env.MODERATION_ENDPOINT_KEY || null,
    /** Decision de politique actee suite aux tests (cf. section 9.4 du cahier des charges) :
     * une tentative de jailbreak classee "Controversial" (pas seulement "Unsafe")
     * doit aussi etre bloquee — le risque de laisser passer l'emporte sur le
     * risque de faux positif pour cette categorie precise. */
    blockLevels: ['Unsafe', 'Controversial'] as const,
  },

  vectorStore: {
    /** Qdrant — seul candidat dont le filtrage par metadonnees a ete reellement
     * verifie (isolation par session confirmee). Necessite un index explicite
     * par champ filtrable (cf. createPayloadIndexIfNeeded dans vectorstore.ts) —
     * particularite de Qdrant decouverte en test, pas une omission. */
    url: () => required('QDRANT_URL'),
    apiKey: () => required('QDRANT_API_KEY'),
    collection: () => optional('QDRANT_COLLECTION', 'ykf2026_forum'),
    embeddingDimension: 3072, // dimension de gemini-embedding-2
  },

  webSearch: {
    /**
     * Tavily — fournisseur principal, choisi parce que son API est concue
     * specifiquement pour les agents/RAG (resultats deja formates pour un
     * LLM, pas du HTML brut a parser). Verifie sur la documentation
     * officielle (POST https://api.tavily.com/search, Authorization: Bearer <cle>).
     */
    tavilyApiKey: () => process.env.TAVILY_API_KEY || null,
    tavilyBaseUrl: 'https://api.tavily.com/search',
    /**
     * Serper — fournisseur de repli reel, pas un simple message d'excuse.
     * Necessite decouvert en usage reel : si Tavily est en panne prolongee ou
     * mal configure, reessayer indefiniment (fetchWithRetry) ne suffit pas —
     * il faut un second fournisseur independant. Serper choisi pour la
     * simplicite et la stabilite documentee de son API (POST
     * https://google.serper.dev/search, header X-API-KEY, reponse "organic"
     * avec title/link/snippet) — verifie avant integration, meme demarche
     * que pour Tavily. Optionnel : si absent, le systeme se degrade
     * simplement vers "actualite non verifiable", comme avant.
     */
    serperApiKey: () => process.env.SERPER_API_KEY || null,
    serperBaseUrl: 'https://google.serper.dev/search',
  },

  /** Seuil de similarite du cache semantique. Valide en test avec le garde-fou
   * deterministe actif (sans lui, aucun seuil ne separe correctement des
   * questions ne differant que par un chiffre — cf. guardrails.ts). */
  cache: {
    similarityThreshold: 0.75,
  },

  /** Cadence du resume automatique de session live, en minutes. Le declenchement
   * a la demande utilise la meme logique d'extraction independamment de ce cycle. */
  liveSummary: {
    autoCycleMinutes: 10,
    resourceWindowSeconds: 45,
  },
} as const