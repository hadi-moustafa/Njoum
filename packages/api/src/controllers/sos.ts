// ============================================================
// SOS Controller
// Actual schema: lat/lng (not latitude/longitude), no address,
// full_name (not display_name).
// ============================================================
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../models/supabase';
import { sendWhatsAppMessage, buildSosMessage, buildSafeMessage } from '../services/whatsapp';
import { ok, created } from '../services/response';
import { AppError } from '../middleware/errorHandler';
import { SOS_TRACKING_LINK_TTL_MINS, SOS_GRACE_PERIOD_SECONDS } from '@njoum/shared';

const TriggerSosSchema = z.object({
  trigger_method: z.enum(['button', 'shake', 'volume', 'safe_word']),
  lat:            z.number().min(-90).max(90).optional(),
  lng:            z.number().min(-180).max(180).optional(),
});

// ── POST /api/v1/sos ──────────────────────────────────────────
export async function triggerSos(req: Request, res: Response, next: NextFunction) {
  try {
    const body   = TriggerSosSchema.parse(req.body);
    const userId = req.user!.id;

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('full_name')
      .eq('id', userId)
      .single();

    const userName = user?.full_name ?? 'A Njoum user';

    const { data: sosEvent, error: sosError } = await supabaseAdmin
      .from('sos_events')
      .insert({
        user_id:        userId,
        trigger_method: body.trigger_method,
        lat:            body.lat,
        lng:            body.lng,
      })
      .select('*')
      .single();

    if (sosError || !sosEvent) throw new AppError(500, 'SOS_FAILED', 'Could not create SOS event.');

    const expiresAt    = new Date(Date.now() + SOS_TRACKING_LINK_TTL_MINS * 60 * 1000);
    const webBase      = process.env.WEB_URL ?? process.env.APP_URL;
    const trackingLink = `${webBase}/track/${sosEvent.id}`;

    const { data: contacts } = await supabaseAdmin
      .from('emergency_contacts')
      .select('id, name, phone, notify_on_sos')
      .eq('user_id', userId)
      .eq('notify_on_sos', true)
      .order('notify_order', { ascending: true });

    console.log(`[SOS] Dispatching to ${(contacts ?? []).length} contact(s) for event ${sosEvent.id}`);

    const dispatchPromises = (contacts ?? []).map(async (contact) => {
      console.log(`[SOS] → Sending WhatsApp to ${contact.name} (${contact.phone})`);

      await supabaseAdmin
        .from('sos_notifications')
        .insert({
          sos_event_id:  sosEvent.id,
          contact_id:    contact.id,
          channel:       'both',
          tracking_link: trackingLink,
          expires_at:    expiresAt.toISOString(),
          status:        'pending',
        });

      try {
        await sendWhatsAppMessage({
          to:   contact.phone,
          body: buildSosMessage({ userName, trackingLink }),
        });
        console.log(`[SOS] ✓ WhatsApp accepted for ${contact.name} (${contact.phone})`);
        await supabaseAdmin
          .from('sos_notifications')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('sos_event_id', sosEvent.id)
          .eq('contact_id', contact.id);
      } catch (err: any) {
        console.error(`[SOS] ✗ WhatsApp FAILED for ${contact.name} (${contact.phone}):`, err?.message ?? err);
        await supabaseAdmin
          .from('sos_notifications')
          .update({ status: 'failed' })
          .eq('sos_event_id', sosEvent.id)
          .eq('contact_id', contact.id);
      }
    });

    Promise.all(dispatchPromises).catch(err =>
      console.error('[SOS] Dispatch error:', err)
    );

    created(res, {
      sos_event_id:         sosEvent.id,
      tracking_link:        trackingLink,
      expires_at:           expiresAt.toISOString(),
      contacts_alerted:     (contacts ?? []).length,
      grace_period_seconds: SOS_GRACE_PERIOD_SECONDS,
    });
  } catch (err) { next(err); }
}

// ── PATCH /api/v1/sos/:id/cancel ──────────────────────────────
export async function cancelSos(req: Request, res: Response, next: NextFunction) {
  try {
    const { data: event } = await supabaseAdmin
      .from('sos_events')
      .select('id, created_at, cancelled, user_id')
      .eq('id', req.params.id!)
      .single();

    if (!event) throw new AppError(404, 'NOT_FOUND', 'SOS event not found.');
    if (event.user_id !== req.user!.id) throw new AppError(403, 'FORBIDDEN', 'Not your SOS event.');
    if (event.cancelled) throw new AppError(409, 'ALREADY_CANCELLED', 'SOS event already cancelled.');

    const elapsed = (Date.now() - new Date(event.created_at).getTime()) / 1000;
    if (elapsed > SOS_GRACE_PERIOD_SECONDS) {
      throw new AppError(422, 'GRACE_PERIOD_EXPIRED', `Cannot cancel after ${SOS_GRACE_PERIOD_SECONDS} seconds.`);
    }

    const { data } = await supabaseAdmin
      .from('sos_events')
      .update({ cancelled: true, cancelled_at: new Date().toISOString() })
      .eq('id', req.params.id!)
      .select('id, cancelled, cancelled_at')
      .single();

    ok(res, data);
  } catch (err) { next(err); }
}

// ── PATCH /api/v1/sos/:id/resolve ─────────────────────────────
export async function resolveSos(req: Request, res: Response, next: NextFunction) {
  try {
    const { data: event } = await supabaseAdmin
      .from('sos_events')
      .select('id, resolved_at, user_id')
      .eq('id', req.params.id!)
      .single();

    if (!event) throw new AppError(404, 'NOT_FOUND', 'SOS event not found.');
    if (event.user_id !== req.user!.id) throw new AppError(403, 'FORBIDDEN', 'Not your SOS event.');
    if (event.resolved_at) throw new AppError(409, 'ALREADY_RESOLVED', 'SOS event already resolved.');

    const { data } = await supabaseAdmin
      .from('sos_events')
      .update({ resolved_at: new Date().toISOString() })
      .eq('id', req.params.id!)
      .select('id, resolved_at')
      .single();

    // Respond immediately, then send "I am safe" WhatsApp messages in background
    ok(res, data);

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('full_name')
      .eq('id', req.user!.id)
      .single();

    const { data: contacts } = await supabaseAdmin
      .from('emergency_contacts')
      .select('name, phone')
      .eq('user_id', req.user!.id)
      .eq('notify_on_sos', true);

    const userName = user?.full_name ?? 'A Njoum user';
    const message  = buildSafeMessage({ userName });

    for (const contact of contacts ?? []) {
      sendWhatsAppMessage({ to: contact.phone, body: message })
        .then(() => console.log(`[SOS] ✓ Safe message sent to ${contact.name} (${contact.phone})`))
        .catch((err: any) => console.error(`[SOS] ✗ Safe message FAILED for ${contact.name}:`, err?.message ?? err));
    }
  } catch (err) { next(err); }
}

// ── GET /api/v1/sos/active ────────────────────────────────────
export async function getActiveSos(req: Request, res: Response, next: NextFunction) {
  try {
    const { data } = await supabaseAdmin
      .from('sos_events')
      .select('*')
      .eq('user_id', req.user!.id)
      .is('resolved_at', null)
      .eq('cancelled', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    ok(res, data ?? null);
  } catch (err) { next(err); }
}
