// ============================================================
// Wellness Tab — main menu
// ============================================================
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Card } from '../../../components/ui/Card';
import { useColorScheme } from '../../../hooks/useColorScheme';
import { Colors, Spacing, FontSize, FontWeight, TAB_BAR_HEIGHT } from '../../../constants/theme';

const MENU: { label: string; sub: string; emoji: string; route: string; color: string }[] = [
  { label: 'مزاجي اليومي',    sub: 'تتبّعي حالتك النفسية يومياً',      emoji: '🌸', route: '/wellness/mood',    color: Colors.primary },
  { label: 'يومياتي السرية',  sub: 'مساحتك الآمنة للتعبير الحر',       emoji: '📓', route: '/wellness/journal', color: Colors.depth   },
  { label: 'دورتي الشهرية',   sub: 'تتبّع الدورة والتنبؤ بالموعد القادم', emoji: '🌙', route: '/wellness/cycle',   color: Colors.accent  },
];

export default function WellnessScreen() {
  const { colors } = useColorScheme();
  const router     = useRouter();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScreenHeader title="صحتي" />
      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: TAB_BAR_HEIGHT + 80 }}>

        <Text style={[styles.greeting, { color: colors.textMuted }]}>
          اعتني بجسدكِ وعقلكِ — كل يوم خطوة نحو الأفضل.
        </Text>

        {MENU.map(item => (
          <Pressable key={item.route} onPress={() => router.push(item.route as any)}>
            <Card style={styles.menuCard}>
              <View style={[styles.iconBox, { backgroundColor: item.color + '20' }]}>
                <Text style={styles.emoji}>{item.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.text }]}>{item.label}</Text>
                <Text style={[styles.sub, { color: colors.textMuted }]}>{item.sub}</Text>
              </View>
              <Text style={[styles.arrow, { color: colors.textMuted }]}>‹</Text>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:     { flex: 1 },
  greeting: { fontSize: FontSize.sm, textAlign: 'right', marginBottom: Spacing.lg, lineHeight: 22 },
  menuCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  iconBox:  { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  emoji:    { fontSize: 26 },
  label:    { fontSize: FontSize.md, fontWeight: FontWeight.semibold, textAlign: 'right' },
  sub:      { fontSize: FontSize.xs, marginTop: 2, textAlign: 'right' },
  arrow:    { fontSize: 20, transform: [{ scaleX: -1 }] },
});
