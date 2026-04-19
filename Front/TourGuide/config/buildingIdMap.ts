// Maps vision classifier labels to building codes used in buildings.json
export const BUILDING_ID_MAP: Record<string, string> = {
  'Ansys': 'AN',
  'Baker': 'BH',
  'Cfa': 'CFA',
  'Cyert': 'CYH',
  'Doherty': 'DH',
  'Gates': 'GHC',
  'Hamburg': 'HBH',
  'Hamerschlag': 'HH',
  'Highmark': 'HWC',
  'Highmark Side': 'HWC',
  'Hoa': 'HOA',
  'Hunt': 'HL',
  'Margaret Morrison': 'MM',
  'Margaret Morrison Back': 'MM',
  'Margaret Morrison Side': 'MM',
  'Newell-Simon': 'NSH',
  'Porter': 'PH',
  'Porter Back': 'PH',
  'Posner': 'POS',
  'Purnell': 'PCA',
  'Scaife': 'SH',
  'Tcs': 'TCS',
  'Tepper': 'TEP',
  'Uc Back': 'CUC',
  'Uc Front': 'CUC',
  'Uc Side': 'CUC',
  'Uc Side 2': 'CUC',
  'Warner': 'WH',
  'Wean': 'WEH',
  'Field': 'FLD',
};

export function canonicalBuildingId(raw: string): string {
  const trimmed = raw.trim();
  return BUILDING_ID_MAP[trimmed] ?? trimmed;
}
