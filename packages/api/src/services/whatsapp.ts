// ============================================================
// WhatsApp Cloud API (Meta) — replaces Twilio for emergency
// messages. No npm package needed; uses the standard fetch API.
//
// FREE TIER SETUP (graduation project / demo):
//   1. Go to developers.facebook.com → My Apps → Create App
//   2. Add "WhatsApp" product to the app
//   3. Under WhatsApp → Getting Started, Meta gives you a free
//      test phone number (From Number ID)
//   4. Register up to 5 recipient numbers as "test numbers" —
//      these can receive any message without template approval
//   5. Copy the temporary access token (lasts 24h) or create a
//      permanent System User token in Meta Business Suite
//
// ENV VARS:
//   WHATSAPP_PHONE_NUMBER_ID=  (the "From" number ID, e.g. 123456789012345)
//   WHATSAPP_ACCESS_TOKEN=     (permanent System User token or temp token)
// ============================================================

const WA_API_VERSION = 'v25.0';

export interface WaMessagePayload {
  to:   string;   // E.164 format, with or without leading +
  body: string;
}

export async function sendWhatsAppMessage(payload: WaMessagePayload): Promise<void> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken   = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    throw new Error('WhatsApp credentials not configured (WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_ACCESS_TOKEN).');
  }

  // WhatsApp expects digits only, no +, spaces, or dashes (e.g. 9613xxxxxxx)
  const to = payload.to.replace(/\D/g, '');

  const res = await fetch(
    `https://graph.facebook.com/${WA_API_VERSION}/${phoneNumberId}/messages`,
    {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: {
          preview_url: true,   // unfurl the tracking link inside WhatsApp
          body: payload.body,
        },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as any;
    const meta = body?.error ?? {};

    /* Give actionable messages for the most common Meta error codes */
    let hint = '';
    if (meta.type === 'OAuthException') {
      if (meta.code === 190)       hint = ' — token expired: regenerate at developers.facebook.com';
      else if (meta.code === 1)    hint = ' — token invalid or not authorised (likely expired 24h test token)';
      else if (meta.code === 10)   hint = ' — app lacks whatsapp_business_messaging permission';
    } else if (res.status === 400) {
      if (meta.code === 131030)    hint = ' — recipient not in test contact list (add in Meta dashboard)';
      else if (meta.code === 131026) hint = ' — phone number not on WhatsApp';
    }

    throw new Error(
      `WhatsApp API error ${res.status}${hint}: ${meta.message ?? JSON.stringify(body)}`
    );
  }
}

/**
 * Builds the SOS WhatsApp message body sent to emergency contacts.
 */
export function buildSosMessage(params: {
  userName:     string;
  trackingLink: string;
}): string {
  return [
    `🚨 *نداء استغاثة — ${params.userName}*`,
    '',
    'لقد فعّلت زر الاستغاثة الطارئة في تطبيق نجوم.',
    '',
    `📍 *تتبع موقعها المباشر (60 دقيقة):*\n${params.trackingLink}`,
    '',
    'ردّ بـ "بخير" إذا تواصلت معكِ وهي بأمان.',
  ].join('\n');
}

/**
 * Builds the "I am safe" WhatsApp message sent when the user resolves their SOS.
 */
export function buildSafeMessage(params: { userName: string }): string {
  return [
    `✅ *أنا بخير — ${params.userName}*`,
    '',
    'أعلنت أنها بأمان الآن وأنهت نداء الاستغاثة في تطبيق نجوم.',
    '',
    'شكراً لك على اهتمامك. 💚',
  ].join('\n');
}
