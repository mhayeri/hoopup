-- Row Level Security
--
-- Read access:
--   profiles, courts, sessions, session_rsvps  — anyone can SELECT
--
-- Write access:
--   profiles      — only the owner (id = auth.uid()) can INSERT/UPDATE
--   courts        — clients cannot write directly; only the service_role can
--                   (court rows are upserted by an RPC the next branch adds)
--   sessions      — only the host can INSERT/UPDATE/DELETE
--   session_rsvps — only the user themselves can INSERT/UPDATE/DELETE their own row
--
-- Every UPDATE/INSERT policy includes WITH CHECK so users can't flip a row's
-- ownership column to point at someone else.

alter table public.profiles      enable row level security;
alter table public.courts        enable row level security;
alter table public.sessions      enable row level security;
alter table public.session_rsvps enable row level security;

-- profiles ----------------------------------------------------------------

create policy profiles_select_all on public.profiles
  for select using (true);

create policy profiles_insert_self on public.profiles
  for insert with check (auth.uid() = id);

create policy profiles_update_self on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- courts ------------------------------------------------------------------

create policy courts_select_all on public.courts
  for select using (true);

-- (no insert/update/delete policies → only service_role can write)

-- sessions ----------------------------------------------------------------

create policy sessions_select_all on public.sessions
  for select using (true);

create policy sessions_insert_self on public.sessions
  for insert with check (auth.uid() = host_id);

create policy sessions_update_host on public.sessions
  for update using (auth.uid() = host_id) with check (auth.uid() = host_id);

create policy sessions_delete_host on public.sessions
  for delete using (auth.uid() = host_id);

-- session_rsvps -----------------------------------------------------------

create policy rsvps_select_all on public.session_rsvps
  for select using (true);

create policy rsvps_insert_self on public.session_rsvps
  for insert with check (auth.uid() = user_id);

create policy rsvps_update_self on public.session_rsvps
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy rsvps_delete_self on public.session_rsvps
  for delete using (auth.uid() = user_id);
