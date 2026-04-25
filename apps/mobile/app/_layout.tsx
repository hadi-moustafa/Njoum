// ============================================================
// Root Layout — session listener + auth guard
// Redirects to /sign-in when no session, to /(tabs) when authed.
// Also forces RTL for Arabic locale.
// ============================================================
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { I18nManager } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/authStore';
import {
  registerForPushNotifications,
  syncPushToken,
  setupNotificationListeners,
} from '../services/notifications';
import { initSentry, identifyUser, clearUser } from '../services/sentry';

// Initialise Sentry before any component renders
initSentry();

// Keep splash visible until we know auth state
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min
      retry: 2,
    },
  },
});

function AuthGuard() {
  const { session, isReady, setSession, loadProfile } = useAuthStore();
  const router   = useRouter() as any;
  const segments = useSegments();

  // Listen for Supabase auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        if (newSession) {
          await loadProfile();
          identifyUser(newSession.user.id, newSession.user.email ?? '');
          const token = await registerForPushNotifications();
          if (token) syncPushToken(token);
        } else {
          clearUser();
        }
      }
    );

    // Get existing session on mount
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) loadProfile();
    });

    // Deep-link listener for notification taps
    const removeListeners = setupNotificationListeners(router);

    return () => {
      subscription.unsubscribe();
      removeListeners();
    };
  }, []);

  // Route guard
  useEffect(() => {
    if (!isReady) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }

    SplashScreen.hideAsync();
  }, [session, isReady, segments]);

  return null;
}

export default function RootLayout() {
  // Force RTL for Arabic — adjust based on user language preference
  // TODO: make dynamic based on user profile language
  useEffect(() => {
    I18nManager.allowRTL(true);
    // I18nManager.forceRTL(true);  // uncomment for Arabic default
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthGuard />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)"  options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)"  options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
