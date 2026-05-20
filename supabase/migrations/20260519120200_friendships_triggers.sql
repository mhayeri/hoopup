-- Friendships business-logic triggers
--
-- BEFORE INSERT — friendly error codes for the two illegal cases that can
-- otherwise surface as opaque check/unique-index violations:
--   P0004 FRIENDSHIP_SELF      requester_id = addressee_id
--   P0005 FRIENDSHIP_DUPLICATE reverse pair already exists in any status
--                              (UI maps this to "they already sent you a
--                              request" — refresh then Accept/Decline).
--
-- BEFORE UPDATE — enforces that:
--   * requester_id / addressee_id are immutable.
--   * the only legal status transition is pending → accepted, which auto-
--     stamps accepted_at. Anything else raises P0006 FRIENDSHIP_IMMUTABLE.
--
-- Both functions match the SECURITY DEFINER + SET search_path = public
-- pattern established by add_host_to_session_rsvps (20260513120000).

create or replace function public.friendships_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.requester_id = new.addressee_id then
    raise exception 'cannot friend yourself'
      using errcode = 'P0004';
  end if;

  if exists (
    select 1
    from public.friendships
    where requester_id = new.addressee_id
      and addressee_id = new.requester_id
  ) then
    raise exception 'a friendship already exists in the reverse direction'
      using errcode = 'P0005';
  end if;

  return new;
end $$;

drop trigger if exists trg_friendships_before_insert on public.friendships;
create trigger trg_friendships_before_insert
  before insert on public.friendships
  for each row execute function public.friendships_before_insert();


create or replace function public.friendships_before_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.requester_id <> old.requester_id
     or new.addressee_id <> old.addressee_id then
    raise exception 'friendship parties are immutable'
      using errcode = 'P0006';
  end if;

  if old.status = 'pending' and new.status = 'accepted' then
    new.accepted_at := now();
  elsif new.status <> old.status then
    raise exception 'illegal friendship status transition'
      using errcode = 'P0006';
  end if;

  return new;
end $$;

drop trigger if exists trg_friendships_before_update on public.friendships;
create trigger trg_friendships_before_update
  before update on public.friendships
  for each row execute function public.friendships_before_update();
