// ============================================================
// Legal Guide Detail Screen
// ============================================================
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Card } from '../../components/ui/Card';
import { useColorScheme } from '../../hooks/useColorScheme';
import { api } from '../../services/api';
import { Colors, Spacing, FontSize, FontWeight, TAB_BAR_HEIGHT } from '../../constants/theme';

interface LegalGuide {
  id: string;
  title: string;
  body: string;
  category: string;
  country_code: string;
  language: string;
  version: number;
  updated_at: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  police_report:     'تقديم بلاغ للشرطة',
  restraining_order: 'أمر ابتعاد',
  online_harassment: 'التحرش الإلكتروني',
  rights:            'حقوقي',
  reporting:         'طرق الإبلاغ',
};

export default function LegalGuideDetailScreen() {
  const { id }     = useLocalSearchParams<{ id: string }>();
  const { colors } = useColorScheme();

  const { data, isLoading } = useQuery({
    queryKey: ['legal-guide', id],
    queryFn:  () => api.get<LegalGuide>(`/legal/guides/${id}`),
    enabled:  !!id,
  });

  const guide = data?.data;

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <ScreenHeader title="جارٍ التحميل…" showBack />
        <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: Spacing.xl }}>جارٍ التحميل…</Text>
      </SafeAreaView>
    );
  }

  if (!guide) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <ScreenHeader title="غير موجود" showBack />
        <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: Spacing.xl }}>الدليل القانوني غير متاح.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScreenHeader title="الدليل القانوني" showBack />
      <ScrollView contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + 80 }}>

        {/* Header */}
        <View style={[styles.header, { backgroundColor: Colors.primary + '12' }]}>
          <View style={[styles.catBadge, { backgroundColor: Colors.primary }]}>
            <Text style={styles.catLabel}>{CATEGORY_LABELS[guide.category] ?? guide.category}</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{guide.title}</Text>
          <View style={styles.meta}>
            <Text style={[styles.metaText, { color: colors.textMuted }]}>الإصدار {guide.version}</Text>
            <Text style={[styles.metaText, { color: colors.textMuted }]}>
              آخر تحديث: {new Date(guide.updated_at).toLocaleDateString('ar-LB')}
            </Text>
          </View>
        </View>

        {/* Legal note */}
        <Card style={{ margin: Spacing.md, backgroundColor: Colors.accent + '15', borderColor: Colors.accent, borderWidth: 1 }}>
          <Text style={[styles.noteText, { color: Colors.accent }]}>
            ⚖️ هذه المعلومات للتوعية فقط وليست استشارة قانونية. تواصلي مع محامية معتمدة لحالتكِ.
          </Text>
        </Card>

        {/* Body */}
        <View style={{ paddingHorizontal: Spacing.md }}>
          <Text style={[styles.body, { color: colors.text }]}>{guide.body}</Text>
        </View>

        {/* Disclaimer */}
        <Card style={{ margin: Spacing.md, borderColor: colors.border }}>
          <Text style={[styles.disclaimer, { color: colors.textMuted }]}>
            📌 للإبلاغ عن معلومات خاطئة في هذا الدليل، تواصلي مع فريق نجوم من الإعدادات.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1 },
  header:     { padding: Spacing.lg, paddingTop: Spacing.md },
  catBadge:   { alignSelf: 'flex-end', paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: 20, marginBottom: Spacing.sm },
  catLabel:   { color: '#fff', fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  title:      { fontSize: FontSize.h2, fontWeight: FontWeight.bold, textAlign: 'right', lineHeight: 36 },
  meta:       { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.md, marginTop: Spacing.xs },
  metaText:   { fontSize: FontSize.xs },
  noteText:   { fontSize: FontSize.sm, textAlign: 'right', lineHeight: 20 },
  body:       { fontSize: FontSize.md, lineHeight: 30, textAlign: 'right', letterSpacing: 0.3 },
  disclaimer: { fontSize: FontSize.xs, textAlign: 'right', lineHeight: 18 },
});
