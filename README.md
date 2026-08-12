# ICESCO Digital Twin Platform — Youth Knowledge Forum 2026

A multilingual, AI-themed front-end for the **ICESCO Crisis Management Knowledge Forum 2026** — *"Connecting minds. Building resilience. Shaping a safer tomorrow."*

This is a **UI/UX prototype**: every screen is fully built and interactive (tabs, search, filters, forms, local component state), but there is **no backend, database, or authentication**. All data — stats, delegates, sessions, chat messages, certificates — is static/mock data seeded from [`lib/data.ts`](lib/data.ts). Interactions like "Connect with a delegate" or "Send a chat message" update local React state only and are not persisted anywhere. The purpose of the project is to demonstrate the full experience and visual design of the platform end-to-end.

## What this app actually does, page by page

### App shell (every page)
Every route is wrapped in `AppShell` ([components/shell/app-shell.tsx](components/shell/app-shell.tsx)), which renders two persistent pieces of UI:

- **`NavRail`** ([components/shell/nav-rail.tsx](components/shell/nav-rail.tsx)) — a collapsible left sidebar. It starts collapsed to icons-only (64px wide), expands to 240px on hover, and can be pinned open with a toggle button at the bottom. It lists 10 primary routes (Home, Live, Program, Digital Twin, World Map, Simulation, Knowledge Hub, Networking, My Passport, Certificates) and 5 utility routes (AI Concierge, Command Center, Global Pulse, Online Experience, Poster Studio), all defined in [lib/nav.ts](lib/nav.ts).
- **`TopBar`** ([components/shell/top-bar.tsx](components/shell/top-bar.tsx)) — a sticky header with search/notification icon buttons (non-functional, decorative), a language `<select>` (EN/FR/AR) wired to the i18n context, a light/dark/system theme cycle button, and a static user avatar circle ("AB").

Certain routes (`/live`, `/command-center`, `/world-map`, `/global-pulse`, `/crisis-simulation`, `/digital-twin`) are flagged as **"immersive"** in `lib/nav.ts`'s `isImmersivePath()` — they always render in a dark navy dashboard theme regardless of the user's light/dark/system preference, and hide the theme toggle in the top bar.

### `/` — Home ([app/page.tsx](app/page.tsx))
- **Hero** ([components/home/hero.tsx](components/home/hero.tsx)): full-width banner with two cross-fading background photos (CSS animation), forum title, tagline, and two CTAs ("Join Live Now" → `/live`, "Explore Program" → `/knowledge`).
- **AI Assistant Card** next to the hero, promoting the AI Concierge.
- **StatRow**: row of headline numbers (countries, participants, sessions today, etc. from `globalStats`).
- **CrisisTimeline**: a horizontal timeline of the day's agenda with done/live/upcoming states.

### `/live` — Live session
- **LiveVideo** ([components/live/live-video.tsx](components/live/live-video.tsx)): a static video-player mockup (play/pause toggles local state only, no real video) with a LIVE badge, viewer count, and a 6-tab panel below it — Live Translation (shows a canned EN→FR string), AI Summary, Poll, Q&A, Resources, Notes.
- **SpeakerStrip**: avatars/names/roles of the 5 mock speakers plus a live participant count.
- **LiveChatPanel** ([components/live/live-chat-panel.tsx](components/live/live-chat-panel.tsx)): scrollable chat seeded with mock messages; typing and submitting appends a new "You" message to local state (not sent anywhere).
- **AiSummaryPanel**: static list of "key points" and "decisions & recommendations" bullet points.

### `/program` — Forum Program ([components/program/program-schedule.tsx](components/program/program-schedule.tsx))
Day-by-day session schedule (3 days) with a day selector and a vertical timeline of sessions, each showing time, duration, track badge, speaker, room, and a status-dependent action button: **Join** (links to `/live`) if the session is live, **Replay** if done, or **Add to plan** if upcoming.

### `/digital-twin` — Digital Twin ([components/digital-twin/twin-city.tsx](components/digital-twin/twin-city.tsx))
An isometric city image ([components/digital-twin/twin-scene.tsx](components/digital-twin/twin-scene.tsx)) with 8 clickable infrastructure markers (hospital, power plant, water plant, government center, school, museum, telemetry center, river) pulsing in a color coded by status (green = operational, amber = warning, red = flood-risk). Clicking a marker or a row in the sidebar list shows that building's mock capacity/power stats. A "Resilience Index" score (7.8/10) is shown as a static figure.

