// ============================================================
// Push notification registration + deep-link routing
// ============================================================
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { Router } from 'expo-router';
import { api } from './api';

// Display banners even when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert:  true,
    shouldShowBanner: true,
    shouldShowList:   true,
    shouldPlaySound:  true,
    shouldSetBadge:   false,
  }),
});

// ── Token registration ────────────────────────────────────────

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null; // simulators cannot receive push

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name:       'default',
      importance: Notifications.AndroidImportance.MAX,
      sound:      'default',
    });
    await Notifications.setNotificationChannelAsync('sos', {
      name:       'SOS Alerts',
      importance: Notifications.AndroidImportance.MAX,
      sound:      'default',
      vibrationPattern: [0, 500, 200, 500],
    });
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  return token;
}

export async function syncPushToken(token: string): Promise<void> {
  await api.patch('/users/me', { push_token: token });
}

// ── Deep-link routing from notification data ──────────────────

type NotifType =
  | 'sos_alert'
  | 'period_reminder'
  | 'badge_earned'
  | 'journey_alert'
  | 'moderation'
  | 'affirmation'
  | 'general';

export function routeNotification(
  data: Record<string, string> | undefined,
  router: Router,
): void {
  if (!data) return;
  const type = data['type'] as NotifType | undefined;

  switch (type) {
    case 'sos_alert':
      // Navigate to the active SOS event details — shows map / resolve button
      router.push('/(tabs)/safety' as any);
      break;

    case 'journey_alert':
      router.push('/(tabs)/safety/journey' as any);
      break;

    case 'period_reminder':
      router.push('/(tabs)/wellness/cycle' as any);
      break;

    case 'badge_earned':
      // Deep-link to the specific badge if ID provided
      router.push('/(tabs)/safety/scouts' as any);
      break;

    case 'moderation':
      // Community post that was flagged / removed
      if (data['group_id']) {
        router.push(`/(tabs)/community/feed?groupId=${data['group_id']}` as any);
      } else {
        router.push('/(tabs)/community' as any);
      }
      break;

    case 'affirmation':
    case 'general':
    default:
      // No navigation — notification banner is enough
      break;
  }
}

// ── Listener setup (call once in root layout) ─────────────────

export function setupNotificationListeners(router: Router): () => void {
  // Notification tapped while app was background/killed
  const tapSub = Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data as Record<string, string> | undefined;
    routeNotification(data, router);
  });

  // Notification received while app is foregrounded (no navigation — just show banner)
  const fgSub = Notifications.addNotificationReceivedListener(_notification => {
    // Badge counts or in-app indicators could be updated here
  });

  return () => {
    tapSub.remove();
    fgSub.remove();
  };
}
