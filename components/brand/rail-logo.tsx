import Image from 'next/image'
import Link from 'next/link'
import { LOGO_SRC, LOGO_SOURCE_WIDTH, LOGO_SOURCE_HEIGHT, LOGO_MARK_WIDTH } from '@/components/brand/logo'

/**
 * The image is always rendered at its full display size (FULL_WIDTH x
 * LOGO_HEIGHT); only the wrapper's width + overflow-hidden changes, so
 * collapsing/expanding the rail slides the same image behind a wipe rather
 * than swapping between two separate assets. The source background is
 * already matted to transparent, so it sits directly on the rail with no
 * card/backing needed.
 */
const LOGO_HEIGHT = 48
const FULL_WIDTH = Math.round(LOGO_HEIGHT * (LOGO_SOURCE_WIDTH / LOGO_SOURCE_HEIGHT))
const MARK_WIDTH = Math.round(LOGO_HEIGHT * (LOGO_MARK_WIDTH / LOGO_SOURCE_HEIGHT))

export function RailLogo({ expanded }: { expanded: boolean }) {
  return (
    <Link
      href="/"
      aria-label="ICESCO"
      className="relative block shrink-0 overflow-hidden transition-[width] duration-300 ease-out"
      style={{ height: LOGO_HEIGHT, width: expanded ? FULL_WIDTH : MARK_WIDTH }}
    >
      <Image
        src={LOGO_SRC}
        alt="ICESCO"
        width={FULL_WIDTH}
        height={LOGO_HEIGHT}
        className="absolute left-0 top-0 max-w-none"
        style={{ height: LOGO_HEIGHT, width: FULL_WIDTH }}
        priority
      />
    </Link>
  )
}
