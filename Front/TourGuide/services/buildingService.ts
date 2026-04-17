import buildingsData from '../data/buildings.json';
import outlinesData from '../data/allOutlines.json';
import type { Building, BuildingId, BuildingOutline } from '../types/building';

const buildings = buildingsData as unknown as Record<BuildingId, Building>;
const outlines = outlinesData as unknown as Record<BuildingId, BuildingOutline>;

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
