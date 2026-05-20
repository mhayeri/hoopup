import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';
import { friendlyMessage } from '../../lib/errors';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

/** Subset of `profiles` exposed to public viewers. Narrower than `ProfileRow` so
 *  fields like `created_at` / `updated_at` aren't accidentally serialized to
 *  unauthenticated clients. */
export type PublicProfileRow = Pick<
  ProfileRow,
  | 'id'
  | 'username'
  | 'avatar_url'
  | 'bio'
  | 'skill_level'
  | 'preferred_position'
  | 'years_playing'
  | 'home_court_id'
>;

type Result = {
  profile: PublicProfileRow | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

/**
 * Loads a profile by `username` (used for the public `/u/:username` route).
 * Returns null when the row doesn't exist — caller renders the not-found
 * empty state. No write methods are exposed here; the owner uses `useProfile`
 * on `/profile` for that.
 *
 * Usernames are stored case-sensitively in Postgres but the signup flow
 * lowercases inputs, so we canonicalize the URL slug to match.
 */
export function useProfileByUsername(username: string | null | undefined): Result {
  const [profile, setProfile] = useState<PublicProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (!username) {
      if (mountedRef.current) {
        setProfile(null);
        setLoading(false);
      }
      return;
    }
    if (mountedRef.current) {
      setLoading(true);
      setError(null);
    }
    // Public route fetches an explicit subset rather than `*` so that any
    // future sensitive column added to `profiles` isn't auto-exposed to
    // unauthenticated viewers. RLS controls row access; this guards columns.
    const { data, error: queryError } = await supabase
      .from('profiles')
      .select(
        'id, username, avatar_url, bio, skill_level, preferred_position, years_playing, home_court_id'
      )
      .eq('username', username.toLowerCase())
      .maybeSingle();
    if (!mountedRef.current) return;
    if (queryError) {
      setError(friendlyMessage(queryError));
      setProfile(null);
    } else {
      setProfile(data);
    }
    setLoading(false);
  }, [username]);

  useEffect(() => {
    void load();
  }, [load]);

  return { profile, loading, error, refresh: load };
}
