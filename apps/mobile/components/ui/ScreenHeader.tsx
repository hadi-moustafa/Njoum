import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useColorScheme } from '../../hooks/useColorScheme';
import { Spacing, FontSize, FontWeight, Radius } from '../../constants/theme';

interface ScreenHeaderProps {
  title:     string;
  showBack?: boolean;
  onBack?:   () => void;
  right?:    React.ReactNode;
}

export function ScreenHeader({ title, showBack, onBack, right }: ScreenHeaderProps) {
  const router                   = useRouter();
  const { isDark, colors, lang } = useColorScheme();
  const isRTL                    = lang === 'ar';

  const handleBack = onBack ?? (() => router.back());

  return (
    <View style={[styles.header, { backgroundColor: colors.background }]}>
      {showBack ? (
        <Pressable
          onPress={handleBack}
          style={[styles.backBtn, { backgroundColor: isDark ? '#1A1130' : '#F5EEF0' }]}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={isRTL ? 'رجوع' : 'Back'}
        >
          <Text style={[styles.backArrow, { color: colors.primary }]}>
            {isRTL ? '›' : '‹'}
          </Text>
        </Pressable>
      ) : (
        <View style={styles.placeholder} />
      )}

      <View style={styles.titleWrap}>
        {isDark && <Text style={styles.starDeco}>✦</Text>}
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        {isDark && <Text style={styles.starDeco}>✦</Text>}
      </View>

      <View style={styles.right}>{right ?? <View style={styles.placeholder} />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingVertical:   Spacing.sm + 4,
    paddingHorizontal: Spacing.md,
    gap:               Spacing.sm,
  },
  backBtn: {
    width:          36,
    height:         36,
    borderRadius:   Radius.md,
    alignItems:     'center',
    justifyContent: 'center',
  },
  backArrow:   { fontSize: 22, fontWeight: '700', lineHeight: 26 },
  placeholder: { width: 36 },
  titleWrap: {
    flex:           1,
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            6,
  },
  title: {
    fontSize:   FontSize.lg,
    fontWeight: FontWeight.bold,
    textAlign:  'center',
  },
  starDeco: {
    fontSize: 11,
    color:    '#E8C86A',
    opacity:  0.7,
  },
  right: { width: 36, alignItems: 'flex-end' },
});
