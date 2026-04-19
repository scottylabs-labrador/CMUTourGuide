// CMU Brand colors — see "CMU Brand Quick Guide" / brand.cmu.edu
export const CMU_RED = '#C41230';      // Carnegie Red (PMS 187C)
export const BLACK = '#000000';        // Black
export const IRON_GRAY = '#6D6E71';    // Iron Gray (PMS Cool Gray 10 C)
export const STEEL_GRAY = '#E0E0E0';   // Steel Gray (PMS Cool Gray 4 C)
export const WHITE = '#FFFFFF';        // White

export const COLORS = {
  primary: CMU_RED,
  background: WHITE,
  card: STEEL_GRAY,
  surface: STEEL_GRAY,
  white: WHITE,
  black: BLACK,
  border: STEEL_GRAY,
  textPrimary: BLACK,
  textSecondary: IRON_GRAY,
  textMuted: IRON_GRAY,
  textLight: IRON_GRAY,
  locked: IRON_GRAY,
  // Non-brand utility color, kept for destructive actions only.
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

// Simplified two-state palette used on the campus map:
// red when the building is unlocked, neutral gray when not.
export function getMapBuildingColors(unlocked: boolean) {
  const hex = unlocked ? CMU_RED : IRON_GRAY;
  return {
    stroke: hex,
    fill: hexToRgba(hex, unlocked ? 0.18 : 0.08),
    dot: hex,
  };
}

// Outline used for all non-app buildings on the map (context only).
export const MAP_OUTLINE_NEUTRAL = {
  stroke: hexToRgba(IRON_GRAY, 0.45),
  fill: hexToRgba(IRON_GRAY, 0.06),
};
