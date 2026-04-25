// ============================================================
// Legal Guides Screen
// ============================================================
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Card } from '../../../components/ui/Card';
import { useColorScheme } from '../../../hooks/useColorScheme';
import { api } from '../../../services/api';
import { Colors, Spacing, FontSize, FontWeight, TAB_BAR_HEIGHT } from '../../../constants/theme';

const CATEGORY_LABELS: Record<string, string> = {
  police_report:      'تقديم بلاغ للشرطة',
  restraining_order:  'أمر ابتعاد',
  online_harassment:  'التحرش الإلكتروني',
  rights:             'حقوقي',
  reporting:          'طرق الإبلاغ',
};

interface Guide { id: string; title: string; category: string; country_code: string; version: number; updated_at: string }

export default function LegalScreen() {
  const { colors } = useColorScheme();
  const router     = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['legal-guides'],
    queryFn:  () => api.get<Guide[]>('/legal/guides?country=LB'),
  });

  const guides = data?.data ?? [];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScreenHeader title="حقوقي القانونية" showBack />
      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: TAB_BAR_HEIGHT + 80 }}>

        <Text style={[styles.intro, { color: colors.textMuted }]}>
          أدلة قانونية مبسّطة — اعرفي حقوقكِ، دافعي عن نفسكِ.
        </Text>

        {isLoading && <Text style={{ color: colors.textMuted, textAlign: 'center' }}>جارٍ التحميل…</Text>}

        {guides.map(g => (
          <Pressable key={g.id} onPress={() => router.push(`/legal/${g.id}` as any)}>
            <Card>
              <Text style={[styles.cat, { color: Colors.primary }]}>{CATEGORY_LABELS[g.category] ?? g.category}</Text>
              <Text style={[styles.title, { color: colors.text }]}>{g.title}</Text>
              <Text style={[styles.meta, { color: colors.textMuted }]}>
                الإصدار {g.version} · {new Date(g.updated_at).toLocaleDateString('ar-LB')}
              </Text>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:  { flex: 1 },
  intro: { fontSize: FontSize.sm, marginBottom: Spacing.md, textAlign: 'right', lineHeight: 20 },
  cat:   { fontSize: FontSize.xs, fontWeight: FontWeight.bold, marginBottom: 4, textAlign: 'right' },
  title: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, textAlign: 'right' },
  meta:  { fontSize: FontSize.xs, marginTop: 4, textAlign: 'right' },
});
