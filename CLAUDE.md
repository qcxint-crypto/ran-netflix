# AGENTS.md

## Overview

Indonesian anime / film / manga streaming aggregator. Scrapes upstream providers
on demand and renders results; hosts no media. Next.js 14.2 (App Router, server
components), React 18.3, TypeScript 5, Tailwind 3.4, three.js via
@react-three/fiber 8 + drei 9. Package manager: npm.

## Commands

```bash
npm install
npm run dev -- -p 3100            # dev server
npm run build                     # must pass before any commit
npm run start -- -p 3100          # serve the production build
npx tsc --noEmit                  # typecheck (this is the lint gate; see below)
node src/lib/watchlist.test.mjs   # watchlist data-layer tests (node:test)

# UI end-to-end (server on 3100, CHROME_PATH set):
CHROME_PATH=<chrome> node scripts/watchlist-e2e.mjs http://localhost:3100
```

**IMPORTANT:** `npm run lint` is not runnable yet — ESLint is not installed and
there is no config, so the script opens Next's interactive setup prompt and
blocks. `npx tsc --noEmit` plus `npm run build` are the current gates. Wiring
ESLint is a separate task, not something to trigger mid-change.

## Conventions

Server components by default; `'use client'` only for state, effects, or browser
APIs. Data pages declare `dynamic = 'force-dynamic'` and usually `maxDuration`.
Shared types live in `src/types/index.ts`.

```tsx
export const dynamic = 'force-dynamic'
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  try { const detail = await getAnimeDetail(slug) }
  catch (err) { if (err instanceof NotFoundError) notFound(); return <ErrorState /> }
}
```

A client component reading localStorage must render identical markup before and
after the first read (see `WatchlistProvider.ready`), or hydration will mismatch.

## Boundaries

- **NEVER** commit `.env`, `.env.local`, or `.env2` — only `.env.example`, with
  placeholders. **NEVER** print, log, or commit the Vercel token in `.env2`.
- **NEVER** import `three` or `@react-three/*` from a server component. Canvases
  load via `dynamic(..., { ssr: false })` to keep three.js out of the shared
  bundle (87.4 kB — treat a jump as a regression).
- **NEVER** widen the `/api/image-proxy` exact-host allowlist; it must not become
  an open proxy.
- **ALWAYS** wrap outbound `fetch` in an AbortController with a timeout, and keep
  the `{ ok, data | error }` API shapes backward compatible.
- **IMPORTANT:** `.env2`, `deploy.sh`, and `_re/` belong to deployment / the RE
  workspace. Do not edit or delete them as application work.

## Dependencies

`next` 14.2, `react` 18.3, `three` 0.169 + `@react-three/fiber` 8.18 +
`@react-three/drei` 9.122 (scenes), `tailwindcss` 3.4 (tokens in
`tailwind.config.ts`). `@react-three/postprocessing` is deliberately absent.

## Config

`NEXT_PUBLIC_SITE_NAME`, `NEXT_PUBLIC_SITE_URL`, `SCRAPE_BASE_URL` (upstream
OtakuDesu domain), `ENABLE_ANIMASU` (`1` enables that source in the episode
chain), `FLARESOLVERR_URL` (empty skips the solver path). See `.env.example`.

## Error Handling

Scraper entry points in `src/lib/scraper/index.ts` throw `NotFoundError` for
unknown slugs, generic `Error` otherwise. Pages map `NotFoundError` to
`notFound()`, the rest to an inline error state. Every client retries within its
own budget and every fetch aborts on a timer, so a slow upstream cannot pin a
request open. `getEpisode` falls back to always-available stream URLs when the
scrape chain misses, so a provider outage degrades instead of failing.

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| `Cannot find module './NNNN.js'` / `./vendor-chunks/*.js` | A `next dev` wrote into `.next` during a production build. Kill all Next processes, `rm -rf .next`, rebuild. |
| Poster wall renders as flat gradient tiles | AniList blocks cross-origin canvas reads, tainting WebGL textures. Confirm images route through `/api/image-proxy`. |
| No `<canvas>` in the DOM | Expected under `prefers-reduced-motion: reduce` (static CSS aurora instead). Headless Chrome defaults to reduce. |
| Fallback servers only on an episode page | Scrape chain (otakudesu → animasu) missed. Check `ENABLE_ANIMASU` and `FLARESOLVERR_URL`. |
