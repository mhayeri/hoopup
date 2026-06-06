-- Notification fan-out triggers.
--
-- Two AFTER INSERT triggers create notification rows. Both run SECURITY
-- DEFINER + SET search_path = public (the pattern set by
-- add_host_to_session_rsvps, 20260513120000) because they must INSERT rows
-- owned by OTHER users and read the recipient's profile flag, which RLS would
-- otherwise block for the acting (inserting) user.
--
-- Each recipient's `notifications_enabled` flag is checked at fan-out time, so
-- opting out suppresses new rows for that user.

-- ---- Trigger 1: a friend hosted a game ---------------------------------
--
-- On a new session, notify every ACCEPTED friend of the host whose flag is on.
-- The friend is the non-host side of the unordered friendship pair (same
-- "requester or addressee" resolution as the friends UI). The unordered-pair
-- unique index guarantees one row per friend, so no DISTINCT is needed. The
-- host is never their own friend (friendships_no_self), so no self-notify guard.
create or replace function public.notify_friends_on_session()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (user_id, actor_id, type, session_id)
  select
    case when f.requester_id = new.host_id then f.addressee_id else f.requester_id end,
    new.host_id,
    'friend_session',
    new.id
  from public.friendships f
  join public.profiles p
    on p.id = case when f.requester_id = new.host_id then f.addressee_id else f.requester_id end
  where f.status = 'accepted'
    and (f.requester_id = new.host_id or f.addressee_id = new.host_id)
    and p.notifications_enabled;
  return new;
end $$;

drop trigger if exists trg_notify_friends_on_session on public.sessions;
create trigger trg_notify_friends_on_session
  after insert on public.sessions
  for each row execute function public.notify_friends_on_session();

-- ---- Trigger 2: incoming friend request --------------------------------
--
-- On a new pending friendship, notify the addressee if their flag is on.
-- The WHEN clause limits this to inserts of pending rows; accepting a request
-- is an UPDATE, so it never double-fires here. Addressee <> requester by
-- construction, so there's no self-notify case.
create or replace function public.notify_on_friend_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.profiles
    where id = new.addressee_id and notifications_enabled
  ) then
    insert into public.notifications (user_id, actor_id, type)
    values (new.addressee_id, new.requester_id, 'friend_request');
  end if;
  return new;
end $$;

drop trigger if exists trg_notify_on_friend_request on public.friendships;
create trigger trg_notify_on_friend_request
  after insert on public.friendships
  for each row
  when (new.status = 'pending')
  execute function public.notify_on_friend_request();

-- ---- Lockdown ----------------------------------------------------------
--
-- Trigger-only functions: revoke the RPC surface so they can't be invoked as
-- /rest/v1/rpc/<name> endpoints (triggers still fire regardless). Matches the
-- convention in 20260525120000_security_lockdown.
revoke execute on function
  public.notify_friends_on_session(),
  public.notify_on_friend_request()
from public, anon, authenticated;
