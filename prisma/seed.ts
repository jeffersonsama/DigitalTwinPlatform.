import 'dotenv/config'
import { PrismaClient } from '../lib/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcrypt'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

function at(offsetMs: number) {
  return new Date(Date.now() + offsetMs)
}

const COUNTRIES = [
  { name: 'Türkiye', isoCode: 'TR', flag: '🇹🇷', lat: 39.0, lng: 35.2 },
  { name: 'Indonesia', isoCode: 'ID', flag: '🇮🇩', lat: -0.8, lng: 113.9 },
  { name: 'Morocco', isoCode: 'MA', flag: '🇲🇦', lat: 31.8, lng: -7.1 },
  { name: 'Egypt', isoCode: 'EG', flag: '🇪🇬', lat: 26.8, lng: 30.8 },
  { name: 'Saudi Arabia', isoCode: 'SA', flag: '🇸🇦', lat: 23.9, lng: 45.1 },
  { name: 'Nigeria', isoCode: 'NG', flag: '🇳🇬', lat: 9.1, lng: 8.7 },
  { name: 'Pakistan', isoCode: 'PK', flag: '🇵🇰', lat: 30.4, lng: 69.3 },
  { name: 'Malaysia', isoCode: 'MY', flag: '🇲🇾', lat: 4.2, lng: 101.9 },
  { name: 'Senegal', isoCode: 'SN', flag: '🇸🇳', lat: 14.5, lng: -14.5 },
  { name: 'Jordan', isoCode: 'JO', flag: '🇯🇴', lat: 30.6, lng: 36.2 },
  { name: 'Kazakhstan', isoCode: 'KZ', flag: '🇰🇿', lat: 48.0, lng: 66.9 },
  { name: 'Bangladesh', isoCode: 'BD', flag: '🇧🇩', lat: 23.7, lng: 90.4 },
  { name: 'UAE', isoCode: 'AE', flag: '🇦🇪', lat: 24.0, lng: 54.0 },
  { name: 'Tunisia', isoCode: 'TN', flag: '🇹🇳', lat: 34.0, lng: 9.5 },
]

const USERS = [
  { name: 'ICESCO Admin', role: 'Forum Administrator', country: 'Morocco', email: 'admin@icesco.demo', accessRole: 'admin' as const },
  { name: 'Ahmed Benali', role: 'Civil Protection Officer', country: 'Morocco', email: 'ahmed.benali@icesco.demo', accessRole: 'admin' as const },
  { name: 'Layla Hassan', role: 'Disaster Risk Analyst', country: 'Egypt', email: 'layla.hassan@icesco.demo' },
  { name: 'Mehmet Yılmaz', role: 'Emergency Coordinator', country: 'Türkiye', email: 'mehmet.yilmaz@icesco.demo' },
  { name: 'Siti Rahmawati', role: 'Community Resilience Lead', country: 'Indonesia', email: 'siti.rahmawati@icesco.demo' },
  { name: 'Karim Diallo', role: 'Humanitarian Advisor', country: 'Senegal', email: 'karim.diallo@icesco.demo' },
  { name: 'Noor Al-Faisal', role: 'Policy Researcher', country: 'Saudi Arabia', email: 'noor.alfaisal@icesco.demo' },
  { name: 'Fatima Zahra', role: 'Youth Program Manager', country: 'Morocco', email: 'fatima.zahra@icesco.demo' },
  { name: 'Amina Bello', role: 'Early Warning Specialist', country: 'Nigeria', email: 'amina.bello@icesco.demo' },
  { name: 'Bilal Ahmed', role: 'Risk Analyst', country: 'Pakistan', email: 'bilal.ahmed@icesco.demo' },
  { name: 'Nurul Aisyah', role: 'Program Officer', country: 'Malaysia', email: 'nurul.aisyah@icesco.demo' },
  { name: 'Rania Odeh', role: 'Policy Advisor', country: 'Jordan', email: 'rania.odeh@icesco.demo' },
]

