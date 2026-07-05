/**
 * Haversine formula — calculates the great-circle distance between two
 * points on Earth given their latitude / longitude in degrees.
 *
 * @returns distance in **kilometres**
 */
export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Earth's radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Given the user's GPS coordinates and a list of delivery areas (each with
 * a centre lat/lng and a radiusKm), return the **first** area whose radius
 * contains the user's position, sorted by distance (closest first).
 *
 * Returns `null` when the user is outside every area.
 */
export function findMatchingArea<T extends { id: string; latitude: number | null; longitude: number | null; radiusKm: number }>(
  userLat: number,
  userLng: number,
  areas: T[],
): T | null {
  const matches = areas
    .filter((a) => a.latitude !== null && a.longitude !== null)
    .map((a) => ({
      area: a,
      distance: haversineDistanceKm(userLat, userLng, a.latitude!, a.longitude!),
    }))
    .filter((m) => m.distance <= m.area.radiusKm)
    .sort((a, b) => a.distance - b.distance);

  return matches.length > 0 ? matches[0].area : null;
}

/**
 * Reverse-geocode coordinates using Google Maps Geocoding API.
 * Returns a human-readable short address or `null` on failure.
 *
 * Requires `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in env.  If the key is missing
 * the function returns `null` immediately (graceful degradation).
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<string | null> {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) return null;

  try {
    const url =
      `https://maps.googleapis.com/maps/api/geocode/json` +
      `?latlng=${lat},${lng}` +
      `&result_type=sublocality,locality,neighborhood` +
      `&key=${key}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.status === 'OK' && data.results?.length > 0) {
      // Prefer a short-form address component
      const result = data.results[0];
      const comp = result.address_components || [];

      // Try neighbourhood > sublocality > locality
      const neighbourhood = comp.find((c: { types: string[] }) =>
        c.types.includes('neighborhood'),
      );
      const sublocality = comp.find((c: { types: string[] }) =>
        c.types.includes('sublocality'),
      );
      const locality = comp.find((c: { types: string[] }) =>
        c.types.includes('locality'),
      );

      return (
        neighbourhood?.short_name ||
        sublocality?.short_name ||
        locality?.short_name ||
        result.formatted_address
      );
    }
    return null;
  } catch {
    return null;
  }
}