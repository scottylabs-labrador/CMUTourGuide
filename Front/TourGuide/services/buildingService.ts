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

export const getAllBuildings = (): Record<BuildingId, Building> => buildings;

export const getAllBuildingIds = (): BuildingId[] => Object.keys(buildings);

export const hasBuilding = (id: BuildingId): boolean => id in buildings;

export const getBuildingOutline = (
  id: BuildingId
): BuildingOutline | undefined => outlines[id];

export const getAllOutlineEntries = (): [BuildingId, BuildingOutline][] =>
  Object.entries(outlines);
