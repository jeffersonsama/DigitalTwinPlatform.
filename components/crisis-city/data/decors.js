// Les décors de scène — Document n°4, section 4.2. 14 décors couvrant les 20 nœuds. Chaque
// décor décrit ses trois couches (fond/milieu/avant, 4.1) en contenu vectoriel — consommé par
// art/DecorArt.jsx — plus sa variante de crise (4.3 : un filtre + des couches d'effets, jamais
// une nouvelle illustration, sauf la digue qui gagne une vraie seconde composition).
export const DECORS = {
  ma_agence: {
    id: 'ma_agence', pays: 'maroc', titre: 'Agence du bassin hydraulique',
    fond: 'salle_reunion', milieu: 'cartes_bassin', avant: 'table_maquette',
    contenu: 'Salle de réunion technique : cartes du bassin au mur, courbes projetées, maquette du barrage.',
    effets: [],
  },
  ma_palmeraie: {
    id: 'ma_palmeraie', pays: 'maroc', titre: 'Palmeraie & forages',
    fond: 'montagnes_seches', milieu: 'rangees_palmiers', avant: 'goutte_a_goutte',
    contenu: "Rangées de palmiers, tuyaux de goutte-à-goutte, pompe de forage, montagnes sèches au fond.",
    effets: ['poussiere'],
    variante: { cle: 'acte2plus', description: 'Palette jaunie (acte 2+)', filtre: { saturation: -0.25, teinte: 18 } },
  },
  ma_radio: {
    id: 'ma_radio', pays: 'maroc', titre: 'Studio de Radio Aïn Sarra',
    fond: 'vitre_regie', milieu: 'console_micros', avant: 'horloge_onair',
    contenu: 'Console, micros à bonnette, vitre de régie, horloge ON AIR.',
    effets: ['neon'],
  },
  ma_cellule: {
    id: 'ma_cellule', pays: 'maroc', titre: 'Cellule de crise',
    fond: 'ecrans_muraux', milieu: 'tableaux_blancs', avant: 'gobelets_telephones',
    contenu: "Open space tendu : écrans muraux (carte réseau d'eau), tableaux blancs, gobelets, téléphones.",
    effets: [],
    variante: { cle: 'ecransRouges', description: 'Écrans passent au rouge (M4)', filtre: { teinte: -10, saturation: 0.2 } },
  },
  ma_parvis: {
    id: 'ma_parvis', pays: 'maroc', titre: 'Parvis de la commune',
    fond: 'facade_institutionnelle', milieu: 'place_minerale', avant: 'foule_contrejour',
    contenu: 'Place minérale, façade institutionnelle, banderoles, foule en contre-jour (silhouettes).',
    effets: [],
    variante: { cle: 'manifestation', description: 'Foule dense + drapeaux (manif)', densiteFoule: 2 },
  },
  ma_bureau: {
    id: 'ma_bureau', pays: 'maroc', titre: 'Bureau du coordinateur',
    fond: 'fenetre_ville', milieu: 'bureau_sobre', avant: 'dossier_aqua_atlas',
    contenu: 'Bureau sobre, dossier Aqua Atlas ouvert, fenêtre sur la ville poussiéreuse.',
    effets: ['poussiere'],
  },
  ma_hopital: {
    id: 'ma_hopital', pays: 'maroc', titre: 'Couloir d\'hôpital, de nuit',
    fond: 'chateau_eau_fenetre', milieu: 'brancards_portes', avant: 'signaletique_neons',
    contenu: "Couloir aux néons blafards, brancards, signalétique bleue, portes de bloc, château d'eau visible par la fenêtre.",
    effets: ['neon'],
    variante: { cle: 'secours', description: 'Éclairage de secours orange', filtre: { teinte: -30, luminosite: -0.1 }, effets: ['gyrophare'] },
  },
  ma_conseil: {
    id: 'ma_conseil', pays: 'maroc', titre: 'Salle du conseil communal',
    fond: 'drapeaux', milieu: 'hemicycle', avant: 'maquette_quinquennal',
    contenu: 'Hémicycle modeste, drapeaux, projecteur, maquette du plan quinquennal.',
    effets: [],
  },
  eg_centre: {
    id: 'eg_centre', pays: 'egypte', titre: 'Centre opérationnel',
    fond: 'mur_ecrans', milieu: 'tables_radio', avant: 'horloges',
    contenu: 'Salle de commandement : mur d\'écrans (carte côtière, météo), tables radio, horloges.',
    effets: [],
    variante: { cle: 'nuitAlerte', description: 'Nuit + pluie aux fenêtres + rouge d\'alerte (acte 2)', filtre: { luminosite: -0.3, teinte: -15 }, effets: ['pluie', 'gyrophare'] },
  },
  eg_port: {
    id: 'eg_port', pays: 'egypte', titre: 'Quartier des pêcheurs',
    fond: 'mer_fond', milieu: 'maisons_basses', avant: 'barques_filets',
    contenu: 'Ruelle d\'Ezbet : barques tirées au sec, filets suspendus, maisons basses, mer au fond.',
    effets: [],
  },
  eg_digue: {
    id: 'eg_digue', pays: 'egypte', titre: 'La digue Est',
    fond: 'mer_huile', milieu: 'enrochements', avant: 'sacs_sable_engin',
    contenu: 'Crête de digue en enrochements, mer d\'huile inquiétante, sacs de sable, engin de chantier.',
    effets: [],
    // Seule variante à mériter sa propre composition (4.3) plutôt qu'un simple filtre.
    variante: { cle: 'tempete', description: 'Version tempête : vagues, écume, ciel noir', secondeComposition: true, effets: ['pluie', 'vagues'] },
  },
  eg_ecole: {
    id: 'eg_ecole', pays: 'egypte', titre: 'École-refuge Al-Nahda',
    fond: 'panneaux_affichage', milieu: 'lits_de_camp', avant: 'familles_silhouettes',
    contenu: 'Gymnase : lits de camp en rangées, couvertures, familles (silhouettes), néons, panneaux d\'affichage.',
    effets: ['neon'],
  },
  eg_champs: {
    id: 'eg_champs', pays: 'egypte', titre: 'Champs salinisés',
    fond: 'horizon_delta', milieu: 'parcelles_mixtes', avant: 'canal_irrigation',
    contenu: 'Parcelles du Delta : moitié verte, moitié blanchie de sel, canal d\'irrigation, palmiers dattiers.',
    effets: [],
  },
  eg_conseil: {
    id: 'eg_conseil', pays: 'egypte', titre: 'Salle du conseil (maquette côtière)',
    fond: 'baie_vitree_port', milieu: 'maquette_littoral', avant: 'panneaux_strategie',
    contenu: 'Table de commandement avec maquette du littoral, trois panneaux de stratégie, baie vitrée sur le port.',
    effets: [],
  },
  // Module CANICULE (Doc n°6 §4.3) : seul décor vraiment nouveau — les 8 autres nœuds du module
  // réutilisent des lieux (et donc des décors) déjà illustrés, cf. NODE_DECOR ci-dessous.
  al_centre_moderne: {
    id: 'al_centre_moderne', pays: 'maroc', titre: 'Le centre moderne',
    fond: 'tours_verre', milieu: 'ecrans_energie', avant: 'climatiseurs',
    contenu: "Salle de contrôle du réseau électrique, baie vitrée sur les tours de verre du centre moderne, chaleur nocturne visible à la vibration de l'air.",
    effets: [],
    variante: { cle: 'nuitCanicule', description: 'Nuit à 41°, vibration de chaleur, rouge d\'alerte réseau', filtre: { luminosite: -0.2, teinte: 10 }, effets: ['lumiere'] },
  },
};

