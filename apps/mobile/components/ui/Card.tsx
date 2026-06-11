import { View, StyleSheet, ViewProps } from 'react-native';
import { Radius, Spacing } from '../../constants/theme';
import { useColorScheme } from '../../hooks/useColorScheme';

interface CardProps extends ViewProps { children: React.ReactNode }

export function Card({ children, style, ...rest }: CardProps) {
  const { isDark, colors } = useColorScheme();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? colors.card   : colors.surface,
          borderColor:     isDark ? '#2C1C48'      : '#F0E4E0',
          shadowColor:     isDark ? '#A480FF'      : '#000',
          shadowOpacity:   isDark ? 0.12           : 0.05,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius:  Radius.lg,
    borderWidth:   1,
    padding:       Spacing.md,
    marginBottom:  Spacing.sm,
    shadowOffset:  { width: 0, height: 2 },
    shadowRadius:  8,
    elevation:     2,
  },
});
