import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { reverseGeocode } from '../../lib/geocode';

const DEFAULT_LABEL = 'Basketball Court';

type CourtLike = {
  id: number;
  name: string | null;
  address?: string | null;
  lat: number;
  lng: number;
};

/**
 * Returns a display name for a court using the fallback chain:
 *   name -> address (from DB) -> lazily geocoded address -> 'Basketball Court'
 *
 * Geocoding only triggers when both name and address are null. The result is
 * persisted via the set_court_address RPC so future loads read from the DB.
 */
export function useCourtAddress(court: CourtLike | null | undefined): string {
  const [resolved, setResolved] = useState<string | null>(null);

  const id = court?.id;
  const name = court?.name;
  const address = court?.address;
  const lat = court?.lat;
  const lng = court?.lng;

  useEffect(() => {
    if (id == null || lat == null || lng == null) return;
    if (name) return;
    if (address) return;
    if (resolved) return;

    let cancelled = false;

    void (async () => {
      const addr = await reverseGeocode(id, lat, lng);
      if (cancelled || !addr) return;
      setResolved(addr);
      // Persist so future loads read from the DB. If it fails the
      // address will be re-geocoded next time someone views this court.
      await supabase.rpc('set_court_address', {
        p_court_id: id,
        p_address: addr,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [id, name, address, lat, lng, resolved]);

  if (!court) return DEFAULT_LABEL;
  return name ?? address ?? resolved ?? DEFAULT_LABEL;
}
