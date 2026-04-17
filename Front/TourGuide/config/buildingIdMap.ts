// Maps vision classifier labels to building codes used in buildings.json
export const BUILDING_ID_MAP: Record<string, string> = {
  'Tepper': 'TEP',
  'Tcs': 'TCS',
  'Gates': 'GHC',
  'Warner': 'WH',
  'Purnell': 'PCA',
  'Doherty': 'DH',
  'Hamerschlag': 'HH',
  'ANSYS': 'AN',
  'Scaife': 'SH',
  'Baker': 'BH',
  'Cfa': 'CFA',
  'Posner': 'POS',
  'Margaret Morrison': 'MM',
  'Margaret Morrison Side': 'MM',
  'Highmark': 'HWC',
  'Hunt': 'HL',
  'Hamburg': 'HBH',
  'Cyert': 'CYH',
  'Uc': 'CUC',
  'Uc Side': 'CUC',
  'Uc Side 2': 'CUC',
  'Uc Front': 'CUC',
  'Uc Back': 'CUC',
  'Wean': 'WEH',
  'Porter': 'PH',
};

export function canonicalBuildingId(raw: string): string {
  const trimmed = raw.trim();
  return BUILDING_ID_MAP[trimmed] ?? trimmed;
}
