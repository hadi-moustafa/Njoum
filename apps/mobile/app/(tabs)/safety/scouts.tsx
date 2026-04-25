// ============================================================
// Scouts Entry Screen — troops list + activities
// ============================================================
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Card } from '../../../components/ui/Card';
import { useColorScheme } from '../../../hooks/useColorScheme';
import { api } from '../../../services/api';
import { Colors, Spacing, FontSize, FontWeight, TAB_BAR_HEIGHT } from '../../../constants/theme';

const TIER_LABELS: Record<string, string> = {
  brownie_6_8:  'براوني (٦–٨)',
  guide_9_12:   'مرشدة (٩–١٢)',
  senior_13_17: 'كشافة كبرى (١٣–١٧)',
};

interface Activity { id: string; title: string; description?: string; module?: string; difficulty?: string; estimated_minutes?: number; is_offline_capable: boolean; badge_id?: string }

export default function ScoutsScreen() {
  const { colors } = useColorScheme();

  const { data: activitiesData, isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn:  () => api.get<Activity[]>('/scouts/activities'),
    staleTime: 1000 * 60 * 60,
  });

  const activities = activitiesData?.data ?? [];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScreenHeader title="برنامج الكشافة" showBack />
      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: TAB_BAR_HEIGHT + 80 }}>

        {/* My badges teaser */}
        <Card style={{ backgroundColor: Colors.accent }}>
          <Text style={styles.badgesTitle}>شاراتي ⭐</Text>
          <Text style={styles.badgesSub}>تتبّعي إنجازاتكِ في برنامج الكشافة</Text>
        </Card>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>الأنشطة المتاحة</Text>

        {isLoading && <Text style={{ color: colors.textMuted, textAlign: 'center' }}>جارٍ التحميل…</Text>}

        {activities.map(a => (
          <Card key={a.id}>
            <View style={styles.actRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.actTitle, { color: colors.text }]}>{a.title}</Text>
                {a.description && <Text style={[styles.actDesc, { color: colors.textMuted }]} numberOfLines={2}>{a.description}</Text>}
                <View style={styles.actMeta}>
                  {a.estimated_minutes && <Text style={[styles.chip, { color: colors.textMuted }]}>⏱ {a.estimated_minutes} د</Text>}
                  {a.difficulty && <Text style={[styles.chip, { color: colors.textMuted }]}>📊 {a.difficulty}</Text>}
                  {a.is_offline_capable && <Text style={[styles.chip, { color: Colors.success }]}>⬇ بدون إنترنت</Text>}
                </View>
              </View>
              <Pressable style={styles.startBtn}>
                <Text style={styles.startBtnText}>ابدئي</Text>
              </Pressable>
            </View>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1 },
  badgesTitle:  { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#fff', textAlign: 'right' },
  badgesSub:    { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', textAlign: 'right', marginTop: 4 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginVertical: Spacing.md, textAlign: 'right' },
  actRow:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  actTitle:     { fontSize: FontSize.md, fontWeight: FontWeight.semibold, textAlign: 'right' },
  actDesc:      { fontSize: FontSize.sm, marginTop: 2, textAlign: 'right' },
  actMeta:      { flexDirection: 'row', gap: Spacing.xs, marginTop: 6, justifyContent: 'flex-end', flexWrap: 'wrap' },
  chip:         { fontSize: FontSize.xs },
  startBtn:     { backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  startBtnText: { color: '#fff', fontWeight: FontWeight.semibold, fontSize: FontSize.sm },
});