const SPEAKERS = [
  { name: 'Dr. Salim A.', role: 'Keynote', initials: 'SA' },
  { name: 'Amina K.', role: 'Panelist', initials: 'AK' },
  { name: 'Yusuf R.', role: 'Panelist', initials: 'YR' },
  { name: 'Fatima Z.', role: 'Moderator', initials: 'FZ' },
  { name: 'Omar H.', role: 'Expert', initials: 'OH' },
]

const TWIN_BUILDINGS = [
  { id: 'hospital', name: 'Hospital', status: 'operational' as const, x: 20, y: 30 },
  { id: 'power', name: 'Power Plant', status: 'operational' as const, x: 72, y: 22 },
  { id: 'water', name: 'Water Plant', status: 'operational' as const, x: 78, y: 52 },
  { id: 'government', name: 'Government Center', status: 'operational' as const, x: 60, y: 66 },
  { id: 'school', name: 'School', status: 'operational' as const, x: 24, y: 60 },
  { id: 'museum', name: 'Museum', status: 'warning' as const, x: 44, y: 42 },
  { id: 'telemetry', name: 'Telemetry Center', status: 'operational' as const, x: 14, y: 78 },
  { id: 'river', name: 'River', status: 'flood_risk' as const, x: 88, y: 80 },
]

