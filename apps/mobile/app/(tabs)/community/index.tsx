// ============================================================
// Community — groups list
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

interface Group { id: string; name: string; description?: string; category: string; member_count: number; is_private: boolean }

const CATEGORY_LABELS: Record<string, string> = {
  survivors:     'الناجيات',
  students:      'الطالبات',
  career:        'المهنة',
  general:       'عام',
  mental_health: 'الصحة النفسية',
  custom:        'مخصص',
};

const CATEGORY_EMOJI: Record<string, string> = {
  survivors: '💜', students: '📚', career: '💼',
  general: '🌸', mental_health: '🧠', custom: '✨',
};

export default function CommunityScreen() {
  const { colors } = useColorScheme();
  const router     = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn:  () => api.get<Group[]>('/community/groups'),
  });

  const groups = data?.data ?? [];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScreenHeader title="مجتمعنا" />
      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: TAB_BAR_HEIGHT + 80 }}>

        {/* Quick nav row */}
        <View style={styles.quickRow}>
          <Pressable style={[styles.quickBtn, { backgroundColor: Colors.primary + '15' }]} onPress={() => router.push('/(tabs)/community/events' as any)}>
            <Text style={{ fontSize: 20 }}>📅</Text>
            <Text style={[styles.quickLabel, { color: Colors.primary }]}>الفعاليات</Text>
          </Pressable>
          <Pressable style={[styles.quickBtn, { backgroundColor: Colors.depth + '15' }]} onPress={() => router.push('/(tabs)/community/mentor' as any)}>
            <Text style={{ fontSize: 20 }}>🌟</Text>
            <Text style={[styles.quickLabel, { color: Colors.depth }]}>مرشدتي</Text>
          </Pressable>
        </View>

        <Text style={[styles.intro, { color: colors.textMuted }]}>
          انضمي إلى مجموعة آمنة تجمعكِ بنساء يشاركنكِ تجاربهن.
        </Text>

        {isLoading && <Text style={{ color: colors.textMuted, textAlign: 'center' }}>جارٍ التحميل…</Text>}

        {groups.map(g => (
          <Pressable key={g.id} onPress={() => router.push(`/community/feed?groupId=${g.id}&groupName=${encodeURIComponent(g.name)}` as any)}>
            <Card style={styles.groupCard}>
              <View style={[styles.iconBox, { backgroundColor: Colors.primary + '15' }]}>
                <Text style={{ fontSize: 24 }}>{CATEGORY_EMOJI[g.category] ?? '🌸'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.groupName, { color: colors.text }]}>{g.name}</Text>
                {g.description && (
                  <Text style={[styles.groupDesc, { color: colors.textMuted }]} numberOfLines={2}>{g.description}</Text>
                )}
                <View style={styles.metaRow}>
                  <Text style={[styles.metaChip, { color: colors.textMuted }]}>
                    {CATEGORY_LABELS[g.category] ?? g.category}
                  </Text>
                  <Text style={[styles.metaChip, { color: colors.textMuted }]}>
                    👥 {g.member_count}
                  </Text>
                  {g.is_private && (
                    <Text style={[styles.metaChip, { color: Colors.accent }]}>🔒 خاصة</Text>
                  )}
                </View>
              </View>
            </Card>
          </Pressable>
        ))}

        {groups.length === 0 && !isLoading && (
          <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: Spacing.xl }}>
            لا توجد مجموعات متاحة حالياً.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1 },
  quickRow:   { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  quickBtn:   { flex: 1, alignItems: 'center', padding: Spacing.md, borderRadius: 14, gap: 6 },
  quickLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  intro:      { fontSize: FontSize.sm, textAlign: 'right', marginBottom: Spacing.lg, lineHeight: 22 },
  groupCard:  { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start', marginBottom: Spacing.sm },
  iconBox:    { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  groupName:  { fontSize: FontSize.md, fontWeight: FontWeight.semibold, textAlign: 'right', marginBottom: 2 },
  groupDesc:  { fontSize: FontSize.xs, textAlign: 'right', lineHeight: 18 },
  metaRow:    { flexDirection: 'row', gap: Spacing.sm, marginTop: 6, justifyContent: 'flex-end' },
  metaChip:   { fontSize: FontSize.xs },
});
