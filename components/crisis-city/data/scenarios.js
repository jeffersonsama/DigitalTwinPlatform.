// Contenu = données (directive 3.1). Aucune réplique, aucun effet, aucun feedback dans le code.
// Schéma : section 2.4 du plan technique. Transcription des chapitres 7 (Maroc) et 8 (Égypte).
// Doc n°6 (pivot 2.0) : les modules ajoutés après Maroc/Égypte vivent dans data/modules/ (un
// fichier par module) et se fusionnent ici dans SCENARIOS — évite que ce fichier grossisse
// indéfiniment à mesure que le portefeuille de crises s'étoffe (§4.2 du document).
import { CANICULE } from './modules/canicule.js';

// ---------------------------------------------------------------------------
// MAROC — Scénario 7 : La grande soif
// ---------------------------------------------------------------------------

export const MAROC = {
  id: 'maroc',
  pays: 'Maroc',
  ville: 'Al-Wasl', // Doc n°6 (pivot) : ville-monde unique, remplace l'ancienne "Aïn Sarra"
  titre: 'La grande soif — sécheresse et stress hydrique',
  contexte:
    "Al-Wasl, ville de 260 000 habitants, vit sa sixième année consécutive de sécheresse. Le " +
    "barrage qui alimente son fleuve-oued est à 14 % de sa capacité, la nappe phréatique baisse " +
    "d'environ deux mètres par an, et l'agriculture irriguée de sa ceinture agricole consomme " +
    "près de 80 % de la ressource. Vous incarnez le nouveau coordinateur de la cellule de crise " +
    "communale, nommé par le gouverneur pour six mois.",
  sdg: [6, 2, 11, 13],
  ressources: [
    { code: 'EAU', nom: 'Réserve d\'eau', initial: 55, min: 0, max: 100 },
    { code: 'BUD', nom: 'Budget de crise', initial: 100, min: 0, max: 200 },
    { code: 'CONF', nom: 'Confiance publique', initial: 55, min: 0, max: 100 },
    { code: 'COH', nom: 'Cohésion sociale', initial: 60, min: 0, max: 100 },
  ],
  defaite: [
    { ressource: 'EAU', op: '<=', valeur: 0, texte: 'Pénurie totale.' },
    { ressource: 'COH', op: '<', valeur: 20, texte: 'Conflit ouvert.' },
  ],
  pnj: [
    { id: 'amrani', nom: 'Dr. Yousra Amrani', role: 'Hydrologue de l\'Agence du bassin hydraulique', disposition: 'alliee' },
    { id: 'brahim', nom: 'Si Brahim Oulhaj', role: 'Président de l\'association des agriculteurs', disposition: 'neutre' },
    { id: 'salma', nom: 'Salma Idrissi', role: 'Présidente de l\'association de jeunes « Chabab Al-Wasl »', disposition: 'neutre' },
    { id: 'hamid', nom: 'Hamid Bennour', role: 'Commerçant du souk, voix de la rue', disposition: 'neutre' },
    { id: 'leila', nom: 'Leïla Tazi', role: 'Journaliste de la radio régionale', disposition: 'neutre' },
    { id: 'gouverneur', nom: 'M. le Gouverneur', role: 'Autorité provinciale (voix off, bilans d\'acte)', disposition: 'neutre' },
  ],
  actes: [
    {
      id: 'acte1',
      titre: 'ACTE 1 — Les signaux faibles',
      soustitre: 'Awareness',
      intro:
        "La ville fonctionne encore normalement en apparence. Vous disposez de 3 actions pour " +
        "établir votre diagnostic et poser les fondations de la confiance.",
      actionsMax: 3,
      noeuds: [
        {
          id: 'M1', titre: 'Le briefing de l\'hydrologue', lieu3d: 'agence_bassin',
          contexte: 'Premier jour de mission. Dr. Amrani déroule les courbes : barrage à 14 %, nappe à -2 m/an, consommation agricole à 80 %. Elle conclut : « À ce rythme, coupures obligatoires dans dix semaines. Personne en ville ne le sait encore. »',
          replique: 'Vous êtes le quatrième coordinateur en trois ans. Les trois autres ont commencé par des annonces. Vous, par quoi commencez-vous ?',
          options: [
            {
              label: 'Lancer un audit complet des usages de l\'eau (compteurs, forages, fuites réseau)',
              effets: [{ ressource: 'BUD', delta: -10, quand: 'immediat' }],
              competences: { C1: 2, C5: 1 },
              feedback: "En gestion de crise, la qualité du diagnostic initial conditionne toutes les décisions suivantes. L'ISO/UNDP 53001 place l'analyse du contexte avant toute planification. Coût apparent en temps, gain réel en précision.",
              marqueurs: ['audit_realise'],
              debloque: ['carte_ma_1'],
              suite: "L'audit revient avec des données précises : le réseau perd 35 % en fuites. Ces données ouvriront des options informées plus tard.",
            },
            {
              label: 'Décréter immédiatement des restrictions nocturnes de distribution',
              effets: [{ ressource: 'EAU', delta: 8, quand: 'immediat' }, { ressource: 'CONF', delta: -12, quand: 'immediat' }, { ressource: 'COH', delta: -5, quand: 'immediat' }],
              competences: { C1: -1, C2: 1, C4: -2 },
              feedback: "Agir vite n'est pas agir tôt. Une mesure correcte mais non expliquée détruit la confiance qu'elle était censée protéger. La communication de crise précède la mesure, pas l'inverse.",
              marqueurs: ['coupures_precoces'],
              suite: "Leïla publie : « Coupures surprises : la commune savait-elle ? » La rumeur des hôtels (nœud suivant) arrivera en version aggravée.",
            },
            {
              label: 'Rassurer publiquement : « La situation est sous contrôle »',
              effets: [{ ressource: 'CONF', delta: 5, quand: 'immediat' }, { ressource: 'CONF', delta: -20, quand: 'finActe' }],
              competences: { C1: -2, C4: -1, C5: -2 },
              feedback: "Minimiser un risque documenté crée une « dette de confiance » à intérêts élevés. La population pardonne l'incertitude assumée, pas le mensonge rassurant.",
              marqueurs: ['dette_confiance'],
              suite: "Dr. Amrani perd un peu de coopération. Marqueur « dette de confiance » : tous vos gains de confiance de l'acte 2 seront réduits de moitié.",
            },
          ],
        },
        {
          id: 'M2', titre: 'Les forages de la discorde', lieu3d: 'palmeraie',
          contexte: 'L\'audit (ou la rumeur publique) révèle des dizaines de forages non déclarés qui irriguent des pastèques destinées à l\'export. Si Brahim reçoit le joueur entre deux rangées de goutte-à-goutte.',
          replique: 'La ville nous accuse de voler l\'eau. Mais qui a vendu les licences d\'exploitation il y a dix ans ? Pas nous. Alors, vous proposez quoi ?',
          options: [
            {
              label: 'Fermeture immédiate des forages illégaux avec appui de la gendarmerie',
              effets: [{ ressource: 'EAU', delta: 15, quand: 'immediat' }, { ressource: 'COH', delta: -18, quand: 'immediat' }, { ressource: 'CONF', delta: -5, quand: 'immediat' }],
              competences: { C2: 1, C3: -1, C4: -2 },
              feedback: "La coercition sans alternative produit de la conformité de façade et des conflits durables. L'eau gagnée aujourd'hui se paie en cohésion demain.",
              marqueurs: ['brahim_oppose'],
              suite: 'Si Brahim devient opposant actif. À l\'acte 2, la manifestation (M5) inclut les agriculteurs et double d\'ampleur.',
            },
            {
              label: 'Négocier un pacte de reconversion : quotas + aides au goutte-à-goutte + cultures moins gourmandes',
              effets: [{ ressource: 'EAU', delta: 8, quand: 'immediat' }, { ressource: 'BUD', delta: -20, quand: 'immediat' }, { ressource: 'COH', delta: 10, quand: 'immediat' }],
              competences: { C1: 1, C3: 2, C4: 1, C5: 1 },
              feedback: "C'est le cœur de l'arbitrage : accepter un gain plus lent mais durable. Impliquer les parties prenantes plutôt que les subir. Le coût budgétaire est un investissement, pas une dépense.",
              marqueurs: ['brahim_allie'],
              debloque: ['carte_ma_2'],
              suite: 'Si Brahim devient allié : son co-financement rendra l\'option durable de l\'acte 3 (M8-A) moins chère.',
            },
            {
              label: 'Tolérer les forages « le temps de la saison » pour acheter la paix sociale',
              effets: [{ ressource: 'COH', delta: 5, quand: 'immediat' }, { ressource: 'EAU', delta: -12, quand: 'immediat' }],
              competences: { C2: -2, C5: -2 },
              feedback: "Reporter un arbitrage douloureux, c'est le transférer au moment où l'on aura le moins de marges. En polycrise, l'inaction est une décision — généralement la plus chère.",
              marqueurs: ['saison_perdue'],
              suite: 'Marqueur « saison perdue » : -12 EAU supplémentaires au début de l\'acte 2. La nuit de l\'hôpital (M7) se déclenchera en version critique.',
            },
          ],
        },
        {
          id: 'M3', titre: 'La rumeur des hôtels', lieu3d: 'radio',
          contexte: 'Une vidéo virale affirme que l\'eau de la ville est détournée vers les piscines des hôtels du Nord. C\'est faux, mais elle cumule 300 000 vues. Leïla propose un direct.',
          replique: 'J\'ai 40 minutes d\'antenne demain. Je peux vous inviter, ou inviter l\'auteur de la vidéo. Ou les deux. Vous venez avec quoi — des éléments de langage ou des données ?',
          options: [
            {
              label: 'Accepter le direct avec données ouvertes : publier le tableau de bord de l\'eau consultable par tous',
              effets: [{ ressource: 'CONF', delta: 15, quand: 'immediat' }],
              competences: { C4: 2, C1: 1 },
              feedback: "Contre la désinformation, la transparence vérifiable bat le démenti d'autorité. Un tableau de bord public transforme chaque citoyen en vérificateur.",
              marqueurs: ['dashboard_actif', 'leila_alliee'],
              debloque: ['carte_ma_3'],
              suite: 'La rumeur s\'éteint. Leïla devient un relais fiable ; le dashboard citoyen procure un bonus de confiance passif pour le reste de la partie.',
            },
            {
              label: 'Publier un démenti officiel sec, sans données',
              effets: [{ ressource: 'CONF', delta: -5, quand: 'immediat' }],
              competences: { C4: -1 },
              feedback: "Un démenti sans preuve est perçu comme un aveu. Ne jamais répéter la rumeur sans la remplacer par une information vérifiable plus intéressante qu'elle.",
              suite: 'La rumeur mute (« ils cachent les chiffres »). La manifestation de M5 gagne un slogan contre « l\'omerta de la commune ».',
            },
            {
              label: 'Ignorer : « on ne commente pas les réseaux sociaux »',
              effets: [{ ressource: 'CONF', delta: -10, quand: 'immediat' }, { ressource: 'COH', delta: -5, quand: 'immediat' }],
              competences: { C4: -2, C5: -1 },
              feedback: "Le silence institutionnel laisse le monopole du récit aux acteurs les plus motivés — rarement les mieux informés. En crise, le vide narratif se remplit toujours.",
              marqueurs: ['recit_perdu'],
              suite: 'Marqueur « récit perdu » actif pour tout l\'acte 2 : toute mesure de restriction coûtera 5 confiance de plus.',
            },
          ],
        },
      ],
    },
    {
      id: 'acte2',
      titre: 'ACTE 2 — Le pic de crise',
      soustitre: 'Understanding & Application',
      intro:
        "L'été arrive, la réserve atteint un seuil critique. Le gouverneur annonce que les coupures " +
        "sont désormais inévitables — reste à décider qui, quand, comment.",
      actionsMax: 4,
      noeuds: [
        {
          id: 'M4', titre: 'L\'arbitrage des coupures', lieu3d: 'cellule_crise',
          contexte: 'Il faut réduire la distribution de 30 %. Trois plans techniques sont sur la table.',
          replique: 'Dr. Amrani : « Chaque plan fait des perdants. Votre travail n\'est pas d\'éviter les perdants — c\'est de pouvoir expliquer pourquoi eux, pourquoi maintenant, et pour combien de temps. »',
          options: [
            {
              label: 'Coupures tournantes égalitaires : tous les quartiers, 8 h par jour, calendrier publié',
              effets: [{ ressource: 'EAU', delta: 20, quand: 'immediat' }, { ressource: 'CONF', delta: -8, quand: 'immediat' }, { ressource: 'COH', delta: 5, quand: 'immediat' }],
              competences: { C2: 1, C3: 1, C4: 1 },
              feedback: "L'équité procédurale (règle claire, publiée, identique pour tous) est souvent mieux acceptée qu'une optimisation opaque. Les gens tolèrent la pénurie ; ils ne tolèrent pas l'arbitraire.",
              debloque: ['carte_ma_4'],
              suite: 'Standard.',
            },
            {
              label: 'Protéger le centre économique et les hôtels, couper davantage la périphérie',
              effets: [{ ressource: 'EAU', delta: 20, quand: 'immediat' }, { ressource: 'BUD', delta: 10, quand: 'immediat' }, { ressource: 'CONF', delta: -18, quand: 'immediat' }, { ressource: 'COH', delta: -15, quand: 'immediat' }],
              competences: { C2: -1, C3: -1, C4: -2 },
              feedback: "Une décision techniquement défendable devient indéfendable si elle confirme un récit d'injustice préexistant. Toute mesure s'inscrit dans une histoire.",
              suite: 'La rumeur de M3 « devient vraie ». La manifestation M5 se déclenche en version maximale.',
            },
            {
              label: 'Campagne éclair anti-fuites sur les 12 km de réseau les plus dégradés + coupures réduites à 15 %',
              effets: [{ ressource: 'EAU', delta: 16, quand: 'immediat' }, { ressource: 'BUD', delta: -25, quand: 'immediat' }, { ressource: 'CONF', delta: 10, quand: 'immediat' }],
              competences: { C1: 1, C3: 2, C5: 2 },
              feedback: "Récompense directe de l'investissement en diagnostic de l'acte 1. Réparer les fuites attaque le stock du problème, pas son flux médiatique.",
              conditions: { marqueurs: ['audit_realise'] },
              recurrent: { ressource: 'EAU', delta: 3 },
              debloque: ['carte_ma_5'],
              suite: 'Le jeu explicite le lien causal M1-A → M4-C : effet durable de +3 EAU par nœud résolu.',
            },
          ],
        },
        {
          id: 'M5', titre: 'La place de la Commune', lieu3d: 'parvis_commune',
          contexte: 'Entre 300 et 2 000 personnes manifestent contre les coupures. Salma est au mégaphone — mais elle canalise plus qu\'elle n\'enflamme.',
          replique: 'Salma : « On n\'est pas là pour casser. On est là parce que personne ne nous dit rien et qu\'on est la génération qui vivra avec vos décisions. Vous nous recevez, ou on campe ? »',
          options: [
            {
              label: 'Recevoir la délégation et co-créer un « comité eau jeunesse » avec siège permanent en cellule de crise',
              effets: [{ ressource: 'CONF', delta: 12, quand: 'immediat' }, { ressource: 'COH', delta: 12, quand: 'immediat' }],
              competences: { C4: 2, C5: 1 },
              feedback: "Transformer une opposition en capacité. Un comité avec un vrai mandat crée de la redevabilité réciproque ; un comité vitrine crée du cynisme.",
              marqueurs: ['salma_alliee'],
              debloque: ['carte_ma_6'],
              suite: 'Salma devient alliée : débloque la brigade de volontaires (M7) et réduit le coût des mesures sociales.',
            },
            {
              label: 'Interdire le rassemblement et disperser',
              effets: [{ ressource: 'COH', delta: -20, quand: 'immediat' }, { ressource: 'CONF', delta: -15, quand: 'immediat' }, { ressource: 'BUD', delta: -15, quand: 'immediat' }],
              competences: { C4: -2, C3: -1, C5: -2 },
              feedback: "La répression d'une contestation légitime convertit un problème de gestion en crise politique. Le coût réel arrive à retardement.",
              marqueurs: ['salma_opposee'],
              suite: 'Salma passe à l\'opposition frontale. Le recrutement des volontaires sera impossible à l\'acte 3 ; M7 se joue sans volontaires.',
            },
            {
              label: 'Promettre publiquement « de l\'eau pour tous d\'ici un mois » pour calmer la place',
              effets: [{ ressource: 'CONF', delta: 8, quand: 'immediat' }, { ressource: 'CONF', delta: -25, quand: 'finActe' }],
              competences: { C4: -1, C5: -2, C2: -1 },
              feedback: "La promesse intenable est l'erreur de communication de crise la plus documentée. Ne promettre que des processus qu'on contrôle, jamais des résultats qu'on ne contrôle pas.",
              marqueurs: ['promesse_brisee'],
              suite: 'Hamid : « On nous a encore menti. » Marqueur « promesse brisée » : confiance plafonnée à 50 jusqu\'à la fin.',
            },
          ],
        },
        {
          id: 'M6', titre: 'L\'offre de Aqua Atlas', lieu3d: 'bureau_coordinateur',
          contexte: 'Une société privée propose 40 camions-citernes garantis tout l\'été, exclusivité de distribution, prix triple du tarif public — ou le financement d\'un forage très profond dans l\'aquifère fossile, avec concession de 25 ans.',
          replique: 'Le représentant : « Vous avez une crise, nous avons de l\'eau. La question n\'est pas le prix, c\'est combien vaut la paix sociale. Signez cette semaine et les camions roulent lundi. »',
          options: [
            {
              label: 'Contrat citernes court (8 semaines), plafonné, ciblé sur les quartiers non raccordés, prix public affiché',
              effets: [{ ressource: 'BUD', delta: -30, quand: 'immediat' }, { ressource: 'EAU', delta: 12, quand: 'immediat' }, { ressource: 'CONF', delta: 6, quand: 'immediat' }, { ressource: 'COH', delta: 8, quand: 'immediat' }],
              competences: { C2: 2, C3: 1 },
              feedback: "Le privé en crise est un outil, pas une solution — la clé est le design du contrat : durée courte, ciblage des plus vulnérables, transparence tarifaire. On achète du temps, pas une dépendance.",
              debloque: ['carte_ma_7'],
              suite: 'Standard.',
            },
            {
              label: 'Signer le forage profond avec concession 25 ans',
              effets: [{ ressource: 'EAU', delta: 25, quand: 'immediat' }, { ressource: 'BUD', delta: -10, quand: 'immediat' }],
              competences: { C5: -2, C3: -1, C1: -1 },
              feedback: "Cas d'école de maladaptation — une réponse qui soulage aujourd'hui et aggrave structurellement demain. Le jeu rend le piège explicite au bilan d'acte.",
              marqueurs: ['maladaptation_aquifere'],
              recurrent: { ressource: 'EAU', delta: -3, delai: 4 },
              suite: 'Marqueur « maladaptation » : le grand forage public (M8-B) est verrouillé à l\'acte 3, « l\'aquifère fossile est déjà engagé ».',
            },
            {
              label: 'Refuser tout recours au privé par principe',
              effets: [{ ressource: 'EAU', delta: -8, quand: 'immediat' }, { ressource: 'COH', delta: -6, quand: 'immediat' }, { ressource: 'CONF', delta: -4, quand: 'immediat' }],
              competences: { C2: -1, C3: -1 },
              feedback: "Le dogme est aussi dangereux que la naïveté. Refuser un outil sans alternative pour les plus vulnérables, c'est faire payer son principe par les autres.",
              suite: 'M7 se déclenche en version aggravée.',
            },
          ],
        },
        {
          id: 'M7', titre: 'La nuit de l\'hôpital', lieu3d: 'hopital',
          contexte: 'Panne sur la conduite principale : l\'hôpital a 18 h de réserve. Trois demandes simultanées : l\'hôpital, la coopérative laitière (600 emplois), le quartier d\'Aït Louz déjà coupé depuis 48 h. Vous disposez de deux citernes.',
          replique: 'Dr. Amrani, au téléphone : « Deux citernes, trois urgences. Vous avez dix minutes. Je note votre ordre de priorité et vos raisons — les raisons comptent autant que l\'ordre. »',
          options: [
            {
              label: 'Hôpital d\'abord, puis Aït Louz ; la coopérative attend demain (avec appel personnel au directeur)',
              effets: [{ ressource: 'COH', delta: 5, quand: 'immediat' }, { ressource: 'CONF', delta: 5, quand: 'immediat' }, { ressource: 'BUD', delta: -5, quand: 'immediat' }],
              competences: { C2: 2, C4: 1 },
              feedback: "La règle vie humaine > besoins vitaux > activité économique est simple ; ce qui distingue un bon gestionnaire, c'est d'assumer et d'expliquer le perdant du jour au lieu de le laisser l'apprendre par la rumeur.",
              debloque: ['carte_ma_8'],
              suite: 'Si la brigade de volontaires est active (M5-A), la distribution à Aït Louz se fait en 2 h au lieu de 6.',
            },
            {
              label: 'Répartir les deux citernes entre les trois demandes « pour ne fâcher personne »',
              effets: [{ ressource: 'CONF', delta: -12, quand: 'immediat' }, { ressource: 'COH', delta: -5, quand: 'immediat' }],
              competences: { C2: -2, C3: -1 },
              feedback: "Le saupoudrage est l'anti-priorisation — tout le monde reçoit trop peu pour que ça compte. En triage, ne pas choisir revient à choisir le pire scénario avec de meilleures intentions.",
              suite: 'L\'hôpital frôle la rupture : événement « évacuation sanitaire ».',
            },
            {
              label: 'Coopérative d\'abord (pression du gouverneur sur l\'emploi), hôpital ensuite',
              effets: [{ ressource: 'BUD', delta: 5, quand: 'immediat' }, { ressource: 'CONF', delta: -15, quand: 'immediat' }],
              competences: { C2: -2, C4: -1 },
              feedback: "Céder à la pression hiérarchique contre la règle de triage est une faute classique en crise réelle. Le jeu montre le mécanisme plutôt que de le moraliser.",
              marqueurs: ['jugement_independant_perdu'],
              suite: 'Le débrief final cite ce choix dans l\'axe « indépendance de jugement ».',
            },
          ],
        },
      ],
    },
    {
      id: 'acte3',
      titre: 'ACTE 3 — Reconstruire mieux',
      soustitre: 'Action',
      intro:
        "Les pluies d'automne offrent un répit : vous disposez d'un budget de relèvement et de 2 actions.",
      actionsMax: 2,
      noeuds: [
        {
          id: 'M8', titre: 'Le plan de relèvement', lieu3d: 'conseil_communal',
          contexte: 'Le conseil vote le plan quinquennal de l\'eau. Trois stratégies sont proposées.',
          replique: 'Mona Abdel-Rahman : « Vous avez géré l\'été. Maintenant, faites que le prochain coordinateur n\'ait pas d\'été à gérer. Qu\'est-ce que vous laissez derrière vous ? »',
          options: [
            {
              label: 'Le triptyque sobriété : réutilisation des eaux usées + goutte-à-goutte généralisé + tarification progressive',
              effets: [{ ressource: 'BUD', delta: -45, quand: 'immediat', reduitSi: { marqueur: 'brahim_allie', delta: 15 } }, { ressource: 'CONF', delta: 8, quand: 'immediat' }],
              competences: { C5: 2, C3: 1, C1: 1 },
              feedback: "La résilience hydrique se construit sur trois leviers combinés — réutiliser, sobriété, signal-prix. Chacun seul échoue ; ensemble ils se renforcent.",
              recurrent: { ressource: 'EAU', delta: 5 },
              debloque: ['carte_ma_9'],
              suite: 'Si Si Brahim est allié, coût réduit de 15 (co-financement agricole). Score ODD 6 et 13 maximal.',
            },
            {
              label: 'Le grand forage public dans l\'aquifère profond',
              effets: [{ ressource: 'BUD', delta: -35, quand: 'immediat' }, { ressource: 'EAU', delta: 20, quand: 'immediat' }, { ressource: 'CONF', delta: 10, quand: 'immediat' }],
              competences: { C5: -1, C1: -1 },
              feedback: "Politiquement séduisant, hydrologiquement daté. Apprendre à lire l'horizon temporel d'une décision est un objectif explicite du scénario.",
              conditions: { marqueursAbsents: ['maladaptation_aquifere'] },
              recurrent: { ressource: 'EAU', delta: -2, delai: 6 },
              suite: 'Le débrief compare les trajectoires sur un graphique à 10 ans.',
            },
            {
              label: 'Tout miser sur la sensibilisation et l\'éducation, sans investissement lourd',
              effets: [{ ressource: 'BUD', delta: -10, quand: 'immediat' }, { ressource: 'CONF', delta: 5, quand: 'immediat' }],
              competences: { C5: -1, C4: 1 },
              feedback: "La sensibilisation est nécessaire mais non suffisante — elle plafonne autour de 10 % d'économies quand le réseau en perd 35 %.",
              marqueurs: ['sensibilisation_seule'],
              suite: 'Risque élevé de re-crise : l\'épilogue simule l\'été suivant.',
            },
          ],
        },
        {
          id: 'M9', titre: 'Institutionnaliser la mémoire', lieu3d: 'cellule_crise',
          contexte: 'La mission s\'achève. Ce nœud ne rapporte presque rien en ressources, mais pèse lourd dans le score C5 et dans le profil final.',
          replique: 'Salma : « Tout le monde vous dit bravo. Moi je vous pose la seule question qui compte : qu\'est-ce qui existera encore dans deux ans ? »',
          options: [
            {
              label: 'Créer un comité permanent de l\'eau avec revue annuelle publique et exercice de crise simulé chaque printemps',
              effets: [{ ressource: 'BUD', delta: -8, quand: 'immediat' }, { ressource: 'CONF', delta: 5, quand: 'immediat' }],
              competences: { C5: 2, C4: 1 },
              feedback: "C'est littéralement la boucle Plan-Do-Check-Act de l'ISO/UNDP 53001. Une organisation qui répète l'exercice de crise transforme l'expérience individuelle en capacité institutionnelle.",
              marqueurs: ['memoire_institutionnalisee'],
              debloque: ['carte_ma_10'],
              suite: 'Verrouille les acquis : tous les bonus permanents sont conservés dans l\'épilogue.',
            },
            {
              label: 'Rédiger un rapport final détaillé et l\'archiver',
              effets: [],
              competences: { C5: 0 },
              feedback: "Le rapport non porté par une instance vivante est de la mémoire morte. Documenter est nécessaire ; institutionnaliser est ce qui distingue l'apprentissage organisationnel de l'archivage.",
              suite: 'Épilogue mitigé : 50 % des acquis se dissipent.',
            },
            {
              label: 'Ne rien formaliser : « les gens se souviendront »',
              effets: [],
              competences: { C5: -2 },
              feedback: "La mémoire organisationnelle a une demi-vie courte. Sans structure, chaque crise recommence à zéro.",
              suite: 'Épilogue dégradé : re-crise avec -30 % d\'efficacité de réponse.',
            },
          ],
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// ÉGYPTE — Scénario 8 : La mer qui monte
// ---------------------------------------------------------------------------

export const EGYPTE = {
  id: 'egypte',
  pays: 'Égypte',
  ville: 'Al-Wasl', // Doc n°6 (pivot) : ville-monde unique, remplace l'ancienne "El-Bahriya"
  titre: 'La mer qui monte — inondation côtière et intrusion saline',
  contexte:
    "Al-Wasl, ville de 260 000 habitants construite en partie sous le niveau de la mer à " +
    "l'embouchure de son fleuve, est protégée par un cordon dunaire dégradé et une digue " +
    "vieillissante. Une tempête méditerranéenne majeure est annoncée à 72 h. Vous incarnez le " +
    "directeur adjoint de la gestion de crise du gouvernorat, détaché sur la ville.",
  sdg: [11, 13, 2, 1],
  ressources: [
    { code: 'SEC', nom: 'Sécurité des personnes', initial: 70, min: 0, max: 100 },
    { code: 'INF', nom: 'Intégrité des infrastructures', initial: 55, min: 0, max: 100 },
    { code: 'BUD', nom: 'Budget de crise', initial: 100, min: 0, max: 200 },
    { code: 'CONF', nom: 'Confiance publique', initial: 50, min: 0, max: 100 },
  ],
  defaite: [
    { ressource: 'SEC', op: '<', valeur: 30, texte: 'Pertes humaines.' },
  ],
  pnj: [
    { id: 'mona', nom: 'Mme Mona Abdel-Rahman', role: 'Gouverneure adjointe', disposition: 'neutre' },
    { id: 'karim', nom: 'Ing. Karim Mansour', role: 'Ingénieur en chef, protection côtière', disposition: 'alliee' },
    { id: 'khaled', nom: 'Abou Khaled', role: 'Doyen des pêcheurs d\'Ezbet El-Sayadin', disposition: 'neutre' },
    { id: 'fatma', nom: 'Fatma Om Sayed', role: 'Agricultrice, porte-parole des exploitants de la ceinture agricole', disposition: 'neutre' },
    { id: 'tarek', nom: 'Cap. Tarek El-Shazly', role: 'Chef de la protection civile locale', disposition: 'alliee' },
    { id: 'nour', nom: 'Nour Hassan', role: 'Coordinatrice des jeunes volontaires du Croissant-Rouge', disposition: 'neutre' },
  ],
  actes: [
    {
      id: 'acte1',
      titre: 'ACTE 1 — 72 heures avant',
      soustitre: 'Awareness',
      intro:
        "La trajectoire de la tempête est incertaine (60 % d'impact direct). Chaque heure de " +
        "préparation vaut dix heures de réponse — mais chaque mesure préventive a un coût politique " +
        "si la tempête dévie. 3 actions.",
      actionsMax: 3,
      noeuds: [
        {
          id: 'E1', titre: 'La décision d\'alerte', lieu3d: 'centre_operationnel',
          contexte: 'Modèles météo : 60 % d\'impact direct, surcote estimée 1,2 à 1,8 m, au-dessus de la crête de digue au secteur Est. L\'an dernier, une évacuation pour rien a coûté cher en crédibilité.',
          replique: 'Tarek : « À 72 h je peux tout faire. À 24 h je peux presque rien. Dites-moi maintenant ce que je prépare — et assumez que la météo, elle, ne vous dira jamais merci. »',
          options: [
            {
              label: 'Alerte graduée : pré-positionnement + évacuation volontaire anticipée + message public sur l\'incertitude (« 60 %, voici ce que ça veut dire »)',
              effets: [{ ressource: 'BUD', delta: -15, quand: 'immediat' }, { ressource: 'SEC', delta: 15, quand: 'immediat' }],
              competences: { C1: 2, C5: 2, C4: 1 },
              feedback: "Le cœur de la préparation est de décider sur les probabilités, pas sur les certitudes. Un bon choix peut mal tourner, il reste un bon choix.",
              tirage: { proba: 0.6, siReussi: [{ ressource: 'CONF', delta: 5 }], siEchoue: [{ ressource: 'CONF', delta: -8 }] },
              marqueurs: ['alerte_graduee'],
              debloque: ['carte_eg_1'],
              suite: 'Débloque l\'option informée E4-C.',
            },
            {
              label: 'Attendre la confirmation météo à 36 h pour ne rien engager « pour rien »',
              effets: [{ ressource: 'SEC', delta: -10, quand: 'immediat' }],
              competences: { C5: -2, C2: -1 },
              feedback: "En préparation, l'attente n'est pas neutre — elle transfère le coût de la décision vers la fenêtre où les options sont les plus chères et les moins efficaces.",
              marqueurs: ['attente_confirmation'],
              suite: 'Acte compressé : les mesures coûteront 50 % de plus.',
            },
            {
              label: 'Alerte générale maximale immédiate, évacuation obligatoire de toute la ville',
              effets: [{ ressource: 'BUD', delta: -35, quand: 'immediat' }, { ressource: 'CONF', delta: -12, quand: 'immediat' }, { ressource: 'SEC', delta: 8, quand: 'immediat' }],
              competences: { C2: -1, C1: -1 },
              feedback: "La sur-réaction indiscriminée n'est pas de la prudence, c'est un défaut de ciblage. La proportionnalité est une compétence, pas une timidité.",
              marqueurs: ['fatigue_alerte'],
              suite: 'À l\'acte 2, le taux de suivi des consignes baisse de 20 %.',
            },
          ],
        },
        {
          id: 'E2', titre: 'Ezbet El-Sayadin ne bougera pas', lieu3d: 'ezbet',
          contexte: 'Le quartier informel des pêcheurs — 4 000 habitants, 1,5 m sous la crête de digue — refuse l\'évacuation.',
          replique: 'Abou Khaled : « L\'an dernier vous nous avez fait dormir dans un gymnase pour rien, et deux maisons ont été vidées pendant qu\'on n\'y était pas. Cette fois, celui qui veut nous faire partir marchera devant, et nous dira qui garde nos maisons. »',
          options: [
            {
              label: 'Négocier via les autorités du quartier : évacuation organisée par les pêcheurs + ronde de gardiennage + navette de retour quotidienne',
              effets: [{ ressource: 'SEC', delta: 18, quand: 'immediat' }, { ressource: 'CONF', delta: 10, quand: 'immediat' }],
              competences: { C4: 2, C1: 1, C3: 1 },
              feedback: "Les refus d'évacuation sont rarement irrationnels — ils protègent quelque chose que le plan officiel ignore. Le savoir communautaire est une infrastructure de sécurité civile.",
              marqueurs: ['khaled_allie'],
              debloque: ['carte_eg_2'],
              suite: 'Les barques des pêcheurs sauveront des vies à l\'acte 2.',
            },
            {
              label: 'Évacuation forcée avec la police',
              effets: [{ ressource: 'SEC', delta: 8, quand: 'immediat' }, { ressource: 'CONF', delta: -18, quand: 'immediat' }],
              competences: { C4: -2 },
              feedback: "La contrainte fait fuir les gens du plan, pas du danger. Les non-évacués sont désormais cachés, donc introuvables pour les secours.",
              marqueurs: ['ezbet_hostile'],
              suite: 'À l\'acte 2, le sauvetage à Ezbet coûte le double d\'actions.',
            },
            {
              label: 'Respecter leur choix et concentrer les moyens ailleurs',
              effets: [],
              competences: { C2: -1, C5: -2 },
              feedback: "« Respecter le choix » d'une population dont la méfiance vient d'erreurs institutionnelles passées, c'est faire payer aux habitants la dette de l'institution.",
              marqueurs: ['ezbet_livre_a_lui_meme'],
              suite: 'Si la tempête frappe : événement « nuit noire à Ezbet » (sécurité -25).',
            },
          ],
        },
        {
          id: 'E3', titre: 'Quarante-huit heures pour la digue', lieu3d: 'digue_est',
          contexte: 'Karim a identifié trois points faibles mais les moyens ne couvrent qu\'un renforcement sérieux : le secteur Est (Ezbet), le port (économie), ou les terres agricoles de Fatma.',
          replique: 'Karim : « Je vous préviens : je peux en tenir un, en bricoler un deuxième, pas les trois. Et le bricolage, par vent de force 9, ça s\'appelle un mensonge en sacs de sable. »',
          options: [
            {
              label: 'Renforcement sérieux du secteur Est (vies humaines) + pompes mobiles pré-positionnées au port',
              effets: [{ ressource: 'BUD', delta: -20, quand: 'immediat' }, { ressource: 'INF', delta: 15, quand: 'immediat' }, { ressource: 'SEC', delta: 12, quand: 'immediat' }],
              competences: { C2: 2, C3: 1, C4: 1 },
              feedback: "Priorisation canonique (vies > biens) avec un amortisseur intelligent pour le deuxième rang. Annoncer aux perdants qu'ils sont les perdants, avant, rend la priorisation socialement tenable.",
              debloque: ['carte_eg_3'],
              suite: 'Pertes économiques modérées au port, assumées et annoncées à l\'avance.',
            },
            {
              label: 'Protéger le port et les entrepôts (« sans économie, pas de reconstruction »)',
              effets: [{ ressource: 'BUD', delta: -20, quand: 'immediat' }, { ressource: 'INF', delta: 10, quand: 'immediat' }],
              competences: { C2: -2, C3: -1 },
              feedback: "L'argument économique est réel — mais il inverse l'ordre du triage. Certaines équations n'ont pas de bonne réponse, seulement une réponse défendable.",
              marqueurs: ['breche_est'],
              suite: 'Brèche au secteur Est à l\'acte 2 : événement majeur à Ezbet.',
            },
            {
              label: 'Répartir les moyens équitablement sur les trois points',
              effets: [{ ressource: 'INF', delta: 4, quand: 'immediat' }],
              competences: { C2: -2, C1: -1 },
              feedback: "Même leçon que la nuit de l'hôpital pendant la sécheresse, en miroir — le saupoudrage sous contrainte forte garantit l'échec partout.",
              marqueurs: ['double_breche'],
              suite: 'Deux brèches sur trois.',
            },
          ],
        },
      ],
    },
    {
      id: 'acte2',
      titre: 'ACTE 2 — La nuit de la tempête',
      soustitre: 'Application, temps compté',
      intro:
        "Chaque décision est chronométrée. L'absence de décision applique l'option par défaut (la " +
        "pire). Pluie battante, eau montante, éclairage d'urgence.",
      actionsMax: 3,
      noeuds: [
        {
          id: 'E4', titre: 'Trois appels, deux équipes', lieu3d: 'centre_operationnel',
          contexte: 'La surcote atteint 1,6 m. Trois appels simultanés : un bus scolaire bloqué (30 personnes), la station de pompage qui protège l\'hôpital, des personnes âgées bloquées à Ezbet.',
          replique: 'Tarek, radio en main : « Deux équipes, trois feux. Vous me donnez l\'ordre dans la minute ou je décide moi-même — et si je décide moi-même, c\'est vous qui l\'expliquerez demain. »',
          timerSec: 60,
          optionParDefaut: 2,
          options: [
            {
              label: 'Équipe 1 sur le bus ; équipe 2 sur la station de pompage ; les pêcheurs d\'Abou Khaled sur les personnes âgées',
              effets: [{ ressource: 'SEC', delta: 15, quand: 'immediat' }, { ressource: 'INF', delta: 8, quand: 'immediat' }],
              competences: { C2: 2, C3: 2, C1: 1 },
              feedback: "Le raisonnement attendu est « immédiateté × ampleur × réversibilité ». La capacité communautaire construite à l'acte 1 est une ressource de secours réelle.",
              debloque: ['carte_eg_4'],
              suite: 'Sans allié à Ezbet (E2-A), les personnes âgées attendent 2 h de plus.',
            },
            {
              label: 'Les deux équipes sur le bus (l\'image de 30 personnes prime tout)',
              effets: [{ ressource: 'SEC', delta: 10, quand: 'immediat' }, { ressource: 'SEC', delta: -12, quand: 'finActe' }, { ressource: 'INF', delta: -15, quand: 'immediat' }],
              competences: { C2: -1, C1: -1 },
              feedback: "La « tyrannie du visible » — le danger filmable capte les moyens du danger différé. Compter les moyens nécessaires (pas disponibles) par mission est un réflexe qui s'apprend.",
              suite: 'Séquence hôpital inondé : évacuation de nuit des patients.',
            },
            {
              label: 'Les deux équipes sur la station (le calcul froid du plus grand nombre)',
              effets: [{ ressource: 'INF', delta: 12, quand: 'immediat' }],
              competences: { C3: 1, C2: -1, C4: -1 },
              feedback: "L'utilitarisme pur ignore une variable réelle : la légitimité. La confiance est la ressource qui fait suivre la prochaine consigne d'évacuation.",
              tirage: { proba: 0.5, siEchoue: [{ ressource: 'SEC', delta: -15 }, { ressource: 'CONF', delta: -20 }] },
              suite: 'Le bus : sauvetage improvisé par des civils, issue incertaine.',
            },
          ],
        },
        {
          id: 'E5', titre: 'Le refuge déborde', lieu3d: 'ecole_refuge',
          contexte: 'L\'école-refuge prévue pour 600 personnes en accueille 1 100. Nour et ses 120 volontaires sont dehors, jamais intégrés au plan.',
          replique: 'Nour : « J\'ai 120 personnes formées aux premiers secours et à la gestion d\'abris, et vos agents nous demandent des badges qu\'on n\'a pas. Donnez-nous un périmètre ou renvoyez-nous — mais décidez. »',
          timerSec: 60,
          optionParDefaut: 1,
          options: [
            {
              label: 'Intégrer les volontaires avec mandat clair : enregistrement, distribution, coin enfants, remontée sanitaire toutes les 2 h',
              effets: [{ ressource: 'SEC', delta: 10, quand: 'immediat' }, { ressource: 'CONF', delta: 12, quand: 'immediat' }],
              competences: { C3: 2, C4: 1, C5: 1 },
              feedback: "Le goulot d'un refuge n'est presque jamais l'espace, c'est l'organisation de l'information. Les volontaires formés traitent ce goulot — à condition d'un mandat précis.",
              marqueurs: ['nour_alliee'],
              debloque: ['carte_eg_5'],
              suite: 'Débloque le réseau de Nour pour l\'acte 3.',
            },
            {
              label: 'Refuser (responsabilité juridique en cas d\'incident avec des volontaires non badgés)',
              effets: [{ ressource: 'SEC', delta: -8, quand: 'immediat' }, { ressource: 'CONF', delta: -10, quand: 'immediat' }],
              competences: { C3: -2, C4: -1 },
              feedback: "Le risque juridique est réel, mais il se gère — il ne se fuit pas. La rigidité procédurale en crise est une forme de défaillance.",
              marqueurs: ['nour_ecartee'],
              suite: 'L\'acte 3 se joue sans le réseau de volontaires.',
            },
            {
              label: 'Ouvrir un deuxième site en urgence dans la mosquée voisine, sans coordination',
              effets: [{ ressource: 'SEC', delta: 3, quand: 'immediat' }, { ressource: 'CONF', delta: -8, quand: 'immediat' }],
              competences: { C3: -1 },
              feedback: "Ajouter de la capacité sans ajouter de la coordination déplace le problème en le rendant invisible. Un registre unique avant un deuxième toit.",
              suite: '14 signalements de proches « introuvables », retrouvés au matin.',
            },
          ],
        },
        {
          id: 'E6', titre: 'La vidéo des vannes', lieu3d: 'centre_operationnel',
          contexte: 'Une vidéo virale affirme que les autorités ont ouvert les vannes du canal pour sauver les beaux quartiers en noyant Ezbet. C\'est faux, mais des jeunes se rassemblent près du canal, en pleine tempête.',
          replique: 'Nour appelle : « Mes volontaires me montrent la vidéo. Si personne ne parle dans l\'heure, il y aura du monde au canal, sous la tempête. »',
          timerSec: 60,
          optionParDefaut: 2,
          options: [
            {
              label: 'Envoyer immédiatement Karim + Abou Khaled ou Nour filmer ensemble la vanne fermée, avec les relevés de marée, diffusion sur les mêmes canaux que la rumeur',
              effets: [{ ressource: 'CONF', delta: 10, quand: 'immediat' }, { ressource: 'SEC', delta: 5, quand: 'immediat' }],
              competences: { C4: 2, C2: 1 },
              feedback: "La réfutation efficace combine trois choses : la vitesse, le bon messager, et le même canal que la rumeur. Un communiqué officiel sur le site du gouvernorat coche zéro case sur trois.",
              debloque: ['carte_eg_6'],
              suite: 'Le rassemblement se disperse.',
            },
            {
              label: 'Couper Internet mobile sur la zone « pour empêcher la panique »',
              effets: [{ ressource: 'CONF', delta: -20, quand: 'immediat' }, { ressource: 'SEC', delta: -10, quand: 'immediat' }],
              competences: { C4: -2, C1: -2 },
              feedback: "Couper le canal coupe aussi les secours qui passent par lui, et transforme la rumeur en certitude. Le remède autoritaire à la désinformation valide la désinformation.",
              marqueurs: ['black_out'],
              suite: 'Marqueur « black-out » : tous les nœuds suivants perdent l\'option de diffusion large.',
            },
            {
              label: 'Traiter ça après la tempête, « on gère les vies d\'abord »',
              effets: [{ ressource: 'SEC', delta: -12, quand: 'immediat' }],
              competences: { C1: -1, C2: -1 },
              feedback: "Classer la désinformation comme « problème de communication » secondaire est l'erreur de catégorie du polycrisis : l'information est une fonction vitale au même titre que l'eau.",
              suite: '60 personnes au canal, 2 blessés, une équipe détournée.',
            },
          ],
        },
      ],
    },
    {
      id: 'acte3',
      titre: 'ACTE 3 — L\'eau se retire, le sel reste',
      soustitre: 'Action',
      intro:
        "Le bilan de la nuit s'affiche. Budget de reconstruction débloqué, 3 actions.",
      actionsMax: 3,
      noeuds: [
        {
          id: 'E7', titre: 'Les terres de Fatma', lieu3d: 'delta_agricole',
          contexte: 'L\'inondation a accéléré l\'intrusion saline : 800 hectares sont durablement dégradés. Fatma parle au nom de 300 familles d\'exploitants.',
          replique: 'Fatma : « La tempête, on la raconte. Le sel, on le tait — il ne fait pas d\'images. Mes enfants partiront à la capitale si ces terres meurent. Alors : vous indemnisez la récolte perdue, ou vous sauvez le métier ? »',
          options: [
            {
              label: 'Programme de transition : cultures tolérantes au sel + drainage rénové + aquaculture en étangs saumâtres, co-conçu avec les exploitants',
              effets: [{ ressource: 'BUD', delta: -30, quand: 'immediat' }, { ressource: 'CONF', delta: 15, quand: 'immediat' }],
              competences: { C5: 2, C1: 1, C3: 1 },
              feedback: "Face à un changement irréversible, la résilience n'est pas la restauration de l'ancien état mais la transformation vers un état viable — l'adaptation transformationnelle du GIEC.",
              debloque: ['carte_eg_7'],
              suite: 'Revenus agricoles restaurés à 80 % en épilogue ; score ODD 2 maximal.',
            },
            {
              label: 'Indemnisation simple de la récolte perdue',
              effets: [{ ressource: 'BUD', delta: -18, quand: 'immediat' }, { ressource: 'CONF', delta: 5, quand: 'immediat' }],
              competences: { C5: -1 },
              feedback: "L'indemnisation compense un événement ; elle ne répond pas à une tendance. Indemniser chaque année une terre qui meurt structurellement, c'est financer l'exode à tempérament.",
              suite: 'En épilogue, 40 % des familles ont quitté la région.',
            },
            {
              label: 'Renvoyer le dossier au ministère de l\'Agriculture (« pas notre mandat »)',
              effets: [{ ressource: 'CONF', delta: -12, quand: 'immediat' }],
              competences: { C1: -2, C5: -2 },
              feedback: "Le renvoi de compétence est exact juridiquement et faux systémiquement — la crise ignorée en amont revient en aval sous une autre forme.",
              suite: 'La crise agricole revient en crise urbaine : exode vers le centre-ville.',
            },
          ],
        },
        {
          id: 'E8', titre: 'Reconstruire la côte', lieu3d: 'conseil_gouvernorat',
          contexte: 'Le budget de reconstruction est arbitré. Trois stratégies côtières, avec leur horizon temporel affiché (10, 30, 50 ans).',
          replique: 'Mona : « La capitale regarde. Il y aura un ruban à couper — la question est de savoir si on coupe un ruban pour les caméras ou pour vos petits-enfants. Proposez. »',
          options: [
            {
              label: 'Défense hybride : cordon dunaire + roselières et brise-lames immergés + rehaussement ciblé de la digue Est + zonage interdisant les constructions nouvelles',
              effets: [{ ressource: 'BUD', delta: -40, quand: 'immediat' }, { ressource: 'INF', delta: 20, quand: 'immediat' }, { ressource: 'SEC', delta: 10, quand: 'immediat' }],
              competences: { C5: 2, C1: 1, C3: 1 },
              feedback: "Les solutions fondées sur la nature ne remplacent pas l'ingénierie, elles en réduisent la charge ; le zonage est la seule mesure gratuite qui évite de reconstruire la vulnérabilité au même endroit.",
              debloque: ['carte_eg_8'],
              suite: 'Score ODD 11/13 maximal ; coût d\'entretien faible en épilogue.',
            },
            {
              label: 'La grande digue en béton sur tout le front de mer, +2 m',
              effets: [{ ressource: 'BUD', delta: -70, quand: 'immediat' }, { ressource: 'INF', delta: 30, quand: 'immediat' }],
              competences: { C5: -1, C3: -1 },
              feedback: "Le « paradoxe de la digue » (levee effect) : plus la protection est imposante, plus on construit derrière, plus la défaillance future est catastrophique.",
              suite: 'Le débrief superpose les courbes de risque à 10/30/50 ans.',
            },
            {
              label: 'Relocalisation planifiée d\'Ezbet El-Sayadin vers un site rehaussé, co-conçue avec les habitants',
              effets: [{ ressource: 'BUD', delta: -50, quand: 'immediat' }, { ressource: 'SEC', delta: 20, quand: 'immediat' }],
              competences: { C5: 2, C4: 2 },
              feedback: "La relocalisation est la mesure d'adaptation la plus efficace et la plus difficile — elle n'est possible qu'adossée à un capital de confiance construit avant.",
              conditions: { marqueurs: ['khaled_allie'], ressourceMin: { CONF: 55 } },
              debloque: ['carte_eg_9'],
              noteVerrouillage: 'Personne ne vous suivra.',
              suite: 'Épilogue spécifique avec le nouveau quartier.',
            },
          ],
        },
        {
          id: 'E9', titre: 'Que la prochaine tempête trouve une ville prête', lieu3d: 'centre_operationnel',
          contexte: 'Nœud d\'institutionnalisation : alerte précoce communautaire, exercice annuel d\'évacuation, intégration officielle des volontaires et des pêcheurs au plan de crise.',
          replique: 'Tarek : « Cette nuit, on a eu de la chance et des gens bien. La chance ne se planifie pas. Les gens bien, si. »',
          options: [
            {
              label: 'Le paquet complet : alerte précoce multicanal + exercice annuel + volontaires et pêcheurs intégrés au plan avec statut, formation et matériel',
              effets: [{ ressource: 'BUD', delta: -15, quand: 'immediat' }],
              competences: { C5: 2, C4: 1 },
              feedback: "Le cadre de Sendai (Build Back Better) et la boucle d'amélioration 53001 réunis. L'épilogue matérialise ce que « préparation » veut dire en minutes et en vies.",
              marqueurs: ['memoire_institutionnalisee_eg'],
              debloque: ['carte_eg_10'],
              suite: 'L\'épilogue simule la tempête suivante : réponse 3 fois plus rapide.',
            },
            {
              label: 'Alerte précoce technique seulement (sirènes, SMS), sans volet communautaire',
              effets: [{ ressource: 'BUD', delta: -8, quand: 'immediat' }],
              competences: { C5: 1, C4: -1 },
              feedback: "Une sirène dit « partez » ; un voisin formé dit « partez, je t'aide, voilà où ». Les systèmes d'alerte sauvent par leur dernier maillon humain.",
              suite: 'Épilogue mitigé : le taux de suivi des consignes reste moyen.',
            },
            {
              label: 'Rien de formel — le budget est épuisé et « on verra l\'an prochain »',
              effets: [],
              competences: { C5: -2 },
              feedback: "Miroir exact du dilemme de la sécheresse : les crises passent ; les capacités restent ou se perdent.",
              suite: 'Épilogue dégradé : la tempête suivante rejoue l\'acte 2 avec -30 % d\'efficacité.',
            },
          ],
        },
      ],
    },
  ],
};

export const SCENARIOS = { maroc: MAROC, egypte: EGYPTE, canicule: CANICULE };
