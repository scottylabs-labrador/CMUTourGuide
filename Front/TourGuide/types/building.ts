import type { BuildingCategory } from '../components/buildingCategories';

export type BuildingId = string;

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface Building {
  title: string;
  latitude: number;
  longitude: number;
  summary: string[];
  tour_guide: string[];
  image_url: string;
}

export interface BuildingOutline {
  name: string;
  category: BuildingCategory;
  shapes: LatLng[][];
}
