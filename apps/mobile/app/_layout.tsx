import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { I18nManager } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { queryPersister } from '../services/queryPersister';
import { supabase } from '../services/supabase';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
      gcTime: 1000 * 60 * 60 * 24 * 7,
    },
  },
});

export default function RootLayout() {
  const router   = useRouter();
  const segments = useSegments();

  useEffect(() => {
    I18nManager.allowRTL(true);
    SplashScreen.hideAsync();
  }, []);

  // Listen for auth state changes so Google OAuth (and token refresh) are
  // handled globally without relying solely on sign-in screen navigation.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const inAuthGroup = segments[0] === '(auth)';

      if (event === 'SIGNED_IN' && session && inAuthGroup) {
        // User just authenticated — move them into the app.
        router.replace('/(tabs)');
      } else if (event === 'SIGNED_OUT') {
        // Session ended — send to sign-in.
        router.replace('/(auth)/sign-in');
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{
            persister: queryPersister,
            maxAge:    1000 * 60 * 60 * 24 * 7,
          }}
        >
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index"                  options={{ headerShown: false }} />
            <Stack.Screen name="(auth)"                 options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)"                 options={{ headerShown: false }} />
            <Stack.Screen name="sos-tracking/[id]"      options={{ presentation: 'fullScreenModal', headerShown: false }} />
            <Stack.Screen name="article/[id]"           options={{ presentation: 'card' }} />
            <Stack.Screen name="quiz/[id]"              options={{ presentation: 'card' }} />
            <Stack.Screen name="legal/[id]"             options={{ presentation: 'card' }} />
            <Stack.Screen name="mentor-dashboard/index" options={{ presentation: 'card', headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
