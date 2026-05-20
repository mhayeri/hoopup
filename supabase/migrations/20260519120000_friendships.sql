-- Friendships
--
-- A directional pair `(requester_id, addressee_id)` records who asked whom,
-- so the UI can render "X sent you a request" vs "you sent X a request"
-- without ambiguity. Statuses:
--   pending   — request sent, awaiting addressee
--   accepted  — mutual; either party can later DELETE to unfriend
-- Decline is represented as DELETE (no row keeps the rejection history).
--
-- Foot-guns handled here:
--   * Self-friend: CHECK (requester_id <> addressee_id) + trigger (P0004) in
--     the triggers migration.
--   * Reverse-pair duplicate (A→B + B→A): a UNIQUE index on the unordered
--     pair (least, greatest) makes either direction collide with the other
--     regardless of status. The triggers migration maps that collision to a
--     friendly P0005 error code.
--   * accepted_at out of sync with status: a paired CHECK ties the two
--     together so a row is `accepted` IFF accepted_at is set.

create table public.friendships (
  requester_id  uuid not null references public.profiles(id) on delete cascade,
  addressee_id  uuid not null references public.profiles(id) on delete cascade,
  status        text not null check (status in ('pending', 'accepted')),
  created_at    timestamptz not null default now(),
  accepted_at   timestamptz,
  primary key (requester_id, addressee_id),
  constraint friendships_no_self check (requester_id <> addressee_id),
  constraint friendships_accepted_stamp
    check ((status = 'accepted') = (accepted_at is not null))
);

-- Reverse-pair guard: prevents both A→B and B→A coexisting in any status.
create unique index friendships_unordered_pair_uniq
  on public.friendships (
    least(requester_id, addressee_id),
    greatest(requester_id, addressee_id)
  );

-- Lookup indexes for "friends of X" queries from both directions.
create index friendships_addressee_idx
  on public.friendships (addressee_id, status);

create index friendships_requester_idx
  on public.friendships (requester_id, status);
