# HoopUp

> Find a court. Pick a time. Get on the floor.

HoopUp is a basketball pickup-game coordinator. Pull up the map, see nearby courts, RSVP to a session, and show up knowing exactly who's running with you. Each session caps at 15 — first come, first hooped.

## Stack

- **Frontend**: React 19 + Vite + TypeScript + Tailwind CSS
- **Backend**: Supabase (Postgres + Auth + Storage + Realtime + Row-Level Security)
- **Map**: Leaflet + OpenStreetMap, court data via the OSM Overpass API
- **Auth**: Email/password, Google OAuth, GitHub OAuth
- **Hosting**: GitHub Pages via GitHub Actions
- **Live site**: https://mhayeri.github.io/hoopup/

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

### Configuring OAuth providers (optional)

Email/password auth works out of the box. To enable Google or GitHub sign-in, you need to register an OAuth app with each provider and paste the credentials into the Supabase dashboard.

**The Supabase callback URL is the same for both providers:**

```
https://<your-project-ref>.supabase.co/auth/v1/callback
```

#### Google (Google Cloud Console)

1. Go to https://console.cloud.google.com/apis/credentials
2. Create or select a project
3. **Create credentials → OAuth client ID → Web application**
4. **Authorized JavaScript origins**: `https://<your-project-ref>.supabase.co`
5. **Authorized redirect URIs**: the Supabase callback URL above
6. Copy the **Client ID** and **Client secret**
7. In the Supabase dashboard → **Authentication → Providers → Google** → enable, paste both values, save

#### GitHub

1. https://github.com/settings/developers → **OAuth Apps → New OAuth App**
2. **Homepage URL**: `https://<your-username>.github.io/hoopup/`
3. **Authorization callback URL**: the Supabase callback URL above
4. Generate a **Client secret**
5. In the Supabase dashboard → **Authentication → Providers → GitHub** → enable, paste **Client ID** and **Client secret**, save

Once a provider is enabled in the dashboard, the corresponding button on the sign-in / sign-up page will work end-to-end.

## How it works

- **Map view** geolocates you and renders nearby basketball courts pulled from OpenStreetMap. Courts are cached server-side to avoid hammering Overpass.
- **Sessions** are time-windowed pickup games attached to a court. Anyone can host one; anyone can RSVP. The 15-player cap is enforced atomically by a Postgres trigger — there's no "16th player slipped through" race condition.
- **Profiles** show your bio, skill level, preferred position, years playing, home court, and avatar.

## Project layout

```
src/
  components/      # shared UI (NavBar, RequireAuth, OAuthButtons)
  lib/             # supabase client, env, database types
  providers/       # AuthProvider + useAuth hook
  routes/          # page-level components (one per route)
supabase/
  config.toml      # CLI-readable project link + auth redirect allowlist
  migrations/      # SQL schema, RLS, triggers, seed
.github/workflows/ # CI + deploy
```

## License

MIT — see [LICENSE](./LICENSE).
