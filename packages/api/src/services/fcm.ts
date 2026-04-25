// ============================================================
// Firebase Cloud Messaging service — push notifications
// ============================================================
import * as admin from 'firebase-admin';

let _initialized = false;

function getApp(): admin.app.App {
  if (!_initialized) {
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!credPath) throw new Error('GOOGLE_APPLICATION_CREDENTIALS not configured.');

    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    _initialized = true;
  }
  return admin.app();
}

export interface PushPayload {
  token: string;       // FCM device token
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Sends a push notification to a single device token.
 */
export async function sendPush(payload: PushPayload): Promise<void> {
  await getApp().messaging().send({
    token: payload.token,
    notification: { title: payload.title, body: payload.body },
    data: payload.data ?? {},
    android: { priority: 'high' },
    apns:    { payload: { aps: { sound: 'default', contentAvailable: true } } },
  });
}

/**
 * Sends to multiple tokens (batch, max 500 per call).
 * Returns count of successful sends.
 */
export async function sendPushMulti(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<number> {
  if (tokens.length === 0) return 0;

  const messages: admin.messaging.Message[] = tokens.map(token => ({
    token,
    notification: { title, body },
    data: data ?? {},
    android: { priority: 'high' as const },
    apns:    { payload: { aps: { sound: 'default', contentAvailable: true } } },
  }));

  // sendEach handles up to 500 messages per call
  const response = await getApp().messaging().sendEach(messages);
  return response.successCount;
}