> Note: `TwinScene` is explicitly written as a 2D image + absolutely-positioned marker overlay, with a code comment noting it's structured so the base layer can later be swapped for a real React Three Fiber 3D `<Canvas>` — there is no actual 3D rendering yet.

### `/world-map` — Global Map ([components/world-map/map-dashboard.tsx](components/world-map/map-dashboard.tsx))
A world choropleth map built with `react-simple-maps`, pulling map geometry from a public CDN (`world-atlas` TopoJSON) and overlaying animated pulse markers for the top participating countries (Türkiye, Indonesia, Morocco, Egypt, Saudi Arabia, Nigeria, etc.), color/size-coded by activity level. Sidebar shows a live-overview stat list and a ranked bar chart of the top active countries.

### `/crisis-simulation` — Crisis Simulation ([components/simulation/crisis-simulation.tsx](components/simulation/crisis-simulation.tsx))
A role-play exercise screen: shows the user's assigned role ("Civil Protection / Team Leader"), 4 objectives, resource counters (rescue teams, medical units, vehicles, shelters), a live countdown timer (165s, ticks down client-side via `setInterval`), the same digital-twin scene with a pulsing red "epicenter" overlay, a situation report (magnitude, epicenter distance, population, injured), a decision panel (buttons like "Evacuate the area" that append to an activity log), a tabbed log/map/media viewer, and a free-text "send update" input that also appends to the log. All state is local and resets on reload.

### `/knowledge` — Knowledge Hub ([components/knowledge/knowledge-hub.tsx](components/knowledge/knowledge-hub.tsx))
A resource library: full-text search box, category filter pills (All, Case Studies, Reports, Tools, Training, Policies), a "Featured Resources" grid of 4 cards with images, and a filterable/searchable list of recent resources (title, type, country, language). Filtering is done client-side against the mock `recentResources` array.

### `/networking` — Networking Directory ([components/networking/networking-directory.tsx](components/networking/networking-directory.tsx))
A searchable grid of delegate cards (name, role, country flag, online status, mutual-connections count) with per-card **Connect/Connected** toggle and a message icon button (non-functional). A stat row shows delegates online, connections made, pending requests, and countries represented.

### `/passport` — My Passport ([components/passport/digital-passport.tsx](components/passport/digital-passport.tsx))
A gamified profile page: avatar, name/role/country, level + XP progress bar, mission/connection/certificate counters, a badge grid (5 badges), and a 4-tab panel — **Activity** (XP-earning event log), **Certificates** (preview of earned certs), **Skills** (progress bars for 5 skill areas), **Progress** (4 completion trackers with locked/complete states).

### `/certificates` — Certificates ([components/certificates/certificates-list.tsx](components/certificates/certificates-list.tsx))
A grid of certificate cards, each showing type, title, issue date/ID, and status (**Issued**, **In Progress**, or **Locked** — locked/in-progress cards are dimmed and their Download/Share buttons disabled).

### `/ai` — AI Concierge ([components/ai/concierge.tsx](components/ai/concierge.tsx))
A chat-style assistant UI. On first load it shows 4 suggested prompts ("Find sessions about climate adaptation", etc.); sending any message appends it to a local message list and always echoes back the **same canned reply** — there is no real LLM call, just a hardcoded placeholder response.

### `/command-center` — Command Center ([components/command/command-center.tsx](components/command/command-center.tsx))
An operations-dashboard mockup with 8 static panels: a 4-stream video grid, real-time analytics bars (engagement/retention/interactions), top-countries ranking, system status (streaming/network/servers/AI services — all hardcoded "Online"), most-discussed-topics sentiment list, a live participant counter with an inline SVG sparkline chart, an AI insight callout, and 2 sample alerts (high traffic, translation delay).

### `/global-pulse` — Global Pulse ([components/pulse/pulse-wall.tsx](components/pulse/pulse-wall.tsx))
A full-screen "broadcast wall" style display (designed for a stage/kiosk screen) showing the same headline stats as the home page in large type over an ambient background image, plus 3 highlight cards (most active country, most discussed crisis, top AI insight). There's also an unused alternate version, `components/pulse/global-pulse.tsx`, with the same content in a slightly different layout.

