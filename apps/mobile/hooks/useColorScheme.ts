import { useColorScheme as _useColorScheme } from 'react-native';
import { useAppStore } from '../store/appStore';
import { Colors } from '../constants/theme';

export function useColorScheme() {
  const systemScheme = _useColorScheme();
  const { theme }    = useAppStore();

  const isDark =
    theme === 'dark' ||
    (theme === 'system' && systemScheme === 'dark');

  return {
    isDark,
    colors: {
      background: isDark ? Colors.darkBackground : Colors.background,
      surface:    isDark ? Colors.darkSurface    : Colors.surface,
      text:       isDark ? Colors.darkText       : Colors.text,
      border:     isDark ? Colors.darkBorder     : Colors.border,
      // Brand colours stay the same in both modes
      primary:   Colors.primary,
      accent:    Colors.accent,
      depth:     Colors.depth,
      emergency: Colors.emergency,
      success:   Colors.success,
      textMuted: isDark ? '#A08090' : Colors.textMuted,
    },
  };
}
