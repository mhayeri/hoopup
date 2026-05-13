-- Host auto-RSVP + solo-host-leaves cancellation
--
-- Tie the host to the RSVP lifecycle so the session model behaves the way
-- people expect:
--
--   1. AFTER INSERT ON sessions: auto-insert the host into session_rsvps with
--      status='going'. The host appears in the roster immediately and counts
--      toward the 15-player cap without clicking "I'm in".
--   2. AFTER UPDATE OR DELETE ON session_rsvps: if the host transitions out
--      of 'going' (or their row is deleted) and no other 'going' RSVPs remain,
--      auto-cancel the session. If others are still going, the session
--      continues — host_id is NOT transferred (that's a future change).
--
-- Both functions run SECURITY DEFINER + SET search_path = public, matching the
-- pattern set by enforce_session_cap (20260512140000). The session edit-guard
-- trigger (20260510120000) explicitly allows pure cancellations, so the
-- auto-cancel UPDATE is not blocked even when the session is in progress.

-- ---- Trigger 1: auto-RSVP the host -------------------------------------

create or replace function public.add_host_to_session_rsvps()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- ON CONFLICT guards against the (shouldn't-happen) case where a client
  -- somehow pre-inserted the host's RSVP before the trigger fires.
  insert into public.session_rsvps (session_id, user_id, status)
  values (new.id, new.host_id, 'going')
  on conflict (session_id, user_id) do nothing;
  return new;
end $$;

drop trigger if exists trg_add_host_rsvp on public.sessions;
create trigger trg_add_host_rsvp
  after insert on public.sessions
  for each row execute function public.add_host_to_session_rsvps();

-- ---- Trigger 2: cancel session if host leaves alone --------------------

create or replace function public.cancel_session_if_host_alone()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session_id uuid;
  v_user_id   uuid;
  v_host_id   uuid;
  v_remaining int;
  v_was_active boolean;
begin
  -- Identify the row being changed and whether it was in an active state
  -- before the change (i.e. the user was "in" the session).
  if tg_op = 'UPDATE' then
    v_session_id := old.session_id;
    v_user_id    := old.user_id;
    v_was_active := (old.status <> 'cancelled' and new.status = 'cancelled');
    if not v_was_active then
      return new;
    end if;
  elsif tg_op = 'DELETE' then
    v_session_id := old.session_id;
    v_user_id    := old.user_id;
    v_was_active := (old.status <> 'cancelled');
    if not v_was_active then
      return old;
    end if;
  else
    return null;
  end if;

  -- Only the host's departure can auto-cancel the session.
  select host_id into v_host_id
  from public.sessions
  where id = v_session_id;

  if v_host_id is null or v_host_id <> v_user_id then
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  -- Count remaining 'going' RSVPs, excluding the row currently leaving.
  select count(*) into v_remaining
  from public.session_rsvps
  where session_id = v_session_id
    and status = 'going'
    and user_id <> v_user_id;

  if v_remaining = 0 then
    update public.sessions
    set cancelled_at = now()
    where id = v_session_id
      and cancelled_at is null;
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end $$;

drop trigger if exists trg_cancel_session_if_host_alone on public.session_rsvps;
create trigger trg_cancel_session_if_host_alone
  after update or delete on public.session_rsvps
  for each row execute function public.cancel_session_if_host_alone();

-- ---- Backfill ----------------------------------------------------------

-- One-shot: every active future session that doesn't already have a host RSVP
-- gets one. Sessions already at the 15-player cap are skipped to avoid the
-- enforce_session_cap trigger raising during migration; in practice this is
-- almost certainly zero rows but the guard keeps the migration safe.

insert into public.session_rsvps (session_id, user_id, status)
select s.id, s.host_id, 'going'
from public.sessions s
where s.cancelled_at is null
  and s.ends_at >= now()
  and (
    select count(*) from public.session_rsvps r
    where r.session_id = s.id and r.status = 'going'
  ) < 15
on conflict (session_id, user_id) do nothing;
