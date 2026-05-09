import { MapContainer, TileLayer } from 'react-leaflet';

const DEFAULT_CENTER: [number, number] = [32.7849, -117.1611];
const DEFAULT_ZOOM = 12;

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
      </MapContainer>
    </div>
  );
}
