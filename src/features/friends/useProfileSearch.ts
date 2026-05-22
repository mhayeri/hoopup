import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/useAuth';
import { friendlyMessage } from '../../lib/errors';
import type { PublicProfileRow } from '../profiles/useProfileByUsername';

/** Minimum characters before we hit the database — avoids querying on a single
 *  letter (too many matches, no signal). */
export const MIN_QUERY_LENGTH = 2;

/** Cap on rows returned. Each result renders a FriendActionButton that does its
 *  own one-row friendship lookup, so keeping this small bounds that fan-out. */
const RESULT_LIMIT = 8;

const SELECT =
  'id, username, avatar_url, bio, skill_level, preferred_position, years_playing, home_court_id';

/** Escape LIKE wildcards so a typed `%`, `_`, or `\` matches literally instead
 *  of acting as a pattern. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

type Result = {
  results: PublicProfileRow[];
  loading: boolean;
  error: string | null;
};

/**
 * Prefix search over `profiles.username` for the find-a-friend overlay.
 *
 * Usernames are stored lowercase (profiles_username_lowercase CHECK), so we
 * lowercase the query and run a case-sensitive `like 'q%'` — that hits the
 * profiles_username_prefix_idx (text_pattern_ops) btree. The signed-in viewer
 * is excluded from their own results.
 *
 * Pass an already-debounced query (see `useDebouncedValue`) so this fires once
 * per typing pause rather than per keystroke.
 */
export function useProfileSearch(query: string): Result {
  const { user } = useAuth();
  const viewerId = user?.id ?? null;

  const [results, setResults] = useState<PublicProfileRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  // Monotonic request id: a slow earlier response must not overwrite the
  // results of a query the user has since refined.
  const seqRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const search = useCallback(
    async (raw: string) => {
      const q = raw.trim().toLowerCase();
      const seq = ++seqRef.current;

      if (q.length < MIN_QUERY_LENGTH) {
        if (mountedRef.current) {
          setResults([]);
          setLoading(false);
          setError(null);
        }
        return;
      }

      if (mountedRef.current) {
        setLoading(true);
        setError(null);
      }

      let request = supabase
        .from('profiles')
        .select(SELECT)
        .like('username', `${escapeLike(q)}%`)
        .order('username')
        .limit(RESULT_LIMIT);
      if (viewerId) request = request.neq('id', viewerId);

      const { data, error: queryError } = await request.returns<PublicProfileRow[]>();

      // Drop stale responses and post-unmount writes.
      if (!mountedRef.current || seq !== seqRef.current) return;

      if (queryError) {
        setError(friendlyMessage(queryError));
        setResults([]);
      } else {
        setResults(data ?? []);
      }
      setLoading(false);
    },
    [viewerId]
  );

  useEffect(() => {
    void search(query);
  }, [query, search]);

  return { results, loading, error };
}
