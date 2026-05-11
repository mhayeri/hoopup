-- Session-edit defense-in-depth
--
-- RLS already restricts UPDATE on public.sessions to the host. These triggers
-- close two further gaps that RLS alone cannot express:
--
--   1. After a session has started (or after it's been cancelled), the host
--      should not be able to rewrite the schedule. Cancellation is still
--      allowed — a host may need to call off an in-progress game.
--   2. Once a session is cancelled, it cannot be un-cancelled. Re-opening
--      a cancelled session would surprise anyone who already saw the
--      "cancelled" badge and walked away.
--
-- Both guards raise on the offending UPDATE; the client receives a 4xx with
-- the message text. No new error codes are introduced — the messages are
-- meant to be surfaced verbatim if needed.

create or replace function public.guard_session_edit()
returns trigger
language plpgsql
as $$
begin
  -- 1. Block schedule/notes changes after the session has started.
  --    A pure cancellation (only cancelled_at moves from NULL to a value)
  --    is still allowed.
  if old.starts_at <= now() then
    if new.starts_at is distinct from old.starts_at
       or new.ends_at  is distinct from old.ends_at
       or new.notes    is distinct from old.notes
       or new.court_id is distinct from old.court_id
       or new.host_id  is distinct from old.host_id then
      raise exception 'Cannot edit a session that has already started.';
    end if;
  end if;

  -- 2. Block un-cancellation.
  if old.cancelled_at is not null and new.cancelled_at is null then
    raise exception 'A cancelled session cannot be un-cancelled.';
  end if;

  return new;
end $$;

create trigger trg_guard_session_edit
  before update on public.sessions
  for each row execute function public.guard_session_edit();
