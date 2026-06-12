import { useState, useRef } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, TextInput as TI,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import Svg, { Path } from 'react-native-svg';
import { extractCodeFromCallbackUrl, extractTokensFromCallbackUrl, buildUserUpsertPayload } from '@njoum/shared';
import { supabase } from '../../services/supabase';
import { useColorScheme } from '../../hooks/useColorScheme';
import { StarField } from '../../components/home/StarField';
import { Illustration } from '../../components/home/Illustration';
import { Spacing, FontSize, FontWeight, Radius } from '../../constants/theme';

// Required by expo-web-browser to dismiss the auth session on return.
WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const router                   = useRouter();
  const { isDark, colors, lang } = useColorScheme();
  const isRTL                    = lang === 'ar';

  const [email,         setEmail]         = useState('');
  const [password,      setPassword]      = useState('');
  const [showPwd,       setShowPwd]       = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error,         setError]         = useState('');

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

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      // This redirect URI must also be added in Supabase dashboard →
      // Authentication → URL Configuration → Redirect URLs.
      const redirectUrl = makeRedirectUri({ scheme: 'njoum', path: 'auth/callback' });

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo:          redirectUrl,
          skipBrowserRedirect: true,   // we open the browser ourselves below
        },
      });

      if (oauthError || !data.url) {
        setError(isRTL ? 'فشل الاتصال بـ Google. حاولي مرة أخرى.' : 'Failed to connect to Google. Please try again.');
        return;
      }

      // Open the Google consent screen in an in-app browser tab.
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (result.type !== 'success') return;   // user cancelled or browser dismissed

      const callbackUrl = result.url;

      // Primary: PKCE flow — ?code=<value> in the query string.
      const code = extractCodeFromCallbackUrl(callbackUrl);

      if (code) {
        const { data: sd, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) { setError(exchangeError.message); return; }
        if (sd.user) await upsertProfile(sd.user.id, sd.user.email, sd.user.user_metadata);
        router.replace('/(tabs)');
        return;
      }

      // Fallback: implicit flow — #access_token=… in the hash fragment.
      const tokens = extractTokensFromCallbackUrl(callbackUrl);

      if (tokens) {
        const { data: sd, error: setErr } = await supabase.auth.setSession({
          access_token: tokens.accessToken, refresh_token: tokens.refreshToken,
        });
        if (setErr) { setError(setErr.message); return; }
        if (sd.user) await upsertProfile(sd.user.id, sd.user.email, sd.user.user_metadata);
        router.replace('/(tabs)');
      }
    } catch {
      setError(isRTL ? 'حدث خطأ غير متوقع. حاولي مرة أخرى.' : 'An unexpected error occurred. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  async function upsertProfile(
    id:    string,
    email?: string | null,
    meta?:  Record<string, unknown> | null,
  ) {
    await supabase.from('users').upsert(
      buildUserUpsertPayload(id, email, meta),
      { onConflict: 'id', ignoreDuplicates: true }
    );
  }

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

            {/* ── Google Sign-In button ── */}
            <Pressable
              style={({ pressed }) => [
                styles.googleBtn,
                {
                  borderColor:     isDark ? '#2C1C48'      : '#E8D5D0',
                  backgroundColor: isDark ? colors.surface : colors.background,
                  opacity: pressed || googleLoading ? 0.75 : 1,
                },
              ]}
              onPress={handleGoogleSignIn}
              disabled={googleLoading || loading}
              accessibilityRole="button"
            >
              {googleLoading ? (
                <ActivityIndicator color={colors.primary} size="small" />
              ) : (
                <>
                  <GoogleIcon />
                  <Text style={[styles.googleBtnText, { color: colors.text }]}>
                    {isRTL ? 'الدخول بحساب Google' : 'Continue with Google'}
                  </Text>
                </>
              )}
            </Pressable>

            {/* ── Divider ── */}
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: isDark ? '#2C1C48' : '#E8D5D0' }]} />
              <Text style={[styles.dividerText, { color: colors.textMuted }]}>
                {isRTL ? 'أو' : 'or'}
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: isDark ? '#2C1C48' : '#E8D5D0' }]} />
            </View>

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

            {/* Email/password login button */}
            <Pressable
              style={({ pressed }) => [styles.btn, { opacity: pressed ? 0.85 : 1 }]}
              onPress={handleLogin}
              disabled={loading || googleLoading}
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

function GoogleIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <Path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <Path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <Path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </Svg>
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

  googleBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             Spacing.sm,
    borderWidth:     1.5,
    borderRadius:    Radius.lg,
    paddingVertical: Spacing.sm + 4,
    minHeight:       52,
  },
  googleBtnText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold },

  divider:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: FontSize.xs },

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
