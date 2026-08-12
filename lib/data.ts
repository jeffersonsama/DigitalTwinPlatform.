// Remaining mock data for pages/features not yet backed by the real database
// this pass: Live (chat/speakers/AI summary), Crisis Simulation (self-contained
// client state machine), Command Center (decorative ops dashboard), Poster
// Studio, and the AI Concierge's canned suggestions.

export const topCountries = [
  { name: 'Türkiye', value: 2451, flag: '🇹🇷' },
  { name: 'Indonesia', value: 1892, flag: '🇮🇩' },
  { name: 'Morocco', value: 1765, flag: '🇲🇦' },
  { name: 'Egypt', value: 1456, flag: '🇪🇬' },
  { name: 'Saudi Arabia', value: 1234, flag: '🇸🇦' },
  { name: 'Nigeria', value: 1102, flag: '🇳🇬' },
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

export const posterTemplates = [
  { id: 'summit', label: 'Summit Announcement', accent: 'from-icesco to-icesco-blue' },
  { id: 'session', label: 'Session Highlight', accent: 'from-icesco-teal to-cyan-accent' },
  { id: 'quote', label: 'Speaker Quote', accent: 'from-forum-orange to-icesco' },
  { id: 'stat', label: 'Impact Stat', accent: 'from-icesco-blue to-navy-900' },
]

export const commandStreams = ['Main Hall', 'Workshop A', 'Workshop B', 'Expo Hall']

export const aiSuggestions = [
  'Find sessions about climate adaptation',
  'Who are the experts on flood management?',
  'Summarize the latest keynote speech',
  'Translate this to Arabic',
]
