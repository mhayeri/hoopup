-- Court favorites
--
-- A user bookmarks any number of courts. This is distinct from
-- profiles.home_court_id (a single "home base"); favorites is a many-to-many
-- set used to surface a personal shortlist on the profile.
--
-- Owner-scoped and private: only the owner reads/writes their rows (see the
-- RLS migration). Toggle semantics — a row exists iff the court is saved — so
-- there are no mutable columns and no UPDATE path. Both FKs cascade so a
-- deleted account or court cleans up its favorites automatically.

create table public.court_favorites (
  user_id    uuid   not null references public.profiles(id) on delete cascade,
  court_id   bigint not null references public.courts(id)   on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, court_id)
);

-- "My favorites, newest first" — the only read pattern (Favorites tab).
create index court_favorites_user_idx
  on public.court_favorites (user_id, created_at desc);
