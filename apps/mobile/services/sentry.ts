// ============================================================
// Sentry for React Native — error + performance monitoring
// Call init() once before rendering the root component.
// ============================================================
import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

export function initSentry(): void {
  const dsn = Constants.expoConfig?.extra?.['sentryDsn'] as string | undefined;
  if (!dsn) return; // skip in dev when DSN is not configured

  Sentry.init({
    dsn,
    environment:      __DEV__ ? 'development' : 'production',
    tracesSampleRate: __DEV__ ? 0 : 0.2,
    // Attach user context automatically (set via Sentry.setUser in authStore)
    integrations: [
      Sentry.mobileReplayIntegration({ maskAllText: true, maskAllImages: true }),
    ],
  });
}

export function identifyUser(userId: string, email: string): void {
  Sentry.setUser({ id: userId, email });
}

export function clearUser(): void {
  Sentry.setUser(null);
}

export function captureError(err: unknown, context?: Record<string, unknown>): void {
  if (context) Sentry.setContext('extra', context);
  Sentry.captureException(err);
}
