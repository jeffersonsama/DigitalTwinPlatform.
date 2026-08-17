import {
  Home,
  Radio,
  Calendar,
  Boxes,
  Globe,
  FlaskConical,
  BookOpen,
  Users,
  IdCard,
  Award,
  Sparkles,
  LayoutDashboard,
  Activity,
  MonitorPlay,
  Image as PosterStudioIcon,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  /** Stable identifier used for translation lookups (see lib/i18n.tsx). */
  key: string
  label: string
  href: string
  icon: LucideIcon
}

/** Primary navigation used across the platform shell. */
export const primaryNav: NavItem[] = [
  { key: 'home', label: 'Home', href: '/', icon: Home },
  { key: 'live', label: 'Live', href: '/live', icon: Radio },
  { key: 'program', label: 'Program', href: '/program', icon: Calendar },
  { key: 'digitalTwin', label: 'Digital Twin', href: '/digital-twin', icon: Boxes },
  { key: 'worldMap', label: 'World Map', href: '/world-map', icon: Globe },
  { key: 'simulation', label: 'Simulation', href: '/crisis-simulation', icon: FlaskConical },
  { key: 'knowledgeHub', label: 'Knowledge Hub', href: '/knowledge', icon: BookOpen },
  { key: 'networking', label: 'Networking', href: '/networking', icon: Users },
  { key: 'passport', label: 'My Passport', href: '/passport', icon: IdCard },
  { key: 'certificates', label: 'Certificates', href: '/certificates', icon: Award },
]

/** Secondary / utility routes surfaced in the rail. */
export const utilityNav: NavItem[] = [
  { key: 'aiConcierge', label: 'AI Concierge', href: '/ai', icon: Sparkles },
  { key: 'commandCenter', label: 'Command Center', href: '/command-center', icon: LayoutDashboard },
  { key: 'globalPulse', label: 'Global Pulse', href: '/global-pulse', icon: Activity },
  { key: 'onlineExperience', label: 'Online Experience', href: '/online-experience', icon: MonitorPlay },
  { key: 'posterStudio', label: 'Poster Studio', href: '/poster-studio', icon: PosterStudioIcon },
]

export const allRoutes: NavItem[] = [...primaryNav, ...utilityNav]

/**
 * Routes that use the permanent dark "immersive" treatment regardless of the
 * user's light/dark/system theme choice — matches the dashboard/video
 * aesthetic these pages were designed with.
 */
export const immersivePaths = [
  '/live',
  '/command-center',
  '/world-map',
  '/global-pulse',
  '/crisis-simulation',
  '/digital-twin',
]

export function isImmersivePath(pathname: string): boolean {
  return immersivePaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}
