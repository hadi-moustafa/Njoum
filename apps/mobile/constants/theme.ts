// ============================================================
// Design tokens — mirrors CLAUDE.md brand palette
// ============================================================

export const Colors = {
  primary:    '#B5586A',
  accent:     '#C8956A',
  depth:      '#7A4E7A',
  background: '#FDF6F0',
  surface:    '#FFFFFF',
  text:       '#2A1520',
  textMuted:  '#8A6070',
  emergency:  '#E53E3E',
  success:    '#38A169',
  warning:    '#D69E2E',
  border:     '#E8D5D0',

  // Dark mode
  darkBackground: '#1A0D10',
  darkSurface:    '#2A1520',
  darkText:       '#FDF6F0',
  darkBorder:     '#4A2530',
} as const;

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
} as const;

export const Radius = {
  sm:   6,
  md:   12,
  lg:   20,
  full: 9999,
} as const;

export const FontSize = {
  xs:  11,
  sm:  13,
  md:  15,
  lg:  17,
  xl:  20,
  xxl: 24,
  h1:  32,
} as const;

export const FontWeight = {
  regular:   '400' as const,
  medium:    '500' as const,
  semibold:  '600' as const,
  bold:      '700' as const,
  extrabold: '800' as const,
} as const;

// Tab bar height — SOS button sits above this
export const TAB_BAR_HEIGHT = 80;
// SOS button dimensions
export const SOS_BUTTON_SIZE = 64;
