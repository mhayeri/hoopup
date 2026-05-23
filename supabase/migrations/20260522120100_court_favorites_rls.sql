-- Row Level Security for court_favorites
--
-- Favorites are private — unlike accepted friendships there is no public
-- read. Every policy is scoped to the owner:
--   SELECT — owner only (powers the profile Favorites tab + the saved-state
--            check on the court detail page).
--   INSERT — owner only; the row's user_id must be the caller.
--   DELETE — owner only (un-save).
-- No UPDATE policy: a favorite is a row that exists or doesn't, with no
-- mutable columns.

alter table public.court_favorites enable row level security;

create policy court_favorites_select_own on public.court_favorites
  for select using (auth.uid() = user_id);

create policy court_favorites_insert_own on public.court_favorites
  for insert with check (auth.uid() = user_id);

create policy court_favorites_delete_own on public.court_favorites
  for delete using (auth.uid() = user_id);