async function main() {
  console.log('Seeding countries…')
  for (const c of COUNTRIES) {
    await prisma.country.upsert({ where: { isoCode: c.isoCode }, update: c, create: c })
  }

  console.log('Seeding users…')
  const passwordHash = await bcrypt.hash('demo1234', 10)
  const usersByName = new Map<string, { id: string }>()
  for (const u of USERS) {
    const accessRole = 'accessRole' in u ? u.accessRole : 'delegate'
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { accessRole },
      create: {
        email: u.email,
        passwordHash,
        name: u.name,
        role: u.role,
        accessRole,
        country: u.country,
        level: 4,
        levelTitle: 'Resilience Builder',
        xp: 2450,
        xpMax: 3300,
      },
    })
    usersByName.set(u.name, user)
  }
  const ahmed = usersByName.get('Ahmed Benali')!

  console.log('Seeding speakers…')
  const speakersByName = new Map<string, { id: string }>()
  for (const s of SPEAKERS) {
    const speaker = await prisma.speaker.upsert({
      where: { id: s.initials },
      update: s,
      create: { id: s.initials, ...s },
    })
    speakersByName.set(s.name, speaker)
  }

  console.log('Seeding program days + sessions…')
  const day1Date = new Date()
  const day2Date = at(DAY)
  const day3Date = at(2 * DAY)
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short' })

  await prisma.programDay.upsert({
    where: { id: 'day1' },
    update: { date: fmt(day1Date) },
    create: { id: 'day1', label: 'Day 1', date: fmt(day1Date) },
  })
  await prisma.programDay.upsert({
    where: { id: 'day2' },
    update: { date: fmt(day2Date) },
    create: { id: 'day2', label: 'Day 2', date: fmt(day2Date) },
  })
  await prisma.programDay.upsert({
    where: { id: 'day3' },
    update: { date: fmt(day3Date) },
    create: { id: 'day3', label: 'Day 3', date: fmt(day3Date) },
  })

  const timeLabel = (d: Date) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })

  type SessionSeed = {
    dayId: string
    title: string
    track: string
    room: string
    speaker: string
    durationMin: number
    startsAt: Date
  }

  const sessions: SessionSeed[] = [
    // Day 1 — timed relative to "now" so live/done/upcoming is always demonstrably correct
    { dayId: 'day1', title: 'Opening Ceremony', track: 'Plenary', room: 'Main Hall', speaker: 'Dr. Salim A.', durationMin: 45, startsAt: at(-3 * HOUR) },
    { dayId: 'day1', title: 'Keynote: Building Resilient Communities', track: 'Keynote', room: 'Main Hall', speaker: 'Amina K.', durationMin: 60, startsAt: at(-1.5 * HOUR) },
    { dayId: 'day1', title: 'Panel: Cross-border Crisis Collaboration', track: 'Panel', room: 'Workshop A', speaker: 'Yusuf R.', durationMin: 75, startsAt: at(-20 * 60 * 1000) },
    { dayId: 'day1', title: 'Simulation Exercise: Earthquake Response', track: 'Workshop', room: 'Simulation Lab', speaker: 'Fatima Z.', durationMin: 90, startsAt: at(2 * HOUR) },
    { dayId: 'day1', title: 'Youth in Action Session', track: 'Youth', room: 'Expo Hall', speaker: 'Omar H.', durationMin: 60, startsAt: at(4 * HOUR) },
    // Day 2
    { dayId: 'day2', title: 'Early Warning Systems Deep Dive', track: 'Workshop', room: 'Workshop A', speaker: 'Dr. Salim A.', durationMin: 60, startsAt: new Date(day2Date.setHours(9, 30, 0, 0)) },
    { dayId: 'day2', title: 'Digital Twin for Urban Resilience', track: 'Tech', room: 'Main Hall', speaker: 'Amina K.', durationMin: 75, startsAt: new Date(day2Date.setHours(11, 0, 0, 0)) },
    { dayId: 'day2', title: 'Community First Responder Training', track: 'Training', room: 'Workshop B', speaker: 'Yusuf R.', durationMin: 90, startsAt: new Date(day2Date.setHours(14, 0, 0, 0)) },
    // Day 3
    { dayId: 'day3', title: 'Policy Roundtable: National Resilience', track: 'Panel', room: 'Main Hall', speaker: 'Fatima Z.', durationMin: 60, startsAt: new Date(day3Date.setHours(10, 0, 0, 0)) },
    { dayId: 'day3', title: 'Closing Ceremony & Awards', track: 'Plenary', room: 'Main Hall', speaker: 'Omar H.', durationMin: 45, startsAt: new Date(day3Date.setHours(15, 0, 0, 0)) },
  ]

  // clear + reinsert sessions each run so the day1 "live now" timing always stays fresh
  await prisma.bookmark.deleteMany({})
  await prisma.programSession.deleteMany({})
  for (const s of sessions) {
    const endsAt = new Date(s.startsAt.getTime() + s.durationMin * 60 * 1000)
    await prisma.programSession.create({
      data: {
        dayId: s.dayId,
        time: timeLabel(s.startsAt),
        duration: `${s.durationMin} min`,
        title: s.title,
        track: s.track,
        room: s.room,
        speakerId: speakersByName.get(s.speaker)?.id,
        startsAt: s.startsAt,
        endsAt,
      },
    })
  }

  console.log('Seeding Ahmed\'s passport data (certificates, badges, skills, progress, activity)…')
  await prisma.certificate.deleteMany({ where: { userId: ahmed.id } })
  await prisma.certificate.createMany({
    data: [
      { userId: ahmed.id, title: 'Crisis Simulation: Flood Scenario', type: 'Simulation', code: 'ICESCO-2026-SIM-0142', status: 'issued', issuedAt: at(-4 * DAY) },
      { userId: ahmed.id, title: 'Early Warning Systems — Foundations', type: 'Training', code: 'ICESCO-2026-TRN-0311', status: 'issued', issuedAt: at(-5 * DAY) },
      { userId: ahmed.id, title: 'Community First Responder', type: 'Training', code: 'ICESCO-2026-TRN-0288', status: 'issued', issuedAt: at(-5 * DAY) },
      { userId: ahmed.id, title: 'Risk Governance Panel — Participation', type: 'Session', code: 'ICESCO-2026-SES-0197', status: 'issued', issuedAt: at(-6 * DAY) },
      { userId: ahmed.id, title: 'Digital Twin for Urban Resilience', type: 'Workshop', code: null, status: 'in_progress', issuedAt: null },
      { userId: ahmed.id, title: 'Youth Resilience Leadership', type: 'Program', code: null, status: 'locked', issuedAt: null },
    ],
  })

  await prisma.badge.deleteMany({ where: { userId: ahmed.id } })
  await prisma.badge.createMany({
    data: [
      { userId: ahmed.id, label: 'Rapid Responder', icon: 'zap' },
      { userId: ahmed.id, label: 'Team Player', icon: 'users' },
      { userId: ahmed.id, label: 'Knowledge Seeker', icon: 'book' },
      { userId: ahmed.id, label: 'First Aid', icon: 'heart' },
      { userId: ahmed.id, label: 'Global Voice', icon: 'globe' },
    ],
  })

  await prisma.skill.deleteMany({ where: { userId: ahmed.id } })
  await prisma.skill.createMany({
    data: [
      { userId: ahmed.id, label: 'Crisis Coordination', value: 82 },
      { userId: ahmed.id, label: 'Early Warning Systems', value: 74 },
      { userId: ahmed.id, label: 'Risk Communication', value: 68 },
      { userId: ahmed.id, label: 'Community Engagement', value: 90 },
      { userId: ahmed.id, label: 'Resource Management', value: 61 },
    ],
  })

  await prisma.progressItem.deleteMany({ where: { userId: ahmed.id } })
  await prisma.progressItem.createMany({
    data: [
      { userId: ahmed.id, label: 'Missions Completed', value: 12, max: 20 },
      { userId: ahmed.id, label: 'Sessions Attended', value: 18, max: 25 },
      { userId: ahmed.id, label: 'Certificates Earned', value: 6, max: 10 },
      { userId: ahmed.id, label: 'Connections Made', value: 87, max: 100 },
    ],
  })

  await prisma.activityLogEntry.deleteMany({ where: { userId: ahmed.id } })
  await prisma.activityLogEntry.createMany({
    data: [
      { userId: ahmed.id, title: 'Completed Simulation: Flood Scenario', meta: 'Mission', xp: 150, createdAt: at(-1 * DAY) },
      { userId: ahmed.id, title: 'Attended Panel: Risk Governance', meta: 'Session', xp: 100, createdAt: at(-2 * DAY) },
      { userId: ahmed.id, title: 'Earned Badge: Rapid Responder', meta: 'Achievement', xp: 200, createdAt: at(-3 * DAY) },
      { userId: ahmed.id, title: 'Connected with 5 delegates', meta: 'Networking', xp: 50, createdAt: at(-3 * DAY) },
    ],
  })

  console.log('Seeding connections…')
  await prisma.connection.deleteMany({})
  const layla = usersByName.get('Layla Hassan')!
  const fatima = usersByName.get('Fatima Zahra')!
  const mehmet = usersByName.get('Mehmet Yılmaz')!
  await prisma.connection.createMany({
    data: [
      { fromUserId: ahmed.id, toUserId: layla.id, status: 'accepted' },
      { fromUserId: fatima.id, toUserId: ahmed.id, status: 'accepted' },
      { fromUserId: ahmed.id, toUserId: mehmet.id, status: 'pending' },
    ],
    skipDuplicates: true,
  })

  console.log('Seeding direct messages…')
  await prisma.directMessage.deleteMany({})
  await prisma.directMessage.createMany({
    data: [
      { fromUserId: layla.id, toUserId: ahmed.id, body: 'Great meeting you at the panel today!', createdAt: at(-2 * DAY) },
      { fromUserId: ahmed.id, toUserId: layla.id, body: 'Likewise! Let’s compare notes on early warning systems sometime.', createdAt: at(-2 * DAY + 3600000) },
      { fromUserId: layla.id, toUserId: ahmed.id, body: 'Definitely — I’ll send over our flood-risk report.', createdAt: at(-1 * DAY) },
    ],
  })

  console.log('Seeding knowledge hub resources…')
  await prisma.resource.deleteMany({})
  await prisma.resource.createMany({
    data: [
      { title: 'Early Warning Systems', type: 'report', category: 'Reports', featured: true, tag: 'Best Practices', image: '/images/kh-early-warning.png', language: 'EN' },
      { title: 'Community Resilience', type: 'case', category: 'Case Studies', featured: true, tag: 'Case Study', image: '/images/kh-community.png', language: 'EN' },
      { title: 'Crisis Communication', type: 'tool', category: 'Tools', featured: true, tag: 'Guidelines', image: '/images/kh-crisis-comms.png', language: 'EN' },
      { title: 'Youth in Action', type: 'training', category: 'Training', featured: true, tag: 'Training Module', image: '/images/kh-youth.png', language: 'EN' },
      { title: 'Flood Risk Governance Framework', type: 'report', category: 'Reports', country: 'Indonesia', language: 'EN' },
      { title: 'Community First Responder Toolkit', type: 'tool', category: 'Tools', country: 'Morocco', language: 'FR' },
      { title: 'Earthquake Preparedness Curriculum', type: 'training', category: 'Training', country: 'Türkiye', language: 'EN' },
      { title: 'National Resilience Policy Brief', type: 'policy', category: 'Policies', country: 'Egypt', language: 'AR' },
      { title: 'Drought Early Warning Case Study', type: 'case', category: 'Case Studies', country: 'Nigeria', language: 'EN' },
    ],
  })

  console.log('Seeding digital twin buildings…')
  for (const b of TWIN_BUILDINGS) {
    await prisma.twinBuilding.upsert({ where: { id: b.id }, update: b, create: b })
  }

  console.log('Seeding event metrics…')
  await prisma.eventMetric.upsert({ where: { key: 'ideasShared' }, update: { value: 1243 }, create: { key: 'ideasShared', value: 1243 } })
  await prisma.eventMetric.upsert({ where: { key: 'projectsInitiated' }, update: { value: 128 }, create: { key: 'projectsInitiated', value: 128 } })
  await prisma.eventMetric.upsert({ where: { key: 'challengesCompleted' }, update: { value: 342 }, create: { key: 'challengesCompleted', value: 342 } })

  console.log('Seeding live room (chat, poll, Q&A)…')
  const noor = usersByName.get('Noor Al-Faisal')!
  const siti = usersByName.get('Siti Rahmawati')!

  await prisma.chatMessage.deleteMany({})
  await prisma.chatMessage.createMany({
    data: [
      { userId: layla.id, authorName: 'Layla Hassan', body: 'Thank you for this insightful session!' },
      { userId: mehmet.id, authorName: 'Mehmet Yılmaz', body: 'Very insightful discussion on resilience.' },
      { userId: ahmed.id, authorName: 'Ahmed Benali', body: 'How can we apply this in rural areas?' },
    ],
  })

  await prisma.pollVote.deleteMany({})
  await prisma.pollOption.deleteMany({})
  await prisma.poll.deleteMany({})
  const poll = await prisma.poll.create({
    data: { question: 'What is the top priority for resilient cities?', active: true },
  })
  await prisma.pollOption.createMany({
    data: [
      { pollId: poll.id, label: 'Early warning systems', order: 0, seedCount: 42 },
      { pollId: poll.id, label: 'Community-led response teams', order: 1, seedCount: 31 },
      { pollId: poll.id, label: 'Resilient infrastructure', order: 2, seedCount: 24 },
      { pollId: poll.id, label: 'Cross-border data sharing', order: 3, seedCount: 18 },
    ],
  })

  await prisma.questionUpvote.deleteMany({})
  await prisma.question.deleteMany({})
  await prisma.question.createMany({
    data: [
      { userId: noor.id, authorName: 'Noor Al-Faisal', body: 'How do we fund early-warning systems in low-resource areas?', seedUpvotes: 18 },
      { userId: siti.id, authorName: 'Siti Rahmawati', body: 'What role can youth volunteers play during the response phase?', seedUpvotes: 11 },
    ],
  })

  console.log('Done. Demo login: ahmed.benali@icesco.demo / demo1234')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
