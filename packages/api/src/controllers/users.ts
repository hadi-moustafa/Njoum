// ============================================================
// Users Controller
// Actual schema: full_name (no display_name), locale (not language),
// country (not country_code), auth_id, is_active, updated_at.
// No last_seen_at, no display_name.
// ============================================================
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../models/supabase';
import { ok, created, noContent } from '../services/response';
import { AppError } from '../middleware/errorHandler';

const UpdateProfileSchema = z.object({
  full_name:  z.string().min(1).max(100).optional(),
  avatar_url: z.string().url().optional(),
  locale:     z.enum(['ar', 'en', 'fr']).optional(),
  age_range:  z.enum(['10-12', '13-17', '18-24', '25+']).optional(),
  safe_word:  z.string().min(2).max(30).optional(),
  push_token: z.string().max(500).optional(),
  country:    z.string().length(2).toUpperCase().optional(),
});

const EmergencyContactSchema = z.object({
  name:          z.string().min(1).max(100),
  phone:         z.string().min(7).max(20),
  relationship:  z.string().max(50).optional(),
  notify_order:  z.number().int().min(1).max(5),
  notify_on_sos: z.boolean().default(true),
});

// ── GET /api/v1/users/me ──────────────────────────────────────
export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, auth_id, email, full_name, avatar_url, role, age_range, country, locale, safe_word, is_verified, is_active, created_at, updated_at')
      .eq('id', req.user!.id)
      .is('deleted_at', null)
      .single();

    if (error || !data) throw new AppError(404, 'NOT_FOUND', 'User not found.');
    ok(res, data);
  } catch (err) { next(err); }
}

// ── PATCH /api/v1/users/me ────────────────────────────────────
export async function updateMe(req: Request, res: Response, next: NextFunction) {
  try {
    const body = UpdateProfileSchema.parse(req.body);

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', req.user!.id)
      .is('deleted_at', null)
      .select('id, email, full_name, avatar_url, role, age_range, locale, safe_word, push_token')
      .single();

    if (error) throw new AppError(400, 'UPDATE_FAILED', error.message);
    ok(res, data);
  } catch (err) { next(err); }
}

// ── GET /api/v1/users/me/emergency-contacts ───────────────────
export async function getEmergencyContacts(req: Request, res: Response, next: NextFunction) {
  try {
    const { data, error } = await supabaseAdmin
      .from('emergency_contacts')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('notify_order', { ascending: true });

    if (error) throw new AppError(500, 'DB_ERROR', error.message);
    ok(res, data ?? []);
  } catch (err) { next(err); }
}

// ── POST /api/v1/users/me/emergency-contacts ──────────────────
export async function addEmergencyContact(req: Request, res: Response, next: NextFunction) {
  try {
    const body = EmergencyContactSchema.parse(req.body);

    const { count } = await supabaseAdmin
      .from('emergency_contacts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', req.user!.id);

    if ((count ?? 0) >= 5) throw new AppError(422, 'LIMIT_EXCEEDED', 'Maximum of 5 emergency contacts allowed.');

    const { data, error } = await supabaseAdmin
      .from('emergency_contacts')
      .insert({ ...body, user_id: req.user!.id })
      .select('*')
      .single();

    if (error) throw new AppError(400, 'INSERT_FAILED', error.message);
    created(res, data);
  } catch (err) { next(err); }
}

// ── PATCH /api/v1/users/me/emergency-contacts/:id ─────────────
export async function updateEmergencyContact(req: Request, res: Response, next: NextFunction) {
  try {
    const body = EmergencyContactSchema.partial().parse(req.body);

    const { data, error } = await supabaseAdmin
      .from('emergency_contacts')
      .update(body)
      .eq('id', req.params.id!)
      .eq('user_id', req.user!.id)
      .select('*')
      .single();

    if (error || !data) throw new AppError(404, 'NOT_FOUND', 'Emergency contact not found.');
    ok(res, data);
  } catch (err) { next(err); }
}

// ── DELETE /api/v1/users/me/emergency-contacts/:id ────────────
export async function deleteEmergencyContact(req: Request, res: Response, next: NextFunction) {
  try {
    const { error, count } = await supabaseAdmin
      .from('emergency_contacts')
      .delete()
      .eq('id', req.params.id!)
      .eq('user_id', req.user!.id);

    if (error) throw new AppError(400, 'DELETE_FAILED', error.message);
    if (count === 0) throw new AppError(404, 'NOT_FOUND', 'Emergency contact not found.');
    noContent(res);
  } catch (err) { next(err); }
}

// ── GET /api/v1/users/me/badges ───────────────────────────────
// Actual user_badges schema: earned_at (not awarded_at), no evidence_url
export async function getMyBadges(req: Request, res: Response, next: NextFunction) {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_badges')
      .select('id, earned_at, badge:badge_id ( id, name, module, category, image_url )')
      .eq('user_id', req.user!.id)
      .order('earned_at', { ascending: false });

    if (error) throw new AppError(500, 'DB_ERROR', error.message);
    ok(res, data ?? []);
  } catch (err) { next(err); }
}

// ── GET /api/v1/users/me/notification-preferences ─────────────
// Actual schema: notification_type (not notif_type)
export async function getNotificationPreferences(req: Request, res: Response, next: NextFunction) {
  try {
    const { data, error } = await supabaseAdmin
      .from('notification_preferences')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('notification_type');

    if (error) throw new AppError(500, 'DB_ERROR', error.message);

    if (!data || data.length === 0) {
      const defaults = [
        { user_id: req.user!.id, channel: 'push', notification_type: 'sos_alert',      is_enabled: true },
        { user_id: req.user!.id, channel: 'push', notification_type: 'period_reminder', is_enabled: true },
        { user_id: req.user!.id, channel: 'push', notification_type: 'journey_alert',   is_enabled: true },
        { user_id: req.user!.id, channel: 'push', notification_type: 'badge_earned',    is_enabled: true },
        { user_id: req.user!.id, channel: 'push', notification_type: 'affirmation',     is_enabled: true },
      ];

      const { data: seeded } = await supabaseAdmin
        .from('notification_preferences')
        .upsert(defaults, { onConflict: 'user_id,channel,notification_type' })
        .select('*');

      return ok(res, seeded ?? defaults);
    }

    ok(res, data);
  } catch (err) { next(err); }
}

// ── PATCH /api/v1/users/me/notification-preferences/:id ───────
export async function updateNotificationPreference(req: Request, res: Response, next: NextFunction) {
  try {
    const { is_enabled } = z.object({ is_enabled: z.boolean() }).parse(req.body);

    const { data, error } = await supabaseAdmin
      .from('notification_preferences')
      .update({ is_enabled, updated_at: new Date().toISOString() })
      .eq('id', req.params.id!)
      .eq('user_id', req.user!.id)
      .select('*')
      .single();

    if (error || !data) throw new AppError(404, 'NOT_FOUND', 'Preference not found.');
    ok(res, data);
  } catch (err) { next(err); }
}
