import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import type { Marker as LeafletMarker } from 'leaflet';
import { useOverpassSync } from './useOverpassSync';
import { useCourtsInView } from './useCourtsInView';
import { useActiveCourts } from './useActiveCourts';
import { useUpcomingSessions, type UpcomingSession } from './useUpcomingSessions';
import { getCourtIcons } from './courtMarkerIcons';
import { useTheme } from '../../providers/useTheme';
import SessionPanel, { type MapFilter } from './SessionPanel';

const DEFAULT_CENTER: [number, number] = [32.7849, -117.1611];
const DEFAULT_ZOOM = 12;
const USER_ZOOM = 14;
const FLY_TO_ZOOM = 15;

function RecenterOnUser() {
  const map = useMap();
  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        map.setView([pos.coords.latitude, pos.coords.longitude], USER_ZOOM);
      },
      () => undefined,
      { timeout: 10000, maximumAge: 60_000 }
    );
    return () => {
      cancelled = true;
    };
  }, [map]);
  return null;
}

function OverpassSync() {
  useOverpassSync();
  return null;
}

type CourtMarkersProps = {
  filter: MapFilter;
  selectedCourtId: number | null;
  markerRefs: React.MutableRefObject<Map<number, LeafletMarker>>;
};

function CourtMarkers({ filter, selectedCourtId, markerRefs }: CourtMarkersProps) {
  const { courts, error } = useCourtsInView();
  const { liveCourtIds, upcomingCourtIds } = useActiveCourts();
  const { theme } = useTheme();
  const icons = getCourtIcons(theme);

  // When a session card is clicked, the parent updates selectedCourtId and the
  // map flies to it. Once the new courts load into view, this effect opens the
  // matching marker's popup. Runs again whenever courts or selection change so
  // it works even if the marker wasn't mounted at click time.
  useEffect(() => {
    if (selectedCourtId == null) return;
    const marker = markerRefs.current.get(selectedCourtId);
    if (marker) marker.openPopup();
  }, [selectedCourtId, courts, markerRefs]);

  const visibleCourts =
    filter === 'sessions'
      ? courts.filter((c) => liveCourtIds.has(c.id) || upcomingCourtIds.has(c.id))
      : courts;

  return (
    <>
      {error ? (
        <div
          role="alert"
          className="pointer-events-auto absolute right-3 top-3 z-[400] max-w-xs rounded-md border border-red-500/40 bg-[var(--color-night-2)] px-3 py-2 text-xs font-semibold text-red-300 shadow-lg"
        >
          Couldn't load courts: {error}
        </div>
      ) : null}
      {visibleCourts.map((c) => (
        <Marker
          key={c.id}
          position={[c.lat, c.lng]}
          icon={
            liveCourtIds.has(c.id)
              ? icons.live
              : upcomingCourtIds.has(c.id)
                ? icons.active
                : icons.default
          }
          ref={(instance) => {
            if (instance) markerRefs.current.set(c.id, instance);
            else markerRefs.current.delete(c.id);
          }}
        >
          <Popup>
            <div className="space-y-1">
              <p className="font-semibold text-[var(--color-bone)]">
                {c.name ?? c.address ?? 'Basketball Court'}
              </p>
              {c.surface || c.hoops ? (
                <p className="text-xs text-[var(--color-bone)]/70">
                  {[c.surface, c.hoops ? `${c.hoops} hoops` : null].filter(Boolean).join(' · ')}
                </p>
              ) : null}
              <Link
                to={`/courts/${c.id}`}
                className="inline-block text-sm font-semibold text-[var(--volt-text)] hover:underline"
              >
                View details →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}

function FlyToSelected({ entry }: { entry: UpcomingSession | null }) {
  const map = useMap();
  useEffect(() => {
    if (!entry?.court) return;
    map.flyTo([entry.court.lat, entry.court.lng], FLY_TO_ZOOM, { duration: 0.6 });
  }, [entry?.session.id, entry?.court, map]);
  return null;
}

export default function MapPage() {
  const [filter, setFilter] = useState<MapFilter>('sessions');
  const [selectedEntry, setSelectedEntry] = useState<UpcomingSession | null>(null);
  const markerRefs = useRef<Map<number, LeafletMarker>>(new Map());
  const { sessions, loading, error } = useUpcomingSessions();
  const { theme } = useTheme();
  // CartoDB basemap matched to the active theme; key the TileLayer on it so the
  // tiles swap cleanly when the user toggles light/dark.
  const basemapUrl =
    theme === 'light'
      ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

  const selectedSessionId = selectedEntry?.session.id ?? null;
  const selectedCourtId = selectedEntry?.court?.id ?? null;

  return (
    <div className="relative h-[calc(100vh-3.5rem)] bg-[var(--color-night)]">
      {/* Full-bleed map behind everything. */}
      <div className="absolute inset-0">
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          scrollWheelZoom
          zoomControl={false}
          className="h-full w-full"
        >
          <TileLayer
            key={theme}
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url={basemapUrl}
          />
          {/* Zoom lives top-right so the floating panel never covers it. */}
          <ZoomControl position="topright" />
          <RecenterOnUser />
          <OverpassSync />
          <CourtMarkers filter={filter} selectedCourtId={selectedCourtId} markerRefs={markerRefs} />
          <FlyToSelected entry={selectedEntry} />
        </MapContainer>
      </div>

      {/* The panel floats as a glass card on desktop and docks to the bottom
          edge as a drawer on mobile. z-[1000] clears Leaflet's panes/controls. */}
      <div className="absolute inset-x-0 bottom-0 z-[1000] md:inset-x-auto md:top-4 md:bottom-4 md:left-4 md:w-[360px]">
        <SessionPanel
          sessions={sessions}
          loading={loading}
          error={error}
          filter={filter}
          onFilterChange={setFilter}
          selectedSessionId={selectedSessionId}
          onSelectSession={setSelectedEntry}
        />
      </div>
    </div>
  );
}
