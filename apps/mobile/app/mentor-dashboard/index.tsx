// ============================================================
// Mentor Dashboard — only visible to users with role='mentor'
//
// Tabs:
//   1. Mentees       — pending + active girls, accept/end buttons
//   2. Post Content  — create event or scout activity
// ============================================================
import { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  Pressable, Alert, ActivityIndicator, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Card }         from '../../components/ui/Card';
import { Button }       from '../../components/ui/Button';
import { StarField }    from '../../components/home/StarField';
import { useColorScheme } from '../../hooks/useColorScheme';
import { api }          from '../../services/api';
import { Colors, Spacing, FontSize, FontWeight, Radius, TAB_BAR_HEIGHT } from '../../constants/theme';

// ── Types ─────────────────────────────────────────────────────
interface MenteeRow {
  id: string;
  status: 'pending' | 'active' | 'ended';
  started_at?: string;
  created_at: string;
  mentee: {
    id: string;
    full_name?: string;
    age_range?: string;
    country?: string;
  } | null;
}

type ActiveTab = 'mentees' | 'post';
type PostMode  = 'event' | 'activity';

const STATUS_COLOR: Record<string, string> = {
  pending: Colors.accent,
  active:  Colors.success,
  ended:   '#8A6070',
};
const STATUS_LABEL: Record<string, string> = {
  pending: 'في انتظار قبولكِ',
  active:  'نشطة',
  ended:   'منتهية',
};

// ── Mentee card ───────────────────────────────────────────────
function MenteeCard({
  row,
  onAccept,
  onEnd,
  loading,
}: {
  row: MenteeRow;
  onAccept: (id: string) => void;
  onEnd:    (id: string) => void;
  loading:  boolean;
}) {
  const { colors } = useColorScheme();
  const name = row.mentee?.full_name ?? 'طالبة';
  return (
    <Card style={{ marginBottom: Spacing.sm }}>
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>{name[0]?.toUpperCase() ?? '★'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.nameText, { color: colors.text }]}>{name}</Text>
          {row.mentee?.age_range && (
            <Text style={[styles.sub, { color: colors.textMuted }]}>{row.mentee.age_range}</Text>
          )}
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[row.status] + '20' }]}>
            <Text style={[styles.statusText, { color: STATUS_COLOR[row.status] }]}>
              {STATUS_LABEL[row.status]}
            </Text>
          </View>
        </View>
      </View>

      {row.status === 'pending' && (
        <View style={styles.actionRow}>
          <Button
            label="قبول"
            onPress={() => onAccept(row.id)}
            loading={loading}
            style={{ flex: 1 }}
          />
          <Button
            label="رفض"
            variant="outline"
            onPress={() => onEnd(row.id)}
            loading={loading}
            style={{ flex: 1, borderColor: Colors.emergency }}
          />
        </View>
      )}

      {row.status === 'active' && (
        <Button
          label="إنهاء الإرشاد"
          variant="outline"
          onPress={() => onEnd(row.id)}
          loading={loading}
          style={{ marginTop: Spacing.xs, borderColor: Colors.emergency }}
        />
      )}
    </Card>
  );
}

