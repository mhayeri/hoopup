-- Index to back the friend-search feature: prefix lookups on username.
--
-- Find-a-friend search runs `username LIKE 'jor%'` (case-sensitive prefix
-- against a lowercased query — usernames are guaranteed lowercase by the
-- profiles_username_lowercase CHECK in 20260520120000). The existing
-- `username unique` btree uses the default collation and so cannot accelerate
-- LIKE prefix scans; a btree with text_pattern_ops can.
--
-- RLS is unchanged: profiles_select_all (20260508120100) already lets any
-- authenticated user SELECT every profile row, which is what powers search.

create index if not exists profiles_username_prefix_idx
  on public.profiles (username text_pattern_ops);
