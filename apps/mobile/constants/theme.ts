export const Colors = {
  primary:     '#B5586A',
  primaryDark: '#9A4459',
  primaryLight:'#F2D0D7',
  accent:      '#C8956A',
  depth:       '#7A4E7A',
  background:  '#FDF6F0',
  surface:     '#FFFFFF',
  surfaceAlt:  '#F9F3EE',
  text:        '#2A1520',
  textMuted:   '#8A6070',
  textLight:   '#B89AA4',
  emergency:   '#E53E3E',
  success:     '#38A169',
  warning:     '#D69E2E',
  info:        '#3182CE',
  border:      '#E8D5D0',
  borderLight: '#F0E4E0',

  // Tile backgrounds
  tileRed:    '#FFF0F0',
  tilePurple: '#F5EEFF',
  tilePink:   '#FFF0F6',
  tileBlue:   '#EEF6FF',
  tileYellow: '#FFFBEE',
  tileGreen:  '#EEFFF4',

  // Gradients (used in LinearGradient)
  gradientStart: '#B5586A',
  gradientEnd:   '#7A4E7A',

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
  xs:   4,
  sm:   8,
  md:   14,
  lg:   22,
  xl:   32,
  full: 9999,
} as const;

export const FontSize = {
  xs:  11,
  sm:  13,
  md:  15,
  lg:  17,
  xl:  20,
  xxl: 24,
  h2:  28,
  h1:  34,
} as const;

export const FontWeight = {
  regular:   '400' as const,
  medium:    '500' as const,
  semibold:  '600' as const,
  bold:      '700' as const,
  extrabold: '800' as const,
} as const;

export const Shadow = {
  sm: {
    shadowColor:   '#B5586A',
    shadowOffset:  { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius:  4,
    elevation:     2,
  },
  md: {
    shadowColor:   '#B5586A',
    shadowOffset:  { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius:  8,
    elevation:     4,
  },
  lg: {
    shadowColor:   '#B5586A',
    shadowOffset:  { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius:  16,
    elevation:     8,
  },
} as const;

export const TAB_BAR_HEIGHT = 72;
export const SOS_BUTTON_SIZE = 60;
