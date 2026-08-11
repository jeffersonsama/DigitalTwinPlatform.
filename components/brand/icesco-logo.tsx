import { cn } from '@/lib/utils'

interface IcescoLogoProps {
  className?: string
  variant?: 'dark' | 'light'
  showWordmark?: boolean
  subtitle?: boolean
}

/**
 * Stylized ICESCO brand mark — a swirling globe formed by interlocking
 * teal and blue arcs, paired with the ICESCO wordmark.
 */
export function IcescoLogo({
  className,
  variant = 'dark',
  showWordmark = true,
  subtitle = false,
}: IcescoLogoProps) {
  const wordColor = variant === 'dark' ? 'text-icesco' : 'text-white'
  const subColor = variant === 'dark' ? 'text-muted-foreground' : 'text-white/70'

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <svg
        viewBox="0 0 48 48"
        className="h-9 w-9 shrink-0"
        role="img"
        aria-label="ICESCO logo"
      >
        <g fill="none" strokeLinecap="round">
          <circle cx="24" cy="24" r="21" stroke="#14508c" strokeWidth="1" opacity="0.25" />
          <path
            d="M8 30 C 12 12, 30 6, 40 14"
            stroke="#1a9e8f"
            strokeWidth="4.5"
          />
          <path
            d="M40 18 C 36 36, 18 42, 8 34"
            stroke="#14508c"
            strokeWidth="4.5"
          />
          <path
            d="M15 24 C 20 18, 30 18, 34 24"
            stroke="#2bb8de"
            strokeWidth="3.5"
          />
        </g>
      </svg>
      {showWordmark && (
        <div className="leading-tight">
          <span className={cn('font-display text-lg font-bold tracking-tight', wordColor)}>
            ICESCO
          </span>
          {subtitle && (
            <span className={cn('block max-w-[200px] text-[10px] leading-tight', subColor)}>
              Islamic World Educational, Scientific and Cultural Organization
            </span>
          )}
        </div>
      )}
    </div>
  )
}
