import { useState, useRef } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, TextInput as TI,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../services/supabase';
import { useColorScheme } from '../../hooks/useColorScheme';
import { StarField } from '../../components/home/StarField';
import { Illustration } from '../../components/home/Illustration';
import { Spacing, FontSize, FontWeight, Radius } from '../../constants/theme';

export default function SignInScreen() {
  const router                   = useRouter();
  const { isDark, colors, lang } = useColorScheme();
  const isRTL                    = lang === 'ar';

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const pwdRef = useRef<TI>(null);

  const validate = () => {
    if (!email.trim())                  { setError(isRTL ? 'الرجاء إدخال البريد الإلكتروني' : 'Please enter your email');    return false; }
    if (!/\S+@\S+\.\S+/.test(email))   { setError(isRTL ? 'البريد الإلكتروني غير صحيح'     : 'Invalid email address');      return false; }
    if (!password)                      { setError(isRTL ? 'الرجاء إدخال كلمة المرور'       : 'Please enter your password'); return false; }
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
        setError(isRTL ? 'البريد الإلكتروني لم يتم تأكيده.' : 'Email not confirmed. Please verify first.');
      } else if (e.message.includes('Invalid login')) {
        setError(isRTL ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'Invalid email or password');
      } else {
        setError(e.message);
      }
      return;
    }

    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      {isDark && <StarField />}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Brand Hero ── */}
          <View style={[styles.hero, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={styles.heroLeft}>
              <View style={[styles.logoRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <LinearGradient
                  colors={['#B5586A', '#7A4E7A']}
                  style={styles.logoCircle}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.logoStar}>✦</Text>
                </LinearGradient>
                <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                  <Text style={[styles.appName, { color: isDark ? colors.starGold : colors.primary }]}>
                    {isRTL ? 'نجوم' : 'Njoum'}
                  </Text>
                  <Text style={[styles.tagline, { color: colors.textMuted }]}>
                    {isRTL ? 'حين يحلّ الظلام، انظري للأعلى' : "When it's dark, look up"}
                  </Text>
                </View>
              </View>
              <View style={styles.decoRow}>
                {(isDark
                  ? ['✦', '✧', '·', '✦', '·']
                  : ['·', '✦', '·', '✦', '·']
                ).map((s, i) => (
                  <Text key={i} style={[styles.deco, { color: isDark ? '#E8C86A' : colors.primary, opacity: 0.25 + i * 0.1 }]}>
                    {s}
                  </Text>
                ))}
              </View>
            </View>
            <Illustration name={isDark ? 'girl-standing' : 'girl-phone'} height={110} />
          </View>

          {/* ── Login Card ── */}
          <View style={[styles.card, {
            backgroundColor: isDark ? colors.card   : colors.surface,
            borderColor:     isDark ? '#2C1C48'     : '#F0E4E0',
            shadowColor:     isDark ? '#A480FF'     : '#B5586A',
          }]}>
            <Text style={[styles.cardTitle, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'تسجيل الدخول' : 'Sign In'}
            </Text>

            {!!error && (
              <View style={styles.errorBox}>
                <Text style={[styles.errorText, { textAlign: isRTL ? 'right' : 'left' }]}>{error}</Text>
              </View>
            )}

            {/* Email */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL ? 'البريد الإلكتروني' : 'Email'}
              </Text>
              <TextInput
                style={[styles.input, {
                  borderColor:     isDark ? '#2C1C48'       : '#E8D5D0',
                  color:           colors.text,
                  backgroundColor: isDark ? colors.surface  : colors.background,
                }]}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="example@email.com"
                placeholderTextColor={colors.textMuted}
                textAlign={isRTL ? 'right' : 'left'}
                returnKeyType="next"
                onSubmitEditing={() => pwdRef.current?.focus()}
              />
            </View>

            {/* Password */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL ? 'كلمة المرور' : 'Password'}
              </Text>
              <View style={styles.pwdWrap}>
                <TextInput
                  ref={pwdRef}
                  style={[styles.input, styles.pwdInput, {
                    borderColor:     isDark ? '#2C1C48'      : '#E8D5D0',
                    color:           colors.text,
                    backgroundColor: isDark ? colors.surface : colors.background,
                  }]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPwd}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textMuted}
                  textAlign={isRTL ? 'right' : 'left'}
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
              style={({ pressed }) => [styles.btn, { opacity: pressed ? 0.85 : 1 }]}
              onPress={handleLogin}
              disabled={loading}
              accessibilityRole="button"
            >
              <LinearGradient
                colors={['#B5586A', '#7A4E7A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>{isRTL ? 'دخول' : 'Sign In'}</Text>
              }
            </Pressable>
          </View>

          {/* ── Footer ── */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textMuted }]}>
              {isRTL ? 'ليس لديكِ حساب؟' : "Don't have an account?"}
            </Text>
            <Link
              href="/(auth)/sign-up"
              style={[styles.link, { color: isDark ? colors.starGold : colors.primary }]}
            >
              {isRTL ? 'إنشاء حساب جديد' : 'Create an account'}
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { flexGrow: 1, padding: Spacing.md, justifyContent: 'center', gap: Spacing.lg },

  hero: {
    alignItems:     'flex-end',
    justifyContent: 'space-between',
  },
  heroLeft: { flex: 1, gap: Spacing.sm },
  logoRow: {
    alignItems: 'center',
    gap:        Spacing.sm,
  },
  logoCircle: {
    width:          52,
    height:         52,
    borderRadius:   Radius.lg,
    alignItems:     'center',
    justifyContent: 'center',
  },
  logoStar: { fontSize: 26, color: '#fff' },
  appName:  { fontSize: 26, fontWeight: FontWeight.extrabold, letterSpacing: -0.5 },
  tagline:  { fontSize: 11, marginTop: 2 },
  decoRow:  { flexDirection: 'row', gap: 4, paddingLeft: 4 },
  deco:     { fontSize: 14 },

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
  cardTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },

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
  input: {
    borderWidth:       1.5,
    borderRadius:      Radius.md,
    paddingVertical:   Spacing.sm + 4,
    paddingHorizontal: Spacing.md,
    fontSize:          FontSize.md,
  },
  pwdWrap:  { flexDirection: 'row', alignItems: 'center' },
  pwdInput: { flex: 1 },
  eyeBtn: {
    position:          'absolute',
    left:              Spacing.sm,
    top: 0, bottom: 0,
    justifyContent:    'center',
    paddingHorizontal: Spacing.xs,
  },
  eyeIcon: { fontSize: 18 },

  btn: {
    borderRadius:    Radius.lg,
    paddingVertical: Spacing.md,
    alignItems:      'center',
    minHeight:       52,
    justifyContent:  'center',
    overflow:        'hidden',
  },
  btnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#fff' },

  footer:     { alignItems: 'center', gap: Spacing.xs, paddingBottom: Spacing.md },
  footerText: { fontSize: FontSize.sm },
  link:       { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
});
