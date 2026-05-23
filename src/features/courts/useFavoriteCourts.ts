import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { FavoriteCourtRow } from '../../lib/database.types';
import { friendlyMessage } from '../../lib/errors';

type Result = {
  favorites: FavoriteCourtRow[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  /** Optimistically drops the court from the list, deletes it, reverts on error. */
  remove: (courtId: number) => Promise<{ error: string | null }>;
};

/** Embed the whole court row onto each favorite so rows render without a second query. */
const FAVORITE_SELECT = 'user_id, court_id, created_at, court:courts(*)';

/**
 * Loads the user's saved courts, newest first, with the joined court row.
 *
 * Favorites are private (owner-only SELECT RLS), so passing someone else's id
 * returns an empty list rather than their saved courts — the Favorites tab is
 * only rendered for the signed-in owner anyway.
 */
export function useFavoriteCourts(userId: string | null | undefined): Result {
  const [favorites, setFavorites] = useState<FavoriteCourtRow[]>([]);
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
    if (!userId) {
      if (mountedRef.current) {
        setFavorites([]);
        setLoading(false);
      }
      return;
    }
    if (mountedRef.current) {
      setLoading(true);
      setError(null);
    }
    const { data, error: queryError } = await supabase
      .from('court_favorites')
      .select(FAVORITE_SELECT)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .returns<FavoriteCourtRow[]>();
    if (!mountedRef.current) return;
    if (queryError) {
      setError(friendlyMessage(queryError));
      setFavorites([]);
    } else {
      setFavorites(data ?? []);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const remove = useCallback(
    async (courtId: number): Promise<{ error: string | null }> => {
      if (!userId) return { error: 'Not signed in' };
      const previous = favorites;
      setFavorites((cur) => cur.filter((f) => f.court_id !== courtId)); // optimistic
      const { error: deleteError } = await supabase
        .from('court_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('court_id', courtId);
      if (deleteError) {
        if (mountedRef.current) setFavorites(previous); // revert
        return { error: friendlyMessage(deleteError) };
      }
      return { error: null };
    },
    [userId, favorites]
  );

  return { favorites, loading, error, refresh: load, remove };
}
