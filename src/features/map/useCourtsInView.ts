import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

export type Court = Pick<
  Database['public']['Tables']['courts']['Row'],
  'id' | 'osm_id' | 'name' | 'lat' | 'lng' | 'surface' | 'hoops' | 'lit'
>;

const DEBOUNCE_MS = 600;
const MAX_ROWS = 2000;

/**
 * Reads courts from the DB constrained to the current map bounds. Refetches
 * on debounced moveend/zoomend. Includes both seed courts (NULL osm_id) and
 * Overpass-sourced rows that useOverpassCourts has already upserted.
 *
 * Refresh is bounded by debounce + an in-flight request abort, so panning
 * fast doesn't queue redundant queries.
 */
export function useCourtsInView(): { courts: Court[]; error: string | null } {
  const map = useMap();
  const [courts, setCourts] = useState<Court[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let debounce: number | null = null;
    let abort: AbortController | null = null;

    async function fetchInBounds() {
      const b = map.getBounds();
      abort?.abort();
      const ctrl = new AbortController();
      abort = ctrl;
      const { data, error: queryError } = await supabase
        .from('courts')
        .select('id, osm_id, name, lat, lng, surface, hoops, lit')
        .gte('lat', b.getSouth())
        .lte('lat', b.getNorth())
        .gte('lng', b.getWest())
        .lte('lng', b.getEast())
        .limit(MAX_ROWS)
        .abortSignal(ctrl.signal);
      if (ctrl.signal.aborted) return;
      if (queryError) {
        setError(queryError.message);
        return;
      }
      setError(null);
      if (data) setCourts(data);
    }

    function schedule() {
      if (debounce !== null) window.clearTimeout(debounce);
      debounce = window.setTimeout(() => {
        void fetchInBounds();
      }, DEBOUNCE_MS);
    }

    map.on('moveend', schedule);
    map.on('zoomend', schedule);
    schedule();

    return () => {
      map.off('moveend', schedule);
      map.off('zoomend', schedule);
      if (debounce !== null) window.clearTimeout(debounce);
      abort?.abort();
    };
  }, [map]);

  return { courts, error };
}
