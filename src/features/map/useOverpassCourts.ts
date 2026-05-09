import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import type { LatLngBounds } from 'leaflet';
import { supabase } from '../../lib/supabase';
import type { OsmCourtUpsert } from '../../lib/database.types';

export type OsmCourt = {
  osmId: number;
  osmType: 'node' | 'way' | 'relation';
  name: string | null;
  lat: number;
  lng: number;
  surface: string | null;
  hoops: number | null;
  lit: 'yes' | 'no' | null;
};

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const MIN_ZOOM = 12;
const DEBOUNCE_MS = 800;

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
const MAX_NAME_LEN = 200;
const MAX_SURFACE_LEN = 50;

function elementToCourt(el: OverpassElement): OsmCourt | null {
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  if (lat === undefined || lng === undefined) return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  if (!Number.isSafeInteger(el.id)) return null;

  const hoopsTag = el.tags?.hoops;
  const litTag = el.tags?.lit;
  return {
    osmId: el.id,
    osmType: el.type,
    name: el.tags?.name?.slice(0, MAX_NAME_LEN) ?? null,
    lat,
    lng,
    surface: el.tags?.surface?.slice(0, MAX_SURFACE_LEN) ?? null,
    hoops: hoopsTag && /^\d+$/.test(hoopsTag) ? Number(hoopsTag) : null,
    lit: litTag === 'yes' ? 'yes' : litTag === 'no' ? 'no' : null,
  };
}

function toUpsertPayload(courts: OsmCourt[]): OsmCourtUpsert[] {
  return courts.map((c) => ({
    osm_id: c.osmId,
    name: c.name,
    lat: c.lat,
    lng: c.lng,
    surface: c.surface,
    hoops: c.hoops,
    lit: c.lit,
  }));
}

function mergeUnique(prev: OsmCourt[], next: OsmCourt[]): OsmCourt[] {
  const seen = new Set(prev.map((c) => `${c.osmType}:${c.osmId}`));
  const merged = [...prev];
  for (const c of next) {
    const key = `${c.osmType}:${c.osmId}`;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(c);
    }
  }
  return merged;
}

/**
 * Must be called from a child of <MapContainer>. Listens to map move/zoom,
 * debounces, and queries the Overpass API for basketball courts in view.
 * Caches by bbox-rounded key so panning back over a region doesn't refetch.
 */
export function useOverpassCourts(): { courts: OsmCourt[]; loading: boolean } {
  const map = useMap();
  const [courts, setCourts] = useState<OsmCourt[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cache = new Map<string, OsmCourt[]>();
    let debounce: number | null = null;
    let abort: AbortController | null = null;

    async function fetchForBounds() {
      if (map.getZoom() < MIN_ZOOM) return;
      const bounds = map.getBounds();
      const key = bboxKey(bounds);
      const cached = cache.get(key);
      if (cached) {
        setCourts((prev) => mergeUnique(prev, cached));
        return;
      }
      abort?.abort();
      const ctrl = new AbortController();
      abort = ctrl;
      setLoading(true);
      try {
        const res = await fetch(OVERPASS_URL, {
          method: 'POST',
          body: 'data=' + encodeURIComponent(buildQuery(bounds)),
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          signal: ctrl.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as OverpassResponse;
        const found = data.elements
          .map(elementToCourt)
          .filter((c): c is OsmCourt => c !== null);
        cache.set(key, found);
        setCourts((prev) => mergeUnique(prev, found));
        if (found.length > 0) {
          void supabase
            .rpc('upsert_osm_courts', { payload: toUpsertPayload(found) })
            .then(({ error }) => {
              if (error) console.warn('upsert_osm_courts failed', error.message);
            });
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        console.warn('Overpass fetch failed', err);
      } finally {
        setLoading(false);
      }
    }

    function schedule() {
      if (debounce !== null) window.clearTimeout(debounce);
      debounce = window.setTimeout(() => {
        void fetchForBounds();
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

  return { courts, loading };
}
