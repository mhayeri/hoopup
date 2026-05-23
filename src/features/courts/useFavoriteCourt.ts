import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/useAuth';
import { friendlyMessage } from '../../lib/errors';

type Result = {
  /** Whether the signed-in user has saved this court. Always false when signed out. */
  isFavorite: boolean;
  /** The initial "is it saved?" check is in flight. */
  loading: boolean;
  /** A save/un-save write is in flight (use to disable the button). */
  pending: boolean;
  error: string | null;
  /** Optimistically flips the saved state, writes to Supabase, reverts on error. */
  toggle: () => Promise<{ error: string | null }>;
};

/**
 * Single-court favorite state for the court detail page. Reads the auth user
 * itself so callers only pass the court id. Returns a no-op `toggle` when
 * signed out — the UI shows a "sign in to save" affordance instead of calling it.
 */
export function useFavoriteCourt(courtId: number | null | undefined): Result {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Existence check: one row keyed by (user, court). RLS scopes this to the
  // owner, so it only ever returns the caller's own favorite.
  useEffect(() => {
    let active = true;
    if (!userId || courtId == null) {
      setIsFavorite(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    void supabase
      .from('court_favorites')
      .select('court_id')
      .eq('user_id', userId)
      .eq('court_id', courtId)
      .maybeSingle()
      .then(({ data, error: queryError }) => {
        if (!active) return;
        if (queryError) setError(friendlyMessage(queryError));
        else setIsFavorite(data !== null);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId, courtId]);

  const toggle = useCallback(async (): Promise<{ error: string | null }> => {
    if (!userId || courtId == null) return { error: 'Not signed in' };

    const previous = isFavorite;
    const next = !previous;
    setIsFavorite(next); // optimistic
    setPending(true);
    setError(null);

    // Save uses upsert+ignoreDuplicates so a double-tap or a stale "off" state
    // (already saved in another tab) lands on the desired end state instead of
    // throwing a primary-key conflict. Un-save of a missing row is a no-op.
    const { error: writeError } = next
      ? await supabase
          .from('court_favorites')
          .upsert(
            { user_id: userId, court_id: courtId },
            { onConflict: 'user_id,court_id', ignoreDuplicates: true }
          )
      : await supabase
          .from('court_favorites')
          .delete()
          .eq('user_id', userId)
          .eq('court_id', courtId);

    if (!mountedRef.current) {
      return { error: writeError ? friendlyMessage(writeError) : null };
    }
    setPending(false);
    if (writeError) {
      setIsFavorite(previous); // revert
      const msg = friendlyMessage(writeError);
      setError(msg);
      return { error: msg };
    }
    return { error: null };
  }, [userId, courtId, isFavorite]);

  return { isFavorite, loading, pending, error, toggle };
}
