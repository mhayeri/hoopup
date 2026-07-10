import L from 'leaflet';
import type { Theme } from '../../providers/theme-context';

function markerSvg(fill: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
    <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 2.4.7 4.6 1.9 6.5L12.5 41l10.6-22c1.2-1.9 1.9-4.1 1.9-6.5C25 5.6 19.4 0 12.5 0z" fill="${fill}" stroke="#fff" stroke-width="1"/>
    <circle cx="12.5" cy="12.5" r="5" fill="#fff"/>
  </svg>`;
}

function makeIcon(fill: string): L.DivIcon {
  return new L.DivIcon({
    className: '',
    html: markerSvg(fill),
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
}

export type CourtIconSet = {
  /** Court with no upcoming/live session. */
  default: L.DivIcon;
  /** Court with a not-yet-ended (live or upcoming) session. */
  active: L.DivIcon;
  /** Court with a session currently in-progress. */
  live: L.DivIcon;
};

// Recolored per theme so markers stay legible on each basemap. Both themes
// follow the Blacktop palette: teal structure for courts with sessions, ember
// (dark) / crimson (light, matching --color-live) for in-progress games.
// Warm-slate default works on both basemaps.
const ICON_SETS: Record<Theme, CourtIconSet> = {
  dark: { default: makeIcon('#8a8378'), active: makeIcon('#38b2a0'), live: makeIcon('#ff6a3d') },
  light: { default: makeIcon('#8a8378'), active: makeIcon('#0c6e60'), live: makeIcon('#d92c3f') },
};

export function getCourtIcons(theme: Theme): CourtIconSet {
  return ICON_SETS[theme] ?? ICON_SETS.dark;
}
