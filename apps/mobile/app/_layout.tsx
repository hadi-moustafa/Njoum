import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { I18nManager } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 2 },
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
        <QueryClientProvider client={queryClient}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index"        options={{ headerShown: false }} />
            <Stack.Screen name="(auth)"  options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)"       options={{ headerShown: false }} />
            <Stack.Screen name="article/[id]" options={{ presentation: 'card' }} />
            <Stack.Screen name="quiz/[id]"    options={{ presentation: 'card' }} />
            <Stack.Screen name="legal/[id]"   options={{ presentation: 'card' }} />
            <Stack.Screen name="+not-found" />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
