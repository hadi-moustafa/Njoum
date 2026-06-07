// ============================================================
// Scouts Screen — activities + badges + complete activity flow
// ============================================================
import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert, Modal, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useColorScheme } from '../../../hooks/useColorScheme';
import { api } from '../../../services/api';
import { Colors, Spacing, FontSize, FontWeight, TAB_BAR_HEIGHT } from '../../../constants/theme';

interface Activity {
  id: string;
  title: string;
  description?: string;
  module?: string;
  badge_id?: string;
  difficulty?: string;
  estimated_minutes?: number;
  is_offline_capable: boolean;
}

interface UserBadge {
  id: string;
  earned_at: string;
  badge: { id: string; name: string; module: string; image_url?: string };
}

interface Completion {
  activity_id: string;
  user_id: string;
}

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner:     '🟢 مبتدئ',
  intermediate: '🟡 متوسط',
  advanced:     '🔴 متقدم',
};

const MODULE_EMOJIS: Record<string, string> = {
  scouts: '⭐', self_defence: '🥋', wellness: '💚', safety: '🛡️', community: '🤝',
};

export default function ScoutsScreen() {
  const { colors } = useColorScheme();
  const qc         = useQueryClient();
  const [selected, setSelected] = useState<Activity | null>(null);

  const { data: activitiesData, isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn:  () => api.get<Activity[]>('/scouts/activities'),
    staleTime: 1000 * 60 * 60,
  });

  const { data: completionsData } = useQuery({
    queryKey: ['my-completions'],
    queryFn:  () => api.get<Completion[]>('/scouts/my-completions'),
  });

  const { data: badgesData } = useQuery({
    queryKey: ['my-badges'],
    queryFn:  () => api.get<UserBadge[]>('/users/me/badges'),
  });

  const activities  = activitiesData?.data  ?? [];
  const completions = completionsData?.data  ?? [];
  const myBadges    = badgesData?.data       ?? [];
  const completedIds = new Set(completions.map(c => c.activity_id));

  const completeMutation = useMutation({
    mutationFn: (activityId: string) => api.post('/scouts/complete', { activity_id: activityId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-completions'] });
      qc.invalidateQueries({ queryKey: ['my-badges'] });
      setSelected(null);
      Alert.alert('أحسنتِ! 🎉', 'تم تسجيل إنجازكِ للنشاط!');
    },
    onError: (err: any) => Alert.alert('خطأ', err?.message ?? 'تعذّر تسجيل الإنجاز.'),
  });

  const done = activities.filter(a => completedIds.has(a.id)).length;
  const total = activities.length;

  return (
    <>
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <ScreenHeader title="برنامج الكشافة" showBack />
        <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: TAB_BAR_HEIGHT + 80 }}>

          {/* Progress banner */}
          <Card style={{ backgroundColor: Colors.accent, marginBottom: Spacing.md }}>
            <Text style={styles.badgesTitle}>شاراتي ⭐  ({myBadges.length})</Text>
            {total > 0 && (
              <>
                <View style={[styles.progressBar, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
                  <View style={[styles.progressFill, { width: `${(done / total) * 100}%` }]} />
                </View>
                <Text style={styles.badgesSub}>{done} من {total} نشاط مكتمل</Text>
              </>
            )}
          </Card>

          {/* My badges horizontal scroll */}
          {myBadges.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>شاراتي المكتسبة</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.lg }}>
                {myBadges.map(ub => (
                  <View key={ub.id} style={[styles.badgeCard, { backgroundColor: Colors.primary + '15' }]}>
                    <Text style={{ fontSize: 28 }}>{MODULE_EMOJIS[ub.badge.module] ?? '🌸'}</Text>
                    <Text style={[styles.badgeName, { color: colors.text }]} numberOfLines={2}>{ub.badge.name}</Text>
                  </View>
                ))}
              </ScrollView>
            </>
          )}

          <Text style={[styles.sectionTitle, { color: colors.text }]}>الأنشطة المتاحة</Text>

          {isLoading && (
            <Text style={{ color: colors.textMuted, textAlign: 'center' }}>جارٍ التحميل…</Text>
          )}

          {activities.map(a => {
            const isCompleted = completedIds.has(a.id);
            return (
              <Card key={a.id} style={{ marginBottom: Spacing.sm, opacity: isCompleted ? 0.75 : 1 }}>
                <View style={styles.actRow}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.titleRow}>
                      {isCompleted && <Text style={styles.checkMark}>✓ </Text>}
                      <Text style={[styles.actTitle, { color: colors.text }]}>{a.title}</Text>
                    </View>
                    {a.description && (
                      <Text style={[styles.actDesc, { color: colors.textMuted }]} numberOfLines={2}>
                        {a.description}
                      </Text>
                    )}
                    <View style={styles.actMeta}>
                      {a.estimated_minutes && (
                        <Text style={[styles.chip, { color: colors.textMuted }]}>⏱ {a.estimated_minutes} د</Text>
                      )}
                      {a.difficulty && (
                        <Text style={[styles.chip, { color: colors.textMuted }]}>
                          {DIFFICULTY_LABELS[a.difficulty] ?? a.difficulty}
                        </Text>
                      )}
                      {a.is_offline_capable && (
                        <Text style={[styles.chip, { color: Colors.success }]}>⬇ بدون إنترنت</Text>
                      )}
                      {a.badge_id && (
                        <Text style={[styles.chip, { color: Colors.accent }]}>🏅 شارة</Text>
                      )}
                    </View>
                  </View>
                  {!isCompleted && (
                    <Pressable
                      style={styles.startBtn}
                      onPress={() => setSelected(a)}
                      accessibilityRole="button"
                    >
                      <Text style={styles.startBtnText}>ابدئي</Text>
                    </Pressable>
                  )}
                  {isCompleted && (
                    <View style={[styles.doneBtn, { backgroundColor: Colors.success + '20' }]}>
                      <Text style={[styles.doneBtnText, { color: Colors.success }]}>منجزة</Text>
                    </View>
                  )}
                </View>
              </Card>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      {/* Activity detail modal */}
      <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{selected?.title}</Text>
            {selected?.description && (
              <Text style={[styles.modalDesc, { color: colors.textMuted }]}>{selected.description}</Text>
            )}

            <View style={styles.modalMeta}>
              {selected?.estimated_minutes && (
                <Text style={[styles.chip, { color: colors.textMuted }]}>⏱ {selected.estimated_minutes} دقيقة</Text>
              )}
              {selected?.difficulty && (
                <Text style={[styles.chip, { color: colors.textMuted }]}>
                  {DIFFICULTY_LABELS[selected.difficulty] ?? selected.difficulty}
                </Text>
              )}
            </View>

            {selected?.badge_id && (
              <Card style={{ backgroundColor: Colors.accent + '15', borderColor: Colors.accent, borderWidth: 1, marginBottom: Spacing.md }}>
                <Text style={[styles.badgeNote, { color: Colors.accent }]}>
                  🏅 إتمام هذا النشاط يمنحكِ شارة!
                </Text>
              </Card>
            )}

            <Button
              label="أنهيتُ هذا النشاط"
              onPress={() => selected && completeMutation.mutate(selected.id)}
              loading={completeMutation.isPending}
              style={{ marginBottom: Spacing.sm }}
            />
            <Button
              label="إلغاء"
              variant="outline"
              onPress={() => setSelected(null)}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1 },
  badgesTitle:   { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#fff', textAlign: 'right' },
  badgesSub:     { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.85)', textAlign: 'right', marginTop: 4 },
  progressBar:   { height: 6, borderRadius: 3, marginVertical: Spacing.xs, overflow: 'hidden' },
  progressFill:  { height: '100%', backgroundColor: '#fff', borderRadius: 3 },
  badgeCard:     { alignItems: 'center', padding: Spacing.md, borderRadius: 14, width: 84, marginRight: Spacing.sm, gap: 4 },
  badgeName:     { fontSize: FontSize.xs, textAlign: 'center', fontWeight: FontWeight.semibold },
  sectionTitle:  { fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginVertical: Spacing.md, textAlign: 'right' },
  actRow:        { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  titleRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  checkMark:     { color: Colors.success, fontWeight: FontWeight.bold },
  actTitle:      { fontSize: FontSize.md, fontWeight: FontWeight.semibold, textAlign: 'right' },
  actDesc:       { fontSize: FontSize.sm, marginTop: 2, textAlign: 'right' },
  actMeta:       { flexDirection: 'row', gap: Spacing.xs, marginTop: 6, justifyContent: 'flex-end', flexWrap: 'wrap' },
  chip:          { fontSize: FontSize.xs },
  startBtn:      { backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  startBtnText:  { color: '#fff', fontWeight: FontWeight.semibold, fontSize: FontSize.sm },
  doneBtn:       { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  doneBtnText:   { fontWeight: FontWeight.semibold, fontSize: FontSize.sm },
  // Modal
  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet:    { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: Spacing.lg },
  modalTitle:    { fontSize: FontSize.xl, fontWeight: FontWeight.bold, textAlign: 'right', marginBottom: Spacing.sm },
  modalDesc:     { fontSize: FontSize.md, textAlign: 'right', lineHeight: 24, marginBottom: Spacing.md },
  modalMeta:     { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'flex-end', marginBottom: Spacing.md },
  badgeNote:     { fontSize: FontSize.sm, textAlign: 'right', fontWeight: FontWeight.semibold },
});
