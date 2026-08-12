const VIDEO_ID = 'gqCKxEaPgOM'
const START_SECONDS = 30

/**
 * Fills its positioned ancestor edge-to-edge regardless of viewport aspect
 * ratio: the iframe is oversized via vw/vh units then centered and clipped
 * by the parent's overflow-hidden — the standard "cover" trick for embeds,
 * since object-fit doesn't apply to iframes.
 *
 * Not muted, per request — browsers generally block unmuted autoplay until
 * the visitor interacts with the page, so the iframe is left clickable
 * (unlike a fully inert decorative embed) as a fallback way to start it;
 * the dark overlay ignores pointer events so clicks reach the video below it.
 */
export function AuthBackgroundVideo() {
  const src =
    `https://www.youtube.com/embed/${VIDEO_ID}` +
    `?autoplay=1&loop=1&playlist=${VIDEO_ID}&start=${START_SECONDS}` +
    `&controls=0&modestbranding=1&disablekb=1&playsinline=1&rel=0&iv_load_policy=3`

  return (
    <div className="absolute inset-0 overflow-hidden bg-navy-950">
      <iframe
        // scale-110 pushes the blurred edges outside the visible area, so
        // overflow-hidden doesn't clip into a hard, un-blurred boundary
        className="absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full origin-center -translate-x-1/2 -translate-y-1/2 scale-105 blur-sm"
        src={src}
        title="Background video"
        allow="autoplay; encrypted-media"
        frameBorder={0}
      />
      <div className="pointer-events-none absolute inset-0 bg-navy-950/60" />
    </div>
  )
}
