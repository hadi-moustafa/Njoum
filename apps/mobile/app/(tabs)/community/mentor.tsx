// ============================================================
// Mentor Matching Screen
// Shows current assignment status + request/end flow
// ============================================================
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useColorScheme } from '../../../hooks/useColorScheme';
import { api } from '../../../services/api';
import { Colors, Spacing, FontSize, FontWeight, TAB_BAR_HEIGHT } from '../../../constants/theme';

interface MentorAssignment {
  id: string;
  status: 'pending' | 'active' | 'ended';
  started_at?: string;
  ended_at?: string;
  created_at: string;
  mentor: { id: string; full_name?: string; display_name?: string; avatar_url?: string } | null;
}

interface AvailableMentor {
  id: string;
  full_name?: string;
  display_name?: string;
  avatar_url?: string;
  country_code?: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'في انتظار القبول',
  active:  'نشطة',
  ended:   'منتهية',
};

const STATUS_COLORS: Record<string, string> = {
  pending: Colors.accent,
  active:  Colors.success,
  ended:   Colors.primary,
};

export default function MentorScreen() {
  const { colors } = useColorScheme();
  const qc         = useQueryClient();

  const { data: assignmentData, isLoading: loadingAssignment } = useQuery({
    queryKey: ['my-mentor'],
    queryFn:  () => api.get<MentorAssignment | null>('/mentor/my'),
  });

  const { data: availableData } = useQuery({
    queryKey: ['available-mentors'],
    queryFn:  () => api.get<AvailableMentor[]>('/mentor/available'),
    enabled:  !assignmentData?.data || assignmentData.data.status === 'ended',
  });

  const assignment  = assignmentData?.data;
  const mentors     = availableData?.data ?? [];
  const hasActive   = assignment && (assignment.status === 'pending' || assignment.status === 'active');

  const requestMutation = useMutation({
    mutationFn: () => api.post('/mentor/request', {}),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['my-mentor'] }),
    onError:    (err: any) => Alert.alert('خطأ', err?.message ?? 'تعذّر إرسال الطلب.'),
  });

  const endMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/mentor/${id}/end`, {}),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['my-mentor'] }),
    onError:    () => Alert.alert('خطأ', 'تعذّر إنهاء العلاقة.'),
  });

  function confirmEnd() {
    Alert.alert('إنهاء علاقة الإرشاد', 'هل أنتِ متأكدة من إنهاء هذه العلاقة؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'إنهاء', style: 'destructive', onPress: () => endMutation.mutate(assignment!.id) },
    ]);
  }

  const mentorName = assignment?.mentor?.display_name ?? assignment?.mentor?.full_name ?? 'مرشدة';
  const initial    = mentorName[0]?.toUpperCase() ?? '★';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScreenHeader title="مرشدتي" showBack />
      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: TAB_BAR_HEIGHT + 80 }}>

        {/* Intro */}
        <Card style={{ backgroundColor: Colors.depth + '15', marginBottom: Spacing.lg }}>
          <Text style={[styles.introTitle, { color: Colors.depth }]}>برنامج الإرشاد</Text>
          <Text style={[styles.introText, { color: colors.textMuted }]}>
            يربطكِ برنامجنا بمرشدة متطوعة تدعمكِ في رحلتكِ. المحادثات سرية وآمنة.
          </Text>
        </Card>

        {loadingAssignment && (
          <Text style={{ color: colors.textMuted, textAlign: 'center' }}>جارٍ التحميل…</Text>
        )}

        {/* Active/pending assignment */}
        {hasActive && assignment && (
          <Card style={{ borderColor: STATUS_COLORS[assignment.status], borderWidth: 2, marginBottom: Spacing.lg }}>
            <View style={styles.mentorRow}>
              <View style={[styles.avatar, { backgroundColor: Colors.depth }]}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.mentorName, { color: colors.text }]}>{mentorName}</Text>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[assignment.status] + '20' }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[assignment.status] }]}>
                    {STATUS_LABELS[assignment.status]}
                  </Text>
                </View>
                {assignment.started_at && (
                  <Text style={[styles.since, { color: colors.textMuted }]}>
                    منذ {new Date(assignment.started_at).toLocaleDateString('ar-LB', { dateStyle: 'long' })}
                  </Text>
                )}
              </View>
            </View>

            {assignment.status === 'pending' && (
              <Text style={[styles.hint, { color: colors.textMuted }]}>
                ⏳ بانتظار قبول المرشدة. ستصلكِ إشعار عند القبول.
              </Text>
            )}

            {assignment.status === 'active' && (
              <Button
                label="إنهاء علاقة الإرشاد"
                variant="outline"
                onPress={confirmEnd}
                loading={endMutation.isPending}
                style={{ marginTop: Spacing.sm, borderColor: Colors.emergency }}
              />
            )}
          </Card>
        )}

        {/* No active assignment */}
        {!hasActive && !loadingAssignment && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              المرشدات المتاحة ({mentors.length})
            </Text>

            {mentors.length === 0 ? (
              <Card>
                <Text style={[styles.noMentors, { color: colors.textMuted }]}>
                  لا توجد مرشدات متاحات حالياً. نحن نعمل على إضافة المزيد قريباً!
                </Text>
              </Card>
            ) : (
              <>
                {mentors.slice(0, 3).map(m => (
                  <Card key={m.id} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm }}>
                    <View style={[styles.avatar, { backgroundColor: Colors.primary }]}>
                      <Text style={styles.avatarText}>
                        {(m.display_name ?? m.full_name ?? '★')[0]?.toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.mentorName, { color: colors.text }]}>
                        {m.display_name ?? m.full_name ?? 'مرشدة'}
                      </Text>
                      {m.country_code && (
                        <Text style={[styles.since, { color: colors.textMuted }]}>{m.country_code}</Text>
                      )}
                    </View>
                  </Card>
                ))}

                <Button
                  label="طلب مرشدة"
                  onPress={() => requestMutation.mutate()}
                  loading={requestMutation.isPending}
                  style={{ marginTop: Spacing.md }}
                />
              </>
            )}

            {/* Previous assignment */}
            {assignment?.status === 'ended' && (
              <Card style={{ marginTop: Spacing.lg, borderColor: colors.border }}>
                <Text style={[styles.hint, { color: colors.textMuted }]}>
                  انتهت علاقة إرشادك السابقة بتاريخ{' '}
                  {assignment.ended_at
                    ? new Date(assignment.ended_at).toLocaleDateString('ar-LB')
                    : '—'}.
                  يمكنكِ طلب مرشدة جديدة.
                </Text>
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1 },
  introTitle:    { fontSize: FontSize.lg, fontWeight: FontWeight.bold, textAlign: 'right', marginBottom: Spacing.xs },
  introText:     { fontSize: FontSize.sm, textAlign: 'right', lineHeight: 20 },
  mentorRow:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  avatar:        { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarText:    { color: '#fff', fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  mentorName:    { fontSize: FontSize.md, fontWeight: FontWeight.semibold, textAlign: 'right', marginBottom: 4 },
  statusBadge:   { alignSelf: 'flex-end', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: 20 },
  statusText:    { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  since:         { fontSize: FontSize.xs, textAlign: 'right', marginTop: 2 },
  hint:          { fontSize: FontSize.sm, textAlign: 'right', lineHeight: 20, marginTop: Spacing.xs },
  sectionTitle:  { fontSize: FontSize.lg, fontWeight: FontWeight.bold, textAlign: 'right', marginBottom: Spacing.md },
  noMentors:     { fontSize: FontSize.sm, textAlign: 'center', lineHeight: 22 },
});
