import { Pressable, Text, StyleSheet, ActivityIndicator, PressableProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '../../hooks/useColorScheme';
import { Spacing, Radius, FontSize, FontWeight } from '../../constants/theme';

interface ButtonProps extends PressableProps {
  label:    string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  loading?: boolean;
  size?:    'sm' | 'md' | 'lg';
}

export function Button({ label, variant = 'primary', loading, size = 'md', style, ...rest }: ButtonProps) {
  const { colors } = useColorScheme();
  const padV     = size === 'sm' ? Spacing.xs : size === 'lg' ? Spacing.lg : Spacing.sm + 4;
  const fontSize = size === 'sm' ? FontSize.sm : FontSize.md;

  if (variant === 'primary') {
    return (
      <Pressable
        style={({ pressed }) => [styles.base, { paddingVertical: padV, opacity: pressed ? 0.85 : 1 }, style as any]}
        {...rest}
      >
        <LinearGradient
          colors={['#B5586A', '#7A4E7A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={[styles.label, { color: '#fff', fontSize }]}>{label}</Text>
        }
      </Pressable>
    );
  }

  const bg: Record<string, string> = {
    secondary: colors.surface,
    outline:   'transparent',
    danger:    colors.emergency,
    ghost:     'transparent',
  };
  const tc: Record<string, string> = {
    secondary: colors.primary,
    outline:   colors.primary,
    danger:    '#fff',
    ghost:     colors.primary,
  };
  const bc: Record<string, string> = {
    secondary: colors.primary,
    outline:   colors.primary,
    danger:    'transparent',
    ghost:     'transparent',
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bg[variant] ?? 'transparent',
          borderColor:     bc[variant] ?? 'transparent',
          paddingVertical: padV,
          opacity:         pressed ? 0.75 : 1,
        },
        style as any,
      ]}
      {...rest}
    >
      {loading
        ? <ActivityIndicator color={tc[variant] ?? colors.text} />
        : <Text style={[styles.label, { color: tc[variant] ?? colors.text, fontSize }]}>{label}</Text>
      }
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius:      Radius.lg,
    borderWidth:       1.5,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: Spacing.lg,
    minHeight:         48,
    overflow:          'hidden',
  },
  label: {
    fontWeight: FontWeight.bold,
    textAlign:  'center',
  },
});
