import { Pressable, Text, StyleSheet, ActivityIndicator, PressableProps } from 'react-native';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '../../constants/theme';

interface ButtonProps extends PressableProps {
  label:    string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
  size?:    'sm' | 'md' | 'lg';
}

export function Button({ label, variant = 'primary', loading, size = 'md', style, ...rest }: ButtonProps) {
  const bg = {
    primary:   Colors.primary,
    secondary: Colors.surface,
    danger:    Colors.emergency,
    ghost:     'transparent',
  }[variant];

  const textColor = variant === 'secondary' ? Colors.primary : '#FFFFFF';
  const borderColor = variant === 'secondary' ? Colors.primary : 'transparent';

  const padV = size === 'sm' ? Spacing.xs : size === 'lg' ? Spacing.lg : Spacing.sm + 4;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg, borderColor, paddingVertical: padV, opacity: pressed ? 0.75 : 1 },
        style as any,
      ]}
      {...rest}
    >
      {loading
        ? <ActivityIndicator color={textColor} />
        : <Text style={[styles.label, { color: textColor, fontSize: size === 'sm' ? FontSize.sm : FontSize.md }]}>{label}</Text>
      }
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius:    Radius.md,
    borderWidth:     1.5,
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: Spacing.lg,
    minHeight:       44,
  },
  label: {
    fontWeight:    FontWeight.semibold,
    textAlign:     'center',
  },
});
