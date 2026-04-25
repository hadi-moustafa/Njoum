// ============================================================
// SOS Controller
// POST   /api/v1/sos              — trigger SOS
// PATCH  /api/v1/sos/:id/cancel   — cancel within grace period
// PATCH  /api/v1/sos/:id/resolve  — mark situation safe
// GET    /api/v1/sos/active        — get active SOS for current user
// ============================================================
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../models/supabase';
import { sendSms, buildSosMessage } from '../services/twilio';
import { sendPushMulti } from '../services/fcm';
import { ok, created } from '../services/response';
import { AppError } from '../middleware/errorHandler';
import { SOS_TRACKING_LINK_TTL_MINS, SOS_GRACE_PERIOD_SECONDS } from '@njoum/shared';

// ── Validation schemas ────────────────────────────────────────

const TriggerSosSchema = z.object({
  trigger_method: z.enum(['button', 'shake', 'volume', 'safe_word']),
  latitude:       z.number().min(-90).max(90).optional(),
  longitude:      z.number().min(-180).max(180).optional(),
  address:        z.string().max(300).optional(),
});

// ── POST /api/v1/sos ──────────────────────────────────────────
export async function triggerSos(req: Request, res: Response, next: NextFunction) {
  try {
    const body = TriggerSosSchema.parse(req.body);
    const userId = req.user!.id;

    // Fetch user display name for SMS
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('full_name, display_name')
      .eq('id', userId)
      .single();

    const userName = user?.display_name ?? user?.full_name ?? 'A Njoum user';

    // Create the SOS event
    const { data: sosEvent, error: sosError } = await supabaseAdmin
      .from('sos_events')
      .insert({
        user_id:        userId,
        trigger_method: body.trigger_method,
        latitude:       body.latitude,
        longitude:      body.longitude,
        address:        body.address,
      })
      .select('*')
      .single();

    if (sosError || !sosEvent) {
      throw new AppError(500, 'SOS_FAILED', 'Could not create SOS event.');
    }

    // Build tracking link (valid for 60 min)
    const expiresAt = new Date(Date.now() + SOS_TRACKING_LINK_TTL_MINS * 60 * 1000);
    const trackingLink = `${process.env.APP_URL}/track/${sosEvent.id}`;

    // Fetch all contacts that should be notified
    const { data: contacts } = await supabaseAdmin
      .from('emergency_contacts')
      .select('id, name, phone, notify_on_sos')
      .eq('user_id', userId)
      .eq('notify_on_sos', true)
      .order('notify_order', { ascending: true });

    // Dispatch notifications (fire after response — don't block)
    const dispatchPromises = (contacts ?? []).map(async (contact) => {
      const channel = 'both'; // SMS + push

      // Insert notification record
      const { data: notifRecord } = await supabaseAdmin
        .from('sos_notifications')
        .insert({
          sos_event_id:  sosEvent.id,
          contact_id:    contact.id,
          channel,
          tracking_link: trackingLink,
          expires_at:    expiresAt.toISOString(),
          status:        'pending',
        })
        .select('id')
        .single();

      let status: 'sent' | 'failed' = 'sent';
      try {
        // Send SMS
        await sendSms({
          to:   contact.phone,
          body: buildSosMessage({ userName, trackingLink, address: body.address }),
        });
      } catch (smsErr) {
        console.error(`[SOS] SMS failed for contact ${contact.id}:`, smsErr);
        status = 'failed';
      }

      // Update notification status
      if (notifRecord) {
        await supabaseAdmin
          .from('sos_notifications')
          .update({ status, sent_at: new Date().toISOString() })
          .eq('id', notifRecord.id);
      }
    });

    // Also log a push notification record for the user themselves (for history)
    await supabaseAdmin.from('push_notifications').insert({
      user_id: userId,
      type:    'sos_alert',
      title:   'SOS Activated',
      body:    'Your emergency contacts have been notified.',
      status:  'sent',
      sent_at: new Date().toISOString(),
    });

    // Dispatch all contact notifications in parallel (non-blocking)
    Promise.all(dispatchPromises).catch(err =>
      console.error('[SOS] Dispatch error:', err)
    );

    created(res, {
      sos_event_id:  sosEvent.id,
      tracking_link: trackingLink,
      expires_at:    expiresAt.toISOString(),
      contacts_alerted: (contacts ?? []).length,
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

    // Enforce grace period
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

    ok(res, data);
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
