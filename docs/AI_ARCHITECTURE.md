# Architecture IA — Youth Knowledge Forum 2026

Ce document explique ce qui a été construit dans `lib/ai/`, `app/api/ai/`, et
comment ça se branche sur le reste de la plateforme. Il est écrit pour rester
compréhensible même après une longue pause — chaque décision technique est
reliée au test qui l'a validée, pas juste énoncée comme un fait.

Le détail chiffré de tous les tests (grilles de notation, scores, transcripts
de test) vit dans `YKF2026_Kit_Test_Technique.xlsx` et dans le cahier des
charges (`YKF2026_AI_Concierge_Cahier_des_charges_v8.docx`, en dehors de ce
dépôt de code). Ce fichier-ci est la version "code" de ce même travail.

## 1. Ce qui existait déjà, et ce qui a été ajouté

**Déjà présent dans le projet avant ce travail :**
- Next.js 16 (App Router) + React 19 + TypeScript, PostgreSQL via Prisma
- Les tables `ProgramDay`, `ProgramSession`, `Speaker` — déjà réelles, déjà
  utilisées par `app/program/page.tsx`
- Deux composants UI vides : `components/ai/concierge.tsx` (renvoyait une
  réponse codée en dur) et `components/live/ai-summary-panel.tsx` (affichait
  une liste statique)

**Ajouté par ce travail :**
- `lib/ai/` — toute la logique IA (config, clients, outils, orchestrateur)
- `app/api/ai/chat/route.ts` et `app/api/ai/live-summary/route.ts` — les deux
  points d'entrée HTTP
- Les deux composants existants, modifiés pour appeler ces routes au lieu de
  renvoyer du texte fixe
- `tests/ai/` — 19 tests unitaires (vitest)

Aucune nouvelle base de données n'a été créée : la couche "faits structurés"
qu'on avait prévue dans le cahier des charges (section 10.3) est en réalité
la base PostgreSQL qui existait déjà.

## 2. Les trois branches du concierge général

Le concierge (`lib/ai/orchestrator.ts`) ne classe pas la question lui-même
avec un modèle séparé — c'est Qwen3.6-27b qui décide, via function calling,
quel(s) outil(s) appeler :

| Branche | Outil | Ce qu'il interroge |
|---|---|---|
| Faits ponctuels | `find_sessions`, `find_speaker`, `list_full_program` | Les vraies tables Prisma (`lib/ai/tools/structuredFacts.ts`) |
| Explication de fond | `search_forum_documents` | Qdrant (`lib/ai/tools/forumSearch.ts`) |
| Actualité | `search_web` | À brancher — voir section 6 |

**Pourquoi une brique séparée pour les faits ponctuels plutôt que tout mettre
dans le vector store ?** Testé et confirmé : un embedding ne sépare pas
fiablement "Session 1" et "Session 2" (jusqu'à 96,7% de similarité mesurée
entre les deux avec Gemini Embedding). Un horaire n'a qu'une seule bonne
réponse — ça doit passer par une requête exacte, pas par une recherche de
proximité sémantique.

## 3. Modération et cache — avant même d'atteindre le LLM

Séquence exacte dans `handleUserQuestion()` :

1. **Modération d'entrée** (`clients/moderation.ts`) — si bloqué, on s'arrête
   là, aucun appel LLM n'est fait.
2. **Cache sémantique** (`cache.ts`) — si une question suffisamment proche
   (et portant sur les mêmes chiffres, voir section 4) a déjà été répondue,
   la réponse est réutilisée sans appeler le LLM.
3. Seulement ensuite, l'appel à Qwen3.6-27b avec les outils.
4. **Modération de sortie** — la réponse générée est revérifiée avant de
   partir vers l'utilisateur.
5. Mise en cache de la nouvelle paire question/réponse.

Ordre volontaire : la modération et le cache sont les deux points qui coûtent
le moins cher et bloquent le plus tôt possible — inverser l'ordre (LLM
d'abord) annulerait leur intérêt.

## 4. Le garde-fou du cache — le point le plus contre-intuitif

**Résultat de test qu'il faut garder en tête** : les 3 modèles d'embedding
testés (Qwen3-Embedding-0.6B, BGE-M3, Gemini Embedding) jugent "Session 1" et
"Session 2" comme presque identiques. Sans correction, le cache aurait pu
répondre à une question sur la Session 2 avec la réponse mise en cache pour
la Session 1.

`lib/ai/guardrails.ts` résout ça en exigeant **une double condition** pour
qu'un hit de cache soit valide :
- la similarité sémantique dépasse le seuil (`aiConfig.cache.similarityThreshold`, 0.75) **ET**
- les deux questions contiennent exactement les mêmes chiffres/ordinaux (extraits y compris quand ils sont écrits en toutes lettres, en FR/EN/AR)

C'est un garde-fou **déterministe** (une simple comparaison d'ensembles), pas
un modèle — volontairement, pour qu'il soit impossible à contourner par un
embedding qui se trompe.

## 5. Pourquoi Gemini Embedding en production, alors que Qwen3-Embedding-0.6B a mieux performé en test

Distinction importante à ne pas perdre : le **meilleur résultat de test**
n'est pas toujours le **bon choix de production**.

