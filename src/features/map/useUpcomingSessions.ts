import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';
import { friendlyMessage } from '../../lib/errors';

type SessionRow = Database['public']['Tables']['sessions']['Row'];

export type UpcomingSessionCourt = {
  id: number;
  name: string | null;
  address: string | null;
  lat: number;
  lng: number;
};

export type UpcomingSessionHost = {
  id: string;
  username: string;
  avatar_url: string | null;
};

export type UpcomingSession = {
  session: SessionRow;
  court: UpcomingSessionCourt | null;
  host: UpcomingSessionHost | null;
  goingCount: number;
};

type Result = {
  sessions: UpcomingSession[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const POLL_INTERVAL_MS = 60_000;

type SessionJoinedRow = SessionRow & {
  court: UpcomingSessionCourt | null;
  host: UpcomingSessionHost | null;
};

/**
 * Lists every upcoming (ends_at >= now, not cancelled) session across all
 * courts, joined with court info, host profile, and the count of 'going'
 * RSVPs. Two parallel queries — one for the session rows, one for the RSVP
 * counts — merged client-side. Polls every 60s on the same cadence as
 * useActiveCourts so the panel stays roughly in sync with the markers.
 */
export function useUpcomingSessions(): Result {
  const [sessions, setSessions] = useState<UpcomingSession[]>([]);
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
    const nowIso = new Date().toISOString();

    const [sessionsRes, rsvpRes] = await Promise.all([
      supabase
        .from('sessions')
        .select(
          `*,
           court:courts!sessions_court_id_fkey ( id, name, address, lat, lng ),
           host:profiles!sessions_host_id_fkey ( id, username, avatar_url )`
        )
        .is('cancelled_at', null)
        .gte('ends_at', nowIso)
        .order('starts_at', { ascending: true })
        .returns<SessionJoinedRow[]>(),
      supabase.from('session_rsvps').select('session_id').eq('status', 'going'),
    ]);

    if (!mountedRef.current) return;

    if (sessionsRes.error) {
      setError(friendlyMessage(sessionsRes.error));
      setSessions([]);
      setLoading(false);
      return;
    }
    if (rsvpRes.error) {
      setError(friendlyMessage(rsvpRes.error));
      setSessions([]);
      setLoading(false);
      return;
    }

    const counts = new Map<string, number>();
    for (const row of rsvpRes.data ?? []) {
      counts.set(row.session_id, (counts.get(row.session_id) ?? 0) + 1);
    }

    const merged: UpcomingSession[] = (sessionsRes.data ?? []).map((row) => {
      const { court, host, ...session } = row;
      return {
        session,
        court,
        host,
        goingCount: counts.get(session.id) ?? 0,
      };
    });

    setSessions(merged);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => {
      void load();
    }, POLL_INTERVAL_MS);
    return () => {
      window.clearInterval(id);
    };
  }, [load]);

  return { sessions, loading, error, refresh: load };
}
