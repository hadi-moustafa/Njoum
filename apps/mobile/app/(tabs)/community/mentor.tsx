// ============================================================
// Mentor Screen (girl view)
//
// States:
//  A. No assignment / ended  → browse mentors, tap to request
//  B. Pending                → waiting card + cancel option
//  C. Active                 → mentor card + feed (events & activities)
// ============================================================
import { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  Alert, ActivityIndicator, TextInput,
} from 'react-native';
import { SafeAreaView }  from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ScreenHeader }  from '../../../components/ui/ScreenHeader';
import { Card }          from '../../../components/ui/Card';
import { Button }        from '../../../components/ui/Button';
import { useColorScheme } from '../../../hooks/useColorScheme';
import { StarField }     from '../../../components/home/StarField';
import { api }           from '../../../services/api';
import { Colors, Spacing, FontSize, FontWeight, Radius, TAB_BAR_HEIGHT } from '../../../constants/theme';

// ── Types ─────────────────────────────────────────────────────
interface MentorProfile {
  id: string;
  full_name?: string;
  avatar_url?: string;
  country?: string;
  age_range?: string;
}

interface MentorAssignment {
  id: string;
  status: 'pending' | 'active' | 'ended';
  started_at?: string;
  ended_at?: string;
  created_at: string;
  mentor: MentorProfile | null;
}

interface MentorFeedItem {
  id: string;
  title: string;
  description?: string;
  event_type?: string;       // events
  starts_at?: string;        // events
  is_virtual?: boolean;      // events
  join_url?: string;         // events
  module?: string;           // activities
  difficulty?: string;       // activities
  estimated_minutes?: number;// activities
  is_offline_capable?: boolean; // activities
}

interface MentorFeed {
  mentor_id: string;
  events:     MentorFeedItem[];
  activities: MentorFeedItem[];
}

// ── Helpers ───────────────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  pending: Colors.accent,
  active:  Colors.success,
  ended:   Colors.textMuted ?? '#8A6070',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'في انتظار القبول',
  active:  'نشطة',
  ended:   'منتهية',
};

const EVENT_TYPE_LABEL: Record<string, string> = {
  workshop:          '🔧 ورشة عمل',
  webinar:           '💻 ندوة إلكترونية',
  meetup:            '🤝 لقاء',
  troop_meeting:     '⭐ اجتماع الفرقة',
  community_service: '🌱 خدمة مجتمعية',
};

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner:     'مبتدئة',
  intermediate: 'متوسطة',
  advanced:     'متقدمة',
};

