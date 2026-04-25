import { View, StyleSheet, ViewProps } from 'react-native';
import { Colors, Spacing, Radius } from '../../constants/theme';
import { useColorScheme } from '../../hooks/useColorScheme';

interface CardProps extends ViewProps { children: React.ReactNode }

export function Card({ children, style, ...rest }: CardProps) {
  const { colors } = useColorScheme();
  return (
    <View
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, style]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius:  Radius.md,
    borderWidth:   1,
    padding:       Spacing.md,
    marginBottom:  Spacing.sm,
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius:  4,
    elevation:     2,
  },
});
