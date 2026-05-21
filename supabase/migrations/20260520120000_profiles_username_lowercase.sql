-- Enforce that profile usernames are always lowercase.
--
-- Background: handle_new_user() (20260508120300) generates lowercase usernames
-- from the email local-part, but ProfileEditForm has been submitting the
-- edited value as-typed since PR #4, so mixed-case rows have leaked in. The
-- /u/:username route then misses because useProfileByUsername lowercases the
-- URL slug before a case-sensitive eq(). Normalizing storage closes the gap.

-- Abort if two rows would collide after lowercasing (e.g. 'Foo' and 'foo').
-- For the current user base this is unlikely; if it ever fires, the operator
-- must manually rename one of each pair before re-running the migration.
do $$
declare
  collision_pairs text;
begin
  select string_agg(lu || ' (' || cnt || ')', ', ')
    into collision_pairs
    from (
      select lower(username) as lu, count(*) as cnt
        from public.profiles
       group by lower(username)
      having count(*) > 1
    ) x;
  if collision_pairs is not null then
    raise exception
      'Cannot lowercase profile usernames: collisions detected -> %. Rename one row per pair, then re-run.',
      collision_pairs;
  end if;
end $$;

update public.profiles
   set username = lower(username)
 where username <> lower(username);

alter table public.profiles
  add constraint profiles_username_lowercase
  check (username = lower(username));