function MentorAvatar({ name, size = 52 }: { name: string; size?: number }) {
  return (
    <View style={[styles.avatarCircle, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarLetter, { fontSize: size * 0.4 }]}>
        {name[0]?.toUpperCase() ?? '★'}
      </Text>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────
export default function MentorScreen() {
  const { isDark, colors } = useColorScheme();
  const qc = useQueryClient();
  const [selectedMentorId, setSelectedMentorId] = useState<string | null>(null);
  const [requestMsg, setRequestMsg] = useState('');

  // Current assignment
  const { data: assignmentRes, isLoading: loadingAssignment } = useQuery({
    queryKey: ['my-mentor'],
    queryFn:  () => api.get<MentorAssignment | null>('/mentor/my'),
  });
  const assignment = assignmentRes?.data ?? null;
  const hasActive  = assignment && (assignment.status === 'pending' || assignment.status === 'active');

  // Available mentors (only load when no active assignment)
  const { data: availableRes, isLoading: loadingMentors } = useQuery({
    queryKey: ['available-mentors'],
    queryFn:  () => api.get<MentorProfile[]>('/mentor/available'),
    enabled:  !hasActive,
  });
  const mentors = availableRes?.data ?? [];

  // Mentor content feed (only when active)
  const { data: feedRes, isLoading: loadingFeed } = useQuery({
    queryKey: ['mentor-feed'],
    queryFn:  () => api.get<MentorFeed>('/mentor/my/feed'),
    enabled:  assignment?.status === 'active',
    staleTime: 1000 * 60 * 5,
  });
  const feed = feedRes?.data;

  // Mutations
  const requestMutation = useMutation({
    mutationFn: (mentor_id: string) =>
      api.post('/mentor/request', { mentor_id, message: requestMsg || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-mentor'] });
      setSelectedMentorId(null);
      setRequestMsg('');
    },
    onError: (err: any) => Alert.alert('خطأ', err?.message ?? 'تعذّر إرسال الطلب.'),
  });

  const endMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/mentor/${id}/end`, {}),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['my-mentor'] });
      qc.invalidateQueries({ queryKey: ['mentor-feed'] });
    },
    onError: () => Alert.alert('خطأ', 'تعذّر إنهاء العلاقة.'),
  });

  function confirmEnd() {
    Alert.alert('إنهاء علاقة الإرشاد', 'هل أنتِ متأكدة؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'إنهاء', style: 'destructive', onPress: () => endMutation.mutate(assignment!.id) },
    ]);
  }

  const mentorName = assignment?.mentor?.full_name ?? 'مرشدة';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {isDark && <StarField />}
      <ScreenHeader title="مرشدتي" showBack />
      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: TAB_BAR_HEIGHT + 80 }}>

        {/* Intro */}
        <Card style={{ backgroundColor: Colors.depth + '15', marginBottom: Spacing.lg }}>
          <Text style={[styles.introTitle, { color: Colors.depth }]}>برنامج الإرشاد 🌟</Text>
          <Text style={[styles.introText, { color: colors.textMuted }]}>
            اختاري مرشدة تثقين بها — ستتابع رحلتكِ وتنشر فعاليات وأنشطة كشفية خاصة بكِ.
          </Text>
        </Card>

        {loadingAssignment && (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.lg }} />
        )}

        {/* ── A: Active / Pending assignment ── */}
        {hasActive && assignment && (
          <>
            <Card style={{ borderColor: STATUS_COLOR[assignment.status], borderWidth: 2, marginBottom: Spacing.lg }}>
              <View style={styles.mentorRow}>
                <MentorAvatar name={mentorName} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.mentorName, { color: colors.text }]}>{mentorName}</Text>
                  {assignment.mentor?.country && (
                    <Text style={[styles.sub, { color: colors.textMuted }]}>{assignment.mentor.country}</Text>
                  )}
                  <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[assignment.status] + '20' }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLOR[assignment.status] }]}>
                      {STATUS_LABEL[assignment.status]}
                    </Text>
                  </View>
                </View>
              </View>

              {assignment.status === 'pending' && (
                <Text style={[styles.hint, { color: colors.textMuted }]}>
                  ⏳ بانتظار قبول المرشدة. ستصلكِ إشعار فور الموافقة.
                </Text>
              )}

              {assignment.status === 'active' && assignment.started_at && (
                <Text style={[styles.hint, { color: colors.textMuted }]}>
                  علاقة إرشاد نشطة منذ{' '}
                  {new Date(assignment.started_at).toLocaleDateString('ar-LB', { dateStyle: 'long' })}
                </Text>
              )}

              <Button
                label="إنهاء علاقة الإرشاد"
                variant="outline"
                onPress={confirmEnd}
                loading={endMutation.isPending}
                style={{ marginTop: Spacing.sm, borderColor: Colors.emergency }}
              />
            </Card>

            {/* ── Mentor feed (events + activities) ── */}
            {assignment.status === 'active' && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  محتوى مرشدتكِ 📋
                </Text>

                {loadingFeed && (
                  <ActivityIndicator color={Colors.primary} style={{ marginBottom: Spacing.md }} />
                )}

                {/* Events */}
                {(feed?.events?.length ?? 0) > 0 && (
                  <>
                    <Text style={[styles.subSection, { color: colors.textMuted }]}>الفعاليات</Text>
                    {feed!.events.map(ev => (
                      <Card key={ev.id} style={{ marginBottom: Spacing.sm }}>
                        <Text style={[styles.itemTitle, { color: colors.text }]}>{ev.title}</Text>
                        {ev.event_type && (
                          <Text style={[styles.badge, { color: Colors.depth, backgroundColor: Colors.depth + '15' }]}>
                            {EVENT_TYPE_LABEL[ev.event_type] ?? ev.event_type}
                          </Text>
                        )}
                        {ev.description && (
                          <Text style={[styles.itemDesc, { color: colors.textMuted }]} numberOfLines={2}>
                            {ev.description}
                          </Text>
                        )}
                        {ev.starts_at && (
                          <Text style={[styles.itemMeta, { color: colors.textMuted }]}>
                            📅 {new Date(ev.starts_at).toLocaleDateString('ar-LB', { dateStyle: 'medium' })}
                            {ev.is_virtual ? '  •  🌐 إلكترونية' : ''}
                          </Text>
                        )}
                        {ev.join_url && (
                          <Text style={[styles.itemMeta, { color: Colors.info }]} numberOfLines={1}>
                            🔗 {ev.join_url}
                          </Text>
                        )}
                      </Card>
                    ))}
                  </>
                )}

                {/* Activities */}
                {(feed?.activities?.length ?? 0) > 0 && (
                  <>
                    <Text style={[styles.subSection, { color: colors.textMuted }]}>الأنشطة الكشفية</Text>
                    {feed!.activities.map(act => (
                      <Card key={act.id} style={{ marginBottom: Spacing.sm }}>
                        <Text style={[styles.itemTitle, { color: colors.text }]}>{act.title}</Text>
                        <View style={{ flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap', marginTop: 4 }}>
                          {act.difficulty && (
                            <Text style={[styles.badge, { color: Colors.accent, backgroundColor: Colors.accent + '15' }]}>
                              {DIFFICULTY_LABEL[act.difficulty] ?? act.difficulty}
                            </Text>
                          )}
                          {act.estimated_minutes && (
                            <Text style={[styles.badge, { color: colors.textMuted, backgroundColor: colors.border }]}>
                              ⏱ {act.estimated_minutes} د
                            </Text>
                          )}
                          {act.is_offline_capable && (
                            <Text style={[styles.badge, { color: Colors.success, backgroundColor: Colors.success + '15' }]}>
                              ⬇ بدون إنترنت
                            </Text>
                          )}
                        </View>
                        {act.description && (
                          <Text style={[styles.itemDesc, { color: colors.textMuted }]} numberOfLines={2}>
                            {act.description}
                          </Text>
                        )}
                      </Card>
                    ))}
                  </>
                )}

                {!loadingFeed && (feed?.events?.length ?? 0) === 0 && (feed?.activities?.length ?? 0) === 0 && (
                  <Card>
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                      لم تنشر مرشدتكِ أي محتوى بعد. تابعي الإشعارات!
                    </Text>
                  </Card>
                )}
              </>
            )}
          </>
        )}

        {/* ── B: No active assignment — browse mentors ── */}
        {!hasActive && !loadingAssignment && (
          <>
            {assignment?.status === 'ended' && (
              <Card style={{ marginBottom: Spacing.md, borderColor: colors.border }}>
                <Text style={[styles.hint, { color: colors.textMuted }]}>
                  انتهت علاقة إرشادكِ السابقة. يمكنكِ اختيار مرشدة جديدة.
                </Text>
              </Card>
            )}

            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              المرشدات المتاحات ({mentors.length})
            </Text>

            {loadingMentors && <ActivityIndicator color={Colors.primary} />}

            {mentors.length === 0 && !loadingMentors && (
              <Card>
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  لا توجد مرشدات متاحات حالياً. نحن نعمل على إضافة المزيد قريباً!
                </Text>
              </Card>
            )}

            {mentors.map(m => {
              const name = m.full_name ?? 'مرشدة';
              const isSelected = selectedMentorId === m.id;
              return (
                <Card
                  key={m.id}
                  style={[
                    { marginBottom: Spacing.sm },
                    isSelected && { borderColor: Colors.primary, borderWidth: 2 },
                  ]}
                >
                  <View style={styles.mentorRow}>
                    <MentorAvatar name={name} size={48} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.mentorName, { color: colors.text }]}>{name}</Text>
                      {m.country && (
                        <Text style={[styles.sub, { color: colors.textMuted }]}>{m.country}</Text>
                      )}
                    </View>
                    <Pressable
                      style={({ pressed }) => [
                        styles.selectBtn,
                        isSelected
                          ? { backgroundColor: Colors.primary }
                          : { backgroundColor: Colors.primary + '18' },
                        pressed && { opacity: 0.75 },
                      ]}
                      onPress={() => setSelectedMentorId(isSelected ? null : m.id)}
                    >
                      <Text style={[styles.selectBtnText, { color: isSelected ? '#fff' : Colors.primary }]}>
                        {isSelected ? '✓ محددة' : 'اختيار'}
                      </Text>
                    </Pressable>
                  </View>

                  {/* Expand request form inline for the selected mentor */}
                  {isSelected && (
                    <View style={styles.requestForm}>
                      <TextInput
                        style={[styles.msgInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                        placeholder="رسالة اختيارية للمرشدة…"
                        placeholderTextColor={colors.textMuted}
                        value={requestMsg}
                        onChangeText={setRequestMsg}
                        multiline
                        numberOfLines={3}
                        textAlign="right"
                      />
                      <Button
                        label="إرسال طلب الإرشاد"
                        onPress={() => requestMutation.mutate(m.id)}
                        loading={requestMutation.isPending}
                      />
                    </View>
                  )}
                </Card>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1 },
  introTitle:   { fontSize: FontSize.lg, fontWeight: FontWeight.bold, textAlign: 'right', marginBottom: Spacing.xs },
  introText:    { fontSize: FontSize.sm, textAlign: 'right', lineHeight: 20 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, textAlign: 'right', marginBottom: Spacing.md },
  subSection:   { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, textAlign: 'right', marginBottom: Spacing.xs, marginTop: Spacing.sm },
  hint:         { fontSize: FontSize.sm, textAlign: 'right', lineHeight: 20, marginTop: Spacing.xs },
  emptyText:    { fontSize: FontSize.sm, textAlign: 'center', lineHeight: 22 },

  mentorRow:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.xs },
  avatarCircle: { backgroundColor: Colors.depth, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: '#fff', fontWeight: FontWeight.bold },
  mentorName:   { fontSize: FontSize.md, fontWeight: FontWeight.semibold, textAlign: 'right', marginBottom: 2 },
  sub:          { fontSize: FontSize.xs, textAlign: 'right' },
  statusBadge:  { alignSelf: 'flex-end', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.full, marginTop: 4 },
  statusText:   { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },

  selectBtn:     { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2, borderRadius: Radius.full },
  selectBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },

  requestForm: { marginTop: Spacing.sm, gap: Spacing.sm },
  msgInput: {
    borderWidth: 1.5,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    fontSize: FontSize.sm,
    minHeight: 72,
    textAlignVertical: 'top',
  },

  itemTitle:  { fontSize: FontSize.md, fontWeight: FontWeight.semibold, textAlign: 'right', marginBottom: 4 },
  itemDesc:   { fontSize: FontSize.sm, textAlign: 'right', marginTop: 4, lineHeight: 18 },
  itemMeta:   { fontSize: FontSize.xs, textAlign: 'right', marginTop: 4 },
  badge: {
    alignSelf: 'flex-start',
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
});
