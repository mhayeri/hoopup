import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';
import { friendlyMessage } from '../../lib/errors';

type SessionRow = Database['public']['Tables']['sessions']['Row'];

export type ActiveSessionCourt = {
  id: number;
  name: string | null;
  address: string | null;
};

export type ActiveSessionRole = 'host' | 'going' | 'waitlist';

export type ActiveSessionEntry = {
  session: SessionRow;
  court: ActiveSessionCourt | null;
  role: ActiveSessionRole;
};

type Result = {
  entries: ActiveSessionEntry[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const ROLE_PRIORITY: Record<ActiveSessionRole, number> = {
  host: 0,
  going: 1,
  waitlist: 2,
};

type HostedRow = SessionRow & { court: ActiveSessionCourt | null };

type RsvpJoinedRow = {
  status: 'going' | 'waitlist' | 'cancelled';
  session: (SessionRow & { court: ActiveSessionCourt | null }) | null;
};

/**
 * Lists active (upcoming or in-progress, not cancelled) sessions the user is
 * part of — either as host or via an RSVP with status 'going' or 'waitlist'.
 * Issues two parallel queries and merges them; if the user is both host and
 * has an RSVP row for the same session, the host role wins.
 */
export function useUserActiveSessions(userId: string | null | undefined): Result {
  const [entries, setEntries] = useState<ActiveSessionEntry[]>([]);
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
      if (!mountedRef.current) return;
      setEntries([]);
      setLoading(false);
      return;
    }
    if (mountedRef.current) {
      setLoading(true);
      setError(null);
    }
    const nowIso = new Date().toISOString();

    const [hostedRes, rsvpRes] = await Promise.all([
      supabase
        .from('sessions')
        .select(`*, court:courts!sessions_court_id_fkey ( id, name, address )`)
        .eq('host_id', userId)
        .is('cancelled_at', null)
        .gte('ends_at', nowIso)
        .returns<HostedRow[]>(),
      supabase
        .from('session_rsvps')
        .select(
          `status,
           session:sessions!session_rsvps_session_id_fkey (
             *,
             court:courts!sessions_court_id_fkey ( id, name, address )
           )`
        )
        .eq('user_id', userId)
        .in('status', ['going', 'waitlist'])
        .returns<RsvpJoinedRow[]>(),
    ]);

    if (!mountedRef.current) return;

    if (hostedRes.error) {
      setError(friendlyMessage(hostedRes.error));
      setEntries([]);
      setLoading(false);
      return;
    }
    if (rsvpRes.error) {
      setError(friendlyMessage(rsvpRes.error));
      setEntries([]);
      setLoading(false);
      return;
    }

    const byId = new Map<string, ActiveSessionEntry>();

    for (const row of hostedRes.data ?? []) {
      const { court, ...session } = row;
      byId.set(session.id, { session, court, role: 'host' });
    }

    for (const row of rsvpRes.data ?? []) {
      const s = row.session;
      if (!s) continue;
      if (s.cancelled_at != null) continue;
      if (s.ends_at < nowIso) continue;
      const role: ActiveSessionRole = row.status === 'going' ? 'going' : 'waitlist';
      const { court, ...session } = s;
      const existing = byId.get(session.id);
      if (!existing || ROLE_PRIORITY[role] < ROLE_PRIORITY[existing.role]) {
        byId.set(session.id, { session, court, role });
      }
    }

    const merged = [...byId.values()].sort((a, b) =>
      a.session.starts_at < b.session.starts_at ? -1 : 1
    );

    setEntries(merged);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { entries, loading, error, refresh: load };
}
