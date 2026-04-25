// ============================================================
// Self-Defence Videos Screen
// ============================================================
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Card } from '../../../components/ui/Card';
import { useColorScheme } from '../../../hooks/useColorScheme';
import { api } from '../../../services/api';
import { Colors, Spacing, FontSize, FontWeight, TAB_BAR_HEIGHT } from '../../../constants/theme';

const CATEGORY_LABELS: Record<string, string> = {
  grabbed:       'التعامل مع الإمساك',
  followed:      'عند الملاحقة',
  attacked:      'التصدي للهجوم',
  online_safety: 'السلامة الإلكترونية',
  general:       'عام',
};

interface Video { id: string; title: string; description?: string; thumbnail_url?: string; scenario_category: string; duration_seconds?: number; is_offline_capable: boolean }

export default function SelfDefenceScreen() {
  const { colors } = useColorScheme();

  const { data, isLoading } = useQuery({
    queryKey: ['selfdefence-videos'],
    queryFn:  () => api.get<Video[]>('/content/videos'),
    staleTime: 1000 * 60 * 30,
  });

  const videos = data?.data ?? [];
  const grouped = videos.reduce<Record<string, Video[]>>((acc, v) => {
    if (!acc[v.scenario_category]) acc[v.scenario_category] = [];
    acc[v.scenario_category]!.push(v);
    return acc;
  }, {});

  function formatDuration(secs?: number) {
    if (!secs) return '';
    const m = Math.floor(secs / 60), s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScreenHeader title="الدفاع عن النفس" showBack />
      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: TAB_BAR_HEIGHT + 80 }}>
        {isLoading && <Text style={{ color: colors.textMuted, textAlign: 'center' }}>جارٍ التحميل…</Text>}

        {Object.entries(grouped).map(([cat, items]) => (
          <View key={cat} style={{ marginBottom: Spacing.lg }}>
            <Text style={[styles.category, { color: colors.text }]}>
              {CATEGORY_LABELS[cat] ?? cat}
            </Text>
            {items.map(v => (
              <Card key={v.id}>
                <View style={styles.videoRow}>
                  <View style={styles.thumbnail}>
                    <Text style={{ fontSize: 32 }}>▶️</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.title, { color: colors.text }]}>{v.title}</Text>
                    {v.description && <Text style={[styles.desc, { color: colors.textMuted }]} numberOfLines={2}>{v.description}</Text>}
                    <View style={styles.meta}>
                      {v.duration_seconds && <Text style={[styles.dur, { color: colors.textMuted }]}>{formatDuration(v.duration_seconds)}</Text>}
                      {v.is_offline_capable && <Text style={styles.offline}>⬇ متاح بدون إنترنت</Text>}
                    </View>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1 },
  category:  { fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: Spacing.sm, textAlign: 'right' },
  videoRow:  { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  thumbnail: { width: 64, height: 64, backgroundColor: '#f0e0e5', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  title:     { fontSize: FontSize.md, fontWeight: FontWeight.semibold, textAlign: 'right' },
  desc:      { fontSize: FontSize.sm, marginTop: 2, textAlign: 'right' },
  meta:      { flexDirection: 'row', gap: Spacing.sm, marginTop: 4, justifyContent: 'flex-end' },
  dur:       { fontSize: FontSize.xs },
  offline:   { fontSize: FontSize.xs, color: Colors.success, fontWeight: FontWeight.medium },
});
