// Real 24/7 broadcast used to test the Live page end-to-end against a genuine
// live stream instead of a static placeholder. Shared by the video player and
// the YouTube live chat embed so they always point at the same broadcast.
// A spoken-word news broadcast (unlike a music stream) has real closed
// captions available. Previous ID OXv77_1KOsQ (also ABC News Live) stopped
// broadcasting; this is the same channel's current stream, verified live and
// embeddable as of 2026-08-17.
export const LIVE_VIDEO_ID = 'iipR5yUp36o'

// Set to the YouTube video ID of the venue's 360° camera once it's live for
// the event — YouTube auto-enables its drag-to-look-around viewer for videos
// uploaded with 360/equirectangular metadata, so no extra viewer library is
// needed. Left empty renders a placeholder instead of a flat 2D video.
export const CAMERA_360_VIDEO_ID = ''
