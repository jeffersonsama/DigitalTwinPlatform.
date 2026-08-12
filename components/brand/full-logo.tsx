import Image from 'next/image'
import { LOGO_SRC, LOGO_SOURCE_WIDTH, LOGO_SOURCE_HEIGHT } from '@/components/brand/logo'

/** The full lockup at a fixed height, no crop/animation — same transparent-background
 * asset the rail uses, just statically sized for places like the auth pages. */
export function FullLogo({ height = 40, className }: { height?: number; className?: string }) {
  const width = Math.round(height * (LOGO_SOURCE_WIDTH / LOGO_SOURCE_HEIGHT))
  return (
    <Image src={LOGO_SRC} alt="ICESCO" width={width} height={height} className={className} priority />
  )
}
