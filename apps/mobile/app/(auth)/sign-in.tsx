// ============================================================
// Sign-In Screen — Google Sign-In via Supabase Auth
// ============================================================
import { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable,
  ActivityIndicator, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '../../services/supabase';
import { Colors, Spacing, FontSize, FontWeight, Radius } from '../../constants/theme';

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const [loading, setLoading] = useState(false);

  async function handleGoogleSignIn() {
    setLoading(true);
    try {
      const redirectTo = makeRedirectUri({ scheme: 'njoum', path: 'auth/callback' });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: { access_type: 'offline', prompt: 'consent' },
        },
      });

      if (error) throw error;

      // Open browser for Google OAuth
      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (result.type === 'success' && result.url) {
          // Supabase will detect the session from the callback URL automatically
          const { error: sessionError } = await supabase.auth.exchangeCodeForSession(
            new URL(result.url).searchParams.get('code') ?? ''
          );
          if (sessionError) throw sessionError;
        }
      }
    } catch (err: any) {
      Alert.alert('Sign-in failed', err?.message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Logo area */}
      <View style={styles.hero}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoStar}>★</Text>
        </View>
        <Text style={styles.appName}>نجوم</Text>
        <Text style={styles.tagline}>حين يحلّ الظلام، انظري للأعلى — نحن هناك</Text>
      </View>

      {/* Sign-in */}
      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.googleButton, pressed && styles.pressed]}
          onPress={handleGoogleSignIn}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="تسجيل الدخول بحساب Google"
        >
          {loading ? (
            <ActivityIndicator color={Colors.text} />
          ) : (
            <>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleLabel}>المتابعة بحساب Google</Text>
            </>
          )}
        </Pressable>

        <Text style={styles.disclaimer}>
          باستخدام التطبيق، توافقين على سياسة الخصوصية وشروط الاستخدام.
          بياناتك آمنة ومشفّرة.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  logoStar: {
    fontSize: 48,
    color: '#FFFFFF',
  },
  appName: {
    fontSize: FontSize.h1,
    fontWeight: FontWeight.extrabold,
    color: Colors.primary,
    textAlign: 'center',
  },
  tagline: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: Spacing.md,
  },
  actions: {
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    minHeight: 52,
  },
  pressed: {
    opacity: 0.7,
  },
  googleIcon: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: '#4285F4',
  },
  googleLabel: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    textAlign: 'center',
  },
  disclaimer: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
