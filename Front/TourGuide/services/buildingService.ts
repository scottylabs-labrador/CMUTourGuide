import buildingsData from '../data/buildings.json';
import outlinesData from '../data/allOutlines.json';
import type {
  Building,
  BuildingId,
  BuildingOutline,
  LatLng,
} from '../types/building';

const buildings = buildingsData as unknown as Record<BuildingId, Building>;
const rawOutlines = outlinesData as unknown as Record<BuildingId, BuildingOutline>;

// Drop consecutive duplicate vertices (zero-length edges). These can sneak in
// from upstream data and cause renderers to draw a degenerate edge whose
// stroke-join folds back on itself, producing a visibly thicker outline at
// that vertex (e.g. Scott Hall pre-fix).
const dedupeRing = (ring: LatLng[]): LatLng[] => {
  const out: LatLng[] = [];
  for (const pt of ring) {
    const prev = out[out.length - 1];
    if (!prev || prev.latitude !== pt.latitude || prev.longitude !== pt.longitude) {
      out.push(pt);
    }
  }
  return out;
};

const outlines: Record<BuildingId, BuildingOutline> = Object.fromEntries(
  Object.entries(rawOutlines).map(([id, data]) => [
    id,
    { ...data, shapes: data.shapes.map(dedupeRing) },
  ])
);

export const getBuilding = (id: BuildingId): Building | undefined =>
  buildings[id];

/**
 * Routing-facing coordinate for a building. Prefers an explicit entrance
 * if set; otherwise falls back to the visual center. Returns undefined
 * only if the building is missing or has no usable coords at all.
 *
 * Use this anywhere a path should *end* at the building (ORS fetches,
 * nearest-stop distance) — not for marker placement, which should stay
 * on the geometric center.
 */
const isValidLatLng = (p?: { latitude?: number; longitude?: number }): boolean =>
  !!p &&
  typeof p.latitude === 'number' &&
  typeof p.longitude === 'number' &&
  Number.isFinite(p.latitude) &&
  Number.isFinite(p.longitude) &&
  (p.latitude !== 0 || p.longitude !== 0);

export const getEntrance = (id: BuildingId): LatLng | undefined => {
  const b = buildings[id];
  if (!b) return undefined;
  if (isValidLatLng(b.entrance)) {
    return { latitude: b.entrance!.latitude, longitude: b.entrance!.longitude };
  }
  if (isValidLatLng(b)) {
    return { latitude: b.latitude, longitude: b.longitude };
  }
  return undefined;
};

export const getAllBuildings = (): Record<BuildingId, Building> => buildings;

export const getAllBuildingIds = (): BuildingId[] => Object.keys(buildings);

export const hasBuilding = (id: BuildingId): boolean => id in buildings;

export const getBuildingOutline = (
  id: BuildingId
): BuildingOutline | undefined => outlines[id];

export const getAllOutlineEntries = (): [BuildingId, BuildingOutline][] =>
  Object.entries(outlines);