- Qwen3-Embedding-0.6B avait la meilleure séparation naturelle en test
  (0,788 de similarité sur le cas "Session 2" contre une vraie Session 1,
  le score le plus bas des trois = le moins de confusion).
- Mais ce projet est déployé en **serverless** (Next.js/Vercel probable, vu
  la dépendance `@vercel/analytics`). Auto-héberger un modèle comme
  Qwen3-Embedding nécessite un serveur d'inférence à part — de
  l'infrastructure supplémentaire, pas juste une clé API.
- Gemini Embedding est directement utilisable depuis une fonction serverless
  via un simple appel REST, sans rien héberger.
- Le garde-fou de la section 4 compense précisément la plus faible
  performance de Gemini Embedding sur ce point.

Si un jour un serveur d'inférence dédié existe pour ce projet,
`lib/ai/clients/embeddings.ts` est le seul fichier à modifier pour repasser
sur Qwen3-Embedding-0.6B — l'interface (`embedText`, `cosineSimilarity`)
resterait identique.

## 6. Ce qui n'est PAS branché, et pourquoi c'est honnête de le dire

- **La modération Qwen3Guard** nécessite un endpoint dédié (pas disponible
  sur Groq). Tant que `MODERATION_ENDPOINT_URL` n'est pas configuré,
  `clients/moderation.ts` utilise un filtre heuristique local — documenté
  dans le fichier comme un filet temporaire, pas un remplacement.
- **Le cache et le buffer de session live sont en mémoire** (`Map`
  JavaScript). Ça fonctionne pour valider le comportement, mais une fonction
  serverless peut redémarrer et perdre cet état, et deux instances
  parallèles ne partagent pas la même mémoire. Avant une vraie mise en
  production à grande échelle, remplacer par Redis ou une table PostgreSQL
  dédiée — la logique autour (guardrail, prompts) ne change pas.
- **Le STT (reconnaissance vocale)** n'est pas branché sur
  `appendTranscriptSegment()`. Les tests ont désigné Groq/Whisper-turbo comme
  candidat en tête (voir le kit de test), mais Whisper local et Munsit
  restaient à confirmer au moment de ce travail (accès GPU indisponible).
- **La branche "Resources en direct" du pipeline live était manquante — c'est
  maintenant corrigé (voir section 7).** Elle utilisait la fenêtre glissante
  de 45s → recherche Qdrant → panneau Resources, exactement comme prévu au
  schéma initial.
- **Le scheduler, le streaming et l'observabilité étaient manquants — c'est
  maintenant corrigé (voir section 11).**
- **Le rate limiting/retry sur les erreurs transitoires (429, 5xx) était
  absent — c'est maintenant corrigé (voir section 12).**

## 7. Branche "Resources en direct" — corrigée

**Contexte** : lors de l'audit complet du pipeline RAG, on a constaté que
seules 2 des 3 branches du schéma "Pipeline de la session live" étaient
implémentées. La troisième (fenêtre glissante → recherche Qdrant → panneau
Resources) manquait entièrement. Voici ce qui a été ajouté pour la
compléter :

- `lib/ai/liveSummary.ts` — nouvelle fonction exportée
  `getRecentTranscriptWindow(sessionId, windowMs)`, qui relit les X dernières
  millisecondes du buffer sans jamais faire avancer de curseur (contrairement
  au cycle automatique) — deux appels rapprochés peuvent légitimement se
  chevaucher, c'est le comportement voulu pour une fenêtre "glissante".
- `lib/ai/tools/liveResources.ts` — assemble la fenêtre glissante,
  l'embedding, et la recherche Qdrant filtrée par session. Retourne
  `available: false` sans rien calculer si la fenêtre est encore vide
  (typiquement en tout début de session).
- `app/api/ai/live-resources/route.ts` — endpoint GET, appelé en sondage
  continu (contrairement aux deux autres routes IA, déclenchées
  ponctuellement).
- `components/live/live-video.tsx` — l'onglet "Resources" (qui affichait un
  texte statique : *"3 documents shared..."*) interroge maintenant cette
  route toutes les 15 secondes et affiche les vrais passages trouvés.
- `app/live/page.tsx` — un seul `sessionId` explicite est maintenant partagé
  entre `LiveVideo` et `AiSummaryPanel`, pour que résumé et ressources
  parlent bien de la même session.

**Testé** : 3 nouveaux tests unitaires (`tests/ai/liveResources.test.ts`),
couvrant la fenêtre vide (aucun appel réseau déclenché), la recherche avec
filtrage par session, et le cas où Qdrant ne trouve rien de pertinent.

**Ce qui reste vrai malgré cet ajout** : le STT n'alimente toujours pas le
buffer automatiquement (section 6), donc en pratique cette branche restera
en attente tant que la reconnaissance vocale n'est pas branchée en amont —
exactement le même agencement que le résumé automatique.

## 8. Recherche web — branchée sur Tavily

**Contexte** : `search_web` levait auparavant une erreur explicite, faute de
fournisseur choisi. C'est maintenant un vrai appel réseau.

