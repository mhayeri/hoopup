# HoopUp

> Find a court. Pick a time. Get on the floor.

HoopUp is a basketball pickup-game coordinator. Pull up the map, see nearby courts, RSVP to a session, and show up knowing exactly who's running with you. Each session caps at 15 — first come, first hooped.

## Stack

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS
- **Backend**: Supabase (Postgres + Auth + Storage + Realtime + Row-Level Security)
- **Map**: Leaflet + OpenStreetMap, court data via the OSM Overpass API
- **Auth**: Email/password, Google OAuth, GitHub OAuth
- **Hosting**: GitHub Pages via GitHub Actions
- **Live site**: https://mhayeri.github.io/hoopup/ _(after first deploy)_

## Local development

```bash
git clone https://github.com/mhayeri/hoopup.git
cd hoopup
npm install
cp .env.example .env.local   # fill in Supabase URL + anon key
npm run dev                  # http://localhost:5173/hoopup/
```

You'll need:
1. A free Supabase project — copy the **Project URL** and **anon key** into `.env.local` (never the `service_role` key).
2. Google + GitHub OAuth client IDs configured in Supabase Auth → Providers (only required for OAuth sign-in; email/password works out of the box).

## How it works

- **Map view** geolocates you and renders nearby basketball courts pulled from OpenStreetMap. Courts are cached server-side to avoid hammering Overpass.
- **Sessions** are time-windowed pickup games attached to a court. Anyone can host one; anyone can RSVP. The 15-player cap is enforced atomically by a Postgres trigger — there's no "16th player slipped through" race condition.
- **Profiles** show your bio, skill level, preferred position, years playing, home court, and avatar.

## Project layout

```
src/
  features/        # auth, profiles, map, sessions, rsvp
  lib/             # supabase client, env, leaflet helpers
  providers/       # AuthProvider, etc.
  routes/          # page-level components
supabase/
  migrations/      # SQL schema, RLS, triggers
.github/workflows/ # deploy.yml
```

## License

MIT — see [LICENSE](./LICENSE).
