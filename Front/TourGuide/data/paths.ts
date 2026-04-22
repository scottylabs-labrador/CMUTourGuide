import type { BuildingId, LatLng } from '../types/building';

/**
 * A walkable path between two buildings. `coordinates` should trace the real
 * sidewalk (typically 5–50 waypoints). Generated via
 * `scripts/generate_tour_segment.py` using OpenRouteService.
 */
export interface Path {
  from: BuildingId;
  to: BuildingId;
  coordinates: LatLng[];
}

/**
 * All known paths, keyed by "FROM->TO". Lookups via routeService.getPath are
 * direction-agnostic — you only need to store each pair once.
 *
 * To add a path:
 *   python3 scripts/generate_tour_segment.py FROM_ID TO_ID
 * Paste the resulting snippet below.
 */
export const PATHS: Record<string, Path> = {
  'TEP->WH': {
    from: 'TEP',
    to: 'WH',
    coordinates: [
      { latitude: 40.445076, longitude: -79.944932 },
      { latitude: 40.445014, longitude: -79.944869 },
      { latitude: 40.444999, longitude: -79.944783 },
      { latitude: 40.444950, longitude: -79.944559 },
      { latitude: 40.444822, longitude: -79.943994 },
      { latitude: 40.444758, longitude: -79.943701 },
      { latitude: 40.444755, longitude: -79.943250 },
      { latitude: 40.444735, longitude: -79.943129 },
      { latitude: 40.444639, longitude: -79.943134 },
      { latitude: 40.444519, longitude: -79.943143 },
      { latitude: 40.444510, longitude: -79.942964 },
      { latitude: 40.444464, longitude: -79.942981 },
      { latitude: 40.444449, longitude: -79.942987 },
      { latitude: 40.444415, longitude: -79.942999 },
      { latitude: 40.444397, longitude: -79.943005 },
      { latitude: 40.444383, longitude: -79.943009 },
      { latitude: 40.444365, longitude: -79.943016 },
      { latitude: 40.444348, longitude: -79.943021 },
      { latitude: 40.444314, longitude: -79.943033 },
      { latitude: 40.444294, longitude: -79.943040 },
      { latitude: 40.444271, longitude: -79.943049 },
      { latitude: 40.444121, longitude: -79.943104 },
      { latitude: 40.444160, longitude: -79.943297 },
    ],
  },
  'WH->CUC': {
    from: 'WH',
    to: 'CUC',
    coordinates: [
      { latitude: 40.444160, longitude: -79.943297 },
      { latitude: 40.444121, longitude: -79.943104 },
      { latitude: 40.444238, longitude: -79.942848 },
      { latitude: 40.443801, longitude: -79.942433 },
      { latitude: 40.443756, longitude: -79.942390 },
      { latitude: 40.443819, longitude: -79.942367 },
    ],
  },
  'CUC->PCA': {
    from: 'CUC',
    to: 'PCA',
    coordinates: [
      { latitude: 40.443819, longitude: -79.942367 },
      { latitude: 40.443756, longitude: -79.942390 },
      { latitude: 40.443728, longitude: -79.942401 },
      { latitude: 40.443740, longitude: -79.942457 },
      { latitude: 40.443891, longitude: -79.943132 },
      { latitude: 40.443901, longitude: -79.943177 },
      { latitude: 40.443748, longitude: -79.943230 },
      { latitude: 40.443534, longitude: -79.943305 },
    ],
  },
  'PCA->DH': {
    from: 'PCA',
    to: 'DH',
    coordinates: [
      { latitude: 40.443534, longitude: -79.943305 },
      { latitude: 40.443213, longitude: -79.943417 },
      { latitude: 40.443172, longitude: -79.943430 },
      { latitude: 40.443120, longitude: -79.943449 },
      { latitude: 40.443031, longitude: -79.943482 },
      { latitude: 40.442860, longitude: -79.943488 },
      { latitude: 40.442741, longitude: -79.943515 },
      { latitude: 40.442645, longitude: -79.943664 },
      { latitude: 40.442530, longitude: -79.943599 },
      { latitude: 40.442354, longitude: -79.943690 },
      { latitude: 40.442274, longitude: -79.943795 },
      { latitude: 40.442193, longitude: -79.943822 },
      { latitude: 40.442154, longitude: -79.943874 },
    ],
  }
};
