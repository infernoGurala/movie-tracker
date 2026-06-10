# 🎬 movie-tracker

> A social film tracking platform. Log what you watch. Share your taste. Discover through people you follow.

---

## What It Is

**movie-tracker** is a web app where users log the films they've watched, rate them, and build a public profile that others can follow. It pulls real movie data (posters, cast, ratings) from the TMDB API — no manual entry.

Think Letterboxd meets IMDB, but minimal, fast, and yours.

---

## Stack

| Layer | Technology |
|---|---|
| Backend / API | Cloudflare Workers |
| Database | Supabase (PostgreSQL) |
| Movie Data | TMDB API (free) |
| Frontend | HTML + CSS + Vanilla JS (served via Worker) |
| Auth | Username + Password (bcrypt, JWT stored in cookie) |
| Hosting | Cloudflare (Workers + Pages) |
| Source | GitHub |

---

## Project Structure

```
movie-tracker/
├── README.md                   ← You are here
├── docs/
│   ├── 01-features.md          ← Full feature list
│   ├── 02-user-flows.md        ← How users move through the app
│   └── 03-api-routes.md        ← All Cloudflare Worker endpoints
├── design/
│   ├── 01-design-system.md     ← Colors, typography, spacing
│   ├── 02-ui-screens.md        ← Screen-by-screen layout descriptions
│   └── 03-components.md        ← Reusable UI components
└── architecture/
    ├── 01-database-schema.md   ← Supabase tables and relationships
    ├── 02-auth-flow.md         ← Login, session, security
    └── 03-tmdb-integration.md  ← How TMDB API is used
```

---

## Core Philosophy

- **No bloat.** Every screen has one job.
- **Real data.** TMDB powers all film info — no manual entry ever.
- **Privacy where it matters.** Reviews are private. Ratings are public.
- **Social without noise.** Only see people you follow. No algorithm, no ads.

---

## Documents Index

| File | Purpose |
|---|---|
| `docs/01-features.md` | Every feature, grouped by area |
| `docs/02-user-flows.md` | Step-by-step user journeys |
| `docs/03-api-routes.md` | Backend route definitions |
| `design/01-design-system.md` | Visual language of the app |
| `design/02-ui-screens.md` | Layout of every screen |
| `design/03-components.md` | UI component specifications |
| `architecture/01-database-schema.md` | All Supabase tables |
| `architecture/02-auth-flow.md` | Auth logic and security |
| `architecture/03-tmdb-integration.md` | TMDB usage and caching |
