// Buildings that must be unlocked by scanning. Every other building in
// `buildings.json` is treated as unlocked by default.
//
// IDs map to keys in `Front/TourGuide/data/buildings.json`.
export const SCANNABLE_BUILDING_IDS: readonly string[] = [
  'AN',   // Ansys Hall
  'BH',   // Baker Hall
  'CFA',  // College of Fine Arts
  'DH',   // Doherty Hall
  'GHC',  // Gates & Hillman Centers
  'HBH',  // Hamburg Hall
  'HH',   // Hamerschlag Hall
  'HL',   // Hunt Library
  'HOA',  // Hall of the Arts
  'MM',   // Margaret Morrison Carnegie Hall
  'NSH',  // Newell-Simon Hall
  'PCA',  // Purnell Center for the Arts
  'PH',   // Porter Hall
  'SC',   // Scott Hall
  'SH',   // Scaife Hall
  'TCS',  // TCS Hall
  'TEP',  // Tepper
  'WEH',  // Wean Hall
  'CYH',  // Cyert Hall
  'WH',   // Warner Hall
  'CUC',  // Cohon University Center
  'POS',  // Posner Hall
  'HWC',  // Highmark Center for Health, Wellness and Athletics
];

const SCANNABLE_SET = new Set(SCANNABLE_BUILDING_IDS);

export const isScannableBuilding = (buildingId: string): boolean =>
  SCANNABLE_SET.has(buildingId);

// Campus landmarks — non-building points of interest (sculptures, traditions,
// etc.) that share the same data shape as buildings but should never be
// scannable and should be presented to the user as "landmarks" rather than
// buildings.
export const LANDMARK_BUILDING_IDS: readonly string[] = [
  'WTS',   // Walking to the Sky
  'FENCE', // The Fence
];

const LANDMARK_SET = new Set(LANDMARK_BUILDING_IDS);

export const isLandmark = (buildingId: string): boolean =>
  LANDMARK_SET.has(buildingId);
