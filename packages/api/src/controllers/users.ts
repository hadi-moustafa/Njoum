// ============================================================
// Users Controller
// Handles: own profile read/update, emergency contacts CRUD
// ============================================================
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../models/supabase';
import { syncRoleToAuth } from '../services/authAdmin';
import { ok, created, noContent } from '../services/response';
import { AppError } from '../middleware/errorHandler';

// ── Validation schemas ────────────────────────────────────────

const UpdateProfileSchema = z.object({
  full_name:    z.string().min(1).max(100).optional(),
  display_name: z.string().min(1).max(50).optional(),
  avatar_url:   z.string().url().optional(),
  language:     z.enum(['ar', 'en', 'fr']).optional(),
  age_range:    z.enum(['10-12', '13-17', '18-24', '25+']).optional(),
  safe_word:    z.string().min(2).max(30).optional(),
});

const EmergencyContactSchema = z.object({
  name:           z.string().min(1).max(100),
  phone:          z.string().min(7).max(20),
  relationship:   z.string().max(50).optional(),
  notify_order:   z.number().int().min(1).max(5),
  notify_on_sos:  z.boolean().default(true),
});

// ── GET /api/v1/users/me ──────────────────────────────────────
export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, display_name, avatar_url, role, age_range, country_code, language, safe_word, is_verified, last_seen_at, created_at')
      .eq('id', req.user!.id)
      .is('deleted_at', null)
      .single();

    if (error || !data) throw new AppError(404, 'NOT_FOUND', 'User not found.');

    // Update last_seen_at (fire and forget)
    supabaseAdmin
      .from('users')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', req.user!.id)
      .then(() => {});

    ok(res, data);
  } catch (err) { next(err); }
}

// ── PATCH /api/v1/users/me ────────────────────────────────────
export async function updateMe(req: Request, res: Response, next: NextFunction) {
  try {
    const body = UpdateProfileSchema.parse(req.body);

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(body)
      .eq('id', req.user!.id)
      .is('deleted_at', null)
      .select('id, email, full_name, display_name, avatar_url, role, age_range, language, safe_word')
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

    // Enforce max 5 contacts
    const { count } = await supabaseAdmin
      .from('emergency_contacts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', req.user!.id);

    if ((count ?? 0) >= 5) {
      throw new AppError(422, 'LIMIT_EXCEEDED', 'Maximum of 5 emergency contacts allowed.');
    }

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
      .eq('user_id', req.user!.id)  // ownership check
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
      .eq('user_id', req.user!.id);  // ownership check

    if (error) throw new AppError(400, 'DELETE_FAILED', error.message);
    if (count === 0) throw new AppError(404, 'NOT_FOUND', 'Emergency contact not found.');

    noContent(res);
  } catch (err) { next(err); }
}
