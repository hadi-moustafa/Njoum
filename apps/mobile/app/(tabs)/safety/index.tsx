// ============================================================
// Safety Tab — entry point: tiles linking to sub-features
// ============================================================
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '../../../hooks/useColorScheme';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Colors, Spacing, FontSize, FontWeight, Radius, TAB_BAR_HEIGHT } from '../../../constants/theme';

const SAFETY_SECTIONS = [
  { emoji: '🆘', label: 'خطوط الطوارئ',      sub: 'أرقام الأزمات بحسب بلدكِ', route: './hotlines',  color: '#FFE5E5' },
  { emoji: '👥', label: 'جهات الاتصال الطارئة', sub: 'أضيفي من تثقينَ بهم',     route: './contacts',  color: '#FFE8F0' },
  { emoji: '🗺️', label: 'تتبّع رحلتي',         sub: 'أرسلي مسارك بأمان',       route: './journey',   color: '#E5F4FF' },
  { emoji: '🥋', label: 'الدفاع عن النفس',     sub: 'فيديوهات وتدريبات',        route: './selfdefence',color: '#FFF5E5' },
  { emoji: '📚', label: 'مركز السلامة',         sub: 'مقالات ومعلومات',          route: './learn',     color: '#E5FFE5' },
  { emoji: '⚖️', label: 'حقوقي القانونية',     sub: 'أدلة وموارد قانونية',       route: './legal',     color: '#F5E5FF' },
  { emoji: '🌟', label: 'برنامج الكشافة',       sub: 'شارات وأنشطة',             route: './scouts',    color: '#FFFCE5' },
];

export default function SafetyScreen() {
  const router   = useRouter();
  const { colors } = useColorScheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScreenHeader title="السلامة" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: TAB_BAR_HEIGHT + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.intro, { color: colors.textMuted }]}>
          أدوات الحماية والأمان — دائماً في متناول يدكِ.
        </Text>

        {SAFETY_SECTIONS.map(item => (
          <Pressable
            key={item.route}
            style={({ pressed }) => [styles.row, { backgroundColor: item.color, opacity: pressed ? 0.85 : 1 }]}
            onPress={() => router.push(item.route as any)}
          >
            <Text style={styles.rowEmoji}>{item.emoji}</Text>
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, { color: Colors.text }]}>{item.label}</Text>
              <Text style={[styles.rowSub,   { color: Colors.textMuted }]}>{item.sub}</Text>
            </View>
            <Text style={[styles.chevron, { color: Colors.textMuted }]}>›</Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1 },
  scroll:    { padding: Spacing.md, gap: Spacing.sm },
  intro:     { fontSize: FontSize.md, marginBottom: Spacing.sm, textAlign: 'right', lineHeight: 22 },
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    padding:        Spacing.md,
    borderRadius:   Radius.md,
    gap:            Spacing.sm,
  },
  rowEmoji:  { fontSize: 28, width: 40, textAlign: 'center' },
  rowText:   { flex: 1 },
  rowLabel:  { fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  rowSub:    { fontSize: FontSize.sm, marginTop: 2 },
  chevron:   { fontSize: 22 },
});