// Nœud -> décor (4.2). Le centre opérationnel égyptien et la cellule de crise marocaine sont
// mutualisés (4 et 2 nœuds) : réaliste, renouvelé par leurs variantes. Le module CANICULE
// réutilise 6 décors existants (les mêmes lieux, la même ville) et n'ajoute qu'un seul nouveau
// décor (`al_centre_moderne`), cohérent avec le pivot "une ville, ses théâtres déjà là".
export const NODE_DECOR = {
  M1: 'ma_agence', M2: 'ma_palmeraie', M3: 'ma_radio',
  M4: 'ma_cellule', M5: 'ma_parvis', M6: 'ma_bureau', M7: 'ma_hopital',
  M8: 'ma_conseil', M9: 'ma_cellule',
  E1: 'eg_centre', E2: 'eg_port', E3: 'eg_digue',
  E4: 'eg_centre', E5: 'eg_ecole', E6: 'eg_centre',
  E7: 'eg_champs', E8: 'eg_conseil', E9: 'eg_centre',
  N1: 'ma_cellule', N2: 'ma_hopital', N3: 'eg_port',
  N4: 'al_centre_moderne', N5: 'al_centre_moderne', N6: 'ma_radio',
  N7: 'ma_parvis', N8: 'ma_conseil', N9: 'ma_cellule',
};
