import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';

const DEFAULT_CENTER: [number, number] = [32.7849, -117.1611];
const DEFAULT_ZOOM = 12;
const USER_ZOOM = 14;

function RecenterOnUser() {
  const map = useMap();
  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.setView([pos.coords.latitude, pos.coords.longitude], USER_ZOOM);
      },
      () => undefined,
      { timeout: 10000, maximumAge: 60_000 }
    );
  }, [map]);
  return null;
}

export default function MapPage() {
  return (
    <div className="h-[calc(100vh-3.5rem)] w-full">
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
      </MapContainer>
    </div>
  );
}
