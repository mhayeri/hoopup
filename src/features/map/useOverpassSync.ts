import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import type { LatLngBounds } from 'leaflet';
import { supabase } from '../../lib/supabase';
import type { OsmCourtUpsert } from '../../lib/database.types';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const MIN_ZOOM = 12;
const DEBOUNCE_MS = 800;
const MAX_NAME_LEN = 200;
const MAX_SURFACE_LEN = 50;

type OverpassElement = {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

type OverpassResponse = { elements: OverpassElement[] };

function buildQuery(bounds: LatLngBounds): string {
  const s = bounds.getSouth().toFixed(5);
  const w = bounds.getWest().toFixed(5);
  const n = bounds.getNorth().toFixed(5);
  const e = bounds.getEast().toFixed(5);
  const bbox = `${s},${w},${n},${e}`;
  return `[out:json][timeout:25];
(
  node["leisure"="pitch"]["sport"="basketball"](${bbox});
  way["leisure"="pitch"]["sport"="basketball"](${bbox});
  relation["leisure"="pitch"]["sport"="basketball"](${bbox});
);
out center tags;`;
}

function bboxKey(bounds: LatLngBounds): string {
  return [
    bounds.getSouth().toFixed(2),
    bounds.getWest().toFixed(2),
    bounds.getNorth().toFixed(2),
    bounds.getEast().toFixed(2),
  ].join(',');
}

// Sanitize Overpass elements before they leave the client. Drops anything
// with non-finite or out-of-range coords; truncates user-controlled string
// fields so a poisoned mirror can't pad a JSON payload arbitrarily.
function elementToUpsert(el: OverpassElement): OsmCourtUpsert | null {
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  if (lat === undefined || lng === undefined) return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  if (!Number.isSafeInteger(el.id)) return null;

  const hoopsTag = el.tags?.hoops;
  const litTag = el.tags?.lit;
  return {
    osm_id: el.id,
    name: el.tags?.name?.slice(0, MAX_NAME_LEN) ?? null,
    lat,
    lng,
    surface: el.tags?.surface?.slice(0, MAX_SURFACE_LEN) ?? null,
    hoops: hoopsTag && /^\d+$/.test(hoopsTag) ? Number(hoopsTag) : null,
    lit: litTag === 'yes' ? 'yes' : litTag === 'no' ? 'no' : null,
  };
}

/**
 * Must be called from a child of <MapContainer>. Side-effect-only: on
 * debounced map move/zoom, queries Overpass for basketball courts in view
 * and upserts them via the upsert_osm_courts RPC. Per-bbox cache (keyed at
 * ~1km granularity) is held in a ref so it survives StrictMode double-mount.
 *
 * Marker rendering reads from useCourtsInView, not from this hook.
 */
export function useOverpassSync(): void {
  const map = useMap();
  const cacheRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let debounce: number | null = null;
    let abort: AbortController | null = null;

    async function fetchAndUpsert() {
      if (map.getZoom() < MIN_ZOOM) return;
      const bounds = map.getBounds();
      const key = bboxKey(bounds);
      if (cacheRef.current.has(key)) return;

      abort?.abort();
      const ctrl = new AbortController();
      abort = ctrl;
      try {
        const res = await fetch(OVERPASS_URL, {
          method: 'POST',
          body: 'data=' + encodeURIComponent(buildQuery(bounds)),
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          signal: ctrl.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as OverpassResponse;
        const payload = data.elements
          .map(elementToUpsert)
          .filter((c): c is OsmCourtUpsert => c !== null);
        cacheRef.current.add(key);
        if (payload.length === 0) return;
        const { error } = await supabase.rpc('upsert_osm_courts', { payload });
        if (error) console.warn('upsert_osm_courts failed', error.message);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        console.warn('Overpass fetch failed', err);
      }
    }

    function schedule() {
      if (debounce !== null) window.clearTimeout(debounce);
      debounce = window.setTimeout(() => {
        void fetchAndUpsert();
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
}
