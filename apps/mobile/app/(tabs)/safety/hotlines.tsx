// ============================================================
// Hotlines Screen — offline-capable, grouped by category
// ============================================================
import { View, Text, ScrollView, StyleSheet, Pressable, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Card } from '../../../components/ui/Card';
import { useColorScheme } from '../../../hooks/useColorScheme';
import { StarField } from '../../../components/home/StarField';
import { api } from '../../../services/api';
import { Hotline } from '@njoum/shared';
import { Colors, Spacing, FontSize, FontWeight, TAB_BAR_HEIGHT } from '../../../constants/theme';

const CATEGORY_LABELS: Record<string, string> = {
  police:           'الشرطة والطوارئ',
  fire:             'الإطفاء',
  mental_health:    'الصحة النفسية',
  domestic_violence:'العنف الأسري',
  legal_aid:        'المساعدة القانونية',
  child_protection: 'حماية الطفل',
  eating_disorder:  'اضطرابات الأكل',
  addiction:        'الإدمان',
};

export default function HotlinesScreen() {
  const { isDark, colors } = useColorScheme();

  const { data, isLoading } = useQuery({
    queryKey: ['hotlines-local'],
    queryFn:  () => api.get<Hotline[]>('/hotlines/local'),
    staleTime: 1000 * 60 * 60,          // 1 hour
    gcTime:   1000 * 60 * 60 * 24 * 30, // 30 days — persisted via MMKV for offline access
  });

  const hotlines = data?.data ?? [];

  // Group by category
  const grouped = hotlines.reduce<Record<string, Hotline[]>>((acc, h) => {
    if (!acc[h.category]) acc[h.category] = [];
    acc[h.category]!.push(h);
    return acc;
  }, {});

  async function callNumber(number: string) {
    const url = `tel:${number.replace(/\s/g, '')}`;
    const ok  = await Linking.canOpenURL(url);
    if (ok) Linking.openURL(url);
    else Alert.alert('خطأ', 'لا يمكن إجراء المكالمة على هذا الجهاز.');
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {isDark && <StarField />}
      <ScreenHeader title="خطوط الطوارئ" showBack />
      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: TAB_BAR_HEIGHT + 80 }}>
        {isLoading && <Text style={[styles.loading, { color: colors.textMuted }]}>جارٍ التحميل…</Text>}

        {Object.entries(grouped).map(([category, items]) => (
          <View key={category} style={{ marginBottom: Spacing.md }}>
            <Text style={[styles.category, { color: colors.text }]}>
              {CATEGORY_LABELS[category] ?? category}
            </Text>
            {items.map(h => (
              <Card key={h.id}>
                <View style={styles.hotlineRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.name, { color: colors.text }]}>{h.name}</Text>
                    {h.region ? (
                      <Text style={[styles.desc, { color: colors.textMuted }]}>{h.region}</Text>
                    ) : null}
                  </View>
                  <Pressable
                    style={styles.callBtn}
                    onPress={() => callNumber(h.phone)}
                    accessibilityLabel={`اتصال بـ ${h.name}`}
                  >
                    <Text style={styles.callEmoji}>📞</Text>
                    <Text style={styles.callNum}>{h.phone}</Text>
                  </Pressable>
                </View>
              </Card>
            ))}
          </View>
        ))}

        {!isLoading && hotlines.length === 0 && (
          <Text style={[styles.loading, { color: colors.textMuted }]}>
            لا توجد أرقام متاحة لبلدكِ حالياً.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1 },
  loading:    { textAlign: 'center', marginTop: Spacing.xl, fontSize: FontSize.md },
  category:   { fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: Spacing.sm, textAlign: 'right' },
  hotlineRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  name:       { fontSize: FontSize.md, fontWeight: FontWeight.semibold, textAlign: 'right' },
  desc:       { fontSize: FontSize.sm, marginTop: 2, textAlign: 'right' },
  badge24:    { fontSize: FontSize.xs, color: Colors.success, fontWeight: FontWeight.bold, marginTop: 4, textAlign: 'right' },
  callBtn:    { alignItems: 'center', backgroundColor: Colors.emergency, borderRadius: 10, padding: Spacing.sm, minWidth: 70 },
  callEmoji:  { fontSize: 20 },
  callNum:    { fontSize: FontSize.xs, color: '#fff', fontWeight: FontWeight.bold, marginTop: 2 },
});
