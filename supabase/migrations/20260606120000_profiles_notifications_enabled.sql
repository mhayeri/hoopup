-- Per-user opt-out switch for in-app notifications.
--
-- One global flag (not per-type) gates both notification kinds: a friend
-- hosting a game and an incoming friend request. The fan-out triggers check
-- the RECIPIENT's flag, so flipping this off stops new notifications from
-- being created for you (existing rows are untouched).
--
-- Defaults true (opt-out) so the feature is live for everyone immediately.
-- The column is world-readable via the existing `profiles_select_all` policy;
-- that's acceptable here (it isn't sensitive), and the triggers read it under
-- SECURITY DEFINER regardless of the caller.
alter table public.profiles
  add column notifications_enabled boolean not null default true;
