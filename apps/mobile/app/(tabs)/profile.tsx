// ============================================================
// Profile & Settings Screen
// ============================================================
import { View, Text, ScrollView, StyleSheet, Pressable, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useColorScheme } from '../../hooks/useColorScheme';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';
import { Colors, Spacing, FontSize, FontWeight, TAB_BAR_HEIGHT } from '../../constants/theme';

const AGE_RANGE_LABELS: Record<string, string> = {
  '10-12': '١٠–١٢', '13-17': '١٣–١٧', '18-24': '١٨–٢٤', '25+': '٢٥+',
};

const ROLE_LABELS: Record<string, string> = {
  girl:                '🌸 فتاة',
  parent:              '👩‍👧 والدة / ولي أمر',
  mentor:              '⭐ مرشدة',
  content_admin:       '✏️ مديرة محتوى',
  community_moderator: '🛡️ مشرفة مجتمع',
  super_admin:         '👑 مديرة عامة',
};

const NOTIF_TYPE_LABELS: Record<string, string> = {
  sos_alert:      'تنبيهات الاستغاثة',
  period_reminder:'تذكير الدورة الشهرية',
  journey_alert:  'تنبيهات الرحلة',
  badge_earned:   'شاراتي المكتسبة',
  affirmation:    'عبارات تحفيزية يومية',
};

interface NotifPref { id: string; channel: string; notif_type: string; is_enabled: boolean }
interface UserBadge {
  id: string;
  earned_at: string;
  badge: { id: string; name: string; module: string; image_url?: string };
}

