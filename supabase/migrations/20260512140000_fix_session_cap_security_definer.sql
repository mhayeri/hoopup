-- Fix: non-host users unable to RSVP
--
-- The original enforce_session_cap() uses SELECT ... FOR UPDATE to lock the
-- parent session row. In PostgreSQL, FOR UPDATE requires both SELECT and
-- UPDATE RLS policies to pass. The sessions UPDATE policy is
-- `auth.uid() = host_id`, so only the host can acquire the lock. For any
-- other user the row is silently filtered out, PERFORM sees NOT FOUND, and
-- the trigger raises SESSION_NOT_AVAILABLE (P0002) — which the client
-- displays as "This session has been cancelled."
--
-- Fix: make the function SECURITY DEFINER so it runs as the function owner,
-- bypassing RLS for the lock query. This is the standard pattern for trigger
-- functions that need to read/lock rows across RLS boundaries. The trigger
-- only fires on session_rsvps inserts/updates, and RLS on session_rsvps
-- already restricts who can invoke it.

create or replace function public.enforce_session_cap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  going_count int;
begin
  -- Lock the parent session row so concurrent inserts serialize on it.
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
