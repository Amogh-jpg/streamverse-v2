# StreamVerse

**AI-powered entertainment discovery & decision assistant.** StreamVerse helps
you answer "what should I watch right now?" faster and more personally than a
plain catalog — with a universal, normalized interface across content verticals.

> **Legal:** StreamVerse never hosts, proxies, embeds, or streams copyrighted
> movies, TV episodes, or music. Every "watch" action links out to an official
> third-party provider. Only official trailers (YouTube) are embedded.

This repository is progressing through **Phase 2**. See
[Roadmap](#roadmap) for what's shipped and what's next.

## Features (Phase 1)

- **Home** — trending, new releases, trending TV, top-rated, popular series, and
  upcoming, with a featured hero.
- **Movies** — browse by category (Trending / Popular / Top Rated / Upcoming /
  Now Playing) and genre; rich detail pages with cast & crew, official trailer,
  "Where to Watch" outbound links, and similar titles.
- **TV Shows** — browse by category and genre; detail pages with seasons &
  episodes, cast, trailer, where-to-watch, and similar shows.
- **Unified Search** — one search across movies and TV.
- **Auth** — email/password and Google OAuth via Supabase.
- **Watchlist ("My World")** — save/remove titles, persisted per user with RLS.
- Dark, glassmorphism UI; responsive; accessible; loading & empty states
  throughout.

## Features (Phase 2 — Profiles, Reviews & Collections)

- **User Profiles** — editable display name, bio, avatar and a shareable public
  handle (`/profile/<slug>`). Profiles are private by default and can be made
  public per user.
- **Reviews (CRUD)** — rate titles 1–10 with an optional written review from any
  movie or show page. One review per title per user (edit/delete supported);
  reviews are publicly readable and surface an aggregate community score.
- **Custom Collections** — create private or public themed lists, add/remove
  titles from any detail page via "Add to collection", and manage or share them
  from `/collections`.
- All new user data is protected by Row Level Security and validated server-side
  with Zod (`src/lib/validation.ts`).

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack) + React 19 + TypeScript
  (strict)
- **Styling:** Tailwind CSS v4, shadcn/ui (Radix), Motion (Framer Motion)
- **Data:** [TMDB](https://www.themoviedb.org/) via server-only adapters
- **Auth & DB:** Supabase (Postgres, Auth, RLS)
- **Tests:** Vitest

## Architecture

External providers are hidden behind **adapters** that normalize everything into
a single `MediaItem` / `MediaDetail` shape (`src/types/media-item.ts`). This is
what makes discovery "universal" and lets future verticals (anime, music, …)
slot in without touching the UI.

```
src/
  app/                 App Router routes (pages, route handlers, server actions)
  components/
    layout/            App shell: header, nav, footer, search
    media/             MediaCard/Row/Grid, detail view, trailer, where-to-watch
    common/            Reusable page primitives (containers, empty/loading states)
    ui/                shadcn/ui primitives
  lib/
    adapters/          Provider adapters (TMDB) + registry keyed by media type
    supabase/          Browser/server clients + auth cookie refresh
    env.ts             Centralized, validated env access
    watchlist.ts       Server-only watchlist data access
    profiles.ts        Server-only profile data access
    reviews.ts         Server-only reviews data access
    collections.ts     Server-only collections data access
    validation.ts      Shared Zod schemas for user-generated input
  app/actions/         Server actions (profile, reviews, collections)
supabase/migrations/   SQL schema (0001) + RLS (0002) + Phase 2 additions (0003)
proxy.ts               Next.js 16 proxy (Supabase session refresh)
```

Key rules enforced by the codebase:

- TMDB and all secrets are **server-only** (`import "server-only"`).
- User-owned data is protected by Supabase **Row Level Security**.
- External responses are **cached** via the Next.js data cache.
- Pages degrade gracefully when TMDB/Supabase aren't configured (a clear notice
  is shown instead of crashing), so the app is reviewable without secrets.

## Getting Started

Requires **Node.js 22.13+** and npm.

```bash
npm install
cp .env.example .env.local   # then fill in the values (see below)
npm run dev
```

Open http://localhost:3000.

### Environment variables

See [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) for the full guide. Minimum:

| Variable | Required for | Notes |
| --- | --- | --- |
| `TMDB_API_READ_ACCESS_TOKEN` | Catalog data | TMDB v4 read token (preferred) |
| `TMDB_API_KEY` | Catalog data | TMDB v3 key (fallback) |
| `NEXT_PUBLIC_SUPABASE_URL` | Auth & watchlist | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Auth & watchlist | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server tasks | Keep server-only |
| `NEXT_PUBLIC_SITE_URL` | OAuth redirects | e.g. `http://localhost:3000` |

The app runs without any keys — you'll just see configuration notices in place
of live data.

### Database

Apply the migrations in `supabase/migrations/` to your Supabase project (via the
Supabase SQL editor or CLI). `0001_init.sql` creates the schema and the
profile-on-signup trigger; `0002_rls.sql` enables Row Level Security;
`0003_phase2_profiles_reviews_collections.sql` adds Phase 2 columns, indexes,
constraints and `updated_at` triggers for profiles, reviews and collections.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run type-check` | `tsc --noEmit` |
| `npm test` | Run Vitest |

### Full verification

```bash
npm install
npm run type-check
npm run lint
npm test
npm run build
```

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the Vercel + Supabase guide.

## Roadmap

- **Phase 1:** Home, Movies, TV, Search, Auth, Watchlist. ✅
- **Phase 2 (in progress):**
  - User Profiles, Reviews (CRUD), Custom Collections. ✅
  - Entertainment DNA, AI Picks, Recommendation Feedback, Shareable DNA Card.
    _(Planned.)_
  - AI Assistant, AI Memory, Google Gemini integration. _(Planned.)_
- **Later:** Watch Together, additional verticals (anime, music),
  notifications, premium/payments. _(Not yet implemented.)_

## Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB.
