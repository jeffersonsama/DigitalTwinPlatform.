// Les cartes de savoir — collection transversale (section 6.3).
// Dix cartes par scénario, débloquées par les marqueurs `debloque` des options de dialogue.

export const KNOWLEDGE_CARDS = {
  carte_ma_1: {
    id: 'carte_ma_1', pays: 'maroc', titre: 'Diagnostic systémique',
    principe: "Une crise se lit par ses interconnexions, pas par son symptôme le plus visible. La qualité du diagnostic initial conditionne toutes les décisions suivantes.",
    ancrage: 'ISO/UNDP 53001 — clause 4 (contexte de l\'organisme)',
  },
  carte_ma_2: {
    id: 'carte_ma_2', pays: 'maroc', titre: 'Parties prenantes',
    principe: "Ceux qui subissent la décision doivent participer à la décision — non par vertu, mais parce qu'ils détiennent l'information et l'exécution.",
    ancrage: 'ISO/UNDP 53001 — clause 4.2',
  },
  carte_ma_3: {
    id: 'carte_ma_3', pays: 'maroc', titre: 'Intégrité de l\'information',
    principe: "En crise, l'information dirige les corps. La transparence vérifiable bat le démenti d'autorité.",
    ancrage: 'Thème YKF 2026 — érosion de l\'intégrité de l\'information',
  },
  carte_ma_4: {
    id: 'carte_ma_4', pays: 'maroc', titre: 'Équité procédurale',
    principe: "Une règle dure mais claire, publiée et identique pour tous est mieux acceptée qu'une optimisation opaque.",
    ancrage: 'Recherche en psychologie de la justice procédurale',
  },
  carte_ma_5: {
    id: 'carte_ma_5', pays: 'maroc', titre: 'Le diagnostic paie',
    principe: "Réparer les fuites est moins spectaculaire qu'un grand plan, mais attaque le stock du problème, pas son flux médiatique. C'est la différence entre gérer la crise et gérer l'image de la crise.",
    ancrage: 'Lien causal M1-A → M4-C',
  },
  carte_ma_6: {
    id: 'carte_ma_6', pays: 'maroc', titre: 'La jeunesse comme capacité',
    principe: "Les jeunes organisés ne sont pas un public à rassurer mais une capacité de réponse à mandater : information, refuges, dernier kilomètre.",
    ancrage: 'Objectifs du Youth Knowledge Forum',
  },
  carte_ma_7: {
    id: 'carte_ma_7', pays: 'maroc', titre: 'Acheter du temps, pas de la dépendance',
    principe: "Le privé en crise est un outil, pas une solution — la clé est le design du contrat : durée courte, ciblage des plus vulnérables, transparence tarifaire.",
    ancrage: 'Doctrine de contractualisation de crise',
  },
  carte_ma_8: {
    id: 'carte_ma_8', pays: 'maroc', titre: 'Triage assumé',
    principe: "Vie humaine > besoins vitaux > activité économique. Ce qui distingue un bon gestionnaire, c'est d'assumer et d'expliquer le perdant du jour au lieu de le laisser l'apprendre par la rumeur.",
    ancrage: 'Doctrine de sécurité civile (adaptée)',
  },
  carte_ma_9: {
    id: 'carte_ma_9', pays: 'maroc', titre: 'Reconstruire mieux (Build Back Better)',
    principe: "La résilience hydrique se construit sur trois leviers combinés : réutiliser (offre), sobriété (demande), signal-prix (comportement). Chacun seul échoue ; ensemble ils se renforcent.",
    ancrage: 'Cadre de Sendai',
  },
  carte_ma_10: {
    id: 'carte_ma_10', pays: 'maroc', titre: 'La boucle d\'amélioration continue',
    principe: "Évaluer, corriger, exercer, répéter : la capacité de crise est un muscle institutionnel, pas un document.",
    ancrage: 'ISO/UNDP 53001 — clauses 9 et 10 ; cadre de Sendai, priorité 4',
  },
  carte_eg_1: {
    id: 'carte_eg_1', pays: 'egypte', titre: 'Décider sous incertitude',
    principe: "On évalue une décision sur l'information disponible au moment du choix, pas sur le résultat du tirage. Un bon choix peut mal tourner ; il reste un bon choix.",
    ancrage: 'Théorie de la décision — distinction décision/résultat',
  },
  carte_eg_2: {
    id: 'carte_eg_2', pays: 'egypte', titre: 'Le dernier kilomètre de la confiance',
    principe: "Les refus d'évacuation sont rarement irrationnels — ils protègent quelque chose que le plan officiel ignore. Le savoir communautaire est une infrastructure de sécurité civile.",
    ancrage: 'La jeunesse et les communautés comme capacité',
  },
  carte_eg_3: {
    id: 'carte_eg_3', pays: 'egypte', titre: 'Protéger, amortir, assumer',
    principe: "Priorisation canonique (vies > biens) avec un amortisseur intelligent pour le deuxième rang. Annoncer aux perdants qu'ils sont les perdants, avant, rend la priorisation socialement tenable.",
    ancrage: 'Doctrine de sécurité civile — immédiateté, ampleur, réversibilité',
  },
  carte_eg_4: {
    id: 'carte_eg_4', pays: 'egypte', titre: 'Immédiateté, ampleur, réversibilité',
    principe: "La grille de triage : traiter d'abord ce qui est immédiat, massif et irréversible. Compter les moyens nécessaires par mission, pas les moyens disponibles.",
    ancrage: 'Doctrine de sécurité civile (adaptée)',
  },
  carte_eg_5: {
    id: 'carte_eg_5', pays: 'egypte', titre: 'L\'information est le premier secours',
    principe: "Le goulot d'un refuge n'est presque jamais l'espace, c'est l'organisation de l'information. Les volontaires formés sont la ressource qui traite ce goulot, à condition d'un mandat précis.",
    ancrage: 'Objectifs du Youth Knowledge Forum',
  },
  carte_eg_6: {
    id: 'carte_eg_6', pays: 'egypte', titre: 'Le bon messager sur le bon canal',
    principe: "La réfutation efficace combine trois choses : la vitesse, le bon messager, et le même canal que la rumeur.",
    ancrage: 'Thème YKF 2026 — érosion de l\'intégrité de l\'information',
  },
  carte_eg_7: {
    id: 'carte_eg_7', pays: 'egypte', titre: 'S\'adapter n\'est pas restaurer',
    principe: "Face à un changement irréversible, la résilience est la transformation vers un état viable, pas le retour à l'état antérieur.",
    ancrage: 'GIEC — adaptation incrémentale vs transformationnelle',
  },
  carte_eg_8: {
    id: 'carte_eg_8', pays: 'egypte', titre: 'L\'infrastructure verte compte double',
    principe: "Les solutions fondées sur la nature ne remplacent pas l'ingénierie, elles en réduisent la charge ; le zonage est la seule mesure gratuite qui évite de reconstruire la vulnérabilité au même endroit.",
    ancrage: 'Le paradoxe de la digue — littérature sur la maladaptation',
  },
  carte_eg_9: {
    id: 'carte_eg_9', pays: 'egypte', titre: 'La confiance est un préinvestissement',
    principe: "La relocalisation est la mesure d'adaptation la plus efficace et la plus difficile — elle n'est possible qu'adossée à un capital de confiance construit avant.",
    ancrage: 'Équité procédurale et confiance institutionnelle',
  },
  carte_eg_10: {
    id: 'carte_eg_10', pays: 'egypte', titre: 'La préparation est la seule dépense qui rembourse',
    principe: "Une sirène dit « partez » ; un voisin formé dit « partez, je t'aide, voilà où ». Les crises passent ; les capacités restent ou se perdent.",
    ancrage: 'Cadre de Sendai, priorité 4 ; ISO/UNDP 53001 — clauses 9-10',
  },
  // Module CANICULE (Doc n°6 §4.3) — les deux cartes citées nommément par le document.
  carte_can_1: {
    id: 'carte_can_1', pays: 'canicule', titre: "L'îlot de chaleur urbain",
    principe: "La chaleur n'est pas répartie également dans une ville : bitume, densité et absence de végétation créent des écarts de plusieurs degrés entre quartiers d'une même agglomération — l'exposition au risque suit déjà les inégalités existantes.",
    ancrage: 'Climatologie urbaine — effet d\'îlot de chaleur urbain (UHI)',
  },
  carte_can_2: {
    id: 'carte_can_2', pays: 'canicule', titre: 'Les morts invisibles',
    principe: "Une canicule ne produit ni images ni décombres : ses victimes meurent seules, chez elles, sans que la crise soit jamais photographiée. L'invisibilité du risque est elle-même un facteur de risque — personne n'agit sur ce qu'il ne voit pas.",
    ancrage: 'Épidémiologie des vagues de chaleur — sous-déclaration de la mortalité',
  },
};
