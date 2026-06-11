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

  // Tile backgrounds (light)
  tileRed:    '#FFF0F0',
  tilePurple: '#F5EEFF',
  tilePink:   '#FFF0F6',
  tileBlue:   '#EEF6FF',
  tileYellow: '#FFFBEE',
  tileGreen:  '#EEFFF4',

  // Brand gradients
  gradientStart: '#B5586A',
  gradientEnd:   '#7A4E7A',

  // Legacy dark mode (kept for backwards compat)
  darkBackground: '#1A0D10',
  darkSurface:    '#2A1520',
  darkText:       '#FDF6F0',
  darkBorder:     '#4A2530',
} as const;

// ── Night / Star theme ────────────────────────────────────────
export const NightColors = {
  background:  '#07050F',
  surface:     '#120B20',
  card:        '#1A1130',
  border:      '#2C1C48',
  text:        '#EDE4FF',
  textMuted:   '#9B89C4',
  textLight:   '#5E4E7A',

  // Star / night decorations
  starGold:    '#E8C86A',
  starPurple:  '#A480FF',
  starBlue:    '#6CB2FF',
  starWhite:   '#FFFFFF',
  glow:        'rgba(164, 128, 255, 0.32)',
  glowGold:    'rgba(232, 200, 106, 0.28)',
  // Sun aliases (so the union type is symmetric)
  sunGold:     '#E8C86A',
  sunWarm:     '#F5D070',
  sunLight:    '#F0E8FF',

  // Gradient (deep space)
  gradientStart: '#281A42',
  gradientEnd:   '#07050F',

  // Tile backgrounds (dark, muted)
  tileRed:    '#270A0A',
  tilePurple: '#150830',
  tilePink:   '#270A18',
  tileBlue:   '#081528',
  tileYellow: '#27200A',
  tileGreen:  '#0A2015',

  // Tab bar
  tabBg:     '#120B20',
  tabBorder: '#2C1C48',

  // Brand preserved
  primary:   '#B5586A',
  accent:    '#C8956A',
  depth:     '#A480FF',
  emergency: '#E53E3E',
  success:   '#38A169',
  warning:   '#D69E2E',
  info:      '#6CB2FF',
} as const;

// ── Day / Sun theme ───────────────────────────────────────────
export const DayColors = {
  background:  '#FDF6F0',
  surface:     '#FFFFFF',
  card:        '#FFFFFF',
  border:      '#E8D5D0',
  text:        '#2A1520',
  textMuted:   '#8A6070',
  textLight:   '#B89AA4',

  // Sun / day decorations
  sunGold:     '#F6A623',
  sunWarm:     '#FFB347',
  sunLight:    '#FFF8EE',
  glow:        'rgba(181, 88, 106, 0.18)',
  glowGold:    'rgba(246, 166, 35, 0.18)',
  // Star aliases (so the union type is symmetric)
  starGold:    '#C8956A',
  starPurple:  '#7A4E7A',
  starBlue:    '#3182CE',
  starWhite:   '#FFFFFF',

  // Gradient (brand rose)
  gradientStart: '#B5586A',
  gradientEnd:   '#7A4E7A',

  // Tile backgrounds (light)
  tileRed:    '#FFF0F0',
  tilePurple: '#F5EEFF',
  tilePink:   '#FFF0F6',
  tileBlue:   '#EEF6FF',
  tileYellow: '#FFFBEE',
  tileGreen:  '#EEFFF4',

  // Tab bar
  tabBg:     '#FFFFFF',
  tabBorder: '#E8D5D0',

  // Brand
  primary:   '#B5586A',
  accent:    '#C8956A',
  depth:     '#7A4E7A',
  emergency: '#E53E3E',
  success:   '#38A169',
  warning:   '#D69E2E',
  info:      '#3182CE',
} as const;

export type ThemeColors = typeof NightColors | typeof DayColors;

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
  night: {
    shadowColor:   '#A480FF',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius:  12,
    elevation:     6,
  },
} as const;

export const TAB_BAR_HEIGHT = 72;
export const SOS_BUTTON_SIZE = 60;
