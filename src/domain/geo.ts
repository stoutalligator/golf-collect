/** Distances between courses and the player (pure; no device APIs). */

export interface LatLng {
  lat: number;
  lng: number;
}

const EARTH_MILES = 3958.8;
const rad = (d: number) => (d * Math.PI) / 180;

/** Great-circle (haversine) distance in miles. */
export function distanceMiles(a: LatLng, b: LatLng): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_MILES * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * The `limit` closest items to `here`, nearest first, within `maxMiles`. Items without usable coordinates
 * (missing, or 0,0) are skipped.
 */
export function nearest<T extends { location?: LatLng }>(items: T[], here: LatLng, { limit = 8, maxMiles = 60 } = {}): (T & { miles: number })[] {
  return items
    .filter((c) => c.location && Number.isFinite(c.location.lat) && Number.isFinite(c.location.lng) && !(c.location.lat === 0 && c.location.lng === 0))
    .map((c) => ({ ...c, miles: distanceMiles(here, c.location!) }))
    .filter((c) => c.miles <= maxMiles)
    .sort((a, b) => a.miles - b.miles)
    .slice(0, limit);
}

/** "0.4 mi", "3.2 mi", "18 mi". */
export function formatMiles(miles: number): string {
  const tenths = Math.round(miles * 10) / 10;
  return `${tenths < 10 ? tenths.toFixed(1) : Math.round(miles)} mi`;
}
