# Local Setup

This is a full-stack app — Postgres + Prisma + a custom Socket.IO server, with optional AI
integrations. `npm install` alone is **not** enough to run it.

## 1. Use pnpm, not npm

This repo has a `pnpm-lock.yaml`. Installing with `npm` against a pnpm lockfile can silently
skip or mismatch packages (this is what causes `Cannot find module 'socket.io'` on `pnpm dev`).

```bash
npm install -g pnpm
```

If you already ran `npm install` in this repo, clean up first:

```bash
rm -rf node_modules package-lock.json     # macOS/Linux
rmdir /s /q node_modules & del package-lock.json   # Windows
```

Then install properly:

```bash
pnpm install
```

## 2. Set up `.env`

`.env` is gitignored — every machine needs its own copy.

```bash
cp .env.example .env      # macOS/Linux
copy .env.example .env    # Windows
```

Fill in at minimum:

- `DATABASE_URL="postgresql://icesco:icesco_dev@localhost:5434/icesco_knowledge_forum"`
- `JWT_SECRET` — any string for local dev

The AI-related keys (`GROQ_API_KEY`, `GEMINI_API_KEY`, `QDRANT_*`, `TAVILY_API_KEY`,
`LANGFUSE_*`, `CRON_SECRET`) are **optional** — the app degrades gracefully without them
(see the comments in `.env.example`). You don't need to chase down every API key just to
get the app running locally.

## 3. Start Postgres

```bash
docker compose up -d
docker compose ps   # confirm icesco_knowledge_forum_db is Up on 5434
```

## 4. Generate the Prisma client and apply migrations

Do this every time after a fresh install, and in this order:

```bash
npx prisma generate
npx prisma migrate deploy
npx tsx prisma/seed.ts
```

This is the step that fixes every
`Property 'chatMessage' | 'poll' | 'directMessage' | ... does not exist on type 'PrismaClient'`
TypeScript error — those come from a stale/missing generated client, not a schema problem.
The schema already defines every one of those models correctly.

## 5. Run it

```bash
pnpm dev
```

Should print `> Ready on http://localhost:8081`.

Demo login: `ahmed.benali@icesco.demo` / `demo1234`

## One-liner (once `.env` and Docker are already configured)

```bash
pnpm install && docker compose up -d && npx prisma generate && npx prisma migrate deploy && pnpm dev
```

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Cannot find module 'socket.io'` | Installed with `npm` instead of `pnpm`, or a partial install | Delete `node_modules` + `package-lock.json`, reinstall with `pnpm install` |
| `Property 'X' does not exist on type 'PrismaClient'` | Stale/missing generated Prisma client | `npx prisma generate` |
| `Can't reach database server at localhost:5434` | Postgres container isn't running | `docker compose up -d`, then re-run `prisma migrate deploy` |
| App loads but pages error out / hang | Postgres up but not seeded | `npx tsx prisma/seed.ts` |
