// ============================================================
// Sign-Up — 3-step registration
// Step 1: Account  (email, password, confirm)
// Step 2: Profile  (full name, age range, country)
// Step 3: Safety   (role, safe word, terms)
// After submit → OTP verify screen
// ============================================================
import { useState, useRef } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform,
  ActivityIndicator, Switch, TextInput as TI,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../services/supabase';
import { useSignupStore } from '../../store/signupStore';
import {
  Colors, Spacing, FontSize, FontWeight, Radius, Shadow,
} from '../../constants/theme';

// ── Constants ─────────────────────────────────────────────────
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

// ── Component ─────────────────────────────────────────────────
export default function SignUpScreen() {
  const router = useRouter();
  const signup = useSignupStore();

  const [step, setStep] = useState(1);

  // Step 1 fields
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPwd,  setShowPwd]  = useState(false);

  // Step 2 fields
  const [fullName,  setFullName]  = useState('');
  const [ageRange,  setAgeRange]  = useState('');
  const [country,   setCountry]   = useState('');

  // Step 3 fields
  const [role,      setRole]      = useState<'girl' | 'parent' | 'mentor'>('girl');
  const [safeWord,  setSafeWord]  = useState('');
  const [terms,     setTerms]     = useState(false);

  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const pwdRef     = useRef<TI>(null);
  const confirmRef = useRef<TI>(null);
  const countryRef = useRef<TI>(null);

  // ── Validation ──────────────────────────────────────────────
  const validateStep = (): boolean => {
    setError('');
    if (step === 1) {
      if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
        setError('الرجاء إدخال بريد إلكتروني صحيح'); return false;
      }
      if (password.length < 8) {
        setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل'); return false;
      }
      if (password !== confirm) {
        setError('كلمتا المرور غير متطابقتين'); return false;
      }
    }
    if (step === 2) {
      if (fullName.trim().length < 2) {
        setError('الرجاء إدخال الاسم الكامل'); return false;
      }
      if (!ageRange) {
        setError('الرجاء اختيار الفئة العمرية'); return false;
      }
      if (!country.trim()) {
        setError('الرجاء إدخال البلد'); return false;
      }
    }
    if (step === 3) {
      if (!terms) {
        setError('يجب الموافقة على الشروط والأحكام للمتابعة'); return false;
      }
    }
    return true;
  };

  // ── Navigation ──────────────────────────────────────────────
  const handleNext = () => {
    if (!validateStep()) return;
    if (step < 3) { setStep(s => s + 1); return; }
    handleSubmit();
  };

  const handleBack = () => {
    setError('');
    setStep(s => s - 1);
  };

  // ── Submit ──────────────────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    const { data, error: signUpErr } = await supabase.auth.signUp({
      email:    email.trim().toLowerCase(),
      password,
      options: {
        data: { full_name: fullName.trim(), age_range: ageRange, country, role, safe_word: safeWord.trim() || null },
      },
    });

    if (signUpErr) {
      setLoading(false);
      if (signUpErr.message.includes('already registered')) {
        setError('هذا البريد الإلكتروني مسجّل بالفعل. يرجى تسجيل الدخول.');
      } else {
        setError(signUpErr.message);
      }
      return;
    }

    // Persist profile data so verify.tsx can save it after OTP confirmation
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
      // Email confirmation is disabled in Supabase — session already established.
      // Save profile immediately and go to the app.
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
      // Email confirmation is enabled — user must enter the OTP sent to their inbox.
      router.push('/(auth)/verify');
    }
  };

  // ── Render helpers ───────────────────────────────────────────
  const renderStepDots = () => (
    <View style={styles.dots}>
      {[1, 2, 3].map(n => (
        <View
          key={n}
          style={[styles.dot, n === step && styles.dotActive, n < step && styles.dotDone]}
        >
          {n < step && <Text style={styles.dotCheck}>✓</Text>}
        </View>
      ))}
    </View>
  );

  const renderField = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    opts: { ref?: any; placeholder?: string; secure?: boolean; showToggle?: boolean; keyboard?: any; returnKey?: any; onSubmit?: () => void } = {},
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pwdWrap}>
        <TextInput
          ref={opts.ref}
          style={[styles.input, !!opts.showToggle && styles.inputWithEye]}
          value={value}
          onChangeText={onChange}
          secureTextEntry={opts.secure}
          placeholder={opts.placeholder}
          placeholderTextColor={Colors.textLight}
          textAlign="right"
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

  // ── Steps ────────────────────────────────────────────────────
  const renderStep1 = () => (
    <>
      {renderField('البريد الإلكتروني', email, setEmail, {
        placeholder: 'example@email.com',
        keyboard:    'email-address',
        returnKey:   'next',
        onSubmit:    () => pwdRef.current?.focus(),
      })}
      {renderField('كلمة المرور', password, setPassword, {
        ref:         pwdRef,
        placeholder: '8 أحرف على الأقل',
        secure:      !showPwd,
        showToggle:  true,
        returnKey:   'next',
        onSubmit:    () => confirmRef.current?.focus(),
      })}
      {renderField('تأكيد كلمة المرور', confirm, setConfirm, {
        ref:         confirmRef,
        placeholder: 'أعيدي كتابة كلمة المرور',
        secure:      !showPwd,
        returnKey:   'done',
      })}
    </>
  );

  const renderStep2 = () => (
    <>
      {renderField('الاسم الكامل', fullName, setFullName, { placeholder: 'مثال: فاطمة أحمد', returnKey: 'next', onSubmit: () => countryRef.current?.focus() })}

      <View style={styles.field}>
        <Text style={styles.label}>الفئة العمرية</Text>
        <View style={styles.chipRow}>
          {AGE_RANGES.map(r => (
            <Pressable
              key={r.value}
              style={[styles.chip, ageRange === r.value && styles.chipActive]}
              onPress={() => setAgeRange(r.value)}
            >
              <Text style={[styles.chipText, ageRange === r.value && styles.chipTextActive]}>
                {r.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {renderField('البلد', country, setCountry, {
        ref:         countryRef,
        placeholder: 'مثال: لبنان',
        returnKey:   'done',
      })}
    </>
  );

  const renderStep3 = () => (
    <>
      <View style={styles.field}>
        <Text style={styles.label}>أنا …</Text>
        <View style={styles.roleRow}>
          {ROLES.map(r => (
            <Pressable
              key={r.value}
              style={[styles.roleCard, role === r.value && styles.roleCardActive]}
              onPress={() => setRole(r.value)}
            >
              <Text style={styles.roleEmoji}>{r.emoji}</Text>
              <Text style={[styles.roleLabel, role === r.value && styles.roleLabelActive]}>
                {r.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>كلمة الأمان (اختياري)</Text>
        <Text style={styles.hint}>
          كلمة سرّية تستخدمينها لتفعيل نداء الطوارئ بهدوء دون أن يلاحظ أحد.
        </Text>
        <TextInput
          style={styles.input}
          value={safeWord}
          onChangeText={setSafeWord}
          placeholder="مثال: قهوة"
          placeholderTextColor={Colors.textLight}
          textAlign="right"
          autoCapitalize="none"
        />
      </View>

      <Pressable
        style={styles.termsRow}
        onPress={() => setTerms(v => !v)}
        accessibilityRole="checkbox"
      >
        <View style={[styles.checkbox, terms && styles.checkboxChecked]}>
          {terms && <Text style={styles.checkboxMark}>✓</Text>}
        </View>
        <Text style={styles.termsText}>
          أوافق على{' '}
          <Text style={styles.termsLink}>شروط الاستخدام</Text>
          {' '}و{' '}
          <Text style={styles.termsLink}>سياسة الخصوصية</Text>
        </Text>
      </Pressable>
    </>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.topHeader}>
            <Text style={styles.appName}>نجوم ★</Text>
            <Text style={styles.stepLabel}>
              الخطوة {step} من 3 — {STEP_LABELS[step - 1]}
            </Text>
          </View>

          {/* Step dots */}
          {renderStepDots()}

          {/* Card */}
          <View style={styles.card}>
            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}

            {/* Navigation buttons */}
            <View style={styles.navRow}>
              {step > 1 ? (
                <Pressable style={styles.backBtn} onPress={handleBack}>
                  <Text style={styles.backBtnText}>→ السابق</Text>
                </Pressable>
              ) : (
                <View />
              )}

              <Pressable
                style={({ pressed }) => [
                  styles.nextBtn,
                  pressed && styles.nextBtnPressed,
                  loading && styles.nextBtnDisabled,
                ]}
                onPress={handleNext}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.nextBtnText}>
                    {step < 3 ? 'التالي ←' : 'إنشاء الحساب'}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>

          {/* Sign-in link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>لديكِ حساب بالفعل؟</Text>
            <Pressable onPress={() => router.push('/(auth)/sign-in')}>
              <Text style={styles.link}>تسجيل الدخول</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, padding: Spacing.md },

  topHeader: {
    alignItems:   'center',
    marginBottom: Spacing.md,
    marginTop:    Spacing.sm,
  },
  appName: {
    fontSize:   FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color:      Colors.primary,
  },
  stepLabel: {
    fontSize:  FontSize.sm,
    color:     Colors.textMuted,
    marginTop: 4,
  },

  // Step dots
  dots: {
    flexDirection:  'row',
    justifyContent: 'center',
    gap:            Spacing.sm,
    marginBottom:   Spacing.md,
  },
  dot: {
    width:           30,
    height:          30,
    borderRadius:    Radius.full,
    borderWidth:     2,
    borderColor:     Colors.border,
    backgroundColor: Colors.surface,
    alignItems:      'center',
    justifyContent:  'center',
  },
  dotActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  dotDone:   { borderColor: Colors.success, backgroundColor: Colors.success },
  dotCheck:  { fontSize: 13, color: '#fff', fontWeight: FontWeight.bold },

  // Card
  card: {
    backgroundColor: Colors.surface,
    borderRadius:    Radius.lg,
    padding:         Spacing.lg,
    gap:             Spacing.md,
    ...Shadow.md,
    marginBottom:    Spacing.md,
  },

  // Error
  errorBox: {
    backgroundColor: '#FFF0F0',
    borderRadius:    Radius.sm,
    padding:         Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.emergency,
  },
  errorText: { fontSize: FontSize.sm, color: Colors.emergency, textAlign: 'right' },

  // Fields
  field: { gap: 6 },
  label: {
    fontSize:   FontSize.sm,
    fontWeight: FontWeight.semibold,
    color:      Colors.text,
    textAlign:  'right',
  },
  hint: {
    fontSize:  FontSize.xs,
    color:     Colors.textMuted,
    textAlign: 'right',
    lineHeight: 16,
  },
  input: {
    borderWidth:       1.5,
    borderColor:       Colors.border,
    borderRadius:      Radius.md,
    paddingVertical:   Spacing.sm + 4,
    paddingHorizontal: Spacing.md,
    fontSize:          FontSize.md,
    color:             Colors.text,
    backgroundColor:   Colors.background,
  },
  inputWithEye: { flex: 1 },
  pwdWrap: { flexDirection: 'row', alignItems: 'center' },
  eyeBtn: {
    position: 'absolute',
    left: Spacing.sm,
    top: 0, bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
  },
  eyeIcon: { fontSize: 18 },

  // Age chips
  chipRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
    borderRadius:      Radius.full,
    borderWidth:       1.5,
    borderColor:       Colors.border,
    backgroundColor:   Colors.surface,
  },
  chipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  chipText:   { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: FontWeight.medium },
  chipTextActive: { color: Colors.primary, fontWeight: FontWeight.bold },

  // Role cards
  roleRow: { flexDirection: 'row', gap: Spacing.sm },
  roleCard: {
    flex:            1,
    alignItems:      'center',
    paddingVertical: Spacing.md,
    borderRadius:    Radius.md,
    borderWidth:     1.5,
    borderColor:     Colors.border,
    backgroundColor: Colors.surface,
    gap:             Spacing.xs,
  },
  roleCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  roleEmoji:      { fontSize: 28 },
  roleLabel:      { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.medium, textAlign: 'center' },
  roleLabelActive: { color: Colors.primary, fontWeight: FontWeight.bold },

  // Terms
  termsRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing.sm,
  },
  checkbox: {
    width:        24,
    height:       24,
    borderRadius: Radius.xs,
    borderWidth:  1.5,
    borderColor:  Colors.border,
    alignItems:   'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkboxMark: { color: '#fff', fontSize: 14, fontWeight: FontWeight.bold },
  termsText: {
    flex:      1,
    fontSize:  FontSize.sm,
    color:     Colors.text,
    textAlign: 'right',
    lineHeight: 20,
  },
  termsLink: { color: Colors.primary, fontWeight: FontWeight.semibold },

  // Navigation
  navRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginTop:      Spacing.sm,
  },
  backBtn: {
    paddingVertical:   Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  backBtnText: {
    fontSize:   FontSize.md,
    color:      Colors.textMuted,
    fontWeight: FontWeight.medium,
  },
  nextBtn: {
    backgroundColor: Colors.primary,
    borderRadius:    Radius.md,
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.xl,
    alignItems:      'center',
    justifyContent:  'center',
    minHeight:       48,
    ...Shadow.sm,
  },
  nextBtnPressed:  { opacity: 0.85 },
  nextBtnDisabled: { opacity: 0.6 },
  nextBtnText: {
    fontSize:   FontSize.md,
    fontWeight: FontWeight.bold,
    color:      '#fff',
  },

  // Footer
  footer: {
    alignItems:    'center',
    gap:           Spacing.xs,
    paddingBottom: Spacing.lg,
  },
  footerText: { fontSize: FontSize.sm, color: Colors.textMuted },
  link: {
    fontSize:   FontSize.sm,
    fontWeight: FontWeight.bold,
    color:      Colors.primary,
  },
});
