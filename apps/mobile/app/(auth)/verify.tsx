// ============================================================
// Email Verification Screen — star/sun theme
// ============================================================
import { useRef, useState, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ActivityIndicator, TextInput as TI, Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../services/supabase';
import { useSignupStore } from '../../store/signupStore';
import { useColorScheme } from '../../hooks/useColorScheme';
import { StarField } from '../../components/home/StarField';
import { Spacing, FontSize, FontWeight, Radius } from '../../constants/theme';

export default function VerifyScreen() {
  const router                   = useRouter();
  const signup                   = useSignupStore();
  const { isDark, colors, lang } = useColorScheme();
  const isRTL                    = lang === 'ar';

  const [digits,    setDigits]    = useState(['', '', '', '', '', '', '', '']);
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [resending, setResending] = useState(false);
  const [resentOk,  setResentOk]  = useState(false);

  const refs = useRef<(TI | null)[]>([null, null, null, null, null, null, null, null]);

  useEffect(() => { setTimeout(() => refs.current[0]?.focus(), 300); }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const enteredCode = digits.join('');
  const isComplete  = enteredCode.length === 8;

  const handleDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next  = [...digits];
    next[index] = digit;
    setDigits(next);
    setError('');
    if (digit && index < 7) refs.current[index + 1]?.focus();
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace') {
      if (digits[index]) {
        const next = [...digits]; next[index] = ''; setDigits(next);
      } else if (index > 0) {
        const next = [...digits]; next[index - 1] = ''; setDigits(next);
        refs.current[index - 1]?.focus();
      }
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    const { error: e } = await supabase.auth.resend({ type: 'signup', email: signup.email });
    setResending(false);
    if (e) {
      setError('تعذّر إعادة الإرسال. حاولي مرة أخرى.');
    } else {
      setResentOk(true);
      setCountdown(60);
      setDigits(['', '', '', '', '', '', '', '']);
      setTimeout(() => { setResentOk(false); refs.current[0]?.focus(); }, 3000);
    }
  };

  const handleVerify = async () => {
    if (!isComplete || loading) return;
    setError('');
    setLoading(true);

    const { data, error: e } = await supabase.auth.verifyOtp({
      email: signup.email,
      token: enteredCode,
      type:  'signup',
    });

    if (e || !data.session) {
      setLoading(false);
      setError('الرمز غير صحيح أو منتهي الصلاحية. تحققي من بريدكِ وحاولي مجدداً.');
      setDigits(['', '', '', '', '', '', '', '']);
      refs.current[0]?.focus();
      return;
    }

    await supabase.from('users').upsert({
      id:        data.session.user.id,
      email:     signup.email,
      full_name: signup.full_name,
      age_range: signup.age_range,
      country:   signup.country,
      role:      signup.role,
      safe_word: signup.safe_word || null,
    }, { onConflict: 'id' });

    signup.clear();
    setLoading(false);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      {isDark && <StarField />}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.container}>

          {/* Header */}
          <View style={styles.header}>
            <LinearGradient
              colors={['#B5586A', '#7A4E7A']}
              style={styles.iconCircle}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.iconText}>✉️</Text>
            </LinearGradient>
            <Text style={[styles.title, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'التحقق من البريد الإلكتروني' : 'Verify Your Email'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {isRTL ? 'أرسلنا رمزاً مكوّناً من ٨ أرقام إلى' : 'We sent an 8-digit code to'}{'\n'}
              <Text style={[styles.emailHighlight, { color: isDark ? colors.starGold : colors.primary }]}>{signup.email}</Text>
            </Text>
            <Text style={[styles.spamNote, { color: colors.textMuted }]}>
              {isRTL ? 'لم يصلكِ الرمز؟ تحققي من مجلد Spam' : "Didn't receive it? Check your Spam folder"}
            </Text>
          </View>

          {/* OTP Boxes */}
          <View style={styles.otpRow}>
            {digits.map((digit, i) => (
              <TextInput
                key={i}
                ref={el => { refs.current[i] = el; }}
                style={[styles.otpBox, {
                  borderColor:     digit
                    ? (isDark ? colors.starPurple : colors.primary)
                    : (isDark ? '#2C1C48' : '#E8D5D0'),
                  backgroundColor: digit
                    ? (isDark ? colors.primary + '20' : colors.primary + '10')
                    : (isDark ? colors.surface : colors.background),
                  color:           colors.text,
                }]}
                value={digit}
                onChangeText={(v) => handleDigit(i, v)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
                selectTextOnFocus
              />
            ))}
          </View>

          {/* Error */}
          {!!error && (
            <View style={styles.errorBox}>
              <Text style={[styles.errorText, { textAlign: isRTL ? 'right' : 'left' }]}>{error}</Text>
            </View>
          )}

          {/* Resent success */}
          {resentOk && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>تم إرسال رمز جديد ✓</Text>
            </View>
          )}

          {/* Verify button */}
          <Pressable
            style={({ pressed }) => [
              styles.btn,
              { opacity: (!isComplete || loading || pressed) ? 0.65 : 1 },
            ]}
            onPress={handleVerify}
            disabled={!isComplete || loading}
          >
            <LinearGradient
              colors={isComplete ? ['#B5586A', '#7A4E7A'] : ['#999', '#777']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>{isRTL ? 'تحقق' : 'Verify'}</Text>
            }
          </Pressable>

          {/* Resend */}
          <View style={styles.resendRow}>
            {countdown > 0 ? (
              <Text style={[styles.countdownText, { color: colors.textMuted }]}>
                {isRTL ? `إعادة الإرسال بعد ${countdown} ث` : `Resend in ${countdown}s`}
              </Text>
            ) : (
              <Pressable onPress={handleResend} disabled={resending}>
                {resending
                  ? <ActivityIndicator color={colors.primary} size="small" />
                  : <Text style={[styles.resendLink, { color: isDark ? colors.starGold : colors.primary }]}>
                      {isRTL ? 'إعادة إرسال الرمز' : 'Resend code'}
                    </Text>
                }
              </Pressable>
            )}
          </View>

          {/* Back */}
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={[styles.backText, { color: colors.textMuted }]}>
              {isRTL ? '← العودة لتعديل البيانات' : '← Edit your details'}
            </Text>
          </Pressable>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1 },
  container: {
    flex:           1,
    padding:        Spacing.lg,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            Spacing.lg,
  },

  header:    { alignItems: 'center', gap: Spacing.sm },
  iconCircle: {
    width: 72, height: 72, borderRadius: Radius.xl,
    alignItems: 'center', justifyContent: 'center',
  },
  iconText:  { fontSize: 34 },
  title: {
    fontSize:   FontSize.xxl,
    fontWeight: FontWeight.bold,
    textAlign:  'center',
  },
  subtitle: {
    fontSize:   FontSize.md,
    textAlign:  'center',
    lineHeight: 26,
  },
  emailHighlight: { fontWeight: FontWeight.bold },
  spamNote: {
    fontSize:   FontSize.xs,
    textAlign:  'center',
    lineHeight: 18,
    marginTop:  Spacing.xs,
  },

  otpRow: {
    flexDirection:     'row',
    gap:               6,
    justifyContent:    'center',
    alignSelf:         'stretch',
    paddingHorizontal: Spacing.md,
  },
  otpBox: {
    flex:       1,
    maxWidth:   42,
    height:     54,
    borderRadius:  Radius.md,
    borderWidth:   1.5,
    fontSize:   FontSize.lg,
    fontWeight: FontWeight.bold,
  },

  errorBox: {
    backgroundColor: 'rgba(229,62,62,0.1)',
    borderRadius:    Radius.sm,
    padding:         Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: '#E53E3E',
    width:           '100%',
  },
  errorText:   { fontSize: FontSize.sm, color: '#E53E3E' },
  successBox: {
    backgroundColor: 'rgba(56,161,105,0.1)',
    borderRadius:    Radius.sm,
    padding:         Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: '#38A169',
    width:           '100%',
  },
  successText: { fontSize: FontSize.sm, color: '#38A169', fontWeight: FontWeight.semibold, textAlign: 'right' },

  btn: {
    borderRadius:    Radius.lg,
    paddingVertical: Spacing.md,
    width:           '100%',
    alignItems:      'center',
    minHeight:       52,
    justifyContent:  'center',
    overflow:        'hidden',
  },
  btnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#fff' },

  resendRow:     { alignItems: 'center' },
  resendLink:    { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  countdownText: { fontSize: FontSize.sm },

  backBtn: { paddingVertical: Spacing.sm },
  backText: { fontSize: FontSize.sm },
});
