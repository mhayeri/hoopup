-- Atomic 15-player session cap
--
-- RLS can't enforce row-count caps; you'd need to count peer rows during the
-- INSERT, and there's no race-free way to do that in pure RLS. So we use a
-- BEFORE INSERT/UPDATE trigger that takes a row-level lock on the parent
-- session before counting peers. Two concurrent INSERTs for the 15th seat
-- will serialize — exactly one wins, the other raises SESSION_FULL.
--
-- Client must catch SQLSTATE P0001 with message 'SESSION_FULL' and surface
-- a "Session full" toast.

create or replace function public.enforce_session_cap()
returns trigger
language plpgsql
as $$
declare
  going_count int;
begin
  -- Lock the parent session row so concurrent inserts serialize on it.
  -- This will fail loudly if the session was deleted mid-flight (FK is set
  -- to ON DELETE CASCADE, but a concurrent delete + insert is still safe
  -- because the FK violation surfaces as a clear error).
  perform 1
  from public.sessions s
  where s.id = new.session_id
    and s.cancelled_at is null
  for update;

  if not found then
    raise exception 'SESSION_NOT_AVAILABLE'
      using errcode = 'P0002';
  end if;

  -- Only count rows that hold a "going" seat. Waitlist and cancelled
  -- rows don't count against the cap.
  if new.status = 'going' then
    select count(*) into going_count
    from public.session_rsvps
    where session_id = new.session_id
      and status = 'going'
      -- Exclude the row currently being updated (UPDATE only).
      and (tg_op <> 'UPDATE' or user_id <> new.user_id);

    if going_count >= 15 then
      raise exception 'SESSION_FULL'
        using errcode = 'P0001';
    end if;
  end if;

  return new;
end $$;

create trigger trg_enforce_session_cap
  before insert or update on public.session_rsvps
  for each row execute function public.enforce_session_cap();
