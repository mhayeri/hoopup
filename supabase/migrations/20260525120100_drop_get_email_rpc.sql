-- Drop the username -> email enumeration RPC.
--
-- get_email_by_username(text) was SECURITY DEFINER granted to anon, so anyone
-- (even logged out) could resolve a username to that account's email address
-- (advisor 0028). Username login now goes through the rate-limited `login`
-- edge function, which resolves the email server-side and never returns it.
--
-- DEPLOY ORDER: apply this to the live database only AFTER the new frontend
-- (LoginPage using the `login` edge function) is deployed. Applying it while
-- the old frontend is still live would break username sign-in.

drop function if exists public.get_email_by_username(text);
