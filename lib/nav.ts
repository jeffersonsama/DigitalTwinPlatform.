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
  MessageCircle,
  Image as PosterStudioIcon,
  Gamepad2,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  /** Stable identifier used for translation lookups (see lib/i18n.tsx). */
  key: string
  label: string
  href: string
  icon: LucideIcon
  /** Hidden from the rail (and gated server-side) for non-admins. */
  adminOnly?: boolean
}

/** Primary navigation used across the platform shell. */
export const primaryNav: NavItem[] = [
  { key: 'home', label: 'Home', href: '/', icon: Home },
  { key: 'live', label: 'Live', href: '/live', icon: Radio },
  { key: 'program', label: 'Program', href: '/program', icon: Calendar },
  { key: 'digitalTwin', label: 'Digital Twin', href: '/digital-twin', icon: Boxes },
  { key: 'worldMap', label: 'World Crisis Map', href: '/world-map', icon: Globe },
  { key: 'simulation', label: 'Simulation', href: '/crisis-simulation', icon: FlaskConical },
  { key: 'knowledgeHub', label: 'Knowledge Hub', href: '/knowledge', icon: BookOpen },
  { key: 'networking', label: 'Networking', href: '/networking', icon: Users },
  { key: 'messages', label: 'Messages', href: '/messages', icon: MessageCircle },
  { key: 'passport', label: 'My Passport', href: '/passport', icon: IdCard },
  { key: 'certificates', label: 'Certificates', href: '/certificates', icon: Award },
  { key: 'crisisCity', label: 'Crisis City', href: '/crisis-city', icon: Gamepad2 },
]

/** Secondary / utility routes surfaced in the rail. */
export const utilityNav: NavItem[] = [
  { key: 'aiConcierge', label: 'AI Concierge', href: '/ai', icon: Sparkles },
  { key: 'commandCenter', label: 'Command Center', href: '/command-center', icon: LayoutDashboard, adminOnly: true },
  { key: 'globalPulse', label: 'Global Pulse', href: '/global-pulse', icon: Activity },
  { key: 'onlineExperience', label: 'Online Experience', href: '/online-experience', icon: MonitorPlay },
  { key: 'posterStudio', label: 'Poster Studio', href: '/poster-studio', icon: PosterStudioIcon },
]

/**
 * Admin-only routes — rendered in the rail only for `accessRole: 'admin'` accounts (see
 * components/shell/nav-rail.tsx). The same admin role doubles as Crisis City
 * moderator/animateur access (lib/auth.ts#requireAdmin).
 */
export const adminNav: NavItem[] = [
  { key: 'crisisCityAdmin', label: 'Crisis City — Admin', href: '/crisis-city/admin', icon: ShieldCheck },
]

export const allRoutes: NavItem[] = [...primaryNav, ...utilityNav, ...adminNav]

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
  '/scan',
]

export function isImmersivePath(pathname: string): boolean {
  return immersivePaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}
