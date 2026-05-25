-- Security lockdown
--
-- Closes the findings surfaced by the live Supabase security advisors:
--
--   * Trigger-only functions were reachable as RPCs via /rest/v1/rpc/<name> by
--     anon + authenticated (advisor 0028/0029). Triggers fire as part of the
--     table operation regardless of EXECUTE grants, so revoking EXECUTE removes
--     the public RPC surface without affecting trigger behaviour.
--   * guard_session_edit / touch_updated_at had a mutable search_path
--     (advisor 0011). Pin it.
--   * The public `avatars` bucket had a broad SELECT policy (advisor 0025) that
--     let clients LIST every file. Public buckets serve object URLs without it,
--     so drop the listing policy.
--
-- The intentionally-public RPCs upsert_osm_courts(jsonb) and
-- set_court_address(bigint, text) are left as-is: the map's Overpass sync runs
-- for logged-out visitors and both validate/truncate input server-side.

-- 1. Revoke direct RPC execution on trigger-only functions.
revoke execute on function
  public.add_host_to_session_rsvps(),
  public.cancel_session_if_host_alone(),
  public.enforce_session_cap(),
  public.friendships_before_insert(),
  public.friendships_before_update(),
  public.handle_new_user(),
  public.guard_session_edit(),
  public.touch_updated_at()
from public, anon, authenticated;

-- 2. Pin search_path on the two SECURITY INVOKER trigger functions.
alter function public.guard_session_edit() set search_path = public;
alter function public.touch_updated_at()  set search_path = public;

-- 3. Stop public listing of the avatars bucket. Object URLs still resolve
--    because the bucket itself is public; this only removes the LIST ability.
drop policy if exists avatars_read_all on storage.objects;

-- NOTE: get_email_by_username(text) is dropped in a SEPARATE migration
-- (20260525120100) so it can be applied to the live DB only AFTER the new
-- login path (the `login` edge function) is deployed — dropping it earlier
-- would break username login on the currently-deployed frontend.
