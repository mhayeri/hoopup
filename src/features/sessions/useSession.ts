import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type SessionRow = Database['public']['Tables']['sessions']['Row'];
type SessionUpdate = Database['public']['Tables']['sessions']['Update'];

export type SessionWithRelations = SessionRow & {
  host: { id: string; username: string; avatar_url: string | null } | null;
  court: {
    id: number;
    name: string | null;
    address: string | null;
    lat: number;
    lng: number;
  } | null;
};

type Result = {
  session: SessionWithRelations | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  update: (patch: SessionUpdate) => Promise<{ error: string | null }>;
  cancel: () => Promise<{ error: string | null }>;
};

/**
 * Fetches a single session by id along with the host's public profile and
 * the court name. The composite SELECT uses PostgREST's foreign-table syntax;
 * the embedded relations honor RLS so unauthenticated callers still see them
 * (profiles + courts are publicly readable per 0002_rls.sql).
 *
 * State writes are gated by a mounted ref so a late-resolving fetch after
 * unmount (e.g. user navigates away mid-update) does not warn or thrash state.
 */
export function useSession(sessionId: string | null | undefined): Result {
  const [session, setSession] = useState<SessionWithRelations | null>(null);
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
    if (!sessionId) {
      if (!mountedRef.current) return;
      setSession(null);
      setLoading(false);
      return;
    }
    if (mountedRef.current) {
      setLoading(true);
      setError(null);
    }
    const { data, error: queryError } = await supabase
      .from('sessions')
      .select(
        `*,
         host:profiles!sessions_host_id_fkey ( id, username, avatar_url ),
         court:courts!sessions_court_id_fkey ( id, name, address, lat, lng )`
      )
      .eq('id', sessionId)
      .maybeSingle<SessionWithRelations>();
    if (!mountedRef.current) return;
    if (queryError) {
      setError(queryError.message);
      setSession(null);
    } else {
      setSession(data);
    }
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const update = useCallback(
    async (patch: SessionUpdate): Promise<{ error: string | null }> => {
      if (!sessionId) return { error: 'No session' };
      const { error: queryError } = await supabase
        .from('sessions')
        .update(patch)
        .eq('id', sessionId);
      if (queryError) return { error: queryError.message };
      await load();
      return { error: null };
    },
    [sessionId, load]
  );

  const cancel = useCallback(() => update({ cancelled_at: new Date().toISOString() }), [update]);

  return { session, loading, error, refresh: load, update, cancel };
}
