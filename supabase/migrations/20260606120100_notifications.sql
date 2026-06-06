-- In-app notifications feed.
--
-- One row per delivered notification. Created only by SECURITY DEFINER fan-out
-- triggers (see 20260606120300) — never by clients (no INSERT RLS policy).
--   * user_id   the recipient (owner; RLS scopes everything to auth.uid()).
--   * actor_id  who triggered it (the host / the friend-requester).
--   * type      'friend_session' (a friend hosted a game) or 'friend_request'.
--   * session_id the hosted session for 'friend_session'; null for 'friend_request'.
--   * read_at   null until the recipient opens the notifications panel.
create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  actor_id    uuid not null references public.profiles(id) on delete cascade,
  type        text not null check (type in ('friend_session', 'friend_request')),
  session_id  uuid references public.sessions(id) on delete cascade,
  read_at     timestamptz,
  created_at  timestamptz not null default now(),
  -- session_id is required for (and only for) the 'friend_session' type.
  -- Mirrors the paired-CHECK style of friendships_accepted_stamp.
  constraint notifications_session_required
    check ((type = 'friend_session') = (session_id is not null))
);

-- Feed query: recipient's rows, newest first.
create index notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

-- Unread-count query: partial index keeps it cheap as read rows pile up.
create index notifications_user_unread_idx
  on public.notifications (user_id)
  where read_at is null;
