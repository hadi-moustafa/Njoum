import { useColorScheme as _useColorScheme } from 'react-native';
import { useAppStore } from '../store/appStore';
import { NightColors, DayColors } from '../constants/theme';
import type { ThemeColors } from '../constants/theme';
import type { Lang } from '../constants/i18n';

export interface ThemeContext {
  isDark: boolean;
  colors: ThemeColors;
  lang: Lang;
}

export function useColorScheme(): ThemeContext {
  const systemScheme = _useColorScheme();
  const { theme, language } = useAppStore();

  const isDark =
    theme === 'dark' ||
    (theme === 'system' && systemScheme === 'dark');

  return {
    isDark,
    colors: isDark ? NightColors : DayColors,
    lang: language as Lang,
  };
}
