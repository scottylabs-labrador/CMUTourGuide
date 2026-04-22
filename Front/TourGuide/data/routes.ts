import type { BuildingId } from '../types/building';

/**
 * A named tour route — an ordered list of buildings. Adjacent pairs of
 * stops should have a corresponding entry in data/paths.ts.
 */
export interface Route {
  id: string;
  name: string;
  description?: string;
  stops: BuildingId[];
}

export const ROUTES: Route[] = [
  {
    id: 'campus-classics',
    name: 'Campus Classics',
    description: 'A walk through the heart of campus — from Tepper down to Doherty.',
    stops: ['TEP', 'WH', 'CUC', 'PCA', 'DH'],
  },
];
