import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '../../hooks/useColorScheme';
import { Spacing, FontSize, FontWeight } from '../../constants/theme';

interface ScreenHeaderProps {
  title:       string;
  showBack?:   boolean;
  right?:      React.ReactNode;
}

export function ScreenHeader({ title, showBack, right }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useColorScheme();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      {showBack ? (
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={12}>
          <Text style={{ fontSize: 20, color: colors.primary }}>‹</Text>
        </Pressable>
      ) : <View style={styles.back} />}

      <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{title}</Text>

      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingBottom:  Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
  },
  back:  { width: 36, alignItems: 'flex-start' },
  title: { flex: 1, fontSize: FontSize.lg, fontWeight: FontWeight.bold, textAlign: 'center' },
  right: { width: 36, alignItems: 'flex-end' },
});