- Fournisseur retenu : **Tavily** (`api.tavily.com/search`) — une API conçue
  spécifiquement pour les agents/RAG, qui renvoie des extraits déjà formatés
  pour un LLM plutôt que du HTML brut à nettoyer.
- `lib/ai/tools/webSearch.ts` — appelle Tavily avec `topic: 'news'` (pertinent
  pour la branche "actualité"), transmet la synthèse Tavily (`answer`) en tête
  des résultats si elle existe, toujours avec son URL pour que l'orchestrateur
  puisse citer la source — jamais présenter cette synthèse comme sa propre
  connaissance.
- Sans `TAVILY_API_KEY` configurée, la fonction retourne `available: false`
  sans lever d'erreur ni appeler le réseau — l'orchestrateur répond alors
  honnêtement qu'il ne peut pas vérifier l'actualité.

**Testé** : 4 nouveaux tests unitaires (`tests/ai/webSearch.test.ts`), avec
`fetch` simulé — absence de clé, appel réussi avec parsing des résultats,
synthèse Tavily placée en tête, et erreur HTTP propagée explicitement (pas
avalée silencieusement).

**Rappel du risque que cette branche corrige** : sans elle, Mistral Small 4
avait fabriqué un faux bulletin de presse complet et daté lors des tests —
c'est exactement ce cas que Tavily doit maintenant empêcher, en donnant au
modèle une vraie alternative à l'invention.

## 9. Pipeline d'ingestion — la pièce qui manquait, maintenant réelle

**Constat fait après une relecture attentive du travail livré** : la première
version de ce code construisait la recherche et la génération d'un RAG, mais
jamais l'ingestion (chunking, tagging par chunk, indexation réelle). Les
"25 passages" utilisés pendant les tests d'embeddings étaient écrits à la
main, pas produits par du code — ce n'est plus le cas.

**Ce qui a été ajouté :**
- `lib/ai/ingestion/chunking.ts` — découpage par paragraphes avec
  regroupement glouton jusqu'à ~800 caractères, jamais de phrase coupée au
  milieu. Testé unitairement (8 tests, `tests/ai/chunking.test.ts`).
- `scripts/ingest.ts` — lit `data/knowledge-base/*.md`, parse le frontmatter
  YAML, découpe, calcule les embeddings, indexe dans Qdrant avec les index de
  filtrage créés au préalable (`sessionAssociee`, `confidentialite`).
