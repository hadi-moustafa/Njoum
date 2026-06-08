// ============================================================
// Profile & Settings Screen
// • Loads signed-in user data directly from Supabase
// • Reset password (email/password accounts)
// • Dark / Light / System theme switcher
// • Arabic / English language switcher
// ============================================================
import { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  Alert, TextInput, ActivityIndicator,
  I18nManager,
} from 'react-native';
import { SafeAreaView }   from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter }      from 'expo-router';
import { supabase }       from '../../services/supabase';
import { useSignupStore } from '../../store/signupStore';
import { useColorScheme } from '../../hooks/useColorScheme';
import { useAppStore }    from '../../store/appStore';
import {
  Colors, Spacing, FontSize, FontWeight, Radius, Shadow, TAB_BAR_HEIGHT,
} from '../../constants/theme';
import type { Theme, Language } from '../../store/appStore';

// ── Translations ─────────────────────────────────────────────
const T = {
  ar: {
    title:           'حسابي',
    account:         'معلومات الحساب',
    email:           'البريد الإلكتروني',
    country:         'البلد',
    joined:          'تاريخ الانضمام',
    safeWord:        'الكلمة الآمنة (محمية)',
    badges:          'شاراتي',
    settings:        'إعدادات التطبيق',
    appearance:      'المظهر',
    light:           'فاتح',
    dark:            'داكن',
    system:          'تلقائي',
    language:        'اللغة',
    changePassword:  'تغيير كلمة المرور',
    newPwd:          'كلمة المرور الجديدة',
    confirmPwd:      'تأكيد كلمة المرور الجديدة',
    minChars:        '٨ أحرف على الأقل',
    save:            'حفظ',
    cancel:          'إلغاء',
    pwdMin:          'كلمة المرور يجب أن تكون ٨ أحرف على الأقل',
    pwdMismatch:     'كلمتا المرور غير متطابقتين',
    pwdSuccess:      'تم تغيير كلمة المرور بنجاح ✓',
    quickActions:    'إجراءات سريعة',
    contacts:        'جهات الطوارئ',
    mentor:          'مرشدتي',
    scouts:          'الكشافة',
    signOut:         'تسجيل الخروج',
    signOutTitle:    'تسجيل الخروج',
    signOutMsg:      'هل تريدين الخروج من حسابكِ؟',
    signOutYes:      'خروج',
    signOutNo:       'إلغاء',
    notSet:          'غير محدد',
    loading:         'جارٍ التحميل...',
    rtlNote:         'أعيدي تشغيل التطبيق لتطبيق اتجاه اللغة بالكامل',
    ageRange:        'الفئة العمرية',
    role:            'الدور',
  },
  en: {
    title:           'My Profile',
    account:         'Account Info',
    email:           'Email',
    country:         'Country',
    joined:          'Joined',
    safeWord:        'Safe Word (hidden)',
    badges:          'My Badges',
    settings:        'App Settings',
    appearance:      'Appearance',
    light:           'Light',
    dark:            'Dark',
    system:          'System',
    language:        'Language',
    changePassword:  'Change Password',
    newPwd:          'New Password',
    confirmPwd:      'Confirm New Password',
    minChars:        'At least 8 characters',
    save:            'Save',
    cancel:          'Cancel',
    pwdMin:          'Password must be at least 8 characters',
    pwdMismatch:     'Passwords do not match',
    pwdSuccess:      'Password changed successfully ✓',
    quickActions:    'Quick Actions',
    contacts:        'Emergency Contacts',
    mentor:          'My Mentor',
    scouts:          'Scouts',
    signOut:         'Sign Out',
    signOutTitle:    'Sign Out',
    signOutMsg:      'Are you sure you want to sign out?',
    signOutYes:      'Sign Out',
    signOutNo:       'Cancel',
    notSet:          'Not set',
    loading:         'Loading...',
    rtlNote:         'Restart the app to fully apply the layout direction',
    ageRange:        'Age Range',
    role:            'Role',
  },
} as const;

