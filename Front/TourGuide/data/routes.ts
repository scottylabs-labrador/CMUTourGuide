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
    description: 'A walk through the heart of campus — Tepper to the College of Fine Arts.',
    stops: ['TEP', 'WH', 'CUC', 'PCA', 'DH', 'BH', 'HL', 'CFA'],
  },
  {
    id: 'compute-and-code',
    name: 'Compute & Code',
    description: 'The School of Computer Science tour — TCS through Gates to Wean.',
    stops: ['TCS', 'NSH', 'CYH', 'GHC', 'WEH'],
  },
  {
    id: 'engineering-and-innovation',
    name: 'Engineering & Innovation',
    description: 'Doherty through Wean and Hamerschlag to ANSYS and Scaife.',
    stops: ['DH', 'WEH', 'HH', 'AN', 'SH'],
  },
  {
    id: 'arts-and-humanities',
    name: 'Arts & Humanities',
    description: 'Design, fine arts, drama, and humanities — ending at Hunt Library.',
    stops: ['MM', 'CFA', 'PCA', 'BH', 'HL'],
  },
  {
    id: 'architectural-icons',
    name: 'Architectural Icons',
    description: 'The most iconic buildings on campus — from Hamerschlag tower to the Tepper Quad.',
    stops: ['HH', 'WEH', 'BH', 'HL', 'CFA', 'MM', 'TEP'],
  },
];
