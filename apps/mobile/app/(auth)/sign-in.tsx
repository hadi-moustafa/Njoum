import { useState, useRef } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, TextInput as TI,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../services/supabase';
import {
  Colors, Spacing, FontSize, FontWeight, Radius, Shadow,
} from '../../constants/theme';

export default function SignInScreen() {
  const router = useRouter();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const pwdRef = useRef<TI>(null);

  const validate = () => {
    if (!email.trim())    { setError('الرجاء إدخال البريد الإلكتروني'); return false; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('البريد الإلكتروني غير صحيح'); return false; }
    if (!password)        { setError('الرجاء إدخال كلمة المرور'); return false; }
    return true;
  };

  const handleLogin = async () => {
    setError('');
    if (!validate()) return;
    setLoading(true);

    const { error: e } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    setLoading(false);

    if (e) {
      if (e.message.includes('Email not confirmed')) {
        setError('البريد الإلكتروني لم يتم تأكيده بعد. يرجى إنشاء حساب جديد أو التواصل مع الدعم.');
      } else if (e.message.includes('Invalid login')) {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      } else {
        setError(e.message);
      }
      return;
    }

    router.replace('/(tabs)');
  };

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
          {/* ── Brand Header ── */}
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoStar}>★</Text>
            </View>
            <Text style={styles.appName}>نجوم</Text>
            <Text style={styles.tagline}>حين يحلّ الظلام، انظري للأعلى</Text>
          </View>

          {/* ── Login Card ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>تسجيل الدخول</Text>

            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Email */}
            <View style={styles.field}>
              <Text style={styles.label}>البريد الإلكتروني</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="example@email.com"
                placeholderTextColor={Colors.textLight}
                textAlign="right"
                returnKeyType="next"
                onSubmitEditing={() => pwdRef.current?.focus()}
              />
            </View>

            {/* Password */}
            <View style={styles.field}>
              <Text style={styles.label}>كلمة المرور</Text>
              <View style={styles.pwdWrap}>
                <TextInput
                  ref={pwdRef}
                  style={[styles.input, styles.pwdInput]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPwd}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textLight}
                  textAlign="right"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <Pressable onPress={() => setShowPwd(v => !v)} style={styles.eyeBtn}>
                  <Text style={styles.eyeIcon}>{showPwd ? '🙈' : '👁'}</Text>
                </Pressable>
              </View>
            </View>

            {/* Login button */}
            <Pressable
              style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
              onPress={handleLogin}
              disabled={loading}
              accessibilityRole="button"
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>دخول</Text>
              }
            </Pressable>
          </View>

          {/* ── Footer ── */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>ليس لديكِ حساب؟</Text>
            <Link href="/(auth)/sign-up" style={styles.link}>إنشاء حساب جديد</Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, padding: Spacing.md, justifyContent: 'center' },

  // Header
  header: {
    alignItems:   'center',
    marginBottom: Spacing.xl,
    gap:          Spacing.sm,
  },
  logoCircle: {
    width:           88,
    height:          88,
    borderRadius:    Radius.full,
    backgroundColor: Colors.primary,
    alignItems:      'center',
    justifyContent:  'center',
    ...Shadow.lg,
  },
  logoStar: { fontSize: 40, color: '#fff' },
  appName:  {
    fontSize:   FontSize.h1,
    fontWeight: FontWeight.extrabold,
    color:      Colors.primary,
  },
  tagline: {
    fontSize:  FontSize.sm,
    color:     Colors.textMuted,
    textAlign: 'center',
  },

  // Card
  card: {
    backgroundColor: Colors.surface,
    borderRadius:    Radius.lg,
    padding:         Spacing.lg,
    marginBottom:    Spacing.md,
    gap:             Spacing.md,
    ...Shadow.md,
  },
  cardTitle: {
    fontSize:   FontSize.xl,
    fontWeight: FontWeight.bold,
    color:      Colors.text,
    textAlign:  'right',
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
  input: {
    borderWidth:   1.5,
    borderColor:   Colors.border,
    borderRadius:  Radius.md,
    paddingVertical:   Spacing.sm + 4,
    paddingHorizontal: Spacing.md,
    fontSize:      FontSize.md,
    color:         Colors.text,
    backgroundColor: Colors.background,
  },
  pwdWrap: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  pwdInput: { flex: 1 },
  eyeBtn: {
    position:    'absolute',
    left:        Spacing.sm,
    top: 0, bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
  },
  eyeIcon: { fontSize: 18 },

  // Button
  btn: {
    backgroundColor: Colors.primary,
    borderRadius:    Radius.md,
    paddingVertical: Spacing.md,
    alignItems:      'center',
    minHeight:       52,
    justifyContent:  'center',
    ...Shadow.md,
  },
  btnPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  btnText: {
    fontSize:   FontSize.lg,
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
