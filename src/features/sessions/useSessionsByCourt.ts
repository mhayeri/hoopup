import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';
import { friendlyMessage } from '../../lib/errors';

export type SessionRow = Database['public']['Tables']['sessions']['Row'];

type Result = {
  sessions: SessionRow[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

/**
 * Lists sessions for a court ordered by start time. Past sessions
 * (ends_at < now) are filtered out at the query layer. Cancelled sessions
 * are intentionally still returned when their end time is in the future so
 * the UI can show them in a "cancelled" state — useful for RSVP'd users to
 * see that a game they were watching was called off.
 */
export function useSessionsByCourt(courtId: number | null | undefined): Result {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (courtId == null) {
      setSessions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: queryError } = await supabase
      .from('sessions')
      .select('*')
      .eq('court_id', courtId)
      .gte('ends_at', new Date().toISOString())
      .order('starts_at', { ascending: true });
    if (queryError) {
      setError(friendlyMessage(queryError));
      setSessions([]);
    } else {
      setSessions(data ?? []);
    }
    setLoading(false);
  }, [courtId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { sessions, loading, error, refresh: load };
}
