-- Add address column for reverse-geocoded location text
ALTER TABLE public.courts ADD COLUMN address text;

-- RPC for clients to persist a reverse-geocoded address.
-- Only writes if the current address is NULL (write-once), preventing
-- repeated overwrites and abuse.
CREATE OR REPLACE FUNCTION public.set_court_address(p_court_id bigint, p_address text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF p_address IS NULL OR char_length(trim(p_address)) = 0 THEN
    RETURN;
  END IF;

  UPDATE public.courts
  SET address = trim(p_address)
  WHERE id = p_court_id
    AND address IS NULL;
END $$;

REVOKE ALL ON FUNCTION public.set_court_address(bigint, text) FROM public;
GRANT EXECUTE ON FUNCTION public.set_court_address(bigint, text) TO anon, authenticated;
