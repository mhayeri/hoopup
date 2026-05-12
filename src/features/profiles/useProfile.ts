import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';
import { friendlyMessage } from '../../lib/errors';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

type UseProfileResult = {
  profile: ProfileRow | null;
  loading: boolean;
  error: string | null;
  /** Optimistically updates local state then writes to Supabase. Reverts on error. */
  updateProfile: (patch: ProfileUpdate) => Promise<{ error: string | null }>;
  refresh: () => Promise<void>;
};

/**
 * Loads the profile for the given user_id. Returns null while loading or if
 * the row doesn't exist yet (it's auto-created on signup, but if you call
 * this for someone else's id and they never signed up, you'll get null).
 */
export function useProfile(userId: string | null | undefined): UseProfileResult {
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      setError(friendlyMessage(error));
      setProfile(null);
    } else {
      setProfile(data);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateProfile = useCallback(
    async (patch: ProfileUpdate): Promise<{ error: string | null }> => {
      if (!userId || !profile) {
        return { error: 'Not signed in' };
      }
      const previous = profile;
      const next: ProfileRow = { ...profile, ...patch };
      setProfile(next);
      const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
      if (error) {
        setProfile(previous);
        return { error: friendlyMessage(error) };
      }
      return { error: null };
    },
    [userId, profile]
  );

  return { profile, loading, error, updateProfile, refresh: load };
}
