// Maps each building to the CMU college / campus area it belongs to, derived
// from each building's affiliation in `data/buildings.json` and grouped to
// match the discipline themes in `data/routes.ts`. Surfaced as the badge on
// building cards in place of the old "Must-See" tag.
//
// Landmarks (see config/scannableBuildings.ts) intentionally have no entry —
// they keep their own "Landmark" badge.
export const BUILDING_COLLEGES: Record<string, string> = {
  AN: 'Engineering', // ANSYS Hall — College of Engineering
  BH: 'Humanities', // Baker Hall — Dietrich College of Humanities & Social Sciences
  CFA: 'Fine Arts', // College of Fine Arts
  DH: 'Sciences', // Doherty Hall — Mellon College of Science
  GHC: 'Computer Science', // Gates & Hillman — School of Computer Science
  HBH: 'Public Policy', // Hamburg Hall — Heinz College
  HH: 'Engineering', // Hamerschlag Hall — College of Engineering (ECE)
  HL: 'Library', // Hunt Library
  HOA: 'Fine Arts', // Hall of the Arts — School of Music / School of Art
  MM: 'Fine Arts', // Margaret Morrison — College of Fine Arts (Design)
  NSH: 'Computer Science', // Newell-Simon Hall — School of Computer Science
  PCA: 'Fine Arts', // Purnell Center — School of Drama
  PH: 'Engineering', // Porter Hall — Engineering & Public Policy
  SH: 'Engineering', // Scaife Hall — Mechanical Engineering
  TCS: 'Computer Science', // TCS Hall — School of Computer Science
  TEP: 'Business', // Tepper Quad — Tepper School of Business
  WEH: 'Sciences', // Wean Hall — Mellon College of Science / Engineering
  CYH: 'Administrative', // Cyert Hall — Computing Services
  WH: 'Administrative', // Warner Hall — university administration
  CUC: 'Student Life', // Cohon University Center — student union
  POS: 'Student Life', // Posner Hall — Student Academic Success Center
  HWC: 'Athletics', // Highmark Center — health, wellness & athletics
  FLD: 'Athletics', // Gesling Stadium
};

export const getBuildingCollege = (buildingId: string): string | undefined =>
  BUILDING_COLLEGES[buildingId];
