// ============================================================
// Sign-Up — 3-step registration with star/sun theme
// ============================================================
import { useState, useRef } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform,
  ActivityIndicator, Switch, TextInput as TI,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../services/supabase';
import { useSignupStore } from '../../store/signupStore';
import { useColorScheme } from '../../hooks/useColorScheme';
import { StarField } from '../../components/home/StarField';
import { Spacing, FontSize, FontWeight, Radius } from '../../constants/theme';

const AGE_RANGES = [
  { value: '10-12', label: '10–12' },
  { value: '13-17', label: '13–17' },
  { value: '18-24', label: '18–24' },
  { value: '25+',   label: '25+' },
];

const ROLES = [
  { value: 'girl'   as const, emoji: '👧', label: 'فتاة / امرأة' },
  { value: 'parent' as const, emoji: '👩‍👧', label: 'والد / والدة' },
  { value: 'mentor' as const, emoji: '🤝', label: 'مرشدة' },
];

const STEP_LABELS = ['الحساب', 'معلوماتكِ', 'الأمان'];

export default function SignUpScreen() {
  const router                   = useRouter();
  const signup                   = useSignupStore();
  const { isDark, colors, lang } = useColorScheme();
  const isRTL                    = lang === 'ar';

  const [step, setStep] = useState(1);

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPwd,  setShowPwd]  = useState(false);

  const [fullName, setFullName] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [country,  setCountry]  = useState('');

  const [role,     setRole]     = useState<'girl' | 'parent' | 'mentor'>('girl');
  const [safeWord, setSafeWord] = useState('');
  const [terms,    setTerms]    = useState(false);

  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const pwdRef     = useRef<TI>(null);
  const confirmRef = useRef<TI>(null);
  const countryRef = useRef<TI>(null);

  const validateStep = (): boolean => {
    setError('');
    if (step === 1) {
      if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) { setError('الرجاء إدخال بريد إلكتروني صحيح'); return false; }
      if (password.length < 8) { setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل'); return false; }
      if (password !== confirm) { setError('كلمتا المرور غير متطابقتين'); return false; }
    }
    if (step === 2) {
      if (fullName.trim().length < 2) { setError('الرجاء إدخال الاسم الكامل'); return false; }
      if (!ageRange) { setError('الرجاء اختيار الفئة العمرية'); return false; }
      if (!country.trim()) { setError('الرجاء إدخال البلد'); return false; }
    }
    if (step === 3) {
      if (!terms) { setError('يجب الموافقة على الشروط والأحكام للمتابعة'); return false; }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (step < 3) { setStep(s => s + 1); return; }
    handleSubmit();
  };

  const handleBack = () => { setError(''); setStep(s => s - 1); };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    const { data, error: signUpErr } = await supabase.auth.signUp({
      email:   email.trim().toLowerCase(),
      password,
      options: {
        data: { full_name: fullName.trim(), age_range: ageRange, country, role, safe_word: safeWord.trim() || null },
      },
    });

    if (signUpErr) {
      setLoading(false);
      setError(signUpErr.message.includes('already registered')
        ? 'هذا البريد الإلكتروني مسجّل بالفعل. يرجى تسجيل الدخول.'
        : signUpErr.message);
      return;
    }

    signup.set({
      email:     email.trim().toLowerCase(),
      password,
      full_name: fullName.trim(),
      age_range: ageRange,
      country:   country.trim(),
      role,
      safe_word: safeWord.trim(),
    });

    setLoading(false);

    if (data.session) {
      await supabase.from('users').upsert({
        id:        data.session.user.id,
        email:     data.session.user.email,
        full_name: fullName.trim(),
        age_range: ageRange,
        country:   country.trim(),
        role,
        safe_word: safeWord.trim() || null,
      }, { onConflict: 'id' });
      signup.clear();
      router.replace('/(tabs)');
    } else {
      router.push('/(auth)/verify');
    }
  };

  const inputStyle = {
    borderColor:     isDark ? '#2C1C48'      : '#E8D5D0',
    color:           colors.text,
    backgroundColor: isDark ? colors.surface : colors.background,
  };

  const renderField = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    opts: { ref?: any; placeholder?: string; secure?: boolean; showToggle?: boolean; keyboard?: any; returnKey?: any; onSubmit?: () => void } = {},
  ) => (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>{label}</Text>
      <View style={styles.pwdWrap}>
        <TextInput
          ref={opts.ref}
          style={[styles.input, inputStyle, !!opts.showToggle && styles.inputWithEye]}
          value={value}
          onChangeText={onChange}
          secureTextEntry={opts.secure}
          placeholder={opts.placeholder}
          placeholderTextColor={colors.textMuted}
          textAlign={isRTL ? 'right' : 'left'}
          keyboardType={opts.keyboard ?? 'default'}
          returnKeyType={opts.returnKey ?? 'next'}
          onSubmitEditing={opts.onSubmit}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {opts.showToggle && (
          <Pressable onPress={() => setShowPwd(v => !v)} style={styles.eyeBtn}>
            <Text style={styles.eyeIcon}>{showPwd ? '🙈' : '👁'}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );

  const renderStep1 = () => (
    <>
      {renderField('البريد الإلكتروني', email, setEmail, { placeholder: 'example@email.com', keyboard: 'email-address', returnKey: 'next', onSubmit: () => pwdRef.current?.focus() })}
      {renderField('كلمة المرور', password, setPassword, { ref: pwdRef, placeholder: '8 أحرف على الأقل', secure: !showPwd, showToggle: true, returnKey: 'next', onSubmit: () => confirmRef.current?.focus() })}
      {renderField('تأكيد كلمة المرور', confirm, setConfirm, { ref: confirmRef, placeholder: 'أعيدي كتابة كلمة المرور', secure: !showPwd, returnKey: 'done' })}
    </>
  );

  const renderStep2 = () => (
    <>
      {renderField('الاسم الكامل', fullName, setFullName, { placeholder: 'مثال: فاطمة أحمد', returnKey: 'next', onSubmit: () => countryRef.current?.focus() })}

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>الفئة العمرية</Text>
        <View style={styles.chipRow}>
          {AGE_RANGES.map(r => (
            <Pressable
              key={r.value}
              style={[styles.chip, {
                borderColor:     ageRange === r.value ? colors.primary : (isDark ? '#2C1C48' : '#E8D5D0'),
                backgroundColor: ageRange === r.value ? colors.primary + '20' : (isDark ? colors.surface : colors.background),
              }]}
              onPress={() => setAgeRange(r.value)}
            >
              <Text style={[styles.chipText, { color: ageRange === r.value ? colors.primary : colors.textMuted, fontWeight: ageRange === r.value ? FontWeight.bold : FontWeight.medium }]}>
                {r.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {renderField('البلد', country, setCountry, { ref: countryRef, placeholder: 'مثال: لبنان', returnKey: 'done' })}
    </>
  );

  const renderStep3 = () => (
    <>
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>أنا …</Text>
        <View style={styles.roleRow}>
          {ROLES.map(r => (
            <Pressable
              key={r.value}
              style={[styles.roleCard, {
                borderColor:     role === r.value ? colors.primary : (isDark ? '#2C1C48' : '#E8D5D0'),
                backgroundColor: role === r.value ? colors.primary + '18' : (isDark ? colors.surface : colors.background),
              }]}
              onPress={() => setRole(r.value)}
            >
              <Text style={styles.roleEmoji}>{r.emoji}</Text>
              <Text style={[styles.roleLabel, { color: role === r.value ? colors.primary : colors.textMuted, fontWeight: role === r.value ? FontWeight.bold : FontWeight.medium }]}>
                {r.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>كلمة الأمان (اختياري)</Text>
        <Text style={[styles.hint, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
          كلمة سرّية تستخدمينها لتفعيل نداء الطوارئ بهدوء دون أن يلاحظ أحد.
        </Text>
        <TextInput
          style={[styles.input, inputStyle]}
          value={safeWord}
          onChangeText={setSafeWord}
          placeholder="مثال: قهوة"
          placeholderTextColor={colors.textMuted}
          textAlign={isRTL ? 'right' : 'left'}
          autoCapitalize="none"
        />
      </View>

      <Pressable style={[styles.termsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} onPress={() => setTerms(v => !v)} accessibilityRole="checkbox">
        <View style={[styles.checkbox, { borderColor: terms ? colors.primary : (isDark ? '#2C1C48' : '#E8D5D0'), backgroundColor: terms ? colors.primary : 'transparent' }]}>
          {terms && <Text style={styles.checkboxMark}>✓</Text>}
        </View>
        <Text style={[styles.termsText, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
          أوافق على <Text style={[styles.termsLink, { color: colors.primary }]}>شروط الاستخدام</Text>{' '}و{' '}<Text style={[styles.termsLink, { color: colors.primary }]}>سياسة الخصوصية</Text>
        </Text>
      </Pressable>
    </>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      {isDark && <StarField />}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.topHeader}>
            <Text style={[styles.appName, { color: isDark ? colors.starGold : colors.primary }]}>
              {isRTL ? 'نجوم' : 'Njoum'} ✦
            </Text>
            <Text style={[styles.stepLabel, { color: colors.textMuted }]}>
              الخطوة {step} من 3 — {STEP_LABELS[step - 1]}
            </Text>
          </View>

          {/* Step dots */}
          <View style={styles.dots}>
            {[1, 2, 3].map(n => (
              <View key={n} style={[styles.dot, {
                borderColor:     n === step ? colors.primary : n < step ? '#38A169' : (isDark ? '#2C1C48' : '#E8D5D0'),
                backgroundColor: n === step ? colors.primary + '20' : n < step ? '#38A169' : 'transparent',
              }]}>
                {n < step && <Text style={styles.dotCheck}>✓</Text>}
                {n === step && <View style={[styles.dotActiveDot, { backgroundColor: colors.primary }]} />}
              </View>
            ))}
          </View>

          {/* Card */}
          <View style={[styles.card, {
            backgroundColor: isDark ? colors.card : colors.surface,
            borderColor:     isDark ? '#2C1C48' : '#F0E4E0',
            shadowColor:     isDark ? '#A480FF' : '#B5586A',
          }]}>
            {!!error && (
              <View style={styles.errorBox}>
                <Text style={[styles.errorText, { textAlign: isRTL ? 'right' : 'left' }]}>{error}</Text>
              </View>
            )}

            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}

            {/* Navigation buttons */}
            <View style={[styles.navRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              {step > 1 ? (
                <Pressable style={[styles.backBtn, { borderColor: isDark ? '#2C1C48' : '#E8D5D0' }]} onPress={handleBack}>
                  <Text style={[styles.backBtnText, { color: colors.textMuted }]}>
                    {isRTL ? '← السابق' : '← Back'}
                  </Text>
                </Pressable>
              ) : (
                <View />
              )}

              <Pressable
                style={({ pressed }) => [styles.nextBtn, { opacity: pressed || loading ? 0.85 : 1 }]}
                onPress={handleNext}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#B5586A', '#7A4E7A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.nextBtnText}>
                    {step < 3 ? (isRTL ? 'التالي ←' : 'Next →') : (isRTL ? 'إنشاء الحساب' : 'Create Account')}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>

          {/* Sign-in link */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textMuted }]}>
              {isRTL ? 'لديكِ حساب بالفعل؟' : 'Already have an account?'}
            </Text>
            <Pressable onPress={() => router.push('/(auth)/sign-in')}>
              <Text style={[styles.link, { color: isDark ? colors.starGold : colors.primary }]}>
                {isRTL ? 'تسجيل الدخول' : 'Sign In'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { flexGrow: 1, padding: Spacing.md, gap: Spacing.md },

  topHeader: { alignItems: 'center', marginTop: Spacing.sm, gap: 4 },
  appName:   { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold },
  stepLabel: { fontSize: FontSize.sm, marginTop: 2 },

  dots:       { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm },
  dot: {
    width: 30, height: 30, borderRadius: Radius.full,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  dotActiveDot: { width: 8, height: 8, borderRadius: 4 },
  dotCheck:     { fontSize: 13, color: '#fff', fontWeight: FontWeight.bold },

  card: {
    borderRadius:  Radius.xl,
    padding:       Spacing.lg,
    gap:           Spacing.md,
    borderWidth:   1,
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius:  16,
    elevation:     4,
  },

  errorBox: {
    backgroundColor: 'rgba(229,62,62,0.1)',
    borderRadius:    Radius.sm,
    padding:         Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: '#E53E3E',
  },
  errorText: { fontSize: FontSize.sm, color: '#E53E3E' },

  field: { gap: 6 },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  hint:  { fontSize: FontSize.xs, lineHeight: 16 },
  input: {
    borderWidth:       1.5,
    borderRadius:      Radius.md,
    paddingVertical:   Spacing.sm + 4,
    paddingHorizontal: Spacing.md,
    fontSize:          FontSize.md,
  },
  inputWithEye: { flex: 1 },
  pwdWrap:      { flexDirection: 'row', alignItems: 'center' },
  eyeBtn: {
    position: 'absolute', left: Spacing.sm, top: 0, bottom: 0,
    justifyContent: 'center', paddingHorizontal: Spacing.xs,
  },
  eyeIcon: { fontSize: 18 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
    borderRadius:      Radius.full,
    borderWidth:       1.5,
  },
  chipText: { fontSize: FontSize.sm },

  roleRow: { flexDirection: 'row', gap: Spacing.sm },
  roleCard: {
    flex: 1, alignItems: 'center', paddingVertical: Spacing.md,
    borderRadius: Radius.lg, borderWidth: 1.5, gap: Spacing.xs,
  },
  roleEmoji: { fontSize: 28 },
  roleLabel: { fontSize: FontSize.xs, textAlign: 'center' },

  termsRow: { alignItems: 'center', gap: Spacing.sm },
  checkbox: {
    width: 24, height: 24, borderRadius: Radius.xs,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  checkboxMark: { color: '#fff', fontSize: 14, fontWeight: FontWeight.bold },
  termsText:    { flex: 1, fontSize: FontSize.sm, lineHeight: 20 },
  termsLink:    { fontWeight: FontWeight.semibold },

  navRow: { justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm },
  backBtn: {
    paddingVertical:   Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius:      Radius.md,
    borderWidth:       1,
  },
  backBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.medium },
  nextBtn: {
    borderRadius:      Radius.lg,
    paddingVertical:   Spacing.sm + 4,
    paddingHorizontal: Spacing.xl,
    alignItems:        'center',
    justifyContent:    'center',
    minHeight:         48,
    overflow:          'hidden',
  },
  nextBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#fff' },

  footer:     { alignItems: 'center', gap: Spacing.xs, paddingBottom: Spacing.lg },
  footerText: { fontSize: FontSize.sm },
  link:       { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
});