### `/online-experience` — Online Experience ([components/online-experience/online-experience.tsx](components/online-experience/online-experience.tsx))
A marketing-style page promoting the web + mobile apps: hero with laptop/phone device mockups, a platforms section (Web App, iOS & Android), and a features grid (Multilingual, AI Powered, Digital Twin, Global Collaboration, Secure & Inclusive). Entirely static/informational, no interactive logic.

### `/poster-studio` — Poster Studio ([components/poster/poster-studio.tsx](components/poster/poster-studio.tsx))
A live poster editor: pick from 4 gradient templates, edit a headline and subtitle in text inputs, and see the result rendered instantly in a preview card. "AI Enhance" and "Export" buttons are present but non-functional (no export/AI logic wired up).

## Internationalization

[lib/i18n.tsx](lib/i18n.tsx) implements a custom (non-library) locale system supporting **English, French, and Arabic**:
- Locale is persisted to `localStorage` (`icesco-locale` key) and read back on load.
- A small inline `<script>` (`localeInitScript`) runs in `<head>` before React hydrates, so returning French/Arabic visitors don't see a flash of English/LTR content.
- Arabic automatically sets `dir="rtl"` on `<html>`.
- Only navigation labels and a handful of top-bar strings (search, notifications, theme, language) are translated so far — page content/body copy is English-only.

## Tech Stack

- **[Next.js 16](https://nextjs.org/)** (App Router) + React 19 + TypeScript, all pages are client components (`'use client'`) except the root layout
- **Tailwind CSS 4**, `class-variance-authority` + `tailwind-merge` for variant/class composition, custom ICESCO brand colors (`icesco`, `icesco-blue`, `icesco-teal`, `cyan-accent`, `navy-950`, `forum-orange`, etc.) defined in [app/globals.css](app/globals.css)
- **next-themes** for light/dark/system theming (disabled on "immersive" routes)
- **lucide-react** for all icons
- **react-simple-maps** + `world-atlas` TopoJSON (fetched from a CDN at runtime) for the world map
- **Vercel Analytics**, enabled only in production builds

## Project Structure

```
app/                      Route segments (App Router) — one folder per page, each just wires
                          AppShell + the corresponding feature component
components/
  shell/                  App shell: NavRail, TopBar, AppShell wrapper
  brand/                  Logo variants (full logo, rail logo, ICESCO mark)
  home/                   Hero, stat row, crisis timeline, AI assistant card
  live/                   Live video player, chat panel, speaker strip, AI summary
  digital-twin/           2D "twin" scene (marker overlay on an isometric image) + city dashboard
  world-map/              react-simple-maps globe + stats dashboard
  simulation/             Crisis simulation exercise
  knowledge/              Knowledge Hub (search + filter + resource grid)
  networking/             Delegate directory
  passport/               Digital passport (XP, badges, skills, progress)
  certificates/           Certificates grid
  poster/                 Poster Studio editor
  pulse/                  Global Pulse broadcast-wall displays
  command/                Command Center dashboard
  ai/                     AI Concierge chat UI
  program/                Program schedule
  online-experience/      Web/mobile marketing page
  ui/                     Shared UI primitives (button, etc.)
lib/
  data.ts                 ALL mock/demo content for the entire app (stats, delegates, sessions,
                          chat, certificates, twin buildings, poster templates, etc.)
  nav.ts                  Nav rail route config (labels, icons, hrefs) + immersive-route rules
  i18n.tsx                Locale context/provider + EN/FR/AR translation dictionaries
  utils.ts                `cn()` class-merging helper
```

## Getting Started

This project uses [pnpm](https://pnpm.io/).

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Other scripts

```bash
pnpm build   # Production build
pnpm start   # Start the production server
pnpm lint    # Run ESLint
```

## Known limitations (by design, at this stage)

- No backend/API, no database, no auth — nothing typed or clicked is saved between page loads.
- The AI Concierge and live-session "AI Summary"/"Live Translation" panels return hardcoded text, not real AI output.
- The Digital Twin is a 2D image with marker overlays, not a true 3D scene (see the comment in `TwinScene`).
- Search, notifications, "AI Enhance", "Export", and chat "message" buttons in the top bar/networking page are present in the UI but not wired to any functionality.
- Only navigation and top-bar labels are localized; most page content is English-only regardless of selected language.
