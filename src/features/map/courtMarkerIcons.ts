import L from 'leaflet';

function markerSvg(fill: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
    <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 2.4.7 4.6 1.9 6.5L12.5 41l10.6-22c1.2-1.9 1.9-4.1 1.9-6.5C25 5.6 19.4 0 12.5 0z" fill="${fill}" stroke="#fff" stroke-width="1"/>
    <circle cx="12.5" cy="12.5" r="5" fill="#fff"/>
  </svg>`;
}

export const defaultCourtIcon = new L.DivIcon({
  className: '',
  html: markerSvg('#2A81CB'),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export const activeCourtIcon = new L.DivIcon({
  className: '',
  html: markerSvg('#C5622A'),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Used for courts with a session that's currently in-progress (now between
// starts_at and ends_at). Distinct from `activeCourtIcon`, which marks
// courts with any not-yet-ended session (live or upcoming).
export const liveCourtIcon = new L.DivIcon({
  className: '',
  html: markerSvg('#10B981'),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
