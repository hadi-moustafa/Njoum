// ============================================================
// Twilio service — sends emergency SMS to contacts
// ============================================================
import twilio from 'twilio';

let _client: ReturnType<typeof twilio> | null = null;

function getClient() {
  if (!_client) {
    const sid   = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !token) throw new Error('Twilio credentials not configured.');
    _client = twilio(sid, token);
  }
  return _client;
}

export interface SmsPayload {
  to: string;          // E.164 phone number e.g. +96170123456
  body: string;
}

export async function sendSms(payload: SmsPayload): Promise<void> {
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!from) throw new Error('TWILIO_FROM_NUMBER not configured.');

  await getClient().messages.create({
    to:   payload.to,
    from,
    body: payload.body,
  });
}

/**
 * Builds the SOS SMS body sent to an emergency contact.
 */
export function buildSosMessage(params: {
  userName: string;
  trackingLink: string;
  address?: string;
}): string {
  const location = params.address
    ? `Location: ${params.address}`
    : 'Location: see tracking link below';

  return [
    `🚨 EMERGENCY ALERT — ${params.userName} has triggered an SOS.`,
    location,
    `Live tracking (60 min): ${params.trackingLink}`,
    'Reply SAFE if she contacts you and is okay.',
  ].join('\n');
}
