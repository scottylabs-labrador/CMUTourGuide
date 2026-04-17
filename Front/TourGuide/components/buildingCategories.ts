export type BuildingCategory = 'academic' | 'residential' | 'student-life' | 'administrative';

export const CATEGORY_COLORS: Record<BuildingCategory, string> = {
  'academic':       '#C41E3A',
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

function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export function getCategoryColors(category: BuildingCategory, unlocked: boolean) {
  const hex = CATEGORY_COLORS[category];
  return {
    stroke: unlocked ? hex : '#999',
    fill: unlocked ? hexToRgba(hex, 0.2) : hexToRgba(hex, 0.08),
    dot: unlocked ? hex : '#999',
  };
}

export function getBaseOutlineColors(category: BuildingCategory) {
  const hex = CATEGORY_COLORS[category];
  return {
    stroke: hexToRgba(hex, 0.4),
    fill: hexToRgba(hex, 0.08),
  };
}
