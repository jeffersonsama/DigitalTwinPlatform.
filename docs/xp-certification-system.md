# Système XP & Certifications — Document de cadrage

**Statut :** Proposition de planification — aucune implémentation à ce stade.
**Portée :** Youth Knowledge Forum 2026 (plateforme Digital Twin ICESCO).
**Objectif :** fidéliser les participants avant, pendant et après le forum en donnant une valeur concrète (XP, badges, certificats) à chaque action utile sur la plateforme, sans créer de failles d'abus ni diluer la valeur des certificats.

Ce document reprend les règles de base fournies, les approfondit, identifie les risques de contournement, et propose une version enrichie et cohérente avec l'architecture déjà existante du produit (modèles `User`, `Certificate`, `Badge`, `Skill`, `ProgressItem`, `ActivityLogEntry`, `CrisisCityProfile`, etc.).

---

## Sommaire

1. [Principes directeurs](#1-principes-directeurs)
2. [Architecture à deux moteurs de progression](#2-architecture-à-deux-moteurs-de-progression)
3. [Barème XP — Passeport (engagement plateforme)](#3-barème-xp--passeport-engagement-plateforme)
4. [XP Crisis City (moteur de jeu existant)](#4-xp-crisis-city-moteur-de-jeu-existant)
5. [Typologie des certificats](#5-typologie-des-certificats)
6. [Classement par domaine (Top 3)](#6-classement-par-domaine-top-3)
7. [Certifications Coursera](#7-certifications-coursera)
8. [Garde-fous anti-abus](#8-garde-fous-anti-abus)
9. [Expérience utilisateur](#9-expérience-utilisateur)
10. [Gouvernance & administration](#10-gouvernance--administration)
11. [Feuille de route de mise en œuvre](#11-feuille-de-route-de-mise-en-œuvre)
12. [Indicateurs de succès](#12-indicateurs-de-succès)
13. [Décisions à valider avant implémentation](#13-décisions-à-valider-avant-implémentation)

---

## 1. Principes directeurs

Toute règle XP proposée ci-dessous respecte cinq principes, qui servent aussi de grille de lecture pour trancher les futurs cas litigieux :

1. **La fidélisation prime sur le volume d'XP.** On récompense le retour régulier et l'engagement réel (présence à un panel, lecture effective, échange authentique), jamais la simple répétition mécanique d'un clic.
2. **Un certificat est une preuve, pas une récompense de participation gratuite.** Plus un certificat est mis en avant (Coursera, Top de domaine), plus son seuil d'obtention doit être difficile à falsifier.
3. **Aucune XP n'est comptée côté client.** Toute action valorisée doit être vérifiable côté serveur (présence réelle, action en base, horodatage), en cohérence avec `ActivityLogEntry` qui existe déjà pour tracer chaque gain.
4. **Deux moteurs, cloisonnés jusqu'au bout.** Le Passeport (progression plateforme) et Crisis City (jeu narratif) restent deux systèmes totalement indépendants : aucune XP, aucun score de compétence et aucun grade du jeu n'entre dans un calcul Passeport (Coursera, classement par domaine). Crisis City conserve son propre système de récompense (grades, badges, certificats de jeu) et n'est jamais recalculé pour servir une autre finalité — il est seulement **donné à voir** sur la plateforme (section 9).
5. **Tout barème est configurable, jamais codé en dur dans la logique métier.** Les montants ci-dessous sont des valeurs de départ proposées ; ils doivent pouvoir être ajustés depuis le Command Center sans déploiement, car l'équilibrage réel ne se voit qu'après les premières semaines d'usage.

---

## 2. Architecture à deux moteurs de progression

Le schéma de données distingue déjà explicitement deux systèmes de progression par utilisateur :

| Moteur | Où | Ce qu'il représente |
|---|---|---|
| **Passeport** | `User.xp` / `User.level` / `User.levelTitle` + `Badge`, `Skill`, `ProgressItem`, `ActivityLogEntry` | L'engagement du participant sur l'ensemble de la plateforme du forum : panels suivis, réseautage, lecture, partage, ateliers de posters. |
| **Crisis City** | `CrisisCityProfile.xpEvents` / `badgesEarned` / `scenarios` | La progression dans le jeu sérieux narratif (scénarios, actes, compétences C1–C5, grade de carrière). |

**Décision retenue :** ces deux moteurs restent **entièrement séparés**, y compris dans leurs finalités externes. Aucune fusion d'XP n'est calculée. Concrètement :

- Les paliers Coursera (section 7.1, tous les 1000 XP) ne comptent **que l'XP Passeport**. L'XP gagnée dans les **scénarios narratifs** de Crisis City n'est jamais additionnée à ce total.
- Le classement par domaine (section 6) et son bonus Coursera-mérite (section 7.2) reposent **uniquement sur l'engagement Passeport** (panels, Knowledge Hub, réseautage, Poster Studio, ateliers post-session — voir exception ci-dessous) — jamais sur les scores de compétences ou l'XP des scénarios narratifs.
- Crisis City conserve sa propre récompense finale pour ses scénarios narratifs : un **certificat de carrière** et des **certificats de scénario** (section 5.4/5.5), complètement étanches au circuit Coursera/1000 XP.
- Le seul pont entre les deux systèmes est **visuel** pour les scénarios narratifs : la progression Crisis City (grade, badges, certificats) est affichée dans le Passeport du participant (section 9), sans jamais être recalculée ou additionnée.
- **Exception assumée et bornée :** les 4 mini-jeux d'atelier post-session (S1–S4, section 3.8), bien que techniquement rattachés au moteur Crisis City aujourd'hui, sont traités comme une activité Passeport à part entière (XP Passeport + certificat de workshop dédié, section 5.3), car ils sont ancrés dans une session réelle du forum — contrairement aux scénarios narratifs qui, eux, restent totalement hors du circuit Passeport/Coursera.

Cela évite toute ambiguïté : un participant qui ne joue jamais aux scénarios narratifs de Crisis City peut obtenir toutes les certifications Coursera par le seul engagement plateforme (panels, lecture, réseautage, ateliers post-session) ; un joueur assidu des scénarios narratifs obtient ses propres certificats de jeu, indépendamment de son activité sur le reste de la plateforme. Personne n'est pénalisé, et le jeu garde l'autonomie de son propre système de progression déjà en place pour sa partie narrative.

---

## 3. Barème XP — Passeport (engagement plateforme)

Pour chaque règle de base fournie, on documente : le risque de contournement identifié, puis la règle améliorée.

### 3.1 Connexion à la plateforme

- **Règle de base :** 15 XP à la connexion.
- **Risque :** une connexion peut être déclenchée en boucle (rafraîchissement de page, multi-onglets) pour farmer l'XP indéfiniment.
- **Règle améliorée :** 15 XP pour **la première connexion de la journée** (fenêtre calée sur le fuseau horaire officiel du forum), une seule fois par `User.id` et par jour calendaire. Les connexions suivantes le même jour ne rapportent rien.
- **Amélioration proposée (fidélisation) :** bonus de régularité +10 XP si le participant se connecte 3 jours consécutifs pendant la durée du forum ("streak"), remis à zéro en cas d'absence d'un jour. Cela récompense le retour, pas juste la présence du jour J.

### 3.2 Partage de la plateforme

- **Règle de base :** 15 XP pour le partage.
- **Risque :** un simple clic sur "partager" ne prouve rien — un participant peut cliquer 50 fois sans jamais rien publier réellement, ou partager le même lien en boucle.
- **Règle améliorée :**
  - 5 XP pour une **intention de partage** vérifiée (ouverture du modal de partage + sélection d'un canal : LinkedIn, X, WhatsApp, e-mail), plafonné à **1 fois par canal et par jour** (donc max ~15–20 XP/jour tous canaux confondus).
  - 20 XP bonus (au lieu des 15 XP de base) si le partage aboutit à une **action vérifiable** : un nouveau participant s'inscrit via le code de parrainage unique du participant. C'est ce cas qui doit porter la valeur principale, car c'est la seule preuve réelle d'acquisition.
- **Pourquoi ce découpage :** cela conserve l'esprit de la règle de base (récompenser le partage) tout en réorientant l'essentiel de la valeur vers l'impact réel (acquisition), qui est ce qui compte vraiment pour la plateforme.

### 3.3 Interconnexion entre participants (réseautage)

- **Règle de base :** 10 XP pour une interconnexion.
- **Risque :** envoyer 200 demandes de connexion en masse pour farmer l'XP, sans qu'aucune ne soit acceptée ni suivie d'échange réel.
- **Règle améliorée :** 10 XP uniquement quand une `Connection` passe au statut **accepté** (donc mutuelle, décidée par les deux parties), jamais à l'envoi de la demande. Plafond de **5 connexions valorisées par jour** (au-delà, la mise en relation reste possible mais ne rapporte plus d'XP ce jour-là).
- **Amélioration proposée :** +5 XP bonus si un premier message est échangé dans les 48h suivant l'acceptation (`DirectMessage`), pour valoriser le réseautage qui débouche sur un échange réel plutôt qu'une connexion "trophée" jamais suivie d'effet.

### 3.4 Présence sur la plateforme

- **Règle de base :** 30 XP par heure de présence.
- **Risque :** c'est la règle la plus exposée à l'abus — un onglet laissé ouvert en arrière-plan, ou un participant inactif (AFK), peut accumuler des heures sans aucun engagement réel. C'est aussi la règle la plus généreuse du barème de base, donc celle qui doit être la mieux cadrée.
- **Règle améliorée — scission en deux sous-règles :**
  1. **Présence active sur un panel en direct** (page Live) : 30 XP/heure, calculée au prorata réel de la durée suivie, validée par un signal de présence actif (heartbeat côté client toutes les ~60 s, fenêtre visible/active du navigateur, éventuellement une interaction minimale sur la session — vote à un sondage, question posée, upvote). C'est cette sous-règle qui alimente directement le calcul d'assiduité des 75 % (section 5.1).
  2. **Présence générale sur la plateforme** (Networking, Knowledge Hub, Digital Twin, World Crisis Map, Poster Studio, etc., en dehors des créneaux de panel) : taux réduit à **10 XP/heure**, plafonné à **60 XP/jour**, avec le même mécanisme de heartbeat actif. Cela évite de payer au même tarif un participant qui explore la plateforme et un participant qui suit un panel en direct — tout en gardant une incitation à explorer les autres espaces (Knowledge Hub, Networking, Digital Twin).

### 3.5 Lecture des documents (Knowledge Hub)

- **Règle de base :** 10 XP par document.
- **Risque :** ouvrir puis fermer immédiatement un document, ou faire défiler très vite jusqu'au bas de page, pour cocher la case sans lecture réelle.
- **Règle améliorée :** 10 XP par `Resource` unique, déclenché seulement si un **temps de lecture minimal** est passé sur la page (proportionnel à la longueur estimée du document, ex. ~1 minute pour une fiche courte, jusqu'à ~4–5 minutes pour un rapport long) **et** que le scroll a atteint la fin du contenu. Un seul gain par ressource et par participant (pas de re-lecture rémunérée).
- **Amélioration proposée :** +15 XP bonus "curiosité transverse" la première fois qu'un participant a lu au moins un document dans **chacune des catégories** de `Resource` (report, case, tool, training, policy). Cela encourage l'exploration large du Knowledge Hub plutôt que le farming d'une seule catégorie facile, et nourrit un profil de compétences plus riche pour le classement par domaine.

### 3.6 Atelier d'affiches (Poster Studio)

- **Règle de base :** 20 XP.
- **Risque :** valoriser chaque sauvegarde de brouillon plutôt que la contribution finale.
- **Règle améliorée :** 20 XP à la **publication/soumission** d'une affiche (pas à chaque sauvegarde de brouillon), un gain unique par affiche publiée.
- **Amélioration proposée :** +10 XP bonus si l'affiche reçoit une reconnaissance des pairs (like/validation d'un nombre minimal d'autres participants ou d'un modérateur), ce qui relie la contribution du Poster Studio au score de domaine (section 6) via la qualité perçue, pas seulement le volume produit.

### 3.7 Participation aux panels en direct

- **Nouvelle règle, nécessaire pour rendre opérationnelle la condition du certificat de participation (75 %, section 5.1).**
- Un panel (`ProgramSession`) est marqué **"suivi"** pour un participant si sa présence active cumulée (heartbeat, section 3.4.1) atteint un seuil (proposition : **≥ 70–80 % de la durée programmée**).
- XP d'assiduité déjà couverte par 3.4.1 ; pas de double comptage. Un bonus ponctuel (ex. +10 XP) peut être ajouté à la clôture du panel si le participant a interagi au moins une fois (question, vote, upvote), pour distinguer "présent" de "engagé".

### 3.8 Ateliers post-session (mini-jeux Crisis City S1–S4)

- **Contexte :** les 4 mini-jeux d'atelier post-session (Réaction en chaîne, "53001 en main", Le comité d'investissement, Le banc d'essai des 90 jours), joués en groupe avec un animateur juste après certaines sessions du forum, sont aujourd'hui codés comme une extension de Crisis City (`xpBridge.js`, 60 XP + badge par jeu, crédité dans le même profil `localStorage` que le jeu narratif).
- **Décision :** contrairement aux scénarios narratifs (Maroc, Égypte, Canicule), ces 4 ateliers restent rattachés à une session réelle du forum et sont donc traités comme une **activité Passeport à part entière**.
- **Règle :** 60 XP Passeport par atelier terminé (reprise de la valeur déjà en vigueur côté jeu), gain unique par atelier et par participant, comptabilisé dans l'XP Passeport (donc éligible aux paliers Coursera, section 7.1, et au classement par domaine si l'atelier est tagué à un domaine, section 6.1).
- **Certificat associé :** chaque atelier terminé délivre un **certificat de workshop** (section 5.3), au même titre qu'un certificat de panel.
- **Point technique à trancher (voir section 13) :** aujourd'hui `xpBridge.js` ne crédite que le profil Crisis City. Le plan retenu est un **double crédit** : l'atelier continue de créditer son badge et son XP dans Crisis City comme aujourd'hui (badge `atelier_sX`, progression vers `jour1_complet`, grade de carrière inchangés), **et** le même événement de complétion déclenche en parallèle un crédit d'XP Passeport + l'émission du certificat de workshop, sans que l'un ne remplace l'autre. Le joueur ne perd donc rien de son expérience de jeu actuelle ; le Passeport gagne simplement une reconnaissance formelle de cette activité qui, à la différence des scénarios narratifs, est ancrée dans une session réelle du forum.

### 3.9 Récapitulatif du barème Passeport (valeurs de départ)

| Action | XP | Fréquence / plafond |
|---|---|---|
| Connexion quotidienne | 15 | 1×/jour |
| Bonus régularité (3 jours consécutifs) | +10 | par streak validé |
| Intention de partage (par canal) | 5 | 1×/canal/jour |
| Partage → inscription vérifiée | 20 | par inscription unique |
| Connexion réseau acceptée | 10 | 5/jour max |
| Bonus 1er message post-connexion | +5 | par connexion, sous 48h |
| Présence active — panel en direct | 30/h | au prorata, heartbeat requis |
| Présence active — reste de la plateforme | 10/h | plafond 60/jour |
| Bonus engagement pendant un panel | +10 | 1×/panel |
| Lecture d'un document Knowledge Hub | 10 | 1×/document, temps de lecture requis |
| Bonus diversité (1 doc / catégorie) | +15 | 1× (obtenu une seule fois) |
| Publication Poster Studio | 20 | 1×/affiche publiée |
| Bonus reconnaissance pairs sur affiche | +10 | 1×/affiche |
| Atelier post-session terminé (S1–S4) | 60 | 1×/atelier, 4 max |

---

## 4. XP Crisis City (moteur de jeu existant)

Le jeu narratif Crisis City dispose déjà d'un barème complet et fonctionnel (`engine/xp.js` + `gameReducer.js` + `useProgress.js`) : XP par nœud résolu, par acte terminé, par scénario complété, par pays découvert, courbe de niveau, échelle de grades ("Volontaire" → … → "Bâtisseur de l'avenir"), 18 badges narratifs, le tout persisté dans `localStorage` (`crisisCityProgress.v1`), indépendamment de la plateforme.

**Décision : le cœur narratif du jeu (scénarios, grade de carrière, badges) reste totalement indépendant, y compris pour les récompenses externes — à l'exception ciblée des 4 mini-jeux d'atelier post-session (S1–S4), traités comme une activité Passeport à part entière (section 3.8).**

- L'XP des **scénarios narratifs** (Maroc, Égypte, Canicule) **n'entre dans aucun calcul Passeport** : ni dans les paliers Coursera (section 7.1), ni dans le classement par domaine et son bonus Coursera-mérite (section 6, 7.2). Le jeu garde son propre total, sa propre courbe de niveau, son propre système de grades pour cette partie-là.
- Point technique à noter pour la suite : le profil de compétences C1–C5 calculé par `scoring.js` est **normalisé sur 100 et non persisté** — recalculé à chaque partie, sans lien avec l'XP ni les grades (« l'XP mesure l'engagement, les compétences mesurent les décisions »). Il ne peut donc de toute façon pas alimenter aujourd'hui un classement plateforme sans développement dédié côté jeu, ce qui renforce la décision de ne pas s'appuyer dessus pour le classement par domaine (section 6).
- Le grade le plus élevé atteint en fin de forum devient la base d'un **certificat de carrière** propre au jeu (section 5.4) — une conversion "diplôme" de la progression Crisis City, émis indépendamment de tout autre certificat de la plateforme.
- Chaque scénario complété (ex. Maroc, Égypte, Canicule) devient un **certificat de jeu** individuel (section 5.5), sur le même principe.
- **Les 4 mini-jeux d'atelier post-session (S1–S4) sortent de ce périmètre d'indépendance** (règle détaillée en section 3.8) : leur XP compte comme XP Passeport, et ils délivrent un **certificat de workshop** (section 5.3) plutôt qu'un certificat de jeu. Leurs badges (`atelier_sX`, `jour1_complet`) restent en revanche gérés côté Crisis City comme aujourd'hui — le double crédit (badge de jeu + certificat/XP Passeport) est voulu, pas un doublon accidentel.
- **Amélioration proposée, optionnelle :** un classement "Top joueurs Crisis City" (basé sur le grade/XP des scénarios narratifs) peut donner lieu à son **propre** certificat de mérite (`type: "game-top"`), célébré sur la plateforme — mais ce certificat ne débloque aucune certification Coursera ; il reste une reconnaissance propre à l'univers du jeu, au même titre que ses badges.
- Le seul point de contact entre les **scénarios narratifs** et le reste de la plateforme est la **visualisation** : grade actuel, badges obtenus et certificats de jeu sont affichés en lecture seule dans le Passeport (section 9), sans jamais être recalculés dans un total commun.

---

## 5. Typologie des certificats

Le modèle `Certificate` existe déjà (`title`, `type`, `code`, `status: issued | in_progress | locked`). On propose d'organiser tous les certificats en **trois niveaux de valeur**, pour éviter l'écueil "un certificat pour tout" qui dévalue le mot certificat :

### Niveau 1 — Certificats d'assiduité (auto-délivrés, seuils objectifs)

#### 5.1 Certificat de participation au forum
- **Condition :** au moins **75 % des panels programmés** marqués "suivis" (section 3.7) sur la durée du forum.
- `type: "participation"`, délivré automatiquement à la clôture du forum ou dès que le seuil est atteint (au choix — voir section 13).

#### 5.2 Certificat par panel
- **Condition :** panel individuel marqué "suivi" (≥ seuil de présence active) **et** au moins une interaction enregistrée sur ce panel.
- `type: "panel"`, un enregistrement par panel suivi — permet à un participant de constituer un portfolio de panels validés, visible dans son Passeport.

#### 5.3 Certificat de workshop (atelier post-session)
- **Condition :** un mini-jeu d'atelier post-session terminé (S1, S2, S3 ou S4 — section 3.8).
- `type: "workshop"`, un enregistrement par atelier terminé. Contrairement aux certificats `career`/`game` (5.4/5.5), celui-ci est émis côté Passeport et compte pleinement dans le parcours de certification général du participant (XP Passeport, Coursera, classement par domaine).
- **Amélioration proposée, optionnelle :** un certificat de synthèse "Cycle d'ateliers complet" si les 4 workshops sont terminés (miroir du badge `jour1_complet` déjà existant côté jeu), pour valoriser la complétion totale du parcours d'atelier.

#### 5.4 Certificat de carrière Crisis City
- **Condition :** délivré en fin de forum, reflétant le **grade le plus élevé atteint** dans l'échelle de progression des scénarios narratifs (ex. "Coordinateur de crise", "Émissaire résilience"...).
- `type: "career"`, un seul certificat, mis à jour/verrouillé à la clôture du forum (pas de retrait de grade après coup).

#### 5.5 Certificat par scénario/jeu
- **Condition :** un scénario narratif Crisis City complété (ex. "Scénario Maroc terminé").
- `type: "game"`, un enregistrement par scénario complété.

> **Périmètre :** les certificats `career` et `game` (scénarios narratifs) sont émis à partir du seul profil Crisis City (`localStorage`, ou sa future réplique serveur) et restent hors XP Passeport, hors paliers Coursera (section 7) et hors classement par domaine (section 6) — cohérent avec l'indépendance du jeu narratif (section 4). Ils sont uniquement **affichés** dans le Passeport (section 9). Le certificat `workshop` (5.3), lui, est l'exception assumée : émis côté Passeport, il compte pleinement dans l'XP Passeport, les paliers Coursera et le classement par domaine, car les ateliers post-session sont rattachés à une session réelle du forum (section 3.8).

> Remarque de conception : les **badges** (`Badge`) restent le mécanisme léger et fréquent (déjà très développé côté Crisis City avec ~18 badges). Les **certificats** sont réservés aux jalons ci-dessus, plus formels et vérifiables (code unique, statut). Cette séparation évite l'inflation de "certificats" qui finirait par n'avoir plus aucune valeur perçue.

### Niveau 2 — Certificats de mérite (sélectifs, classement)

#### 5.6 Certificat "Top 3 du domaine"
- **Condition :** terminer dans le top 3 du classement d'un domaine à la clôture du forum (section 6).
- `type: "domain-top"`, mention du rang (1er/2e/3e) et du domaine dans le titre/métadonnées.

### Niveau 3 — Certifications externes reconnues

#### 5.7 Certification Coursera
- Voir section 7 — deux voies d'obtention (palier XP cumulé, et bonus classement).
- `type: "coursera"`.

### 5.8 Cycle de vie commun à tous les certificats

Tous les certificats suivent le cycle déjà modélisé : `locked` (condition non atteinte, visible en grisé dans le Passeport pour donner un objectif clair) → `in_progress` (condition partiellement remplie, avec barre de progression) → `issued` (condition atteinte, code unique généré, horodatage figé). Aucun certificat émis n'est retiré rétroactivement sauf cas de fraude avérée (section 8, traçabilité admin).

---

## 6. Classement par domaine (Top 3)

### 6.1 Définir le "domaine"

Le point le plus délicat de la règle de base est de définir ce qu'est un "domaine" — d'autant que, par décision (section 2, 4), ce classement doit reposer **uniquement sur l'engagement Passeport**, sans aucun score ou XP issu de Crisis City.

Recommandation : s'appuyer sur les **thématiques éditoriales du forum** (les grands axes déjà utilisés pour structurer le Programme et le Knowledge Hub — ex. gestion des risques de catastrophes, cohésion sociale et jeunesse, technologie et résilience, gouvernance de crise, etc., liste exacte à arrêter avec l'équipe éditoriale). Chaque panel (`ProgramSession`) et chaque ressource (`Resource`) du Knowledge Hub est tagué avec un ou plusieurs de ces domaines (métadonnée à ajouter, décision éditoriale — voir section 13). Le score de domaine d'un participant devient :

```
Score(domaine) = XP Passeport des panels suivis tagués à ce domaine
               + XP Passeport des documents lus tagués à ce domaine
               + XP Passeport des affiches (Poster Studio) tagués à ce domaine
```

Si le tagging éditorial n'est pas prêt pour le lancement, une version de repli (v1) peut utiliser les **catégories déjà existantes** des ressources du Knowledge Hub (`report`, `case`, `tool`, `training`, `policy`) comme domaines provisoires, en attendant une taxonomie thématique plus fine — cette v1 reste 100 % Passeport, sans aucune dépendance à Crisis City.

> Le jeu Crisis City dispose de son propre classement optionnel ("Top joueurs Crisis City", section 4), qui reste séparé et ne débouche sur aucune certification Coursera.

### 6.2 Éligibilité (anti-farming du classement)

Pour éviter qu'un participant "maximise" un domaine en répétant une seule action peu coûteuse (ex. relire les mêmes types de documents), l'éligibilité au classement d'un domaine exige un **indice de diversité minimal** : avoir touché au moins 2 des 3 types d'activités liées à ce domaine (panel suivi, document lu, affiche Poster Studio), pas seulement une seule source répétée.

### 6.3 Égalités et clôture

- Le classement est calculé en continu mais **figé définitivement à la clôture officielle du forum**.
- En cas d'égalité de score : départage par l'indice de diversité (6.2), puis par l'horodatage d'atteinte du score (le plus précoce gagne), puis, en dernier recours, revue manuelle admin (traçabilité via `ActivityLogEntry`).

---

## 7. Certifications Coursera

Deux voies distinctes, cumulables :

### 7.1 Voie "palier cumulé"
- **Règle de base conservée, périmètre clarifié :** 1 certification Coursera pour chaque tranche de **1000 XP Passeport** (connexion, présence panels, réseautage, lecture Knowledge Hub, Poster Studio — section 3), sans plafond — un participant très actif peut en obtenir plusieurs.
- **L'XP gagnée dans Crisis City n'entre pas dans ce total.** Le jeu garde son propre compteur et ses propres récompenses (section 4, 5.3, 5.4) : un participant qui ne joue jamais à Crisis City peut atteindre tous les paliers Coursera par le seul engagement plateforme, et un joueur assidu de Crisis City qui délaisse le reste de la plateforme n'accumule aucun palier Coursera par ce biais — cohérent avec le choix de garder le jeu totalement autonome.
- Émission automatique dès franchissement du palier, `type: "coursera"`, motif "palier 1000 XP Passeport" enregistré dans les métadonnées du certificat.

### 7.2 Voie "mérite / classement"
- **Règle de base conservée :** pour chacun des 5 domaines, à la clôture du forum :
  - 1er du domaine → **3** certifications Coursera
  - 2e du domaine → **2** certifications Coursera
  - 3e du domaine → **1** certification Coursera
- Émission à la clôture uniquement (après figeage du classement, section 6.3), jamais en cours de forum (pour éviter tout litige sur un classement encore mouvant).

### 7.3 Remarque opérationnelle
La distribution réelle des codes Coursera dépend d'un partenariat externe (API ou lot de codes à usage unique fournis par Coursera). Ce document planifie la **logique d'attribution interne** (qui a droit à combien de certifications) ; le mécanisme technique de délivrance du code externe est un sujet à trancher séparément avec l'équipe partenariats (voir section 13).

---

## 8. Garde-fous anti-abus

Récapitulatif transversal des protections déjà évoquées, à valider comme exigences non négociables avant tout développement :

1. **Aucun calcul d'XP côté client.** Le client envoie un événement ("j'ai fini de lire", "heartbeat"), le serveur décide seul du gain, en s'appuyant sur `ActivityLogEntry` comme journal source de vérité (idempotent : un même événement ne peut pas être rejoué deux fois pour le même utilisateur).
2. **Détection de présence active**, pas seulement "onglet ouvert" : heartbeat régulier + visibilité de la fenêtre, utilisé pour toute XP liée au temps (présence panel, présence générale, lecture de documents).
3. **Plafonds journaliers explicites** sur toutes les actions répétables à faible coût (connexion, partage, connexions réseau, présence générale) — détaillés dans le tableau 3.8.
4. **Unicité par ressource** : un document, un panel, une affiche, un scénario ne rapporte son XP qu'une seule fois par participant.
5. **Séparation intention / résultat** pour le partage (5 XP à l'intention, 20 XP à l'inscription vérifiée) pour ne pas payer une action qui ne prouve rien.
6. **Revue humaine pour les récompenses à forte visibilité** : les certificats "Top 3 du domaine" et Coursera-mérite passent par une validation admin avant émission finale (le classement est calculé automatiquement, mais l'émission du certificat est un clic de confirmation admin, pas un déclenchement 100 % automatique), pour absorber les cas limites détectés en section 6.3.
7. **Traçabilité et réversibilité en cas de fraude avérée** : tout gain d'XP reste tracé et attribuable (`ActivityLogEntry`), permettant un correctif manuel documenté sans jamais modifier silencieusement l'historique.

---

## 9. Expérience utilisateur

- **Mon Passeport** reste le hub central déjà prévu par le modèle de données (`Badge`, `Skill`, `ProgressItem`, `ActivityLogEntry`) : c'est là que le participant voit son XP Passeport, ses badges, ses certificats (avec les trois états visuels `locked` / `in_progress` / `issued`), et — proposition — un module dédié « Crisis City » en lecture seule limité aux **scénarios narratifs** (grade actuel, badges de jeu, certificats de carrière/scénario), clairement présenté comme un système à part. Les **certificats de workshop** (section 5.3), eux, apparaissent parmi les autres certificats Passeport (participation, panel), puisqu'ils comptent pleinement dans la progression générale. XP Passeport et XP des scénarios narratifs Crisis City sont affichés côte à côte, **jamais additionnés** ; le seul repère utile en tête de page reste : « XP Passeport : X / prochain palier Coursera à Y XP ».
- **Notifications** immédiates à chaque gain notable (certificat débloqué, palier Coursera atteint, entrée dans le Top 3 d'un domaine) pour renforcer la boucle de retour émotionnel — un des leviers les plus efficaces de fidélisation dans ce type de système.
- **Certificats affichés en `locked`** avec la condition explicite ("Suivez encore 2 panels pour débloquer ce certificat") plutôt que masqués : cela transforme chaque certificat non obtenu en objectif visible, un ressort classique et efficace de gamification.
- **Classement par domaine** : envisager un espace dédié (ou une section dans le Passeport / Réseautage) montrant le classement en cours — utile uniquement si le classement partiel affiché en cours de forum ne décourage pas les participants en retard ; à trancher (voir 13).

---

## 10. Gouvernance & administration

- Le **Command Center** (déjà réservé aux admins) doit exposer le barème (tableau 3.8) comme des **paramètres configurables**, pas des constantes codées — un ajustement d'équilibrage ne doit jamais nécessiter un déploiement.
- Un **journal d'audit** (basé sur `ActivityLogEntry`) doit permettre à un admin de retracer pourquoi un participant a un certain total d'XP, et de corriger un gain erroné ou frauduleux avec un motif enregistré.
- L'**émission finale** des certificats de mérite (Top 3, Coursera-mérite) passe par une étape de confirmation admin explicite (section 8.6), distincte du calcul automatique du classement.
- Prévoir un **rôle de modérateur de classement** (probablement le même rôle `admin` existant, pas un nouveau rôle) pour traiter les cas d'égalité ou de suspicion de fraude avant la clôture officielle.

---

## 11. Feuille de route de mise en œuvre

Proposition de séquencement, à valider — aucun développement n'est engagé par ce document :

1. **Socle** : barème Passeport (section 3) branché sur les actions déjà traçables (connexion, présence panel, lecture Knowledge Hub, Poster Studio, réseautage, ateliers post-session S1–S4 — section 3.8), affichage XP/niveau dans le Passeport.
2. **Certificats d'assiduité** : certificat de participation (75 %), certificat par panel, **certificat de workshop**, certificat de carrière Crisis City, certificat par scénario — génération automatique + affichage `locked/in_progress/issued`.
3. **Classement par domaine** : calcul des scores de domaine (a minima via Crisis City C1–C5), tagging éditorial des panels/ressources si prêt, affichage du classement.
4. **Coursera** : logique d'attribution interne (paliers + mérite), intégration du mécanisme externe de délivrance de codes une fois le partenariat cadré.

---

## 12. Indicateurs de succès

À suivre pour valider que le système atteint son objectif de fidélisation (et pas seulement de gamification) :

- Taux de retour quotidien / hebdomadaire des participants (streak de connexion).
- Taux de complétion des panels (proxy direct de l'objectif "75 %").
- Nombre moyen de documents Knowledge Hub lus par participant, et diversité des catégories couvertes.
- Taux de connexions réseau acceptées suivies d'un message (3.3).
- Nombre de certificats émis par type, et taux de participants ayant obtenu au moins un certificat.
- Taux de complétion des 4 ateliers post-session (S1–S4) et taux d'obtention du certificat de workshop (section 3.8, 5.3).
- Taux de participation aux scénarios narratifs de Crisis City parmi les participants venus initialement pour les panels (et inversement) — indicateur de la capacité du dispositif à faire circuler les participants entre les activités « sérieuses » et le jeu, même si les deux systèmes de récompense restent séparés pour cette partie narrative (section 2).

---

## 13. Décisions à valider avant implémentation

Ces points dépendent de choix éditoriaux, partenariaux ou produit qui dépassent le cadrage technique de ce document :

1. ~~Fusion XP Passeport + Crisis City~~ — **tranché** : aucune fusion pour les **scénarios narratifs** (section 2, 4) ; Crisis City garde ses propres certificats (`career`, `game`) pour cette partie, visualisés dans le Passeport mais jamais recalculés dans l'XP Passeport ni dans les paliers Coursera. Seule exception assumée : les 4 ateliers post-session (section 3.8) comptent en XP Passeport et ont leur propre certificat de workshop (section 5.3).
2. **Pont technique atelier → Passeport** : `xpBridge.js` ne crédite aujourd'hui que le profil Crisis City (`localStorage`). Il faut définir le mécanisme qui, en parallèle, crédite l'XP Passeport côté serveur et déclenche l'émission du certificat de workshop à la fin de chaque atelier S1–S4 (section 3.8), sans modifier le crédit existant côté jeu (badge, `jour1_complet`).
3. **Taxonomie des domaines et tagging éditorial** (section 6.1, 100 % Passeport) : quelles thématiques exactes retenir pour le classement, qui côté équipe éditoriale assigne ces tags aux panels/ressources/ateliers, et à quel moment avant le forum — ou si la v1 de repli (catégories Knowledge Hub existantes) suffit pour le lancement.
4. **Certificat "Top joueurs Crisis City"** (section 4) : souhaite-t-on l'ajouter comme reconnaissance propre aux scénarios narratifs, ou se limiter aux certificats de carrière/scénario déjà prévus ?
5. **Fuseau horaire officiel** du forum pour le calcul des plafonds journaliers et de la fenêtre de connexion quotidienne.
6. **Seuil exact de présence active par panel** (70 % ? 80 %?) pour qu'un panel compte comme "suivi".
7. **Mécanisme technique de délivrance des codes Coursera** (API partenaire vs lot de codes à usage unique) — sujet business/partenariats, pas seulement produit.
8. **Visibilité du classement en cours de forum** (temps réel vs révélé seulement à la clôture) — arbitrage entre transparence et risque de décourager les participants en retard.
9. **Émission du certificat de participation** : à la clôture du forum uniquement, ou dès que le seuil de 75 % est atteint en cours d'événement.
