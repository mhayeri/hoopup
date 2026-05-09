-- Auto-create a profile row when a new auth.users row is inserted
--
-- Without this, every signup would need a follow-up client call to insert a
-- profile, and that creates a window where a logged-in user has no profile.
-- The trigger runs SECURITY DEFINER so it can write to public.profiles even
-- though the new user's session isn't established yet.
--
-- Username generation:
--   1. Take the part of the email before '@'
--   2. Lowercase it and strip anything that isn't [a-z0-9_]
--   3. If nothing's left (extremely rare), fall back to 'player'
--   4. Truncate to 14 chars, then append '_<4 hex>' for uniqueness
--   5. Retry up to 5 times on collision
--
-- The user can change their username later via the profiles RLS policy.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  base_username text;
  candidate     text;
  attempts      int := 0;
begin
  base_username := lower(
    regexp_replace(split_part(coalesce(new.email, 'player'), '@', 1), '[^a-z0-9_]', '', 'g')
  );
  if char_length(base_username) < 3 then
    base_username := 'player';
  end if;
  base_username := substring(base_username from 1 for 14);

  loop
    candidate := base_username || '_' ||
                 substring(md5(random()::text || clock_timestamp()::text), 1, 4);
    candidate := substring(candidate from 1 for 20);

    begin
      insert into public.profiles (id, username) values (new.id, candidate);
      return new;
    exception when unique_violation then
      attempts := attempts + 1;
      if attempts >= 5 then
        raise exception 'Could not generate unique username after 5 attempts'
          using errcode = 'P0003';
      end if;
    end;
  end loop;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
