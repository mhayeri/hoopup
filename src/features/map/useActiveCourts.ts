import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const POLL_INTERVAL_MS = 60_000;

export function useActiveCourts(): Set<number> {
  const [activeCourts, setActiveCourts] = useState<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      const { data } = await supabase
        .from('sessions')
        .select('court_id')
        .is('cancelled_at', null)
        .gte('ends_at', new Date().toISOString());

      if (cancelled || !data) return;
      setActiveCourts(new Set(data.map((r) => r.court_id)));
    }

    fetch();
    const id = setInterval(fetch, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return activeCourts;
}
