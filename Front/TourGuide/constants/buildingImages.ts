import type { ImageSourcePropType } from 'react-native';

// Metro bundler requires static require paths, so every building image is
// listed explicitly here. Keep this in sync with files under
// assets/images/buildings/ — add a new entry whenever a building gains an image.
export const BUILDING_IMAGES: Record<string, ImageSourcePropType> = {
  AN: require('../assets/images/buildings/AN.jpg'),
  BH: require('../assets/images/buildings/BH.jpg'),
  CFA: require('../assets/images/buildings/CFA.jpg'),
  CUC: require('../assets/images/buildings/CUC.jpg'),
  CYH: require('../assets/images/buildings/CYH.jpg'),
  DH: require('../assets/images/buildings/DH.jpg'),
  GHC: require('../assets/images/buildings/GHC.jpg'),
  HBH: require('../assets/images/buildings/HBH.jpg'),
  HH: require('../assets/images/buildings/HH.jpg'),
  HL: require('../assets/images/buildings/HL.jpg'),
  HOA: require('../assets/images/buildings/HOA.jpg'),
  HWC: require('../assets/images/buildings/HWC.webp'),
  MM: require('../assets/images/buildings/MM.jpg'),
  NSH: require('../assets/images/buildings/NSH.png'),
  PCA: require('../assets/images/buildings/PCA.jpg'),
  PH: require('../assets/images/buildings/PH.jpg'),
  POS: require('../assets/images/buildings/POS.jpg'),
  SC: require('../assets/images/buildings/SC.jpg'),
  SH: require('../assets/images/buildings/SH.jpg'),
  TCS: require('../assets/images/buildings/TCS.jpg'),
  TEP: require('../assets/images/buildings/TEP.jpg'),
  WEH: require('../assets/images/buildings/WEH.jpg'),
  WH: require('../assets/images/buildings/WH.jpg'),
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
