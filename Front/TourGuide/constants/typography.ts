// CMU Brand typefaces — Source Serif Pro for display / brand moments,
// Open Sans for body copy and UI labels.
export const FONTS = {
  // Source Serif Pro
  serifRegular: 'SourceSerifPro_400Regular',
  serifSemiBold: 'SourceSerifPro_600SemiBold',
  serifBold: 'SourceSerifPro_700Bold',

  // Open Sans
  sansRegular: 'OpenSans_400Regular',
  sansSemiBold: 'OpenSans_600SemiBold',
  sansBold: 'OpenSans_700Bold',

  // Backwards-compatible aliases (legacy code uses FONTS.regular / semiBold / bold).
  regular: 'SourceSerifPro_400Regular',
  semiBold: 'SourceSerifPro_600SemiBold',
  bold: 'SourceSerifPro_700Bold',
} as const;
