import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { useOverpassCourts } from './useOverpassCourts';
import { useCourtsInView } from './useCourtsInView';

const DEFAULT_CENTER: [number, number] = [32.7849, -117.1611];
const DEFAULT_ZOOM = 12;
const USER_ZOOM = 14;

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
  useOverpassCourts();
  return null;
}

function CourtMarkers() {
  const { courts, error } = useCourtsInView();
  return (
    <>
      {error ? (
        <div
          role="alert"
          className="pointer-events-auto absolute right-3 top-3 z-[400] max-w-xs rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800 shadow"
        >
          Couldn't load courts: {error}
        </div>
      ) : null}
      {courts.map((c) => (
        <Marker key={c.id} position={[c.lat, c.lng]}>
          <Popup>
            <div className="space-y-1">
              <p className="font-semibold text-[var(--color-ink)]">
                {c.name ?? 'Unnamed court'}
              </p>
              {c.surface || c.hoops ? (
                <p className="text-xs text-[var(--color-ink)]/70">
                  {[c.surface, c.hoops ? `${c.hoops} hoops` : null]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              ) : null}
              <Link
                to={`/courts/${c.id}`}
                className="inline-block text-sm font-semibold text-[var(--color-court)] hover:underline"
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

export default function MapPage() {
  return (
    <div className="relative h-[calc(100vh-3.5rem)] w-full">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterOnUser />
        <OverpassSync />
        <CourtMarkers />
      </MapContainer>
    </div>
  );
}
