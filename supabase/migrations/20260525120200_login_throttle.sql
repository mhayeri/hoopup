-- Server-side support for the rate-limited `login` edge function.
--
-- The edge function (verify_jwt=false, callers are logged out) needs three
-- things, all reachable only with the service-role key it holds — never by
-- anon/authenticated:
--
--   1. auth_throttle  — per-IP fixed-window attempt counter.
--   2. record_login_attempt(ip, max, window_seconds) — atomic increment that
--      returns whether the caller is still under the limit.
--   3. resolve_login_email(username) — username -> email lookup, kept private
--      (this replaces the dropped public get_email_by_username RPC).
--
-- RLS is enabled on auth_throttle with NO policies, so only the service role
-- (which bypasses RLS) can touch it. Both functions REVOKE from public/anon/
-- authenticated and GRANT only to service_role, so they never appear as a
-- public /rest/v1/rpc endpoint.

create table if not exists public.auth_throttle (
  ip           varchar(45) not null, -- max length of an IPv6 text representation
  window_start timestamptz not null,
  attempts     int         not null default 0,
  primary key (ip, window_start)
);

alter table public.auth_throttle enable row level security;

-- Atomic per-IP attempt counter. Returns true while under the limit.
create or replace function public.record_login_attempt(
  p_ip             text,
  p_max            int,
  p_window_seconds int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window   timestamptz := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );
  v_attempts int;
begin
  -- Clamp to the column width; only an oversized (spoofed) header could exceed it.
  p_ip := left(p_ip, 45);

  insert into public.auth_throttle (ip, window_start, attempts)
  values (p_ip, v_window, 1)
  on conflict (ip, window_start)
  do update set attempts = public.auth_throttle.attempts + 1
  returning attempts into v_attempts;

  -- Opportunistic cleanup of stale windows so the table stays small.
  if random() < 0.05 then
    delete from public.auth_throttle where window_start < now() - interval '1 hour';
  end if;

  return v_attempts <= p_max;
end $$;

revoke all on function public.record_login_attempt(text, int, int) from public, anon, authenticated;
grant execute on function public.record_login_attempt(text, int, int) to service_role;

-- Private username -> email resolution (service-role only).
create or replace function public.resolve_login_email(p_username text)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_email text;
begin
  select au.email into v_email
  from public.profiles p
  join auth.users au on au.id = p.id
  where lower(p.username) = lower(p_username);

  return v_email;
end $$;

revoke all on function public.resolve_login_email(text) from public, anon, authenticated;
grant execute on function public.resolve_login_email(text) to service_role;