- `data/knowledge-base/` — les 5 documents réellement récupérés plus tôt dans
  ce projet (bios d'orateurs, ressources thématiques), au format frontmatter
  + Markdown.

**Vérifié dans cet environnement** (sans accès réseau externe) : le script
trouve bien les 5 documents, les découpe correctement (20 chunks produits au
total, tailles cohérentes avec la cible), extrait les métadonnées, puis
échoue explicitement à l'étape `QDRANT_URL` manquante — exactement le
comportement attendu. L'appel réel à Gemini Embedding et à Qdrant reste à
valider avec de vraies clés (voir section 7).

**Pour lancer une vraie ingestion une fois les clés renseignées :**
```bash
npm run ingest
```

**Ce que ce script ne couvre pas encore** : les documents `restreint` (aucun
actuellement dans `data/knowledge-base/`, mais le script les ignore
explicitement s'il en trouve — cf. principe de séparation des données
sensibles). Et il n'y a pour l'instant que 5 documents sources — le reste du
registre de sourcing (~40 lignes) reste à récupérer et à déposer dans ce même
dossier au même format pour être ingéré par le même script, sans changement
de code nécessaire.

## 10. Comment tester réellement, avec de vraies clés

Ce code a été écrit et vérifié (compilation TypeScript + 19 tests unitaires)
dans un environnement sans accès aux APIs externes (Groq, Gemini, Qdrant).
Pour un premier test de bout en bout avec de vraies clés :

```bash
cp .env.example .env.local
# remplir GROQ_API_KEY, GEMINI_API_KEY, QDRANT_URL, QDRANT_API_KEY

npx prisma generate
docker compose up -d          # lance PostgreSQL en local
npx prisma migrate deploy
npx tsx prisma/seed.ts        # peuple les tables avec les donnees de demo

pnpm dev
# ouvrir /ai et poser une question, ex: "A quelle heure commence la Session 1 ?"
```

Sans `QDRANT_URL`/`QDRANT_API_KEY` configurés, la branche `search_forum_documents`
échouera à l'appel — c'est attendu tant que la collection Qdrant n'existe pas
encore (voir section 6).

## 11. Streaming, scheduler et observabilité — les 3 dernières pièces

**Streaming** (`lib/ai/clients/llm.ts`, fonction `chatCompletionStream`) :
diffuse la réponse finale token par token via Server-Sent Events, format
vérifié contre la documentation Groq (compatible OpenAI). Limite assumée et
documentée dans le code : les décisions d'appel d'outils restent non
streamées (trop complexe à valider sans accès réseau réel dans cet
environnement de développement) — seule la synthèse finale, une fois les
outils résolus, est diffusée progressivement. Autre limite assumée : la
modération de sortie s'applique après la fin du flux, elle ne peut pas
retirer des caractères déjà envoyés au client — un vrai filtrage en continu,
chunk par chunk, serait l'amélioration suivante si ce risque s'avère
significatif en usage réel.

**Scheduler** (`app/api/ai/cron/route.ts` + `vercel.json`) : une route
protégée par un secret partagé (`CRON_SECRET`) interroge les sessions du
programme actuellement en direct (via `computeSessionStatus`, déjà utilisé
ailleurs dans le projet) et déclenche `runAutomaticSummaryCycle()` pour
chacune. Fonctionne avec Vercel Cron (configuration dans `vercel.json`) ou
n'importe quel planificateur externe pointé sur cette URL.

**Observabilité** (`lib/ai/observability.ts`, fonction `logAiEvent`) : envoie
les événements clés (modération, cache, outils utilisés, latence) vers
Langfuse si configuré, sinon les affiche dans les logs serveur — jamais
d'échec silencieux. Point de vigilance explicitement noté dans le code :
le format exact de l'API d'ingestion Langfuse n'a pas pu être vérifié contre
un compte réel dans cet environnement (pas d'accès réseau externe) — à
revalider avant une mise en production, comme cela a été nécessaire pour
Qdrant, Gemini et Pinecone plus tôt dans ce projet.

**Testé** : 14 nouveaux tests unitaires (`llmStream.test.ts`,
`observability.test.ts`, `cron.test.ts`, plus les tests de l'orchestrateur
mis à jour pour la nouvelle fonction `streamUserQuestion`) — 47 tests au
total désormais, tous passants.

## 12. Sourcing étendu, retries, et évaluation sur le vrai corpus — dernier passage de finalisation

**Sourcing** : le corpus est passé de 5 à **7 documents réels**
(`data/knowledge-base/`), avec deux ajouts vérifiés (chiffres OIT sur le
chômage des jeunes 2025-2026, contexte organisationnel ICESCO). Point de
rigueur à noter : il existe deux rapports OIT distincts avec des chiffres
légèrement différents (12,4% vs 12,6% de chômage jeunes) — les deux sont
documentés séparément dans le fichier source plutôt que d'en choisir un
arbitrairement. **Plafond réel atteint** : les documents encore manquants du
registre (Toolkit, programme final confirmé, modèle 30/60/90 jours) sont des
livrables internes du forum, jamais publiés — aucune recherche supplémentaire
ne les fera apparaître, ils doivent venir de l'équipe métier.

**Retry/backoff** (`lib/ai/clients/httpRetry.ts`) : dernière vraie lacune de
robustesse identifiée à l'audit précédent. Toutes les erreurs transitoires
(429, 500-599) déclenchent une nouvelle tentative avec recul exponentiel et
un peu de gigue, en respectant l'en-tête `Retry-After` si le fournisseur le
renvoie. Ne retente jamais une erreur 4xx définitive (401, 400) — inutile et
trompeur. Branché sur les 3 clients à appel simple (LLM non-streamé,
Embeddings, Qdrant, Tavily) ; le mode streaming reste volontairement à part,
un flux déjà commencé ne peut pas être "réessayé" proprement. 6 tests
unitaires avec horloge simulée (`vi.useFakeTimers`), pas de vraie attente.

**Évaluation réelle** (`scripts/evaluate.ts`) : remplace enfin l'évaluation
faite sur le corpus jouet de 25 passages écrits à la main. Ce script pose 8
questions construites à partir de faits réellement présents dans les 7
documents sources, et vérifie que le bon **document** remonte en top-3 (pas
un chunk exact, le découpage pouvant varier légèrement) — calcule une vraie
precision@3 sur les données effectivement utilisées en production, à
exécuter après `npm run ingest` avec de vraies clés :
```bash
npm run evaluate
```

**Total après cette finalisation** : 53 tests unitaires (6 nouveaux sur le
retry), 7 documents sources, 28 chunks réels.

## 13. Test réel en production — correctifs suite aux premiers échanges avec de vraies clés

Cette section documente ce qui a changé après le tout premier test de bout en
bout du concierge (Groq, Gemini, Qdrant, Tavily réellement appelés) — la
première fois que ce code a rencontré des conditions réelles plutôt que des
mocks. Plusieurs vrais problèmes ont émergé, chacun corrigé avec sa propre
justification.

### 13.1 Changement du modèle principal (Qwen3.6-27b → gpt-oss-120b)

**Symptôme observé** : des fragments de raisonnement interne du modèle
(`<think>...</think>`) et des tentatives d'appel d'outil jamais réellement
exécutées (juste décrites en texte) apparaissaient directement dans les
réponses affichées à l'utilisateur.

**Cause racine** : Qwen3.6-27b est officiellement classé par Groq comme un
modèle **"preview, non destiné à la production"**. Plusieurs utilisateurs
indépendants rapportent exactement ce symptôme (appel d'outil annoncé mais
jamais exécuté). Ce n'était pas un problème de configuration.

**Correctif** : `lib/ai/config.ts`, `primaryModel` pointe maintenant vers
`openai/gpt-oss-120b`, explicitement listé par Groq avec un support natif et
fiable du function calling. Le risque d'invention détecté sur ce modèle lors
des tout premiers tests hors-ligne (avant que les outils ne soient branchés)
était dû à l'absence de données réelles fournies au modèle — désormais que
les outils fonctionnent de manière fiable, ce risque est structurellement
réduit, la consigne anti-invention du prompt système restant comme filet
supplémentaire.

### 13.2 Filtre anti-fuite de raisonnement (nouveau : `lib/ai/textCleanup.ts`)

Un filet de sécurité indépendant du choix de modèle, pour ne jamais dépendre
uniquement de "on a choisi un modèle fiable" :

- `stripReasoningArtifacts(text)` — nettoie une réponse complète (mode JSON classique).
- `filterReasoningStream(stream)` — filtre **en continu pendant le streaming**,
  avant que le texte n'atteigne l'écran. Une suppression après coup ne suffit
  pas en streaming : le texte s'affiche caractère par caractère au fur et à
  mesure de sa réception.

Point technique géré explicitement : une balise (`<think>`, `<tool_call>`)
peut être coupée entre deux morceaux de flux réseau reçus successivement. Le
filtre garde une marge de sécurité (basée sur la longueur de la plus longue
balise connue) pour ne jamais relâcher un fragment qui pourrait être le début
d'une balise. Un vrai bug a été détecté et corrigé pendant le développement :
la première version effaçait tout le buffer quand aucune balise fermante
n'était trouvée, perdant ainsi le début d'une balise coupée — corrigé pour ne
garder que la fin du buffer dans ce cas précis.

Branché dans `orchestrator.ts` : `stripReasoningArtifacts` sur la réponse non
streamée, `filterReasoningStream` enveloppe `chatCompletionStream` dans la
version streamée.

### 13.3 Mémoire de conversation

**Symptôme observé** : l'historique disparaissait à chaque rafraîchissement
de page, et le concierge "oubliait" le contexte d'un échange à l'autre (par
exemple, demander un texte à traduire puis ne plus s'en souvenir au tour
suivant).

**Cause racine** : l'orchestrateur ne recevait jamais l'historique des
échanges précédents — chaque question était traitée comme un tout nouveau
dialogue, sans aucun souvenir de ce qui avait été dit avant.

**Correctif** :
- `lib/ai/orchestrator.ts` — nouveau type `ConversationTurn` (`{ role, content }`),
  paramètre `history` optionnel sur `handleUserQuestion` et `streamUserQuestion`,
  transmis au modèle entre le message système et la question actuelle
  (tronqué aux `MAX_HISTORY_TURNS` derniers échanges). Règle 8 du prompt
  système ajoutée pour que le modèle en tienne compte explicitement.
- Le cache sémantique est désormais **désactivé dès qu'un historique est
  fourni** — une même question posée dans deux conversations différentes peut
  avoir un sens différent selon le contexte ; la mettre en cache sans ça
  donnerait de faux positifs.
- `app/api/ai/chat/route.ts` accepte un champ `history` dans le corps de la
  requête, validé et filtré avant transmission à l'orchestrateur.
- `components/ai/concierge.tsx` et `components/home/ai-assistant-card.tsx` —
  l'historique affiché à l'écran est envoyé à chaque nouvelle question.
- **Persistance** : `concierge.tsx` sauvegarde la conversation dans
  `localStorage` à chaque échange et la recharge au montage du composant —
  corrige la disparition au rafraîchissement. Un bouton "Nouvelle
  conversation" permet de repartir de zéro volontairement.

### 13.4 Robustesse face à l'échec d'un outil

**Symptôme observé** : une question d'actualité renvoyait l'erreur générique
"je n'ai pas pu obtenir de réponse" au lieu d'un refus honnête et spécifique.

**Cause racine** : dans `executeTool()`, ni le `JSON.parse` des arguments ni
l'appel de l'outil lui-même n'étaient protégés — une clé API invalide, un
service indisponible, ou des arguments mal formés par le modèle faisaient
remonter une exception non interceptée, qui faisait planter **toute** la
réponse plutôt qu'un seul outil.

**Correctif** : `executeTool()` protège maintenant individuellement le
parsing des arguments et l'exécution de chaque outil. Un échec devient un
résultat d'outil normal contenant un champ `"error"` — la règle 10 du prompt
système, ajoutée à cette occasion, indique au modèle de traiter ce champ
honnêtement (ni comme une vraie donnée, ni en l'ignorant silencieusement) et
de dire à l'utilisateur qu'il n'a pas pu vérifier cette information précise.

### 13.5 Vrai fournisseur de repli pour la recherche web (Tavily → Serper)

**Constat** : le retry (`fetchWithRetry`) gère déjà les pannes *transitoires*
d'un fournisseur (quota dépassé un instant, erreur serveur passagère). Mais
si Tavily est réellement en panne prolongée ou mal configuré, retenter
indéfiniment le même fournisseur ne sert à rien.

**Correctif** : `lib/ai/tools/webSearch.ts` tente Tavily en premier ; s'il
échoue (pas seulement s'il est absent), **Serper** prend automatiquement le
relais — un second fournisseur réellement indépendant, pas un simple message
d'excuse. Serper vérifié avant intégration comme Tavily
(`POST https://google.serper.dev/search`, header `X-API-KEY`, réponse
`organic[]` avec `title/link/snippet`). Le système ne renvoie
`available: false` que si les deux échouent ou qu'aucun n'est configuré.
`SERPER_API_KEY` est optionnelle dans `.env` — sans elle, comportement
identique à avant (dégradation honnête vers Tavily seul).

### 13.6 Consigne renforcée contre les réponses de mémoire périmées

**Point soulevé** : répondre "de mémoire" sur une question générale sans
jamais vérifier si l'information a changé depuis la date de coupure du
modèle est un risque réel de désinformation involontaire, distinct du risque
d'hallucination pure.

**Correctif** : la règle 5 du prompt système distingue maintenant les faits
stables dans le temps (définitions, histoire établie — réponse directe
autorisée) des faits qui peuvent avoir changé (statistiques récentes, qui
occupe un poste actuellement, un événement en cours) — pour ces derniers, le
modèle doit utiliser `search_web` pour vérifier ou compléter sa réponse
avant de répondre. La description de l'outil `search_web` a été élargie en
conséquence : il ne sert plus seulement à l'actualité déclarée, mais aussi à
la vérification de faits généraux.

### 13.7 Widget IA de la page d'accueil, jamais branché

**Découverte** : `components/home/ai-assistant-card.tsx` existait déjà dans
le projet original (un second concierge, plus compact, sur la page
d'accueil) mais n'avait jamais été identifié ni branché sur le vrai backend
lors du travail initial — trouvé en auditant le reste du projet suite au
signalement d'un "espace IA qui ne marche pas" sur la page d'accueil.

**Correctif** : réécrit selon le même mécanisme que le concierge principal
(appel réel à `/api/ai/chat` en streaming, historique transmis).

### 13.8 Présentation des réponses

Un rendu léger a été ajouté dans `concierge.tsx` : le texte en `**gras**` et
les lignes commençant par `- ` sont rendus visuellement (gras, listes à
puces) plutôt qu'affichés en texte brut. Volontairement simple (pas de
bibliothèque Markdown complète ajoutée) — combiné au filtre anti-fuite de
raisonnement (13.2), la réponse affichée est désormais uniquement le contenu
utile, correctement mis en forme.

### 13.9 Correctif Qdrant — la collection elle-même n'était jamais créée

**Symptôme observé lors de la toute première ingestion réelle** : chaque
chunk échouait avec `Collection 'ykf2026_forum' doesn't exist`.

**Cause racine** : le code savait créer un index sur un champ
(`createPayloadIndexIfNeeded`) et insérer des points, mais personne n'avait
jamais écrit la création de la collection Qdrant elle-même en amont.

**Correctif** : nouvelle fonction `createCollectionIfNeeded()` dans
`lib/ai/clients/vectorstore.ts` — vérifie si la collection existe (GET), et
la crée (PUT, avec la dimension et la métrique cosinus) seulement si absente.
Appelée dans `scripts/ingest.ts` avant la création des index. Idempotente :
ne recrée rien si la collection est déjà présente lors d'une relance.

**Second correctif lié, dans la foulée** : Qdrant n'accepte que des entiers
ou des UUID comme identifiant de point — jamais une chaîne arbitraire comme
`"YKF26-BIO-FA-chunk1"`. Nouvelle fonction `chunkIdToQdrantPointId()` dans
`lib/ai/ingestion/chunking.ts` : transforme un identifiant lisible en entier
stable (hash SHA-256 tronqué à 48 bits) — déterministe, donc une
réingestion du même document met à jour le même point plutôt que d'en créer
un doublon. L'identifiant lisible reste conservé dans les métadonnées
(`passageId`) pour la traçabilité des citations.

### 13.10 Tests ajoutés ou étendus dans cette vague

| Fichier de test | Statut | Ce qu'il couvre en plus |
|---|---|---|
| `textCleanup.test.ts` | Nouveau (10 tests) | Le filtre anti-fuite, y compris balise coupée entre deux morceaux de flux |
| `webSearch.test.ts` | Réécrit (6 tests) | Le vrai basculement Tavily → Serper en cas d'échec (pas seulement absence) |
| `orchestrator.test.ts` | Étendu (+5 tests, 12 au total) | Mémoire de conversation, désactivation du cache avec historique, nettoyage des balises, résistance à l'échec d'un outil |
| `vectorstore.test.ts` | Nouveau (3 tests) | Création de collection Qdrant, idempotence |
| `chunking.test.ts` | Étendu (+3 tests, 11 au total) | `chunkIdToQdrantPointId` — déterminisme et validité de l'entier produit |

**Total après cette vague : 76 tests, tous passants.**

## 14. Deuxième vague de tests réels — 12 correctifs supplémentaires

Cette section documente une deuxième session de test intensif, distincte de
la section 13. Chaque point part d'un symptôme observé dans les logs réels
de production, jamais d'une supposition.

### 14.1 Le premier correctif du bug `sessionId` ne fonctionnait pas réellement

Le correctif de la section 13.9 (`type: ['string', 'null']` dans le schéma)
s'est révélé inefficace en pratique : Groq continuait à rejeter la requête
avec la même erreur. **Correctif robuste** : `sessionId` est entièrement
retiré du schéma exposé au modèle dans `forumSearchTools` — le modèle ne
peut plus jamais générer une valeur invalide pour ce champ. Le paramètre
reste disponible en interne pour `liveResources.ts`, qui l'utilise
directement sans jamais passer par le modèle.

### 14.2 Confusion avec un forum homonyme

Symptôme réel : *"tell me more about the forum"* a déclenché `search_web`
au lieu de `search_forum_documents`, et le modèle a présenté les
informations d'un **autre** "Youth Knowledge Forum" (organisé par le MBRF
à Dubaï, sans rapport avec ce projet) comme si c'était celui-ci. Règle 3
du prompt système renforcée : toute question sur le forum lui-même
(historique, organisateurs, thème, dates, lieu, édition) passe
obligatoirement par `search_forum_documents`, jamais par `search_web` — avec
l'exemple précis de cette confusion écrit dans la consigne.

### 14.3 Trou de sourcing découvert — le concept note lui-même n'était jamais ingéré

Le modèle répondait honnêtement "je ne trouve pas cette information" à des
questions sur l'historique et le thème du forum — **et il avait raison** :
le document concept note (utilisé comme référence tout au long de ce
projet) n'avait jamais été transformé en fichier ingéré. Ajouté :
`data/knowledge-base/YKF26-CONCEPT-DAY1_Concept_Note_Jour1.md` — le corpus
passe de 7 à **8 documents réels** (35 chunks). Ce cas confirme que le
comportement anti-invention du modèle fonctionne correctement : il n'a
jamais inventé cette information malgré une insistance de l'utilisateur.

### 14.4 Widget IA de la page d'accueil — présentation non formatée

`components/home/ai-assistant-card.tsx` affichait le texte brut, sans le
rendu (gras, listes à puces) déjà présent sur `/ai`. Extrait dans un
composant partagé `components/ai/formatted-text.tsx`, utilisé par les deux
interfaces — évite que les deux divergent à l'avenir.

### 14.5 Recherche météo/factuelle systématiquement vide

`lib/ai/tools/webSearch.ts` forçait `topic: 'news'` sur chaque appel
Tavily — un filtre pertinent pour l'actualité, mais qui exclut les sites
d'agrégation météo/factuelle (non catégorisés "actualité"). Corrigé en
`topic: 'general'`.

### 14.6 Nom de fournisseur technique cité comme source

Le modèle citait *"Source : tavily"* — parce que notre propre code
labellisait la synthèse Tavily avec le titre `"Synthese Tavily"`, que le
modèle recopiait fidèlement en suivant la consigne de citation. Corrigé :
cette synthèse n'est plus ajoutée comme un faux "résultat" nommé ; seuls
les vrais résultats individuels (avec leur vrai titre de site) servent de
source citable.

### 14.7 Format de citation illisible

Ancien format : `(Source : « Synthese Tavily » et « titre brut d'article ».)`
— guillemets imbriqués, titres bruts. Règle 4 précisée : format exact
`Source : nomDuSite`, une ligne par source, jamais de titre d'article brut
ni de guillemets imbriqués.

### 14.8 Confirmation : le plafond de quota est au niveau du compte, pas du modèle

Qwen3.6-27b, `gpt-oss-120b` et `gpt-oss-20b` ont chacun rencontré la même
limite (429, tokens/minute **et** tokens/jour) — preuve que le problème est
au niveau du compte Groq gratuit, pas d'un modèle en particulier. Changer
de modèle une nouvelle fois n'aurait rien résolu.

### 14.9 Prompt système condensé — réduction réelle de tokens

`SYSTEM_PROMPT` reformulé de 635 à ~350 mots (les 14 règles conservées
intégralement en substance) — réduit la consommation de tokens à chaque
appel, contribuant à limiter la pression sur le quota.

### 14.10 Plafond de délai d'attente sur les appels LLM

`fetchWithRetry` attendait fidèlement le délai réel annoncé par Groq
(jusqu'à 20-25 secondes observées), produisant des réponses de 13 à 69
secondes. Un `RetryConfig` dédié et plus strict (`maxAttempts: 2,
maxDelayMs: 1000`) est maintenant appliqué spécifiquement aux appels LLM
dans `lib/ai/clients/llm.ts` — échec honnête et rapide plutôt qu'une
attente longue rarement payante en cas de quota très épuisé.

### 14.11 Bug frontend — un refus correct affiché comme erreur générique

`firstChunkReceived` n'était mis à `true` que sur un événement `chunk`,
jamais sur un événement `blocked` — un refus de modération pourtant
correctement reçu et affiché se faisait ensuite écraser par le message
d'erreur générique. Corrigé dans les deux composants
(`concierge.tsx`, `ai-assistant-card.tsx`).

### 14.12 Messages de refus dans une langue figée, sans rapport avec la question

Les messages de refus (modération d'entrée/sortie) étaient codés en dur,
chacun dans **une seule langue fixe**, à la fois côté serveur et côté
interface (différente selon le composant) — une question en anglais
recevait un refus en français. **Correctif architectural** : une fonction
`detectQuestionLanguage()` (FR/EN/AR, heuristique légère) choisit
désormais le bon message côté serveur, transmis via un nouveau champ
`message` sur l'événement `StreamEvent` de type `blocked` — le frontend
n'invente plus jamais de texte lui-même, il affiche uniquement ce que le
serveur décide.

### 14.13 Récapitulatif chiffré de cette deuxième vague

**Total après cette vague : 87 tests, tous passants, 8 documents sources,
35 chunks réels.**

## 15. Premier test réel du pipeline live — bout en bout

**Contexte** : le pipeline live (résumé + ressources en direct) n'avait
jamais été testé en conditions réelles jusqu'ici — tout le travail de test
précédent portait sur le concierge général. Le STT n'étant pas branché
(section 6), rien n'alimente `appendTranscriptSegment()` en production.

**Outil de test ajouté** :
- `app/api/ai/live-transcript/route.ts` — endpoint de test qui permet
  d'injecter manuellement du texte dans le buffer d'une session, simulant
  ce qu'un STT produirait. Protégé par une vérification d'environnement,
  à retirer une fois le STT réellement branché.
- `components/live/dev-transcript-injector.tsx` — interface visuelle sur
  `/live` (zone de texte + bouton), pour tester sans ligne de commande.

**Bug réel trouvé et corrigé lors de ce premier test** : l'identifiant de
session de démonstration (`current-live-session`) ne correspondait à
**aucun** document réellement tagué dans `data/knowledge-base/` (les vrais
tags sont `session_1_awareness`, `session_3_application`, `transverse`) —
la recherche de ressources en direct filtrait donc systématiquement sur une
session inexistante et ne trouvait jamais rien, indépendamment du texte
injecté. Corrigé en alignant `LIVE_SESSION_ID` sur `session_1_awareness`
dans `app/live/page.tsx`. **À revoir** une fois cette page reliée à un vrai
`ProgramSession.id` de la base de données : il faudra alors réconcilier les
tags des documents avec les vrais identifiants de session (ou construire un
mapping explicite entre les deux).

**Confirmé fonctionnel, avec de vrais appels externes** :
- Le résumé (`AI Summary`) passe de "Example — awaiting live transcript" à
  "Updated live", avec de vrais points clés extraits par le modèle à partir
  du texte injecté — première synthèse réelle générée par Groq pour ce
  pipeline.
- L'onglet Resources affiche le vrai contenu du document
  `YKF26-THM-001_UNDP_Polycrisis_Foresight_Brief.md`, récupéré via une
  vraie recherche Qdrant filtrée par session.

**Point d'attention découvert au passage** : le panneau de résumé ne se
rafraîchit automatiquement que toutes les 10 minutes (`AUTO_REFRESH_MS`)
— sans clic manuel sur le bouton de rafraîchissement, il reste sur le
contenu d'exemple bien après l'injection d'un nouveau texte. Comportement
voulu, mais à garder en tête pour tout futur test.

## 16. Lexique rapide des fichiers

| Fichier | Rôle en une phrase |
|---|---|
| `lib/ai/config.ts` | Tous les noms de modèles et seuils, avec leur justification |
| `lib/ai/guardrails.ts` | Le garde-fou déterministe du cache |
| `lib/ai/clients/*.ts` | Un fichier par service externe (LLM, embeddings, modération, vector store) |
| `lib/ai/tools/*.ts` | Les 3 branches, exposées comme des outils appelables par le LLM |
| `lib/ai/tools/liveResources.ts` | La 3e branche du pipeline live (fenêtre glissante + Qdrant) |
| `lib/ai/tools/webSearch.ts` | Branche actualité, appel réel à Tavily |
| `lib/ai/observability.ts` | Journalisation vers Langfuse ou repli console |
| `app/api/ai/cron/route.ts` | Déclenche le cycle automatique pour les sessions live |
| `vercel.json` | Planification du cron toutes les 10 minutes |
| `lib/ai/clients/httpRetry.ts` | Nouvelle tentative automatique sur erreurs transitoires |
| `scripts/evaluate.ts` | Vraie évaluation precision@3 sur le corpus réellement ingéré |
| `lib/ai/ingestion/chunking.ts` | Découpage des documents en passages, avec parsing du frontmatter |
| `scripts/ingest.ts` | Script d'ingestion réel : lit, découpe, tague, embed, indexe |
| `data/knowledge-base/*.md` | Les documents sources réels, au format frontmatter + Markdown |
| `lib/ai/orchestrator.ts` | Assemble tout pour le concierge général |
| `lib/ai/liveSummary.ts` | Buffer + résumé pour la session live |
| `app/api/ai/*/route.ts` | Les points d'entrée HTTP appelés par l'UI |
| `tests/ai/*.test.ts` | Tests unitaires, sans dépendance réseau |
| `lib/ai/textCleanup.ts` | Filtre anti-fuite de raisonnement (`<think>`, `<tool_call>`), y compris en streaming |
| `components/ai/formatted-text.tsx` | Rendu partagé (gras, listes) entre le concierge principal et le widget d'accueil |
| `app/api/ai/live-transcript/route.ts` | Endpoint de test — injecte manuellement du texte tant que le STT n'est pas branché |
| `components/live/dev-transcript-injector.tsx` | Interface visuelle pour tester le pipeline live sans ligne de commande |
| `lib/ai/tools/webSearch.ts` | Recherche web avec repli réel Tavily → Serper |