export default function ProfileScreen() {
  const { colors }  = useColorScheme();
  const { profile, supaUser, signOut } = useAuthStore();
  const qc          = useQueryClient();
  const router      = useRouter();

  const { data: notifsData } = useQuery({
    queryKey: ['notif-prefs'],
    queryFn:  () => api.get<NotifPref[]>('/users/me/notification-preferences'),
  });
  const notifs = notifsData?.data ?? [];

  const { data: badgesData } = useQuery({
    queryKey: ['my-badges'],
    queryFn:  () => api.get<UserBadge[]>('/users/me/badges'),
  });
  const badges = badgesData?.data ?? [];

  const signOutMutation = useMutation({
    mutationFn: signOut,
    onError: () => Alert.alert('خطأ', 'تعذّر تسجيل الخروج.'),
  });

  const togglePrefMutation = useMutation({
    mutationFn: ({ id, is_enabled }: { id: string; is_enabled: boolean }) =>
      api.patch(`/users/me/notification-preferences/${id}`, { is_enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notif-prefs'] }),
  });

  function confirmSignOut() {
    Alert.alert('تسجيل الخروج', 'هل تريدين الخروج من حسابكِ؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'خروج', style: 'destructive', onPress: () => signOutMutation.mutate() },
    ]);
  }

  const displayName = profile?.display_name
    ?? supaUser?.user_metadata?.['full_name']
    ?? supaUser?.email
    ?? 'نجمتنا';

  const avatarLetter = displayName[0]?.toUpperCase() ?? '★';

  // Group push notification prefs
  const pushNotifs = notifs.filter(n => n.channel === 'push');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScreenHeader title="حسابي" />
      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: TAB_BAR_HEIGHT + 80 }}>

        {/* Avatar + name */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: Colors.primary }]}>
            <Text style={styles.avatarLetter}>{avatarLetter}</Text>
          </View>
          <Text style={[styles.displayName, { color: colors.text }]}>{displayName}</Text>
          {profile?.age_range && (
            <Text style={[styles.meta, { color: colors.textMuted }]}>
              {AGE_RANGE_LABELS[profile.age_range] ?? profile.age_range} سنة
            </Text>
          )}
          {profile?.role && (
            <View style={[styles.roleBadge, { backgroundColor: Colors.primary + '20' }]}>
              <Text style={[styles.roleLabel, { color: Colors.primary }]}>
                {ROLE_LABELS[profile.role] ?? profile.role}
              </Text>
            </View>
          )}
        </View>

        {/* Badges */}
        {badges.length > 0 && (
          <>
            <Text style={[styles.section, { color: colors.text }]}>شاراتي ⭐</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.lg }}>
              {badges.map(ub => (
                <View key={ub.id} style={[styles.badgeCard, { backgroundColor: Colors.accent + '20' }]}>
                  <Text style={{ fontSize: 28 }}>
                    {ub.badge.module === 'scouts' ? '⭐' :
                     ub.badge.module === 'self_defence' ? '🥋' :
                     ub.badge.module === 'wellness' ? '💚' :
                     ub.badge.module === 'safety' ? '🛡️' : '🌸'}
                  </Text>
                  <Text style={[styles.badgeName, { color: colors.text }]} numberOfLines={2}>{ub.badge.name}</Text>
                  <Text style={[styles.badgeDate, { color: colors.textMuted }]}>
                    {new Date(ub.earned_at).toLocaleDateString('ar-LB', { month: 'short', year: 'numeric' })}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </>
        )}

        {/* Notification preferences */}
        {pushNotifs.length > 0 && (
          <>
            <Text style={[styles.section, { color: colors.text }]}>إشعاراتي 🔔</Text>
            <Card style={{ marginBottom: Spacing.md }}>
              {pushNotifs.map((n, idx) => (
                <View
                  key={n.id}
                  style={[styles.prefRow, idx < pushNotifs.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                >
                  <Switch
                    value={n.is_enabled}
                    trackColor={{ true: Colors.primary, false: colors.border }}
                    ios_backgroundColor={colors.border}
                    onValueChange={(val) => togglePrefMutation.mutate({ id: n.id, is_enabled: val })}
                  />
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text style={[styles.prefLabel, { color: colors.text }]}>
                      {NOTIF_TYPE_LABELS[n.notif_type] ?? n.notif_type}
                    </Text>
                    <Text style={[styles.prefSub, { color: colors.textMuted }]}>
                      {n.channel === 'push' ? 'إشعار' : n.channel === 'sms' ? 'رسالة نصية' : n.channel}
                    </Text>
                  </View>
                </View>
              ))}
            </Card>
          </>
        )}

        {/* Info rows */}
        <Text style={[styles.section, { color: colors.text }]}>معلومات الحساب</Text>
        <Card style={{ marginBottom: Spacing.lg }}>
          <InfoRow label="البريد الإلكتروني" value={supaUser?.email ?? '—'} colors={colors} />
          {profile?.safe_word && (
            <InfoRow label="الكلمة الآمنة" value={'•'.repeat(profile.safe_word.length)} colors={colors} />
          )}
          <InfoRow
            label="تاريخ الانضمام"
            value={profile?.created_at
              ? new Date(profile.created_at).toLocaleDateString('ar-LB', { dateStyle: 'long' })
              : '—'}
            colors={colors}
          />
        </Card>

        {/* Quick actions */}
        <Text style={[styles.section, { color: colors.text }]}>إجراءات سريعة</Text>
        <View style={styles.actionsGrid}>
          <Pressable
            style={[styles.actionBtn, { backgroundColor: Colors.primary + '15' }]}
            onPress={() => router.push('/(tabs)/safety/contacts' as any)}
          >
            <Text style={{ fontSize: 24 }}>📞</Text>
            <Text style={[styles.actionLabel, { color: Colors.primary }]}>جهات الطوارئ</Text>
          </Pressable>
          <Pressable
            style={[styles.actionBtn, { backgroundColor: Colors.depth + '15' }]}
            onPress={() => router.push('/(tabs)/community/mentor' as any)}
          >
            <Text style={{ fontSize: 24 }}>🌟</Text>
            <Text style={[styles.actionLabel, { color: Colors.depth }]}>مرشدتي</Text>
          </Pressable>
          <Pressable
            style={[styles.actionBtn, { backgroundColor: Colors.accent + '15' }]}
            onPress={() => router.push('/(tabs)/safety/scouts' as any)}
          >
            <Text style={{ fontSize: 24 }}>⭐</Text>
            <Text style={[styles.actionLabel, { color: Colors.accent }]}>برنامج الكشافة</Text>
          </Pressable>
        </View>

        {/* Sign out */}
        <Button
          label="تسجيل الخروج"
          variant="outline"
          onPress={confirmSignOut}
          loading={signOutMutation.isPending}
          style={{ borderColor: Colors.emergency, marginTop: Spacing.md }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1 },
  avatarSection: { alignItems: 'center', paddingVertical: Spacing.xl },
  avatar:        { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  avatarLetter:  { color: '#fff', fontSize: FontSize.h1, fontWeight: FontWeight.bold },
  displayName:   { fontSize: FontSize.xl, fontWeight: FontWeight.bold, marginBottom: 4 },
  meta:          { fontSize: FontSize.sm, marginBottom: Spacing.xs },
  roleBadge:     { paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: 20, marginTop: Spacing.xs },
  roleLabel:     { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  section:       { fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: Spacing.sm, textAlign: 'right' },
  // Badges
  badgeCard:     { alignItems: 'center', padding: Spacing.md, borderRadius: 14, width: 90, marginRight: Spacing.sm, gap: 4 },
  badgeName:     { fontSize: FontSize.xs, textAlign: 'center', fontWeight: FontWeight.semibold },
  badgeDate:     { fontSize: 10 },
  // Notification prefs
  prefRow:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  prefLabel:     { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  prefSub:       { fontSize: FontSize.xs, marginTop: 1 },
  // Account info
  infoRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  infoLabel:     { fontSize: FontSize.sm },
  infoValue:     { fontSize: FontSize.sm, fontWeight: FontWeight.medium, textAlign: 'right', flex: 1 },
  // Quick actions
  actionsGrid:   { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  actionBtn:     { flex: 1, alignItems: 'center', padding: Spacing.md, borderRadius: 14, gap: 6 },
  actionLabel:   { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, textAlign: 'center' },
});
