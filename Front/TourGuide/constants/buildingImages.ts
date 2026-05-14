import type { ImageSourcePropType } from 'react-native';

// Metro bundler requires static require paths, so every building image is
// listed explicitly here. Keep this in sync with files under
// assets/images/buildings/ — add a new entry whenever a building gains an image.
//
// Source files are downscaled WebP (max 1600px wide, q=82) produced by
// scripts/optimize_building_images.sh. Re-run that script if you replace any
// source photo.
export const BUILDING_IMAGES: Record<string, ImageSourcePropType> = {
  AN: require('../assets/images/buildings/AN.webp'),
  BH: require('../assets/images/buildings/BH.webp'),
  CFA: require('../assets/images/buildings/CFA.webp'),
  CUC: require('../assets/images/buildings/CUC.webp'),
  CYH: require('../assets/images/buildings/CYH.webp'),
  DH: require('../assets/images/buildings/DH.webp'),
  GHC: require('../assets/images/buildings/GHC.webp'),
  HBH: require('../assets/images/buildings/HBH.webp'),
  HH: require('../assets/images/buildings/HH.webp'),
  HL: require('../assets/images/buildings/HL.webp'),
  HOA: require('../assets/images/buildings/HOA.webp'),
  HWC: require('../assets/images/buildings/HWC.webp'),
  MM: require('../assets/images/buildings/MM.webp'),
  NSH: require('../assets/images/buildings/NSH.webp'),
  PCA: require('../assets/images/buildings/PCA.webp'),
  PH: require('../assets/images/buildings/PH.webp'),
  POS: require('../assets/images/buildings/POS.webp'),
  SC: require('../assets/images/buildings/SC.webp'),
  SH: require('../assets/images/buildings/SH.webp'),
  TCS: require('../assets/images/buildings/TCS.webp'),
  TEP: require('../assets/images/buildings/TEP.webp'),
  WEH: require('../assets/images/buildings/WEH.webp'),
  WH: require('../assets/images/buildings/WH.webp'),
};

/**
 * Resolve the image source for a building. Prefers the bundled asset; falls
 * back to the remote `image_url` (useful for buildings added via data only or
 * while a local asset hasn't been checked in yet). Returns `null` when neither
 * is available so callers can render a placeholder.
 */
export function getBuildingImageSource(
  id: string,
  fallbackUrl?: string
): ImageSourcePropType | null {
  const bundled = BUILDING_IMAGES[id];
  if (bundled) return bundled;
  if (fallbackUrl && fallbackUrl.trim().length > 0) return { uri: fallbackUrl };
  return null;
}
