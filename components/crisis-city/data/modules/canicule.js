// Module CANICULE — « Le dôme » — Doc n°6 (pivot 2.0), section 4.3. Premier module entièrement
// nouveau depuis le pivot : joué sur la même ville-monde Al-Wasl que Sécheresse/Submersion, pas
// une nouvelle ville. Suit fidèlement l'esquisse du document (dilemme de chacun des 9 nœuds) et
// le gabarit exact des nœuds Maroc/Égypte existants (mêmes champs, même échelle numérique).
//
// Théâtres : 7 des 8 lieux existants sont réutilisés (mêmes décors déjà illustrés) — seul
// `centre_moderne` est nouveau (cf. CityGenerator.js / decors.js). Cœur pédagogique du document :
// une crise invisible (la chaleur tue sans images), l'effet réseau électricité-santé, et le
// dilemme structurel végétaliser (ombre pour tous dans 5 ans) vs climatiser (fraîcheur pour
// certains demain).
export const CANICULE = {
  id: 'canicule',
  pays: 'Al-Wasl',
  ville: 'Al-Wasl',
  titre: 'Le dôme — canicule et réseau sous tension',
  contexte:
    "Al-Wasl vit sa pire vague de chaleur en cinquante ans : huit jours annoncés à 47°, sans " +
    "rafraîchissement nocturne suffisant. Le réseau électrique frôle la saturation à cause de la " +
    "climatisation, l'hôpital universitaire redoute un afflux de patients âgés et isolés, et le " +
    "quartier auto-construit des collines n'a ni ombre ni eau courante fiable. Vous incarnez la " +
    "coordinatrice ou le coordinateur du plan canicule d'Al-Wasl, mandaté pour dix jours.",
  sdg: [3, 7, 11, 13],
  ressources: [
    { code: 'SANTE', nom: 'Santé publique', initial: 65, min: 0, max: 100 },
    { code: 'ENERGIE', nom: 'Marge du réseau électrique', initial: 70, min: 0, max: 100 },
    { code: 'BUD', nom: 'Budget de crise', initial: 100, min: 0, max: 200 },
    { code: 'CONF', nom: 'Confiance publique', initial: 55, min: 0, max: 100 },
  ],
  defaite: [
    { ressource: 'SANTE', op: '<=', valeur: 0, texte: 'Les urgences débordent : le système de santé cède.' },
    { ressource: 'ENERGIE', op: '<=', valeur: 0, texte: 'Black-out généralisé en pleine canicule.' },
  ],
  pnj: [
    { id: 'yousra', nom: 'Dr. Yousra Amrani', role: 'Observatoire des risques', disposition: 'neutre' },
    { id: 'tarek', nom: 'Cap. Tarek El-Shazly', role: 'Protection civile', disposition: 'neutre' },
    { id: 'nour', nom: 'Nour Hassan', role: 'Croissant humanitaire', disposition: 'neutre' },
    { id: 'karim', nom: 'Ing. Karim Mansour', role: 'Infrastructures', disposition: 'neutre' },
    { id: 'leila', nom: 'Leïla Tazi', role: 'Tour des médias', disposition: 'neutre' },
    { id: 'mona', nom: 'Mona Abdel-Rahman', role: 'Arbitrage politique', disposition: 'neutre' },
    { id: 'salma', nom: 'Salma Idrissi', role: 'Conseil jeunesse', disposition: 'neutre' },
  ],
  actes: [
    {
      id: 'acte1', titre: 'Acte 1 — Le dôme s\'installe', soustitre: 'Awareness', actionsMax: 3,
      intro: "La météo est formelle : huit jours à 47°, sans répit nocturne sous 32°. La ville fonctionne encore normalement en apparence.",
      noeuds: [
        {
          id: 'N1', titre: 'Huit jours à 47°', lieu3d: 'cellule_crise',
          contexte: "L'Observatoire confirme : huit jours de dôme de chaleur, aucun répit nocturne sous 32°. C'est le pic le plus long jamais mesuré à Al-Wasl.",
          replique: "Dr. Amrani : « On peut décréter le plan gradué maintenant, avec tout ce que ça implique de désorganisation immédiate — ou attendre de voir si les modèles se confirment. Je vous donne les chiffres. Le choix politique vous appartient. »",
          options: [
            {
              label: 'Déclencher le plan canicule gradué : ouverture des points de fraîcheur, alerte aux services vulnérables',
              effets: [{ ressource: 'SANTE', delta: 8, quand: 'immediat' }, { ressource: 'BUD', delta: -20, quand: 'immediat' }, { ressource: 'CONF', delta: 5, quand: 'immediat' }],
              competences: { C5: 2, C1: 1, C3: -1 },
              feedback: "Anticiper une crise lente coûte cher tout de suite et ne rapporte rien de visible — c'est exactement pourquoi c'est rare, et exactement pourquoi c'est efficace.",
              marqueurs: ['plan_canicule_actif'],
              debloque: ['carte_can_1'],
              suite: 'Le plan actif réduit le coût des décisions d\'urgence des actes suivants (N4).',
            },
            {
              label: 'Attendre la confirmation des modèles avant de mobiliser des moyens',
              effets: [{ ressource: 'SANTE', delta: -5, quand: 'immediat' }, { ressource: 'CONF', delta: -3, quand: 'immediat' }],
              competences: { C5: -2, C1: -1 },
              feedback: "Attendre la certitude, c'est souvent attendre qu'il soit trop tard pour agir à moindre coût — la fenêtre d'anticipation ne se rouvre pas.",
              suite: 'Sans alerte précoce, le nœud N3 (quartier informel) sera plus dur à traiter.',
            },
            {
              label: 'Communiqué rassurant : « une vague de chaleur estivale classique »',
              effets: [{ ressource: 'SANTE', delta: -3, quand: 'immediat' }, { ressource: 'CONF', delta: -10, quand: 'finActe' }],
              competences: { C4: -2, C1: -1 },
              marqueurs: ['communication_minimisante'],
              feedback: "Minimiser une crise invisible retarde les comportements de protection individuelle — et se retourne contre la confiance dès que la réalité contredit le communiqué.",
              suite: 'Le déni initial nourrit la rumeur du nœud N6.',
            },
          ],
        },
        {
          id: 'N2', titre: 'Doubler les urgences', lieu3d: 'hopital',
          contexte: "L'hôpital universitaire demande le doublement immédiat de la capacité d'urgences pour les dix jours à venir — personnel, lits, climatisation de secours.",
          replique: "Cap. El-Shazly, en visite avec vous : « Chaque été, on répète le même arbitrage. Cette fois j'aimerais qu'on décide avant de compter les morts, pas après. »",
          options: [
            {
              label: 'Doubler la capacité d\'urgences : rappel de personnel, lits supplémentaires, groupes électrogènes de secours',
              effets: [{ ressource: 'SANTE', delta: 15, quand: 'immediat' }, { ressource: 'BUD', delta: -35, quand: 'immediat' }],
              competences: { C1: 1, C3: 2, C5: 1 },
              feedback: "Le coût d'anticiper un afflux est toujours inférieur au coût de le subir — mais il faut un budget pour se le permettre avant que les lits soient pleins.",
              debloque: ['carte_can_2'],
              suite: 'Standard.',
            },
            {
              label: 'Refuser : le budget sanitaire annuel est déjà engagé ailleurs',
              effets: [{ ressource: 'SANTE', delta: -20, quand: 'immediat' }, { ressource: 'CONF', delta: -8, quand: 'immediat' }],
              competences: { C3: -2, C4: -1 },
              feedback: "Un refus budgétaire pendant une crise sanitaire annoncée se lit rarement comme de la rigueur — il se lit comme de l'indifférence.",
              suite: 'Séquence tendue à N9 : le plan canicule sera institutionnalisé sous contrainte, pas par conviction.',
            },
            {
              label: 'Renfort partiel : mobiliser les réservistes de la Croissant humanitaire en appui, sans nouveaux lits',
              effets: [{ ressource: 'SANTE', delta: 6, quand: 'immediat' }, { ressource: 'BUD', delta: -10, quand: 'immediat' }, { ressource: 'CONF', delta: 3, quand: 'immediat' }],
              competences: { C2: 1, C4: 1 },
              feedback: "Un compromis raisonnable dans l'urgence — mais un pansement, pas un plan : la capacité réelle ne suit pas la charge si la vague dure.",
              suite: 'Standard.',
            },
          ],
        },
        {
          id: 'N3', titre: 'Le quartier sans ombre', lieu3d: 'ezbet',
          contexte: "Le quartier auto-construit des collines n'a ni ombre ni eau courante fiable. La chaleur y est mesurée 4° au-dessus de la moyenne de la ville — l'îlot de chaleur urbain dans toute sa cruauté.",
          replique: "Nour : « J'ai vu des gens dormir sur leur toit en tôle parce que c'est la seule surface qui refroidit un peu la nuit. On peut installer des brumisateurs et des citernes cette semaine. On peut aussi décider que ce n'est pas notre priorité. »",
          options: [
            {
              label: 'Brumisateurs collectifs + citernes d\'eau fraîche, installés cette semaine dans le quartier',
              effets: [
                { ressource: 'SANTE', delta: 12, quand: 'immediat' },
                { ressource: 'BUD', delta: -18, quand: 'immediat', reduitSi: { marqueur: 'khaled_allie', delta: 8 } },
                { ressource: 'CONF', delta: 8, quand: 'immediat' },
              ],
              competences: { C4: 2, C3: 1 },
              feedback: "La confiance gagnée ailleurs dans la ville se traduit ici en coopération concrète — le Doyen du port a fait passer le mot avant même votre arrivée.",
              debloque: ['carte_can_1'],
              suite: 'Si khaled_allie est hérité d\'un module précédent, l\'installation coûte moins cher (le quartier coopère déjà).',
            },
            {
              label: '« Chacun chez soi, climatisé » — laisser le marché de la climatisation individuelle absorber la demande',
              effets: [{ ressource: 'SANTE', delta: -15, quand: 'immediat' }, { ressource: 'CONF', delta: -15, quand: 'immediat' }],
              competences: { C4: -2, C1: -1 },
              feedback: "Une solution qui suppose que tout le monde peut se permettre une climatisation individuelle n'est pas une solution — c'est un choix de qui compte.",
              marqueurs: ['quartier_informel_neglige'],
              suite: 'Le nœud N8 sera plus difficile : la confiance du quartier envers les brigades de visite est entamée.',
            },
            {
              label: 'Distribuer seulement de l\'eau en bouteille, sans installation durable',
              effets: [{ ressource: 'SANTE', delta: 4, quand: 'immediat' }, { ressource: 'BUD', delta: -5, quand: 'immediat' }],
              competences: { C3: 0, C4: 1 },
              feedback: "Un geste immédiat et visible, mais qui ne change rien à l'exposition réelle une fois les bouteilles distribuées.",
              suite: 'Standard.',
            },
          ],
        },
      ],
    },
    {
      id: 'acte2', titre: 'Acte 2 — La nuit à 41°', soustitre: 'Temps compté', actionsMax: 3,
      intro: "Troisième nuit du dôme. La température ne descend plus sous 41°. Le réseau électrique et les nerfs sont à bout.",
      noeuds: [
        {
          id: 'N4', titre: 'Le réseau à 103 %', lieu3d: 'centre_moderne',
          contexte: "La climatisation pousse le réseau électrique à 103 % de sa capacité. Sans délestage immédiat, la panne sera générale — hôpital compris.",
          replique: "Ing. Mansour, au téléphone : « Je peux couper par quartiers en rotation, ou ne rien faire et espérer que ça tienne. Vous avez une minute, pas plus — après ça, c'est le réseau qui décide à ma place. »",
          timerSec: 60,
          optionParDefaut: 2,
          options: [
            {
              label: 'Délestage tournant équitable : tous les quartiers, calendrier public, hôpital exempté',
              effets: [
                { ressource: 'ENERGIE', delta: 20, quand: 'immediat' },
                { ressource: 'BUD', delta: -15, quand: 'immediat', reduitSi: { marqueur: 'plan_canicule_actif', delta: 15 } },
                { ressource: 'CONF', delta: -8, quand: 'immediat' },
              ],
              competences: { C2: 1, C3: 1, C4: 1 },
              feedback: "Une règle claire et identique pour tous coûte de la confiance dans l'instant, mais elle ne laisse personne accuser l'arbitraire — et elle ne coûte rien si le plan canicule tournait déjà.",
              debloque: ['carte_can_1'],
              suite: 'Standard.',
            },
            {
              label: 'Délestage ciblé : épargner le centre-ville et les hôtels, couper davantage la périphérie',
              effets: [{ ressource: 'ENERGIE', delta: 20, quand: 'immediat' }, { ressource: 'BUD', delta: 5, quand: 'immediat' }, { ressource: 'CONF', delta: -18, quand: 'immediat' }],
              competences: { C2: -1, C3: -1, C4: -2 },
              feedback: "Une décision techniquement défendable devient indéfendable si elle confirme un récit d'injustice préexistant — surtout un soir où tout le monde compare son quartier au voisin.",
              suite: 'La rumeur du nœud N6 trouve un terrain plus favorable.',
            },
            {
              label: 'Ne rien décider — laisser le réseau s\'autoréguler',
              effets: [{ ressource: 'ENERGIE', delta: -15, quand: 'immediat' }],
              competences: { C5: -2, C3: -1 },
              tirage: { proba: 0.5, siEchoue: [{ ressource: 'SANTE', delta: -20 }, { ressource: 'ENERGIE', delta: -25 }] },
              feedback: "Ne pas décider est encore une décision — ici, celle de laisser le hasard choisir qui perd l'électricité, hôpital compris.",
              suite: 'Un tirage au sort détermine si le réseau tient ou si la panne touche l\'hôpital.',
            },
          ],
        },
        {
          id: 'N5', titre: 'Le chantier tombe', lieu3d: 'centre_moderne',
          contexte: "Trois ouvriers du chantier de rénovation du centre moderne s'effondrent en pleine nuit, la température ne baissant jamais sous 41°.",
          replique: "Cap. El-Shazly : « Arrêter le chantier coûte cher à l'entreprise et au calendrier. Le laisser tourner de nuit sans encadrement coûte des vies. Vous décidez, ou je décide et vous l'assumez demain. »",
          timerSec: 60,
          optionParDefaut: 2,
          options: [
            {
              label: 'Arrêter le chantier pendant la durée du pic de chaleur',
              effets: [{ ressource: 'SANTE', delta: 10, quand: 'immediat' }, { ressource: 'BUD', delta: -25, quand: 'immediat' }],
              competences: { C5: 1, C3: 1 },
              feedback: "Le coût économique est immédiat et visible ; le coût humain évité ne l'est jamais — c'est toute la difficulté de cette crise.",
              suite: 'Standard.',
            },
            {
              label: 'Basculer le chantier en horaires de nuit fraîche encadrés, avec pauses obligatoires',
              effets: [{ ressource: 'SANTE', delta: 5, quand: 'immediat' }, { ressource: 'BUD', delta: -8, quand: 'immediat' }, { ressource: 'ENERGIE', delta: -5, quand: 'immediat' }],
              competences: { C2: 1, C3: 1 },
              feedback: "Un compromis opérationnel raisonnable — mais la « nuit fraîche » n'existe plus vraiment cette semaine, à 41°.",
              suite: 'Standard.',
            },
            {
              label: 'Laisser le chantier continuer normalement : le calendrier de livraison prime',
              effets: [{ ressource: 'SANTE', delta: -18, quand: 'immediat' }, { ressource: 'CONF', delta: -10, quand: 'immediat' }],
              competences: { C5: -2, C4: -1 },
              feedback: "Prioriser un calendrier sur des corps en surchauffe est le genre d'arbitrage qui semble rationnel sur un tableau Excel et indéfendable partout ailleurs.",
              suite: 'Standard.',
            },
          ],
        },
        {
          id: 'N6', titre: 'La rumeur de l\'eau', lieu3d: 'radio',
          contexte: "Une rumeur enfle : « l'eau du réseau rend malade pendant la canicule ». Elle cumule déjà des milliers de partages — écho de la rumeur des hôtels (dossier M3/E6).",
          replique: "Leïla Tazi : « Je peux répondre avec les analyses de qualité de l'eau, publiques, tout de suite. Je peux aussi me contenter d'un démenti sec. Ou ne rien dire et espérer que ça retombe. Ça ne retombe jamais. »",
          timerSec: 60,
          optionParDefaut: 2,
          options: [
            {
              label: 'Réponse publique avec les données de qualité de l\'eau, en direct',
              effets: [{ ressource: 'CONF', delta: 12, quand: 'immediat' }, { ressource: 'BUD', delta: -5, quand: 'immediat' }],
              competences: { C4: 2, C1: 1 },
              feedback: "Des chiffres publics valent toujours mieux qu'un démenti — la rumeur meurt de preuves, pas d'autorité.",
              debloque: ['carte_can_2'],
              suite: 'Standard.',
            },
            {
              label: 'Démenti sec, sans preuves publiées : « ces allégations sont infondées »',
              effets: [{ ressource: 'CONF', delta: -10, quand: 'immediat' }],
              competences: { C4: -2 },
              feedback: "Un démenti sans preuve se lit comme un aveu pour qui doute déjà — il nourrit la rumeur plus qu'il ne l'éteint.",
              suite: 'Standard.',
            },
            {
              label: 'Ignorer : répondre à une rumeur, c\'est lui donner de l\'importance',
              effets: [{ ressource: 'CONF', delta: -18, quand: 'immediat' }, { ressource: 'SANTE', delta: -5, quand: 'immediat' }],
              competences: { C4: -1, C5: -1 },
              feedback: "Le silence pendant une canicule a un coût sanitaire direct : des gens évitent l'eau du réseau et se déshydratent par précaution mal informée.",
              suite: 'Standard.',
            },
          ],
        },
      ],
    },
    {
      id: 'acte3', titre: 'Acte 3 — Après le dôme', soustitre: 'Action', actionsMax: 3,
      intro: "Le pic retombe. Reste la question qui compte le plus : qu'est-ce qui change pour la prochaine fois ?",
      noeuds: [
        {
          id: 'N7', titre: 'Ombre ou fraîcheur', lieu3d: 'parvis_commune',
          contexte: "Le dilemme structurel de l'après-canicule : végétaliser la ville (ombre pour tous dans cinq ans) ou climatiser les bâtiments publics (fraîcheur pour certains dès demain). Le budget ne permet pas les deux à pleine échelle.",
          replique: "Mona Abdel-Rahman : « Je peux vous obtenir l'un ou l'autre budget, pas les deux en entier. La végétalisation ne protégera personne cet été. La climatisation ne protégera jamais les rues. Choisissez ce que vous êtes prêt à devoir aux prochains coordinateurs. »",
          options: [
            {
              label: 'Plan de végétalisation massif : ombre de rue, canopée urbaine, sur cinq ans',
              effets: [{ ressource: 'BUD', delta: -40, quand: 'immediat' }, { ressource: 'CONF', delta: 6, quand: 'immediat' }],
              competences: { C5: 2, C3: 1, C2: 1 },
              feedback: "Un investissement dont les effets rafraîchissants réels ne se mesureront que dans plusieurs années — le genre de décision qui n'a pas d'électorat immédiat mais que tout le monde remercie plus tard.",
              marqueurs: ['vegetalisation_engagee'],
              debloque: ['carte_can_1'],
              suite: 'Standard.',
            },
            {
              label: 'Climatiser les bâtiments publics prioritaires (écoles, centres de santé) dès cette année',
              effets: [{ ressource: 'BUD', delta: -30, quand: 'immediat' }, { ressource: 'ENERGIE', delta: -10, quand: 'immediat' }, { ressource: 'CONF', delta: -5, quand: 'immediat' }],
              competences: { C5: -1, C4: -1 },
              feedback: "Une fraîcheur réelle et immédiate pour ceux qui franchissent ces portes — et une aggravation de la charge sur un réseau déjà fragilisé, pour tous les autres.",
              suite: 'Standard.',
            },
            {
              label: 'Compromis budgétaire : un peu des deux, à échelle réduite',
              effets: [{ ressource: 'BUD', delta: -50, quand: 'immediat' }, { ressource: 'CONF', delta: 2, quand: 'immediat' }],
              competences: { C3: -1, C5: 1 },
              feedback: "Diviser un budget déjà insuffisant en deux parts encore plus insuffisantes satisfait rarement quiconque pleinement — mais évite de trancher un choix de valeurs en public.",
              suite: 'Standard.',
            },
          ],
        },
        {
          id: 'N8', titre: 'Le registre des isolés', lieu3d: 'conseil_communal',
          contexte: "Chaque canicule, les mêmes personnes âgées et isolées passent sous le radar. Salma propose un registre permanent et des brigades de visite bénévoles.",
          replique: "Salma Idrissi : « On a recensé 340 personnes isolées pendant cette vague, à la main, en urgence. Avec un mandat clair et un vrai registre, on double ce chiffre l'an prochain — avant la crise, pas pendant. »",
          options: [
            {
              label: 'Mandat clair au conseil jeunesse : registre permanent, brigades de visite financées',
              effets: [
                { ressource: 'CONF', delta: 10, quand: 'immediat' },
                { ressource: 'BUD', delta: -15, quand: 'immediat', reduitSi: { marqueur: 'brahim_allie', delta: 5 } },
              ],
              competences: { C4: 2, C2: 1 },
              feedback: "Donner un mandat réel — pas seulement de la reconnaissance verbale — est ce qui transforme une mobilisation ponctuelle en capacité permanente.",
              marqueurs: ['salma_alliee'],
              debloque: ['carte_can_2'],
              suite: 'Standard.',
            },
            {
              label: 'Créer le registre, sans mandat ni financement dédié aux brigades',
              effets: [{ ressource: 'CONF', delta: -5, quand: 'immediat' }],
              competences: { C2: -1, C4: -1 },
              feedback: "Un registre sans les moyens de le tenir à jour ni de le faire vivre sur le terrain devient vite une liste qu'on consulte trop tard.",
              suite: 'Standard.',
            },
            {
              label: 'Laisser les associations s\'organiser seules, sans structure officielle',
              effets: [{ ressource: 'SANTE', delta: -8, quand: 'immediat' }, { ressource: 'CONF', delta: -12, quand: 'immediat' }],
              competences: { C5: -2 },
              marqueurs: ['isoles_negliges'],
              feedback: "La canicule tue sans images — les morts invisibles sont d'abord des personnes que personne n'avait la charge officielle de chercher.",
              debloque: ['carte_can_2'],
              suite: 'Standard.',
            },
          ],
        },
        {
          id: 'N9', titre: 'Institutionnaliser le dôme', lieu3d: 'cellule_crise',
          contexte: "Le pic est passé. Reste à décider si le plan canicule devient une politique permanente d'Al-Wasl ou un souvenir de cet été-là.",
          replique: "Dr. Amrani : « On a tenu. La question n'est plus de savoir si une autre vague viendra — elle viendra. La question est de savoir si vous laissez un plan derrière vous, ou seulement un bon souvenir de gestion de crise. »",
          options: [
            {
              label: 'Institutionnaliser : comité canicule permanent, revue annuelle du plan, budget récurrent',
              effets: [{ ressource: 'CONF', delta: 10, quand: 'immediat' }, { ressource: 'BUD', delta: -10, quand: 'immediat' }],
              competences: { C5: 2, C3: 1 },
              feedback: "Une crise qui produit une institution plutôt qu'un simple bilan est une crise dont la leçon a des chances de survivre au changement de coordinateur.",
              conditions: { marqueurs: ['plan_canicule_actif'] },
              noteVerrouillage: "Nécessite d'avoir activé le plan canicule gradué à l'acte 1 (nœud N1).",
              marqueurs: ['plan_canicule_institutionnalise'],
              debloque: ['carte_can_1'],
              suite: 'Fin standard.',
            },
            {
              label: 'Rédiger un rapport de fin de crise, sans suite institutionnelle prévue',
              effets: [{ ressource: 'CONF', delta: -5, quand: 'immediat' }],
              competences: { C5: -2 },
              feedback: "Un rapport dans un tiroir n'a jamais protégé personne de la canicule suivante.",
              suite: 'Standard.',
            },
            {
              label: 'Rien de formel — le budget est épuisé et « on verra l\'an prochain »',
              effets: [{ ressource: 'BUD', delta: 10, quand: 'immediat' }, { ressource: 'CONF', delta: -8, quand: 'immediat' }],
              competences: { C5: -2, C4: -1 },
              feedback: "Miroir exact des dilemmes des crises précédentes : les crises passent ; les capacités restent ou se perdent.",
              suite: 'Fin dégradée : la prochaine vague de chaleur retrouve Al-Wasl sans plan.',
            },
          ],
        },
      ],
    },
  ],
};
