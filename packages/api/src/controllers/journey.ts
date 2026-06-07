// ============================================================
// Journey Tracks Controller
//
// GET    /api/v1/journey           — list user's journey tracks
// POST   /api/v1/journey           — start tracking a journey
// PATCH  /api/v1/journey/:id/safe  — mark arrived safely
// PATCH  /api/v1/journey/:id/cancel — cancel an active journey
// ============================================================
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../models/supabase';
import { ok, created } from '../services/response';
import { AppError } from '../middleware/errorHandler';
import { sendPushMulti } from '../services/fcm';
import { sendSms } from '../services/twilio';

const StartJourneySchema = z.object({
  destination:      z.string().max(200).optional(),
  expected_arrival: z.string().datetime(),   // ISO 8601
  share_with_contacts: z.boolean().default(true),
});

// ── GET /api/v1/journey ───────────────────────────────────────
export async function listJourneys(req: Request, res: Response, next: NextFunction) {
  try {
    const { data, error } = await supabaseAdmin
      .from('journey_tracks')
      .select('id, destination, expected_arrival, marked_safe, marked_safe_at, created_at')
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw new AppError(500, 'DB_ERROR', error.message);
    ok(res, data ?? []);
  } catch (err) { next(err); }
}

// ── POST /api/v1/journey ──────────────────────────────────────
export async function startJourney(req: Request, res: Response, next: NextFunction) {
  try {
    const body = StartJourneySchema.parse(req.body);
    const userId = req.user!.id;

    // Only one active journey at a time
    const { data: existing } = await supabaseAdmin
      .from('journey_tracks')
      .select('id')
      .eq('user_id', userId)
      .eq('marked_safe', false)
      .limit(1)
      .maybeSingle();

    if (existing) {
      throw new AppError(409, 'ACTIVE_JOURNEY', 'You already have an active journey. Mark it safe first.');
    }

    const { data: journey, error } = await supabaseAdmin
      .from('journey_tracks')
      .insert({
        user_id:          userId,
        destination:      body.destination,
        expected_arrival: body.expected_arrival,
      })
      .select('*')
      .single();

    if (error || !journey) throw new AppError(500, 'DB_ERROR', error?.message ?? 'Failed to start journey.');

    // Notify emergency contacts
    if (body.share_with_contacts) {
      const { data: contacts } = await supabaseAdmin
        .from('emergency_contacts')
        .select('name, phone')
        .eq('user_id', userId)
        .eq('notify_on_sos', true)
        .order('notify_order', { ascending: true });

      const { data: user } = await supabaseAdmin
        .from('users')
        .select('full_name')
        .eq('id', userId)
        .single();

      const userName = user?.full_name ?? 'A Njoum user';
      const dest     = body.destination ?? 'their destination';
      const arrival  = new Date(body.expected_arrival).toLocaleTimeString('ar', { timeStyle: 'short' });
      const smsBody  = `${userName} بدأت رحلة إلى ${dest} وتتوقع الوصول الساعة ${arrival}. ستتلقى تأكيداً عند وصولها.`;

      for (const contact of (contacts ?? [])) {
        try {
          await sendSms({ to: contact.phone, body: smsBody });
        } catch { /* non-blocking */ }
      }
    }

    created(res, journey);
  } catch (err) { next(err); }
}

// ── PATCH /api/v1/journey/:id/safe ────────────────────────────
export async function markJourneySafe(req: Request, res: Response, next: NextFunction) {
  try {
    const { data: journey } = await supabaseAdmin
      .from('journey_tracks')
      .select('id, user_id, marked_safe, destination')
      .eq('id', req.params.id!)
      .single();

    if (!journey) throw new AppError(404, 'NOT_FOUND', 'Journey not found.');
    if (journey.user_id !== req.user!.id) throw new AppError(403, 'FORBIDDEN', 'Not your journey.');
    if (journey.marked_safe) throw new AppError(409, 'ALREADY_SAFE', 'Journey already marked safe.');

    const { data, error } = await supabaseAdmin
      .from('journey_tracks')
      .update({ marked_safe: true, marked_safe_at: new Date().toISOString() })
      .eq('id', req.params.id!)
      .select('id, marked_safe, marked_safe_at')
      .single();

    if (error) throw new AppError(500, 'DB_ERROR', error.message);

    // Notify contacts: user arrived safely
    const userId = req.user!.id;
    const { data: contacts } = await supabaseAdmin
      .from('emergency_contacts')
      .select('name, phone')
      .eq('user_id', userId)
      .eq('notify_on_sos', true)
      .order('notify_order', { ascending: true });

    const { data: user } = await supabaseAdmin
      .from('users')
      .select('full_name')
      .eq('id', userId)
      .single();

    const userName = user?.full_name ?? 'المستخدمة';
    const smsBody  = `✅ ${userName} وصلت بأمان${journey.destination ? ` إلى ${journey.destination}` : ''}.`;

    for (const contact of (contacts ?? [])) {
      try {
        await sendSms({ to: contact.phone, body: smsBody });
      } catch { /* non-blocking */ }
    }

    ok(res, data);
  } catch (err) { next(err); }
}

// ── PATCH /api/v1/journey/:id/cancel ─────────────────────────
export async function cancelJourney(req: Request, res: Response, next: NextFunction) {
  try {
    const { data: journey } = await supabaseAdmin
      .from('journey_tracks')
      .select('id, user_id, marked_safe')
      .eq('id', req.params.id!)
      .single();

    if (!journey) throw new AppError(404, 'NOT_FOUND', 'Journey not found.');
    if (journey.user_id !== req.user!.id) throw new AppError(403, 'FORBIDDEN', 'Not your journey.');
    if (journey.marked_safe) throw new AppError(409, 'ALREADY_SAFE', 'Journey already completed.');

    // Mark as safe with note — simplest cancellation (keeps the record)
    const { data, error } = await supabaseAdmin
      .from('journey_tracks')
      .update({ marked_safe: true, marked_safe_at: new Date().toISOString() })
      .eq('id', req.params.id!)
      .select('id, marked_safe')
      .single();

    if (error) throw new AppError(500, 'DB_ERROR', error.message);
    ok(res, data);
  } catch (err) { next(err); }
}
