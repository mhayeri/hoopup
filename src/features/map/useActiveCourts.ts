import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNow } from '../../lib/useNow';

const POLL_INTERVAL_MS = 60_000;

type SessionTimeRow = {
  court_id: number;
  starts_at: string;
  ends_at: string;
};

export type CourtActivity = {
  /** Courts with at least one session currently in-progress (starts_at <= now < ends_at). */
  liveCourtIds: Set<number>;
  /** Courts with at least one not-yet-started session (now < starts_at). Excludes courts already in `liveCourtIds`. */
  upcomingCourtIds: Set<number>;
};

/**
 * Tracks which courts have a non-cancelled session that hasn't ended.
 * Returns two sets — live (in-progress) and upcoming (future) — recomputed
 * on every `useNow()` tick so a court flips from upcoming to live without
 * a refetch. The DB query polls on its own 60s cadence to pick up new
 * sessions / cancellations.
 */
export function useActiveCourts(): CourtActivity {
  const [rows, setRows] = useState<SessionTimeRow[]>([]);
  const now = useNow();

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      const { data } = await supabase
        .from('sessions')
        .select('court_id, starts_at, ends_at')
        .is('cancelled_at', null)
        .gte('ends_at', new Date().toISOString());

      if (cancelled || !data) return;
      setRows(data);
    }

    void fetch();
    const id = window.setInterval(fetch, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return useMemo(() => {
    const t = now.getTime();
    const live = new Set<number>();
    const upcoming = new Set<number>();
    for (const r of rows) {
      const startMs = new Date(r.starts_at).getTime();
      const endMs = new Date(r.ends_at).getTime();
      if (endMs <= t) continue;
      if (startMs <= t) live.add(r.court_id);
      else upcoming.add(r.court_id);
    }
    // Live wins for marker color: a court with both live and upcoming
    // sessions should be reported only as live.
    for (const id of live) upcoming.delete(id);
    return { liveCourtIds: live, upcomingCourtIds: upcoming };
  }, [rows, now]);
}
