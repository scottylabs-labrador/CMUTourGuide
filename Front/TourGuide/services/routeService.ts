import { PATHS, Path } from '../data/paths';
import { ROUTES, Route } from '../data/routes';
import { getBuilding } from './buildingService';
import type { BuildingId, LatLng } from '../types/building';

const pathKey = (from: BuildingId, to: BuildingId) => `${from}->${to}`;

/** Great-circle distance between two lat/lng points in meters. */
export const haversineMeters = (a: LatLng, b: LatLng): number => {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

/**
 * Look up the path between two buildings. Direction-agnostic: if "A->B"
 * is defined but the caller asks for "B->A", the coordinates are reversed.
 */
export const getPath = (
  from: BuildingId,
  to: BuildingId
): Path | undefined => {
  const forward = PATHS[pathKey(from, to)];
  if (forward) return forward;
  const reverse = PATHS[pathKey(to, from)];
  if (!reverse) return undefined;
  return {
    from,
    to,
    coordinates: [...reverse.coordinates].reverse(),
  };
};

export const getAllRoutes = (): Route[] => ROUTES;

export const getRoute = (id: string): Route | undefined =>
  ROUTES.find((r) => r.id === id);

/**
 * All paths that make up a route, in order. Paths without data are
 * skipped silently so a route can be defined before every segment is
 * generated.
 */
export const getPathsForRoute = (routeId: string): Path[] => {
  const route = getRoute(routeId);
  if (!route) return [];
  const paths: Path[] = [];
  for (let i = 0; i < route.stops.length - 1; i++) {
    const p = getPath(route.stops[i], route.stops[i + 1]);
    if (p) paths.push(p);
  }
  return paths;
};

/** Flatten a route into a single continuous list of coordinates. */
export const getRoutePolyline = (routeId: string): LatLng[] => {
  const out: LatLng[] = [];
  for (const p of getPathsForRoute(routeId)) {
    for (const pt of p.coordinates) {
      const prev = out[out.length - 1];
      if (
        !prev ||
        prev.latitude !== pt.latitude ||
        prev.longitude !== pt.longitude
      ) {
        out.push(pt);
      }
    }
  }
  return out;
};

/**
 * Find the closest stop in a route to a given point. Stops whose building
 * lacks coordinates are skipped. An optional `predicate` filters which stops
 * are eligible — use this to limit the search to, e.g., still-locked stops.
 * Returns null if the route is empty or no eligible stop has coordinates.
 */
export const findNearestStopInRoute = (
  routeId: string,
  from: LatLng,
  predicate?: (id: BuildingId) => boolean
): { id: BuildingId; distance: number } | null => {
  const route = getRoute(routeId);
  if (!route) return null;
  let best: { id: BuildingId; distance: number } | null = null;
  for (const id of route.stops) {
    if (predicate && !predicate(id)) continue;
    const b = getBuilding(id);
    if (!b?.latitude || !b?.longitude) continue;
    const d = haversineMeters(from, {
      latitude: b.latitude,
      longitude: b.longitude,
    });
    if (!best || d < best.distance) best = { id, distance: d };
  }
  return best;
};

export type { Path, Route };
