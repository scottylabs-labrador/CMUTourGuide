export const CMU_RED = '#C41E3A';

export const COLORS = {
  primary: CMU_RED,
  background: '#F8F9FA',
  card: '#F1F3F5',
  white: '#FFFFFF',
  border: '#e9ecef',
  textPrimary: '#1F2933',
  textSecondary: '#7A8593',
  textMuted: '#999',
  textLight: '#bbb',
  locked: '#999',
  danger: '#dc3545',
};

export type BuildingCategory = 'academic' | 'residential' | 'student-life' | 'administrative';

export const CATEGORY_COLORS: Record<BuildingCategory, string> = {
  'academic':       CMU_RED,
  'residential':    '#E6A817',
  'student-life':   '#0072B2',
  'administrative': '#7A7A7A',
};

export const CATEGORY_LABELS: Record<BuildingCategory, string> = {
  'academic':       'Academic',
  'residential':    'Residential',
  'student-life':   'Student Life',
  'administrative': 'Administrative',
};

export function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export function getCategoryColors(category: BuildingCategory, unlocked: boolean) {
  const hex = CATEGORY_COLORS[category];
  return {
    stroke: unlocked ? hex : COLORS.locked,
    fill: unlocked ? hexToRgba(hex, 0.2) : hexToRgba(hex, 0.08),
    dot: unlocked ? hex : COLORS.locked,
  };
}

export function getBaseOutlineColors(category: BuildingCategory) {
  const hex = CATEGORY_COLORS[category];
  return {
    stroke: hexToRgba(hex, 0.4),
    fill: hexToRgba(hex, 0.08),
  };
}
