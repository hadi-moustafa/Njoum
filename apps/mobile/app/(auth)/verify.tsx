// ============================================================
// Email Verification Screen
// Uses Supabase Auth verifyOtp (type: 'signup').
// Supabase emails a 6-digit code to the user on sign-up.
// After success the session is auto-stored in AsyncStorage
// so the user never has to log in again on the same device.
// ============================================================
import { useRef, useState, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ActivityIndicator, TextInput as TI, Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../services/supabase';
import { useSignupStore } from '../../store/signupStore';
import {
  Colors, Spacing, FontSize, FontWeight, Radius, Shadow,
} from '../../constants/theme';

export default function VerifyScreen() {
  const router = useRouter();
  const signup = useSignupStore();

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

  // ── OTP box handlers ─────────────────────────────────────────
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

  // ── Resend ───────────────────────────────────────────────────
  const handleResend = async () => {
    setResending(true);
    setError('');
    const { error: e } = await supabase.auth.resend({
      type:  'signup',
      email: signup.email,
    });
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

  // ── Verify ───────────────────────────────────────────────────
  const handleVerify = async () => {
    if (!isComplete || loading) return;
    setError('');
    setLoading(true);

    // Verify OTP with Supabase — this confirms the account and returns a session
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

    // Session is now stored in AsyncStorage automatically by Supabase.
    // Save the user profile to the `users` table.
    await supabase.from('users').upsert({
      id:        data.session.user.id,
      email:     signup.email,
      full_name: signup.full_name,
      age_range: signup.age_range,
      country:   signup.country,
      role:      signup.role,
      safe_word: signup.safe_word || null,
    }, { onConflict: 'id' });

    // Clear signup temp data (password is now unnecessary)
    signup.clear();

    setLoading(false);
    // Replace the entire auth stack so Back can't return here
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>✉️</Text>
            </View>
            <Text style={styles.title}>التحقق من البريد الإلكتروني</Text>
            <Text style={styles.subtitle}>
              أرسلنا رمزاً مكوّناً من ٨ أرقام إلى{'\n'}
              <Text style={styles.emailHighlight}>{signup.email}</Text>
            </Text>
            <Text style={styles.spamNote}>
              لم يصلكِ الرمز؟ تحققي من مجلد الرسائل غير المرغوب فيها (Spam)
            </Text>
          </View>

          {/* OTP Boxes */}
          <View style={styles.otpRow}>
            {digits.map((digit, i) => (
              <TextInput
                key={i}
                ref={el => { refs.current[i] = el; }}
                style={[styles.otpBox, !!digit && styles.otpBoxFilled]}
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
              <Text style={styles.errorText}>{error}</Text>
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
              (!isComplete || loading) && styles.btnDisabled,
              pressed && isComplete && styles.btnPressed,
            ]}
            onPress={handleVerify}
            disabled={!isComplete || loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>تحقق</Text>
            }
          </Pressable>

          {/* Resend */}
          <View style={styles.resendRow}>
            {countdown > 0 ? (
              <Text style={styles.countdownText}>
                إعادة الإرسال بعد {countdown} ث
              </Text>
            ) : (
              <Pressable onPress={handleResend} disabled={resending}>
                {resending
                  ? <ActivityIndicator color={Colors.primary} size="small" />
                  : <Text style={styles.resendLink}>إعادة إرسال الرمز</Text>
                }
              </Pressable>
            )}
          </View>

          {/* Back */}
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← العودة لتعديل البيانات</Text>
          </Pressable>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.background },
  container: {
    flex:           1,
    padding:        Spacing.lg,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            Spacing.lg,
  },

  header:          { alignItems: 'center', gap: Spacing.sm },
  iconCircle: {
    width:           72,
    height:          72,
    borderRadius:    Radius.full,
    backgroundColor: Colors.primaryLight,
    alignItems:      'center',
    justifyContent:  'center',
  },
  iconText:        { fontSize: 34 },
  title: {
    fontSize:   FontSize.xxl,
    fontWeight: FontWeight.bold,
    color:      Colors.text,
    textAlign:  'center',
  },
  subtitle: {
    fontSize:   FontSize.md,
    color:      Colors.textMuted,
    textAlign:  'center',
    lineHeight: 26,
  },
  emailHighlight: {
    color:      Colors.primary,
    fontWeight: FontWeight.bold,
  },
  spamNote: {
    fontSize:   FontSize.xs,
    color:      Colors.textLight,
    textAlign:  'center',
    lineHeight: 18,
    marginTop:  Spacing.xs,
  },

  // OTP
  otpRow: {
    flexDirection:   'row',
    gap:             6,
    justifyContent:  'center',
    alignSelf:       'stretch',
    paddingHorizontal: Spacing.md,
  },
  otpBox: {
    flex:            1,
    maxWidth:        42,
    height:          54,
    borderRadius:    Radius.md,
    borderWidth:     1.5,
    borderColor:     Colors.border,
    backgroundColor: Colors.surface,
    fontSize:        FontSize.lg,
    fontWeight:      FontWeight.bold,
    color:           Colors.text,
    ...Shadow.sm,
  },
  otpBoxFilled: {
    borderColor:     Colors.primary,
    backgroundColor: Colors.primaryLight,
  },

  // Error / Success
  errorBox: {
    backgroundColor: '#FFF0F0',
    borderRadius:    Radius.sm,
    padding:         Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.emergency,
    width:           '100%',
  },
  errorText:   { fontSize: FontSize.sm, color: Colors.emergency, textAlign: 'right' },
  successBox: {
    backgroundColor: '#EEFFF4',
    borderRadius:    Radius.sm,
    padding:         Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.success,
    width:           '100%',
  },
  successText: { fontSize: FontSize.sm, color: Colors.success, fontWeight: FontWeight.semibold, textAlign: 'right' },

  // Button
  btn: {
    backgroundColor: Colors.primary,
    borderRadius:    Radius.md,
    paddingVertical: Spacing.md,
    width:           '100%',
    alignItems:      'center',
    minHeight:       52,
    justifyContent:  'center',
    ...Shadow.md,
  },
  btnDisabled: { backgroundColor: Colors.border },
  btnPressed:  { opacity: 0.85 },
  btnText: {
    fontSize:   FontSize.lg,
    fontWeight: FontWeight.bold,
    color:      '#fff',
  },

  // Resend
  resendRow:     { alignItems: 'center' },
  resendLink:    { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },
  countdownText: { fontSize: FontSize.sm, color: Colors.textMuted },

  // Back
  backBtn: { paddingVertical: Spacing.sm },
  backText: { fontSize: FontSize.sm, color: Colors.textMuted },
});
