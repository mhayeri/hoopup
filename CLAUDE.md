# HoopUp

Basketball pickup-game coordinator. Find a court, pick a time, get on the floor.

Live: https://mhayeri.github.io/hoopup/

## Stack

- **Frontend:** React 19 + Vite 6 + TypeScript 5.7 + Tailwind CSS 4.3
- **Routing:** React Router 7 (HashRouter for GitHub Pages)
- **Map:** Leaflet + React Leaflet + OpenStreetMap Overpass API
- **Backend:** Supabase (Postgres 15 + PostGIS + Auth + Storage + RLS)
- **Deploy:** GitHub Pages via GitHub Actions CI
- **Supabase project ID:** `cnqtnomndqcuxeogzihb`

## Repo layout

```
src/
  components/         Shared UI (NavBar, RequireAuth, OAuthButtons)
  providers/          AuthProvider + useAuth hook
  lib/                supabase client, database.types.ts, env.ts, leaflet.ts
  routes/             Page-level components (one per route)
  features/
    map/              MapPage, useCourtsInView, useOverpassSync
    sessions/         SessionForm/Modal/ListItem, useSession, useSessionsByCourt, createSession, formatTime
    profiles/         ProfileEditForm, AvatarUpload, useProfile
supabase/
  migrations/         SQL migrations (applied to live project)
  config.toml         Supabase CLI config
```

## Database schema (public)

| Table           | Key columns                                                                                                   | Notes                                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `profiles`      | id (uuid, FK auth.users), username, skill_level, preferred_position, years_playing, home_court_id, avatar_url | Auto-created on signup via trigger. RLS: owner-only writes.                                                            |
| `courts`        | id (bigserial), osm_id, name, lat, lng, surface, hoops, lit, geom (PostGIS)                                   | Read-only for clients. Upserted via `upsert_osm_courts()` SECURITY DEFINER RPC.                                        |
| `sessions`      | id (uuid), court_id, host_id, starts_at, ends_at, notes, cancelled_at                                         | Host-only writes via RLS. DB triggers block post-start edits and un-cancellation.                                      |
| `session_rsvps` | session_id + user_id (composite PK), status ('going'\|'waitlist'\|'cancelled')                                | User-only writes via RLS. 15-player cap enforced atomically by `enforce_session_cap()` trigger with row-level locking. |

## Key patterns

- **Hand-maintained TS types** in `src/lib/database.types.ts` — keep in sync with migrations.
- **RLS + triggers** — RLS enforces ownership; triggers enforce business logic (session cap, edit guards).
- **Debounced Overpass sync** — map pan/zoom fetches courts from Overpass, upserts via RPC, per-bbox cache prevents duplicate queries.
- **Sanitized client-to-server** — Overpass data validated + truncated before RPC call.
- **Optimistic UI** — useProfile applies updates optimistically, reverts on error.
- **PG error codes** — `P0001` = SESSION_FULL, `P0002` = SESSION_NOT_AVAILABLE, `P0003` = USERNAME_GENERATION_FAILED.

## Commands

```bash
npm run dev          # local dev server (localhost:5173/hoopup/)
npm run build        # production build
npm run lint         # ESLint
npm run format       # Prettier write
npm run format:check # Prettier check (CI uses this)
```

## Roadmap

1. ~~Scaffold (Vite + React + Tailwind + CI)~~ — PR #1
2. ~~Supabase schema (tables + RLS + triggers)~~ — PR #2
3. ~~Auth (email/password + Google/GitHub OAuth)~~ — PR #3
4. ~~Profiles (edit form + avatar upload)~~ — PR #4
5. ~~Map + Courts (Leaflet + Overpass + court detail)~~ — PR #5
6. ~~Sessions (host, list, detail, edit, cancel)~~ — PR #6
7. ~~RSVP system (roster UI, waitlist, session-full handling)~~ — PR #8
8. **Design polish** — in progress (PR #9)