// ── Role / age labels ─────────────────────────────────────────
const ROLE_LABELS: Record<string, { ar: string; en: string; emoji: string }> = {
  girl:                { ar: 'فتاة / امرأة',    en: 'Girl / Woman',     emoji: '👧' },
  parent:              { ar: 'والد / والدة',      en: 'Parent/Guardian',  emoji: '👩‍👧' },
  mentor:              { ar: 'مرشدة',             en: 'Mentor',           emoji: '🤝' },
  content_admin:       { ar: 'مديرة محتوى',       en: 'Content Admin',    emoji: '✏️' },
  community_moderator: { ar: 'مشرفة مجتمع',       en: 'Moderator',        emoji: '🛡️' },
  super_admin:         { ar: 'مديرة عامة',        en: 'Super Admin',      emoji: '👑' },
};

const BADGE_MODULE_EMOJI: Record<string, string> = {
  scouts:       '⭐',
  self_defence: '🥋',
  wellness:     '💚',
  safety:       '🛡️',
  community:    '🌸',
};

// ── Profile data loader ───────────────────────────────────────
async function fetchProfileData() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from('users')
    .select('full_name, role, age_range, country, safe_word, created_at')
    .eq('id', user.id)
    .maybeSingle();
  return { user, profile };
}

// ── Component ─────────────────────────────────────────────────
export default function ProfileScreen() {
  const router         = useRouter();
  const queryClient    = useQueryClient();
  const { isDark, colors } = useColorScheme();
  const { theme, language, setTheme, setLanguage } = useAppStore();
  const t = T[language];
  const isRTL = language === 'ar';

  // Profile query
  const { data, isLoading, refetch } = useQuery({
    queryKey:  ['profile'],
    queryFn:   fetchProfileData,
    staleTime: 1000 * 60 * 5,
  });

  // Badges query
  const { data: badgesData } = useQuery({
    queryKey: ['my-badges'],
    queryFn:  async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from('user_badges')
        .select('id, earned_at, badge:badges(id, name, module)')
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false })
        .limit(10);
      return data ?? [];
    },
    staleTime: 1000 * 60 * 10,
  });
  const badges = (badgesData ?? []) as any[];

  // Password reset state
  const [showReset,   setShowReset]   = useState(false);
  const [newPwd,      setNewPwd]      = useState('');
  const [confirmPwd,  setConfirmPwd]  = useState('');
  const [showNewPwd,  setShowNewPwd]  = useState(false);
  const [pwdError,    setPwdError]    = useState('');
  const [pwdSuccess,  setPwdSuccess]  = useState(false);
  const [pwdLoading,  setPwdLoading]  = useState(false);

  // Sign-out
  const [signingOut, setSigningOut] = useState(false);

  const { user, profile } = data ?? {};

  const displayName = profile?.full_name
    ?? user?.user_metadata?.full_name
    ?? user?.email?.split('@')[0]
    ?? '—';

  const avatarLetter = (displayName[0] ?? '★').toUpperCase();
  const roleInfo = ROLE_LABELS[profile?.role ?? 'girl'];

  // ── Handlers ─────────────────────────────────────────────────
  const handleTheme = (t: Theme) => setTheme(t);

  const handleLanguage = (lang: Language) => {
    setLanguage(lang);
    // Apply RTL toggle immediately for text; full layout requires restart
    I18nManager.allowRTL(lang === 'ar');
    // We don't force-reload to avoid disrupting development flow
    // Show a brief note instead (rendered in settings section)
  };

  const handleResetPassword = async () => {
    setPwdError('');
    if (newPwd.length < 8)    { setPwdError(t.pwdMin);       return; }
    if (newPwd !== confirmPwd) { setPwdError(t.pwdMismatch);  return; }
    setPwdLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    setPwdLoading(false);
    if (error) {
      setPwdError(error.message);
    } else {
      setPwdSuccess(true);
      setNewPwd('');
      setConfirmPwd('');
      setShowReset(false);
      setTimeout(() => setPwdSuccess(false), 4000);
    }
  };

  const confirmSignOut = () => {
    Alert.alert(t.signOutTitle, t.signOutMsg, [
      { text: t.signOutNo, style: 'cancel' },
      {
        text: t.signOutYes, style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          // 1. Clear all cached queries so stale data doesn't leak to next user
          queryClient.clear();
          // 2. Clear any pending signup data
          useSignupStore.getState().clear();
          // 3. Sign out — removes session from AsyncStorage and invalidates refresh token
          await supabase.auth.signOut({ scope: 'local' });
          // tabs _layout onAuthStateChange fires SIGNED_OUT and redirects to sign-in
        },
      },
    ]);
  };

  // ── Reusable sub-components ───────────────────────────────────
  const SectionTitle = ({ children }: { children: string }) => (
    <Text style={[styles.sectionTitle, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
      {children}
    </Text>
  );

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.infoValue, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
        {value || t.notSet}
      </Text>
      <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );

  // ── Render ────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>{t.loading}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: TAB_BAR_HEIGHT + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar & Identity ── */}
        <View style={styles.heroSection}>
          <View style={[styles.avatar, Shadow.lg]}>
            <Text style={styles.avatarLetter}>{avatarLetter}</Text>
          </View>
          <Text style={[styles.displayName, { color: colors.text }]}>{displayName}</Text>
          {profile?.age_range && (
            <Text style={[styles.metaText, { color: colors.textMuted }]}>
              {profile.age_range} {isRTL ? 'سنة' : 'yrs'}
            </Text>
          )}
          {roleInfo && (
            <View style={styles.rolePill}>
              <Text style={styles.rolePillText}>
                {roleInfo.emoji}  {isRTL ? roleInfo.ar : roleInfo.en}
              </Text>
            </View>
          )}
        </View>

        {/* ── Badges ── */}
        {badges.length > 0 && (
          <>
            <SectionTitle>{t.badges} ⭐</SectionTitle>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: Spacing.lg }}
              contentContainerStyle={{ gap: Spacing.sm, paddingHorizontal: 2 }}
            >
              {badges.map((ub: any) => (
                <View key={ub.id} style={[styles.badgeCard, { backgroundColor: colors.surface }]}>
                  <Text style={{ fontSize: 28 }}>
                    {BADGE_MODULE_EMOJI[ub.badge?.module ?? ''] ?? '🌸'}
                  </Text>
                  <Text style={[styles.badgeName, { color: colors.text }]} numberOfLines={2}>
                    {ub.badge?.name}
                  </Text>
                  <Text style={[styles.badgeDate, { color: colors.textMuted }]}>
                    {new Date(ub.earned_at).toLocaleDateString(isRTL ? 'ar-LB' : 'en-GB', { month: 'short', year: 'numeric' })}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </>
        )}

        {/* ── Account Info ── */}
        <SectionTitle>{t.account}</SectionTitle>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <InfoRow label={t.email}   value={user?.email ?? '—'} />
          <InfoRow label={t.country} value={profile?.country ?? ''} />
          <InfoRow label={t.ageRange} value={profile?.age_range ?? ''} />
          {profile?.safe_word && (
            <InfoRow label={t.safeWord} value={'•'.repeat(profile.safe_word.length)} />
          )}
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={[styles.infoValue, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString(isRTL ? 'ar-LB' : 'en-GB', { dateStyle: 'long' })
                : '—'}
            </Text>
            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{t.joined}</Text>
          </View>
        </View>

        {/* ── App Settings ── */}
        <SectionTitle>{t.settings}</SectionTitle>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>

          {/* Theme */}
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>{t.appearance}</Text>
            <View style={[styles.segmented, { backgroundColor: colors.background }]}>
              {(['light', 'system', 'dark'] as Theme[]).map(opt => (
                <Pressable
                  key={opt}
                  style={[
                    styles.segment,
                    theme === opt && { backgroundColor: Colors.primary },
                  ]}
                  onPress={() => handleTheme(opt)}
                >
                  <Text style={[
                    styles.segmentText,
                    { color: theme === opt ? '#fff' : colors.textMuted },
                  ]}>
                    {opt === 'light'  ? (isRTL ? t.light  : 'Light')  :
                     opt === 'dark'   ? (isRTL ? t.dark   : 'Dark')   :
                                        (isRTL ? t.system : 'System')}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Language */}
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>{t.language}</Text>
            <View style={[styles.segmented, { backgroundColor: colors.background }]}>
              {(['ar', 'en'] as Language[]).map(opt => (
                <Pressable
                  key={opt}
                  style={[
                    styles.segment,
                    language === opt && { backgroundColor: Colors.primary },
                  ]}
                  onPress={() => handleLanguage(opt)}
                >
                  <Text style={[
                    styles.segmentText,
                    { color: language === opt ? '#fff' : colors.textMuted },
                  ]}>
                    {opt === 'ar' ? 'عربي' : 'English'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          <Text style={[styles.settingNote, { color: colors.textMuted }]}>
            {t.rtlNote}
          </Text>
        </View>

        {/* ── Change Password ── */}
        <SectionTitle>{t.changePassword}</SectionTitle>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {pwdSuccess && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>{t.pwdSuccess}</Text>
            </View>
          )}

          <Pressable
            style={styles.pwdToggleRow}
            onPress={() => { setShowReset(v => !v); setPwdError(''); }}
          >
            <Text style={[styles.pwdToggleIcon, { transform: [{ rotate: showReset ? '90deg' : '0deg' }] }]}>
              ›
            </Text>
            <Text style={[styles.pwdToggleLabel, { color: Colors.primary }]}>
              {showReset ? t.cancel : t.changePassword}
            </Text>
          </Pressable>

          {showReset && (
            <View style={styles.pwdForm}>
              {/* New password */}
              <View style={styles.pwdField}>
                <Text style={[styles.pwdLabel, { color: colors.text }]}>{t.newPwd}</Text>
                <View style={styles.pwdInputRow}>
                  <TextInput
                    style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                    value={newPwd}
                    onChangeText={setNewPwd}
                    secureTextEntry={!showNewPwd}
                    placeholder={t.minChars}
                    placeholderTextColor={colors.textMuted}
                    textAlign={isRTL ? 'right' : 'left'}
                    autoCapitalize="none"
                  />
                  <Pressable style={styles.eyeBtn} onPress={() => setShowNewPwd(v => !v)}>
                    <Text style={{ fontSize: 18 }}>{showNewPwd ? '🙈' : '👁'}</Text>
                  </Pressable>
                </View>
              </View>

              {/* Confirm password */}
              <View style={styles.pwdField}>
                <Text style={[styles.pwdLabel, { color: colors.text }]}>{t.confirmPwd}</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                  value={confirmPwd}
                  onChangeText={setConfirmPwd}
                  secureTextEntry={!showNewPwd}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  textAlign={isRTL ? 'right' : 'left'}
                  autoCapitalize="none"
                />
              </View>

              {!!pwdError && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{pwdError}</Text>
                </View>
              )}

              <Pressable
                style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]}
                onPress={handleResetPassword}
                disabled={pwdLoading}
              >
                {pwdLoading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.saveBtnText}>{t.save}</Text>
                }
              </Pressable>
            </View>
          )}
        </View>

        {/* ── Quick Actions ── */}
        <SectionTitle>{t.quickActions}</SectionTitle>
        <View style={styles.actionsGrid}>
          {[
            { emoji: '📞', label: t.contacts, route: '/safety/contacts',    color: Colors.emergency },
            { emoji: '🌟', label: t.mentor,   route: '/community/mentor',   color: Colors.depth },
            { emoji: '⭐', label: t.scouts,   route: '/safety/scouts',      color: Colors.accent },
          ].map(a => (
            <Pressable
              key={a.route}
              style={({ pressed }) => [
                styles.actionBtn,
                { backgroundColor: a.color + '18' },
                pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
              ]}
              onPress={() => router.push(a.route as any)}
            >
              <Text style={{ fontSize: 26 }}>{a.emoji}</Text>
              <Text style={[styles.actionLabel, { color: a.color }]}>{a.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* ── Sign Out ── */}
        <Pressable
          style={({ pressed }) => [styles.signOutBtn, pressed && { opacity: 0.85 }]}
          onPress={confirmSignOut}
          disabled={signingOut}
        >
          {signingOut
            ? <ActivityIndicator color={Colors.emergency} size="small" />
            : <Text style={styles.signOutText}>{t.signOut}</Text>
          }
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { padding: Spacing.md },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loadingText: { fontSize: FontSize.sm },

  // Hero
  heroSection: {
    alignItems:    'center',
    paddingVertical: Spacing.xl,
    gap:           Spacing.sm,
  },
  avatar: {
    width:           88,
    height:          88,
    borderRadius:    Radius.full,
    backgroundColor: Colors.primary,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    Spacing.xs,
  },
  avatarLetter: {
    color:      '#fff',
    fontSize:   FontSize.h1,
    fontWeight: FontWeight.extrabold,
  },
  displayName: {
    fontSize:   FontSize.xl,
    fontWeight: FontWeight.bold,
    textAlign:  'center',
  },
  metaText: { fontSize: FontSize.sm },
  rolePill: {
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.xs,
    borderRadius:      Radius.full,
    backgroundColor:   Colors.primary + '20',
    marginTop:         Spacing.xs,
  },
  rolePillText: {
    fontSize:   FontSize.sm,
    fontWeight: FontWeight.semibold,
    color:      Colors.primary,
  },

  // Section title
  sectionTitle: {
    fontSize:    FontSize.md,
    fontWeight:  FontWeight.bold,
    marginBottom: Spacing.sm,
    marginTop:   Spacing.xs,
  },

  // Card
  card: {
    borderRadius:  Radius.lg,
    marginBottom:  Spacing.md,
    overflow:      'hidden',
    ...Shadow.sm,
  },

  // Info rows
  infoRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoLabel: { fontSize: FontSize.sm, minWidth: 100, textAlign: 'right' },
  infoValue: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, flex: 1 },

  // Settings
  settingRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    padding:        Spacing.md,
    gap:            Spacing.sm,
  },
  settingLabel: {
    fontSize:   FontSize.sm,
    fontWeight: FontWeight.semibold,
    flexShrink: 0,
  },
  settingNote: {
    fontSize:     FontSize.xs,
    textAlign:    'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    lineHeight:   18,
  },
  segmented: {
    flexDirection: 'row',
    borderRadius:  Radius.md,
    padding:       3,
    gap:           2,
  },
  segment: {
    paddingVertical:   Spacing.xs + 2,
    paddingHorizontal: Spacing.sm + 2,
    borderRadius:      Radius.sm,
  },
  segmentText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },

  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: Spacing.md },

  // Password
  pwdToggleRow: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            Spacing.sm,
    padding:        Spacing.md,
  },
  pwdToggleIcon:  { fontSize: FontSize.xl, color: Colors.primary, fontWeight: FontWeight.bold },
  pwdToggleLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  pwdForm: {
    padding:    Spacing.md,
    paddingTop: 0,
    gap:        Spacing.sm,
  },
  pwdField: { gap: 4 },
  pwdLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  pwdInputRow: { flexDirection: 'row', alignItems: 'center' },
  input: {
    flex:              1,
    borderWidth:       1.5,
    borderRadius:      Radius.md,
    paddingVertical:   Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    fontSize:          FontSize.md,
  },
  eyeBtn: {
    position:    'absolute',
    left:        Spacing.sm,
    top: 0, bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
  },
  errorBox: {
    backgroundColor: '#FFF0F0',
    borderRadius:    Radius.sm,
    padding:         Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.emergency,
  },
  errorText: { fontSize: FontSize.sm, color: Colors.emergency },
  successBox: {
    backgroundColor: '#EEFFF4',
    borderRadius:    Radius.sm,
    padding:         Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.success,
    marginHorizontal: Spacing.md,
    marginTop:        Spacing.sm,
  },
  successText: { fontSize: FontSize.sm, color: Colors.success, fontWeight: FontWeight.medium },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius:    Radius.md,
    paddingVertical: Spacing.sm + 4,
    alignItems:      'center',
    justifyContent:  'center',
    minHeight:       44,
    ...Shadow.sm,
  },
  saveBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.bold },

  // Badges
  badgeCard: {
    alignItems:    'center',
    padding:       Spacing.md,
    borderRadius:  Radius.lg,
    width:         88,
    gap:           4,
    ...Shadow.sm,
  },
  badgeName: { fontSize: FontSize.xs, textAlign: 'center', fontWeight: FontWeight.semibold },
  badgeDate: { fontSize: 10 },

  // Quick actions
  actionsGrid: {
    flexDirection: 'row',
    gap:           Spacing.sm,
    marginBottom:  Spacing.md,
  },
  actionBtn: {
    flex:            1,
    alignItems:      'center',
    paddingVertical: Spacing.md,
    borderRadius:    Radius.lg,
    gap:             Spacing.xs,
  },
  actionLabel: {
    fontSize:   FontSize.xs,
    fontWeight: FontWeight.semibold,
    textAlign:  'center',
  },

  // Sign out
  signOutBtn: {
    borderWidth:     1.5,
    borderColor:     Colors.emergency,
    borderRadius:    Radius.md,
    paddingVertical: Spacing.md,
    alignItems:      'center',
    minHeight:       52,
    justifyContent:  'center',
    marginTop:       Spacing.sm,
  },
  signOutText: {
    color:      Colors.emergency,
    fontSize:   FontSize.md,
    fontWeight: FontWeight.bold,
  },
});