// ── Main component ────────────────────────────────────────────
export default function MentorDashboard() {
  const { isDark, colors } = useColorScheme();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<ActiveTab>('mentees');
  const [postMode, setPostMode]   = useState<PostMode>('event');

  // Event form state
  const [evTitle,      setEvTitle]      = useState('');
  const [evDesc,       setEvDesc]       = useState('');
  const [evType,       setEvType]       = useState('workshop');
  const [evStartsAt,   setEvStartsAt]   = useState('');
  const [evEndsAt,     setEvEndsAt]     = useState('');
  const [evLocation,   setEvLocation]   = useState('');
  const [evIsVirtual,  setEvIsVirtual]  = useState(false);
  const [evJoinUrl,    setEvJoinUrl]    = useState('');

  // Activity form state
  const [actTitle,     setActTitle]     = useState('');
  const [actDesc,      setActDesc]      = useState('');
  const [actDiff,      setActDiff]      = useState<'beginner'|'intermediate'|'advanced'>('beginner');
  const [actMinutes,   setActMinutes]   = useState('');
  const [actOffline,   setActOffline]   = useState(false);

  // Data
  const { data: menteesRes, isLoading: loadingMentees } = useQuery({
    queryKey: ['mentor-mentees'],
    queryFn:  () => api.get<MenteeRow[]>('/mentor/mentees'),
  });
  const mentees = menteesRes?.data ?? [];

  // Mutations
  const acceptMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/mentor/${id}/accept`, {}),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['mentor-mentees'] }),
    onError:    () => Alert.alert('خطأ', 'تعذّر قبول الطلب.'),
  });

  const endMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/mentor/${id}/end`, {}),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['mentor-mentees'] }),
    onError:    () => Alert.alert('خطأ', 'تعذّر إنهاء العلاقة.'),
  });

  const createEventMutation = useMutation({
    mutationFn: () => api.post('/mentor/events', {
      title:      evTitle,
      description:evDesc || undefined,
      event_type: evType,
      starts_at:  new Date(evStartsAt).toISOString(),
      ...(evEndsAt   ? { ends_at:   new Date(evEndsAt).toISOString() } : {}),
      ...(evLocation ? { location:  evLocation }  : {}),
      is_virtual: evIsVirtual,
      ...(evJoinUrl  ? { join_url:  evJoinUrl }   : {}),
    }),
    onSuccess: () => {
      Alert.alert('تم', 'تمّ نشر الفعالية!');
      setEvTitle(''); setEvDesc(''); setEvStartsAt(''); setEvEndsAt('');
      setEvLocation(''); setEvJoinUrl(''); setEvIsVirtual(false);
    },
    onError: (err: any) => Alert.alert('خطأ', err?.message ?? 'تعذّر إنشاء الفعالية.'),
  });

  const createActivityMutation = useMutation({
    mutationFn: () => api.post('/mentor/activities', {
      title:              actTitle,
      description:        actDesc || undefined,
      difficulty:         actDiff,
      estimated_minutes:  actMinutes ? parseInt(actMinutes, 10) : undefined,
      is_offline_capable: actOffline,
    }),
    onSuccess: () => {
      Alert.alert('تم', 'تمّ نشر النشاط!');
      setActTitle(''); setActDesc(''); setActMinutes(''); setActOffline(false);
    },
    onError: (err: any) => Alert.alert('خطأ', err?.message ?? 'تعذّر إنشاء النشاط.'),
  });

  const activeMutLoading = acceptMutation.isPending || endMutation.isPending;

  const pending = mentees.filter(m => m.status === 'pending');
  const active  = mentees.filter(m => m.status === 'active');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {isDark && <StarField />}
      <ScreenHeader
        title="لوحة المرشدة"
        showBack
        onBack={() => router.back()}
      />

      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {(['mentees', 'post'] as ActiveTab[]).map(tab => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && { borderBottomColor: Colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabLabel, { color: activeTab === tab ? Colors.primary : colors.textMuted }]}>
              {tab === 'mentees' ? `المتدربات (${active.length + pending.length})` : 'نشر محتوى'}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: TAB_BAR_HEIGHT + 80 }}>

        {/* ── Mentees tab ── */}
        {activeTab === 'mentees' && (
          <>
            {loadingMentees && <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.lg }} />}

            {pending.length > 0 && (
              <>
                <Text style={[styles.section, { color: Colors.accent }]}>طلبات جديدة ({pending.length})</Text>
                {pending.map(row => (
                  <MenteeCard
                    key={row.id}
                    row={row}
                    onAccept={id => acceptMutation.mutate(id)}
                    onEnd={id => {
                      Alert.alert('رفض الطلب', 'هل أنتِ متأكدة؟', [
                        { text: 'إلغاء', style: 'cancel' },
                        { text: 'رفض', style: 'destructive', onPress: () => endMutation.mutate(id) },
                      ]);
                    }}
                    loading={activeMutLoading}
                  />
                ))}
              </>
            )}

            {active.length > 0 && (
              <>
                <Text style={[styles.section, { color: Colors.success }]}>متدربات نشطات ({active.length})</Text>
                {active.map(row => (
                  <MenteeCard
                    key={row.id}
                    row={row}
                    onAccept={() => {}}
                    onEnd={id => {
                      Alert.alert('إنهاء الإرشاد', 'هل أنتِ متأكدة من إنهاء علاقة الإرشاد مع هذه المتدربة؟', [
                        { text: 'إلغاء', style: 'cancel' },
                        { text: 'إنهاء', style: 'destructive', onPress: () => endMutation.mutate(id) },
                      ]);
                    }}
                    loading={activeMutLoading}
                  />
                ))}
              </>
            )}

            {!loadingMentees && mentees.filter(m => m.status !== 'ended').length === 0 && (
              <Card>
                <Text style={[styles.empty, { color: colors.textMuted }]}>
                  لا توجد طلبات أو متدربات بعد. شارك ملفكِ الشخصي ليجدكِ الأخريات!
                </Text>
              </Card>
            )}
          </>
        )}

        {/* ── Post tab ── */}
        {activeTab === 'post' && (
          <>
            {/* Mode switcher */}
            <View style={[styles.modeSwitcher, { backgroundColor: colors.border }]}>
              {(['event', 'activity'] as PostMode[]).map(m => (
                <Pressable
                  key={m}
                  style={[
                    styles.modeBtn,
                    postMode === m && { backgroundColor: Colors.primary },
                  ]}
                  onPress={() => setPostMode(m)}
                >
                  <Text style={[styles.modeBtnText, { color: postMode === m ? '#fff' : colors.textMuted }]}>
                    {m === 'event' ? '📅 فعالية' : '⭐ نشاط كشفي'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* ── Event form ── */}
            {postMode === 'event' && (
              <Card style={{ gap: Spacing.sm }}>
                <Text style={[styles.formLabel, { color: colors.text }]}>عنوان الفعالية *</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                  value={evTitle}
                  onChangeText={setEvTitle}
                  placeholder="مثال: ورشة الدفاع عن النفس"
                  placeholderTextColor={colors.textMuted}
                  textAlign="right"
                />

                <Text style={[styles.formLabel, { color: colors.text }]}>الوصف</Text>
                <TextInput
                  style={[styles.input, styles.multiline, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                  value={evDesc}
                  onChangeText={setEvDesc}
                  placeholder="تفاصيل الفعالية…"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  textAlign="right"
                />

                <Text style={[styles.formLabel, { color: colors.text }]}>نوع الفعالية</Text>
                <View style={styles.typeRow}>
                  {['workshop','webinar','meetup','troop_meeting','community_service'].map(t => (
                    <Pressable
                      key={t}
                      onPress={() => setEvType(t)}
                      style={[
                        styles.typeChip,
                        { borderColor: evType === t ? Colors.primary : colors.border },
                        evType === t && { backgroundColor: Colors.primary + '18' },
                      ]}
                    >
                      <Text style={[styles.typeChipText, { color: evType === t ? Colors.primary : colors.textMuted }]}>
                        {t === 'workshop' ? 'ورشة' : t === 'webinar' ? 'ندوة' : t === 'meetup' ? 'لقاء' : t === 'troop_meeting' ? 'فرقة' : 'مجتمع'}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={[styles.formLabel, { color: colors.text }]}>تاريخ البدء (YYYY-MM-DDTHH:MM) *</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                  value={evStartsAt}
                  onChangeText={setEvStartsAt}
                  placeholder="2026-07-15T18:00"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="default"
                  textAlign="right"
                />

                <Text style={[styles.formLabel, { color: colors.text }]}>تاريخ الانتهاء (اختياري)</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                  value={evEndsAt}
                  onChangeText={setEvEndsAt}
                  placeholder="2026-07-15T20:00"
                  placeholderTextColor={colors.textMuted}
                  textAlign="right"
                />

                <View style={styles.switchRow}>
                  <Text style={[styles.formLabel, { color: colors.text, flex: 1 }]}>فعالية إلكترونية؟</Text>
                  <Switch
                    value={evIsVirtual}
                    onValueChange={setEvIsVirtual}
                    thumbColor={evIsVirtual ? Colors.primary : '#ccc'}
                    trackColor={{ true: Colors.primary + '60', false: '#ccc' }}
                  />
                </View>

                {evIsVirtual && (
                  <>
                    <Text style={[styles.formLabel, { color: colors.text }]}>رابط الانضمام</Text>
                    <TextInput
                      style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                      value={evJoinUrl}
                      onChangeText={setEvJoinUrl}
                      placeholder="https://meet.example.com/..."
                      placeholderTextColor={colors.textMuted}
                      keyboardType="url"
                      textAlign="right"
                      autoCapitalize="none"
                    />
                  </>
                )}

                {!evIsVirtual && (
                  <>
                    <Text style={[styles.formLabel, { color: colors.text }]}>الموقع</Text>
                    <TextInput
                      style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                      value={evLocation}
                      onChangeText={setEvLocation}
                      placeholder="بيروت — نادي الشباب"
                      placeholderTextColor={colors.textMuted}
                      textAlign="right"
                    />
                  </>
                )}

                <Button
                  label="نشر الفعالية"
                  onPress={() => {
                    if (!evTitle.trim() || !evStartsAt.trim()) {
                      Alert.alert('تنبيه', 'يرجى تعبئة العنوان والتاريخ.'); return;
                    }
                    createEventMutation.mutate();
                  }}
                  loading={createEventMutation.isPending}
                />
              </Card>
            )}

            {/* ── Activity form ── */}
            {postMode === 'activity' && (
              <Card style={{ gap: Spacing.sm }}>
                <Text style={[styles.formLabel, { color: colors.text }]}>عنوان النشاط *</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                  value={actTitle}
                  onChangeText={setActTitle}
                  placeholder="مثال: إسعافات أولية للمبتدئات"
                  placeholderTextColor={colors.textMuted}
                  textAlign="right"
                />

                <Text style={[styles.formLabel, { color: colors.text }]}>الوصف</Text>
                <TextInput
                  style={[styles.input, styles.multiline, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                  value={actDesc}
                  onChangeText={setActDesc}
                  placeholder="تفاصيل النشاط…"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  textAlign="right"
                />

                <Text style={[styles.formLabel, { color: colors.text }]}>المستوى</Text>
                <View style={styles.typeRow}>
                  {(['beginner','intermediate','advanced'] as const).map(d => (
                    <Pressable
                      key={d}
                      onPress={() => setActDiff(d)}
                      style={[
                        styles.typeChip,
                        { borderColor: actDiff === d ? Colors.depth : colors.border },
                        actDiff === d && { backgroundColor: Colors.depth + '18' },
                      ]}
                    >
                      <Text style={[styles.typeChipText, { color: actDiff === d ? Colors.depth : colors.textMuted }]}>
                        {d === 'beginner' ? 'مبتدئة' : d === 'intermediate' ? 'متوسطة' : 'متقدمة'}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={[styles.formLabel, { color: colors.text }]}>المدة بالدقائق (اختياري)</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                  value={actMinutes}
                  onChangeText={setActMinutes}
                  placeholder="30"
                  keyboardType="numeric"
                  textAlign="right"
                />

                <View style={styles.switchRow}>
                  <Text style={[styles.formLabel, { color: colors.text, flex: 1 }]}>يعمل بدون إنترنت؟</Text>
                  <Switch
                    value={actOffline}
                    onValueChange={setActOffline}
                    thumbColor={actOffline ? Colors.success : '#ccc'}
                    trackColor={{ true: Colors.success + '60', false: '#ccc' }}
                  />
                </View>

                <Button
                  label="نشر النشاط"
                  onPress={() => {
                    if (!actTitle.trim()) {
                      Alert.alert('تنبيه', 'يرجى تعبئة عنوان النشاط.'); return;
                    }
                    createActivityMutation.mutate();
                  }}
                  loading={createActivityMutation.isPending}
                />
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1 },
  tabBar:     { flexDirection: 'row', borderBottomWidth: 1 },
  tab:        { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm },
  tabLabel:   { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  section:    { fontSize: FontSize.md, fontWeight: FontWeight.bold, textAlign: 'right', marginBottom: Spacing.sm, marginTop: Spacing.md },
  empty:      { textAlign: 'center', lineHeight: 22 },

  row:        { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.xs },
  avatar:     { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.depth, alignItems: 'center', justifyContent: 'center' },
  avatarLetter:{ color: '#fff', fontSize: 18, fontWeight: FontWeight.bold },
  nameText:   { fontSize: FontSize.md, fontWeight: FontWeight.semibold, textAlign: 'right' },
  sub:        { fontSize: FontSize.xs, textAlign: 'right' },
  statusBadge:{ alignSelf: 'flex-end', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.full, marginTop: 4 },
  statusText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  actionRow:  { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },

  modeSwitcher: { flexDirection: 'row', borderRadius: Radius.full, padding: 3, marginBottom: Spacing.lg },
  modeBtn:      { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.full, alignItems: 'center' },
  modeBtnText:  { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },

  formLabel:  { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, textAlign: 'right' },
  input: {
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
    fontSize: FontSize.sm,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  switchRow:  { flexDirection: 'row', alignItems: 'center' },
  typeRow:    { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  typeChip:   { borderWidth: 1.5, borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  typeChipText:{ fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
});
