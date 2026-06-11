import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { I18nManager } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { queryPersister } from '../services/queryPersister';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
      // Offline-capable queries (hotlines, activities, videos) set gcTime to Infinity
      // in their own queryFn options so they survive offline app restarts.
      gcTime: 1000 * 60 * 60 * 24 * 7,  // 7-day default GC — matches persister max age
    },
  },
});

export default function RootLayout() {
  useEffect(() => {
    I18nManager.allowRTL(true);
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{
            persister: queryPersister,
            maxAge:    1000 * 60 * 60 * 24 * 7,   // 7 days
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
