CREATE OR REPLACE FUNCTION public.get_email_by_username(p_username text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_email text;
BEGIN
  SELECT au.email INTO v_email
  FROM public.profiles p
  JOIN auth.users au ON au.id = p.id
  WHERE lower(p.username) = lower(p_username);

  RETURN v_email;
END $$;

REVOKE ALL ON FUNCTION public.get_email_by_username(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_email_by_username(text) TO anon, authenticated;
