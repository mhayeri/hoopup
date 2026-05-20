import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { FriendshipWithProfiles } from '../../lib/database.types';
import { friendlyMessage } from '../../lib/errors';
import { FRIENDSHIP_SELECT } from './friendsApi';

type Buckets = {
  accepted: FriendshipWithProfiles[];
  incoming: FriendshipWithProfiles[];
  outgoing: FriendshipWithProfiles[];
};

type Result = Buckets & {
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  accept: (otherUserId: string) => Promise<{ error: string | null }>;
  decline: (otherUserId: string) => Promise<{ error: string | null }>;
  cancel: (otherUserId: string) => Promise<{ error: string | null }>;
  remove: (otherUserId: string) => Promise<{ error: string | null }>;
};

const EMPTY_BUCKETS: Buckets = { accepted: [], incoming: [], outgoing: [] };

function bucketize(rows: FriendshipWithProfiles[], userId: string): Buckets {
  const accepted: FriendshipWithProfiles[] = [];
  const incoming: FriendshipWithProfiles[] = [];
  const outgoing: FriendshipWithProfiles[] = [];
  for (const row of rows) {
    if (row.status === 'accepted') {
      accepted.push(row);
    } else if (row.addressee_id === userId) {
      incoming.push(row);
    } else if (row.requester_id === userId) {
      outgoing.push(row);
    }
  }
  accepted.sort((a, b) =>
    (b.accepted_at ?? b.created_at).localeCompare(a.accepted_at ?? a.created_at)
  );
  incoming.sort((a, b) => b.created_at.localeCompare(a.created_at));
  outgoing.sort((a, b) => b.created_at.localeCompare(a.created_at));
  return { accepted, incoming, outgoing };
}

/**
 * Loads every friendship row touching `userId` and exposes accept / decline /
 * cancel / remove mutations. Buckets the rows client-side by status + direction.
 *
 * Public-profile case: when `userId !== auth.uid()`, RLS filters out pending
 * rows so `incoming`/`outgoing` will be empty — this is by design, the caller
 * just renders the accepted list.
 */
export function useFriendships(userId: string | null | undefined): Result {
  const [buckets, setBuckets] = useState<Buckets>(EMPTY_BUCKETS);
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
        setBuckets(EMPTY_BUCKETS);
        setLoading(false);
      }
      return;
    }
    if (mountedRef.current) {
      setLoading(true);
      setError(null);
    }
    const { data, error: queryError } = await supabase
      .from('friendships')
      .select(FRIENDSHIP_SELECT)
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .returns<FriendshipWithProfiles[]>();
    if (!mountedRef.current) return;
    if (queryError) {
      setError(friendlyMessage(queryError));
      setBuckets(EMPTY_BUCKETS);
    } else {
      setBuckets(bucketize(data ?? [], userId));
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Locate a row in the current buckets by the *other* party's id.
  const findRow = useCallback(
    (otherUserId: string): FriendshipWithProfiles | null => {
      const all = [...buckets.accepted, ...buckets.incoming, ...buckets.outgoing];
      return (
        all.find(
          (r) =>
            (r.requester_id === otherUserId || r.addressee_id === otherUserId) &&
            (r.requester_id === userId || r.addressee_id === userId)
        ) ?? null
      );
    },
    [buckets, userId]
  );

  const accept = useCallback(
    async (otherUserId: string): Promise<{ error: string | null }> => {
      if (!userId) return { error: 'Not signed in' };
      const { error: updateError } = await supabase
        .from('friendships')
        .update({ status: 'accepted' as const })
        .eq('requester_id', otherUserId)
        .eq('addressee_id', userId);
      if (updateError) return { error: friendlyMessage(updateError) };
      await load();
      return { error: null };
    },
    [userId, load]
  );

  const removeRow = useCallback(
    async (otherUserId: string): Promise<{ error: string | null }> => {
      if (!userId) return { error: 'Not signed in' };
      const row = findRow(otherUserId);
      if (!row) return { error: null };
      const { error: deleteError } = await supabase
        .from('friendships')
        .delete()
        .eq('requester_id', row.requester_id)
        .eq('addressee_id', row.addressee_id);
      if (deleteError) return { error: friendlyMessage(deleteError) };
      await load();
      return { error: null };
    },
    [userId, findRow, load]
  );

  return {
    ...buckets,
    loading,
    error,
    refresh: load,
    accept,
    decline: removeRow,
    cancel: removeRow,
    remove: removeRow,
  };
}
