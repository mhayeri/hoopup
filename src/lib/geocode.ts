const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';
const USER_AGENT = 'HoopUp/1.0 (https://mhayeri.github.io/hoopup/)';

// Tracks court IDs currently being geocoded so concurrent React renders
// don't fire duplicate Nominatim requests.
const inflight = new Set<number>();

type NominatimAddress = {
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
};

type NominatimResponse = {
  address?: NominatimAddress;
};

/** Extracts a short "Road, City" address from Nominatim structured fields. */
function formatShortAddress(data: NominatimResponse): string | null {
  const addr = data.address;
  if (!addr) return null;

  const road = addr.road ?? addr.neighbourhood ?? addr.suburb;
  const city = addr.city ?? addr.town ?? addr.village;

  if (road && city) return `${road}, ${city}`;
  if (road) return road;
  if (city) return city;
  return null;
}

/**
 * Reverse-geocodes a lat/lng pair via Nominatim. Returns a short address
 * string or null on failure. The inflight guard ensures only one request
 * per court ID at a time.
 */
export async function reverseGeocode(
  courtId: number,
  lat: number,
  lng: number
): Promise<string | null> {
  if (inflight.has(courtId)) return null;
  inflight.add(courtId);
  try {
    const url = `${NOMINATIM_URL}?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=18`;
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as NominatimResponse;
    return formatShortAddress(data);
  } catch {
    return null;
  } finally {
    inflight.delete(courtId);
  }
}
