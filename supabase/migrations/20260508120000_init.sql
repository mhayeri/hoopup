-- Initial HoopUp schema
--
-- Tables:
--   profiles        — 1:1 with auth.users
--   courts          — cached from OSM Overpass; geography column for radius queries
--   sessions        — time-windowed pickup games attached to a court
--   session_rsvps   — composite-PK join table; 15-player cap enforced by trigger (next migration)

create extension if not exists postgis with schema extensions;

-- profiles ----------------------------------------------------------------

create table public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  username            text unique not null check (char_length(username) between 3 and 20),
  bio                 text check (char_length(bio) <= 500),
  skill_level         text check (skill_level in ('beginner','intermediate','advanced','pro')),
  preferred_position  text check (preferred_position in ('PG','SG','SF','PF','C')),
  years_playing       int  check (years_playing between 0 and 80),
  home_court_id       bigint, -- FK added after courts table is created
  avatar_url          text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- courts ------------------------------------------------------------------

create table public.courts (
  id              bigserial primary key,
  osm_id          bigint unique,
  name            text,
  lat             double precision not null,
  lng             double precision not null,
  surface         text,
  hoops           int,
  lit             boolean,
  geom            extensions.geography(Point, 4326)
                  generated always as (extensions.st_makepoint(lng, lat)::extensions.geography) stored,
  last_synced_at  timestamptz not null default now(),
  created_at      timestamptz not null default now()
);
create index courts_geom_idx on public.courts using gist (geom);

alter table public.profiles
  add constraint profiles_home_court_fk
  foreign key (home_court_id) references public.courts(id) on delete set null;

-- sessions ----------------------------------------------------------------

create table public.sessions (
  id            uuid primary key default gen_random_uuid(),
  court_id      bigint not null references public.courts(id) on delete restrict,
  host_id       uuid   not null references public.profiles(id) on delete cascade,
  starts_at     timestamptz not null,
  ends_at       timestamptz not null check (ends_at > starts_at),
  notes         text check (char_length(notes) <= 500),
  cancelled_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index sessions_starts_idx on public.sessions (starts_at) where cancelled_at is null;
create index sessions_court_idx  on public.sessions (court_id, starts_at);
create index sessions_host_idx   on public.sessions (host_id);

-- session_rsvps -----------------------------------------------------------

create table public.session_rsvps (
  session_id  uuid not null references public.sessions(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  status      text not null default 'going'
              check (status in ('going','waitlist','cancelled')),
  created_at  timestamptz not null default now(),
  primary key (session_id, user_id)
);
create index session_rsvps_user_idx on public.session_rsvps (user_id);

-- updated_at touch helper (reused by future tables) -----------------------

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

create trigger sessions_touch_updated_at
  before update on public.sessions
  for each row execute function public.touch_updated_at();
