export interface NavItem {
  label: string
  href: string
}

/** Primary navigation used across the platform top bars. */
export const primaryNav: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Live', href: '/live' },
  { label: 'Digital Twin', href: '/digital-twin' },
  { label: 'World Map', href: '/world-map' },
  { label: 'Simulation', href: '/crisis-simulation' },
  { label: 'Knowledge Hub', href: '/knowledge' },
  { label: 'My Passport', href: '/passport' },
]

/** Secondary / utility routes surfaced in menus and launchers. */
export const utilityNav: NavItem[] = [
  { label: 'AI Concierge', href: '/ai' },
  { label: 'Command Center', href: '/command-center' },
  { label: 'Global Pulse', href: '/global-pulse' },
  { label: 'Online Experience', href: '/online-experience' },
  { label: 'Poster Studio', href: '/poster-studio' },
]

export const allRoutes: NavItem[] = [...primaryNav, ...utilityNav]
