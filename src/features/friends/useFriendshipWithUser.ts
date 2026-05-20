import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/useAuth';
import { friendlyMessage } from '../../lib/errors';
import { assertUuid, type FriendshipRelation, relationFromRow } from './friendsApi';

type FriendshipRow = {
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted';
  created_at: string;
  accepted_at: string | null;
};

type Result = {
  relation: FriendshipRelation;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  send: () => Promise<{ error: string | null }>;
  accept: () => Promise<{ error: string | null }>;
  decline: () => Promise<{ error: string | null }>;
  cancel: () => Promise<{ error: string | null }>;
  remove: () => Promise<{ error: string | null }>;
};

/**
 * Lightweight pair lookup for "what is my relationship with this one user?"
 * Drives the morphing FriendActionButton on hover cards, session cards, and
 * the public profile. Cheaper than loading every friendship via
 * `useFriendships`.
 *
 * When the viewer is unauthenticated, `relation` is `none` and mutators
 * return an error.
 */
export function useFriendshipWithUser(otherUserId: string | null | undefined): Result {
  const { user } = useAuth();
  const viewerId = user?.id ?? null;
  const isSelf = !!viewerId && viewerId === otherUserId;

  const [relation, setRelation] = useState<FriendshipRelation>(
    isSelf ? { kind: 'self' } : { kind: 'none' }
  );
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
    if (!otherUserId) {
      if (mountedRef.current) {
        setRelation({ kind: 'none' });
        setLoading(false);
      }
      return;
    }
    if (!viewerId) {
      if (mountedRef.current) {
        setRelation({ kind: 'none' });
        setLoading(false);
      }
      return;
    }
    if (viewerId === otherUserId) {
      if (mountedRef.current) {
        setRelation({ kind: 'self' });
        setLoading(false);
      }
      return;
    }
    if (mountedRef.current) {
      setLoading(true);
      setError(null);
    }
    assertUuid(viewerId, 'viewerId');
    assertUuid(otherUserId, 'otherUserId');
    // At most one of (viewer,other) or (other,viewer) exists due to the
    // unordered-pair UNIQUE index. .in() + .in() expresses that cross-product
    // safely without relying on PostgREST nested-and-or filter parsing.
    const pair = [viewerId, otherUserId];
    const { data, error: queryError } = await supabase
      .from('friendships')
      .select('requester_id, addressee_id, status, created_at, accepted_at')
      .in('requester_id', pair)
      .in('addressee_id', pair)
      .returns<FriendshipRow[]>()
      .maybeSingle();
    if (!mountedRef.current) return;
    if (queryError) {
      setError(friendlyMessage(queryError));
      setRelation({ kind: 'none' });
    } else if (!data) {
      setRelation({ kind: 'none' });
    } else {
      setRelation(relationFromRow(data, viewerId));
    }
    setLoading(false);
  }, [otherUserId, viewerId]);

  useEffect(() => {
    void load();
  }, [load]);

  const send = useCallback(async (): Promise<{ error: string | null }> => {
    if (!viewerId || !otherUserId) return { error: 'Not signed in' };
    if (viewerId === otherUserId) return { error: 'You cannot friend yourself.' };
    // Optimistic: flip to outgoing immediately.
    const previous = relation;
    setRelation({ kind: 'outgoing', createdAt: new Date().toISOString() });
    const { error: insertError } = await supabase.from('friendships').insert({
      requester_id: viewerId,
      addressee_id: otherUserId,
      status: 'pending',
    });
    if (insertError) {
      if (mountedRef.current) setRelation(previous);
      // P0005 (reverse) means the OTHER user already sent us a request — refresh
      // so the button morphs to Accept/Decline instead of staying on "Add".
      if (insertError.code === 'P0005') {
        await load();
      }
      return { error: friendlyMessage(insertError) };
    }
    return { error: null };
  }, [viewerId, otherUserId, relation, load]);

  const accept = useCallback(async (): Promise<{ error: string | null }> => {
    if (!viewerId || !otherUserId) return { error: 'Not signed in' };
    const previous = relation;
    setRelation({ kind: 'friends', acceptedAt: new Date().toISOString() });
    const { error: updateError } = await supabase
      .from('friendships')
      .update({ status: 'accepted' as const })
      .eq('requester_id', otherUserId)
      .eq('addressee_id', viewerId);
    if (updateError) {
      if (mountedRef.current) setRelation(previous);
      return { error: friendlyMessage(updateError) };
    }
    return { error: null };
  }, [viewerId, otherUserId, relation]);

  const removeRow = useCallback(async (): Promise<{ error: string | null }> => {
    if (!viewerId || !otherUserId) return { error: 'Not signed in' };
    assertUuid(viewerId, 'viewerId');
    assertUuid(otherUserId, 'otherUserId');
    const previous = relation;
    setRelation({ kind: 'none' });
    // The row exists in exactly one direction (the unordered-pair UNIQUE
    // index ensures that). .in() + .in() matches at most that one row safely.
    const pair = [viewerId, otherUserId];
    const { error: deleteError } = await supabase
      .from('friendships')
      .delete()
      .in('requester_id', pair)
      .in('addressee_id', pair);
    if (deleteError) {
      if (mountedRef.current) setRelation(previous);
      return { error: friendlyMessage(deleteError) };
    }
    return { error: null };
  }, [viewerId, otherUserId, relation]);

  return {
    relation,
    loading,
    error,
    refresh: load,
    send,
    accept,
    decline: removeRow,
    cancel: removeRow,
    remove: removeRow,
  };
}
