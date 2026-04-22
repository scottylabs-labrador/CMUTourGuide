import type { LatLng } from '../types/building';

/**
 * Thin client for OpenRouteService's foot-walking directions endpoint.
 * Used at runtime to compute the approach path from the user's current
 * location to the nearest stop in the active route. Predefined
 * building-to-building paths are baked in via scripts/generate_tour_segment.py
 * and should not hit this endpoint.
 */

const ORS_URL =
  'https://api.openrouteservice.org/v2/directions/foot-walking/geojson';

export interface WalkingRoute {
  coordinates: LatLng[];
  distanceMeters: number;
}

export async function fetchWalkingRoute(
  start: LatLng,
  end: LatLng,
  signal?: AbortSignal
): Promise<WalkingRoute> {
  const apiKey = process.env.EXPO_PUBLIC_ORS_API_KEY;
  if (!apiKey) {
    throw new Error(
      'EXPO_PUBLIC_ORS_API_KEY is not set — add it to .env and restart the bundler.'
    );
  }

  const res = await fetch(ORS_URL, {
    method: 'POST',
    headers: {
      Authorization: apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/geo+json',
    },
    body: JSON.stringify({
      coordinates: [
        [start.longitude, start.latitude],
        [end.longitude, end.latitude],
      ],
    }),
    signal,
  });

  if (!res.ok) {
    throw new Error(`ORS ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const feature = data?.features?.[0];
  if (!feature?.geometry?.coordinates?.length) {
    throw new Error('ORS returned no route geometry');
  }

  const coords: [number, number][] = feature.geometry.coordinates;
  const distance: number = feature.properties?.summary?.distance ?? 0;

  return {
    coordinates: coords.map(([lng, lat]) => ({
      latitude: lat,
      longitude: lng,
    })),
    distanceMeters: distance,
  };
}
