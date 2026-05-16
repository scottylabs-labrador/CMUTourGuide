import type { BuildingCategory } from '../constants/colors';

export type BuildingId = string;

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface Building {
  title: string;
  /** Visual center of the building. Used for marker placement. */
  latitude: number;
  longitude: number;
  /**
   * Main entrance coordinate used for routing (ORS approach path,
   * nearest-stop distance). Optional — when omitted, callers fall back to
   * the center. Set this when the center-based route snaps to a side door.
   */
  entrance?: LatLng;
  tour_guide: string[];
}

export interface BuildingOutline {
  name: string;
  category: BuildingCategory;
  shapes: LatLng[][];
}
