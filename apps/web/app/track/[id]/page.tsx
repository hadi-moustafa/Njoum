// ============================================================
// /track/[id] — Public SOS tracking page.
// Sent to emergency contacts via Twilio SMS.
// No auth required — the UUID in the URL is the access token.
// ============================================================
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';
import TrackingClient from './TrackingClient';

export const dynamic = 'force-dynamic';

export default async function TrackingPage({ params }: { params: { id: string } }) {
  const { data: event } = await supabaseAdmin
    .from('sos_events')
    .select('id, user_id, trigger_method, cancelled, resolved_at, created_at, lat, lng, users(full_name)')
    .eq('id', params.id)
    .maybeSingle();

  if (!event) notFound();

  // Expire the page after 60 min even if link is guessed
  const createdAt  = new Date(event.created_at);
  const expiresAt  = new Date(createdAt.getTime() + 60 * 60 * 1000);
  const isExpired  = Date.now() > expiresAt.getTime();

  if (isExpired && !event.resolved_at && !event.cancelled) {
    // Still show the page but as expired
  }

  const status: 'active' | 'resolved' | 'cancelled' =
    event.cancelled   ? 'cancelled'
  : event.resolved_at ? 'resolved'
  : isExpired         ? 'resolved'   // treat expired link as closed
  : 'active';

  const userName = (event.users as any)?.full_name ?? 'مستخدمة نجوم';

  return (
    <TrackingClient
      sosEventId={event.id}
      userName={userName}
      triggeredAt={event.created_at}
      status={status}
      initialLat={event.lat ?? null}
      initialLng={event.lng ?? null}
      expiresAt={expiresAt.toISOString()}
    />
  );
}
