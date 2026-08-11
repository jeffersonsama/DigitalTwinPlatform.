export const globalStats = {
  countriesConnected: 57,
  participantsOnline: 31420,
  participantsDelta: 2345,
  sessionsToday: 28,
  ideasShared: 1243,
  projectsInitiated: 128,
  challengesCompleted: 342,
}

export const topCountries = [
  { name: 'Türkiye', value: 2451, flag: '🇹🇷' },
  { name: 'Indonesia', value: 1892, flag: '🇮🇩' },
  { name: 'Morocco', value: 1765, flag: '🇲🇦' },
  { name: 'Egypt', value: 1456, flag: '🇪🇬' },
  { name: 'Saudi Arabia', value: 1234, flag: '🇸🇦' },
  { name: 'Nigeria', value: 1102, flag: '🇳🇬' },
]

// [lng, lat] coordinates for active-country markers on the world map
export const activeCountryMarkers = [
  { name: 'Türkiye', coordinates: [35.2, 39.0], value: 2451, activity: 'high' as const },
  { name: 'Indonesia', coordinates: [113.9, -0.8], value: 1892, activity: 'high' as const },
  { name: 'Morocco', coordinates: [-7.1, 31.8], value: 1765, activity: 'high' as const },
  { name: 'Egypt', coordinates: [30.8, 26.8], value: 1456, activity: 'medium' as const },
  { name: 'Saudi Arabia', coordinates: [45.1, 23.9], value: 1234, activity: 'medium' as const },
  { name: 'Nigeria', coordinates: [8.7, 9.1], value: 1102, activity: 'medium' as const },
  { name: 'Pakistan', coordinates: [69.3, 30.4], value: 980, activity: 'medium' as const },
  { name: 'Malaysia', coordinates: [101.9, 4.2], value: 870, activity: 'low' as const },
  { name: 'Senegal', coordinates: [-14.5, 14.5], value: 610, activity: 'low' as const },
  { name: 'Jordan', coordinates: [36.2, 30.6], value: 540, activity: 'low' as const },
  { name: 'Kazakhstan', coordinates: [66.9, 48.0], value: 720, activity: 'medium' as const },
  { name: 'Bangladesh', coordinates: [90.4, 23.7], value: 690, activity: 'medium' as const },
  { name: 'UAE', coordinates: [54.0, 24.0], value: 830, activity: 'low' as const },
  { name: 'Tunisia', coordinates: [9.5, 34.0], value: 430, activity: 'low' as const },
]

export const crisisTimeline = [
  { time: '09:00', label: 'Opening Ceremony', status: 'done' as const },
  { time: '10:30', label: 'Keynote Speech', status: 'done' as const },
  { time: '12:00', label: 'Panel Discussion', status: 'live' as const },
  { time: '14:00', label: 'Simulation Exercise', status: 'upcoming' as const },
  { time: '16:00', label: 'Youth Session', status: 'upcoming' as const },
]

export const speakers = [
  { name: 'Dr. Salim A.', role: 'Keynote', initials: 'SA' },
  { name: 'Amina K.', role: 'Panelist', initials: 'AK' },
  { name: 'Yusuf R.', role: 'Panelist', initials: 'YR' },
  { name: 'Fatima Z.', role: 'Moderator', initials: 'FZ' },
  { name: 'Omar H.', role: 'Expert', initials: 'OH' },
]

export const liveChat = [
  { user: 'Layla', text: 'Thank you for this insightful session!', mine: false },
  { user: 'Karim', text: 'Very insightful discussion on resilience.', mine: false },
  { user: 'You', text: 'How can we apply this in rural areas?', mine: true },
  { user: 'Dr. Salim', text: 'Great question — start with local networks.', mine: false },
  { user: 'Noor', text: 'We need more examples like this.', mine: false },
]

export const aiKeyPoints = [
  'Importance of cross-border collaboration',
  'Early warning systems save lives and property',
  'Education is a key pillar of resilience',
  'Youth engagement drives long-term change',
]

export const aiDecisions = [
  'Strengthen institutional partnerships',
  'Invest in risk knowledge sharing',
  'Promote youth-led resilience programs',
]

export const twinBuildings = [
  { id: 'hospital', name: 'Hospital', status: 'operational', x: 20, y: 30 },
  { id: 'power', name: 'Power Plant', status: 'operational', x: 72, y: 22 },
  { id: 'water', name: 'Water Plant', status: 'operational', x: 78, y: 52 },
  { id: 'government', name: 'Government Center', status: 'operational', x: 60, y: 66 },
  { id: 'school', name: 'School', status: 'operational', x: 24, y: 60 },
  { id: 'museum', name: 'Museum', status: 'warning', x: 44, y: 42 },
  { id: 'telemetry', name: 'Telemetry Center', status: 'operational', x: 14, y: 78 },
  { id: 'river', name: 'River', status: 'flood-risk', x: 88, y: 80 },
] as const

export const knowledgeCategories = [
  'All',
  'Case Studies',
  'Reports',
  'Tools',
  'Training',
  'Policies',
]

export const featuredResources = [
  {
    title: 'Early Warning Systems',
    tag: 'Best Practices',
    type: 'Report',
    image: '/images/kh-early-warning.png',
  },
  {
    title: 'Community Resilience',
    tag: 'Case Study',
    type: 'Case Study',
    image: '/images/kh-community.png',
  },
  {
    title: 'Crisis Communication',
    tag: 'Guidelines',
    type: 'Tool',
    image: '/images/kh-crisis-comms.png',
  },
  {
    title: 'Youth in Action',
    tag: 'Training Module',
    type: 'Training',
    image: '/images/kh-youth.png',
  },
]

export const recentResources = [
  { title: 'Flood Risk Governance Framework', type: 'Report', country: 'Indonesia', lang: 'EN' },
  { title: 'Community First Responder Toolkit', type: 'Tool', country: 'Morocco', lang: 'FR' },
  { title: 'Earthquake Preparedness Curriculum', type: 'Training', country: 'Türkiye', lang: 'EN' },
  { title: 'National Resilience Policy Brief', type: 'Policy', country: 'Egypt', lang: 'AR' },
  { title: 'Drought Early Warning Case Study', type: 'Case Study', country: 'Nigeria', lang: 'EN' },
]

export const passport = {
  name: 'Ahmed Benali',
  role: 'Civil Protection Officer',
  country: 'Morocco',
  level: 4,
  levelTitle: 'Resilience Builder',
  xp: 2450,
  xpMax: 3300,
  stats: { missions: 12, connections: 87, certificates: 6 },
}

export const passportActivity = [
  { title: 'Completed Simulation: Flood Scenario', meta: 'Mission', xp: 150 },
  { title: 'Attended Panel: Risk Governance', meta: 'Session', xp: 100 },
  { title: 'Earned Badge: Rapid Responder', meta: 'Achievement', xp: 200 },
  { title: 'Connected with 5 delegates', meta: 'Networking', xp: 50 },
]

export const commandStreams = ['Main Hall', 'Workshop A', 'Workshop B', 'Expo Hall']

export const aiSuggestions = [
  'Find sessions about climate adaptation',
  'Who are the experts on flood management?',
  'Summarize the latest keynote speech',
  'Translate this to Arabic',
]
