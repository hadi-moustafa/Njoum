// ============================================================
// Scouts Controller
// Actual schema:
//   activities: age_tier, category (no module/difficulty/estimated_minutes)
//   activity_completions: completed_at, notes (no unique constraint)
//   scouts_troops: country (not country_code)
//   user_badges: earned_at (not awarded_at)
//   badges: image_url (not icon_url)
// ============================================================
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../models/supabase';
import { ok, created } from '../services/response';
import { AppError } from '../middleware/errorHandler';

// ── GET /api/v1/scouts/troops ─────────────────────────────────
export async function listTroops(req: Request, res: Response, next: NextFunction) {
  try {
    const country  = req.query['country'] as string | undefined;
    const age_tier = req.query['age_tier'] as string | undefined;

    let query = supabaseAdmin
      .from('scouts_troops')
      .select('id, name, region, country, age_tier')
      .eq('is_active', true)
      .order('name');

    if (country)  query = query.eq('country', country.toUpperCase());
    if (age_tier) query = query.eq('age_tier', age_tier);

    const { data, error } = await query;
    if (error) throw new AppError(500, 'DB_ERROR', error.message);
    ok(res, data ?? []);
  } catch (err) { next(err); }
}

// ── GET /api/v1/scouts/troops/:id ────────────────────────────
export async function getTroop(req: Request, res: Response, next: NextFunction) {
  try {
    const { data: troop, error } = await supabaseAdmin
      .from('scouts_troops')
      .select('id, name, region, country, age_tier, leader_id')
      .eq('id', req.params.id!)
      .single();

    if (error || !troop) throw new AppError(404, 'NOT_FOUND', 'Troop not found.');

    const { data: members } = await supabaseAdmin
      .from('troop_members')
      .select('user_id, status, joined_at')
      .eq('troop_id', req.params.id!)
      .eq('status', 'active');

    ok(res, { ...troop, members: members ?? [] });
  } catch (err) { next(err); }
}

// ── GET /api/v1/scouts/activities ────────────────────────────
export async function listActivities(req: Request, res: Response, next: NextFunction) {
  try {
    const offline_only = req.query['offline_only'] === 'true';

    let query = supabaseAdmin
      .from('activities')
      .select('id, title, description, age_tier, category, badge_id, is_offline_capable, instructions, materials_list')
      .order('age_tier')
      .order('title');

    if (offline_only) query = query.eq('is_offline_capable', true);

    const { data, error } = await query;
    if (error) throw new AppError(500, 'DB_ERROR', error.message);
    ok(res, data ?? []);
  } catch (err) { next(err); }
}

// ── GET /api/v1/scouts/activities/:id ────────────────────────
export async function getActivity(req: Request, res: Response, next: NextFunction) {
  try {
    const { data, error } = await supabaseAdmin
      .from('activities')
      .select('id, title, description, age_tier, category, badge_id, is_offline_capable, instructions, materials_list')
      .eq('id', req.params.id!)
      .single();

    if (error || !data) throw new AppError(404, 'NOT_FOUND', 'Activity not found.');
    ok(res, data);
  } catch (err) { next(err); }
}

// ── POST /api/v1/scouts/activities/:id/complete ──────────────
export async function completeActivity(req: Request, res: Response, next: NextFunction) {
  try {
    const Schema = z.object({
      evidence_url: z.string().url().optional(),
      notes:        z.string().max(500).optional(),
    });
    const body = Schema.parse(req.body);

    const { data: activity } = await supabaseAdmin
      .from('activities')
      .select('id, badge_id')
      .eq('id', req.params.id!)
      .single();

    if (!activity) throw new AppError(404, 'NOT_FOUND', 'Activity not found.');

    // No unique constraint — check for existing completion first
    const { data: existing } = await supabaseAdmin
      .from('activity_completions')
      .select('id')
      .eq('activity_id', req.params.id!)
      .eq('user_id', req.user!.id)
      .maybeSingle();

    if (existing) throw new AppError(409, 'ALREADY_COMPLETED', 'You already completed this activity.');

    const { data, error } = await supabaseAdmin
      .from('activity_completions')
      .insert({ activity_id: req.params.id, user_id: req.user!.id, evidence_url: body.evidence_url, notes: body.notes })
      .select('id, activity_id, completed_at')
      .single();

    if (error) throw new AppError(400, 'COMPLETION_FAILED', error.message);

    // Auto-award badge
    if (activity.badge_id) {
      const { data: hasBadge } = await supabaseAdmin
        .from('user_badges')
        .select('id')
        .eq('user_id', req.user!.id)
        .eq('badge_id', activity.badge_id)
        .maybeSingle();

      if (!hasBadge) {
        await supabaseAdmin.from('user_badges').insert({ user_id: req.user!.id, badge_id: activity.badge_id });
      }
    }

    created(res, data);
  } catch (err) { next(err); }
}

// ── GET /api/v1/scouts/my-completions ────────────────────────
export async function getMyCompletions(req: Request, res: Response, next: NextFunction) {
  try {
    const { data, error } = await supabaseAdmin
      .from('activity_completions')
      .select('activity_id, user_id, completed_at')
      .eq('user_id', req.user!.id);

    if (error) throw new AppError(500, 'DB_ERROR', error.message);
    ok(res, data ?? []);
  } catch (err) { next(err); }
}

// ── POST /api/v1/scouts/complete ──────────────────────────────
export async function completeActivityByBody(req: Request, res: Response, next: NextFunction) {
  try {
    const Schema = z.object({
      activity_id:  z.string().uuid(),
      evidence_url: z.string().url().optional(),
      notes:        z.string().max(500).optional(),
    });
    const { activity_id, evidence_url, notes } = Schema.parse(req.body);

    const { data: activity } = await supabaseAdmin
      .from('activities')
      .select('id, badge_id')
      .eq('id', activity_id)
      .single();

    if (!activity) throw new AppError(404, 'NOT_FOUND', 'Activity not found.');

    const { data: existing } = await supabaseAdmin
      .from('activity_completions')
      .select('id')
      .eq('activity_id', activity_id)
      .eq('user_id', req.user!.id)
      .maybeSingle();

    if (existing) throw new AppError(409, 'ALREADY_COMPLETED', 'You already completed this activity.');

    const { data, error } = await supabaseAdmin
      .from('activity_completions')
      .insert({ activity_id, user_id: req.user!.id, evidence_url, notes })
      .select('id, activity_id, completed_at')
      .single();

    if (error) throw new AppError(400, 'COMPLETION_FAILED', error.message);

    if (activity.badge_id) {
      const { data: hasBadge } = await supabaseAdmin
        .from('user_badges')
        .select('id')
        .eq('user_id', req.user!.id)
        .eq('badge_id', activity.badge_id)
        .maybeSingle();

      if (!hasBadge) {
        await supabaseAdmin.from('user_badges').insert({ user_id: req.user!.id, badge_id: activity.badge_id });
      }
    }

    created(res, data);
  } catch (err) { next(err); }
}

// ── GET /api/v1/badges ────────────────────────────────────────
export async function listBadges(_req: Request, res: Response, next: NextFunction) {
  try {
    const { data, error } = await supabaseAdmin
      .from('badges')
      .select('id, name, description, module, category, image_url')
      .order('module')
      .order('name');

    if (error) throw new AppError(500, 'DB_ERROR', error.message);
    ok(res, data ?? []);
  } catch (err) { next(err); }
}

// ── GET /api/v1/scouts/me/badges ─────────────────────────────
export async function getMyBadges(req: Request, res: Response, next: NextFunction) {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_badges')
      .select('id, badge_id, earned_at, badges(name, description, module, category, image_url)')
      .eq('user_id', req.user!.id)
      .order('earned_at', { ascending: false });

    if (error) throw new AppError(500, 'DB_ERROR', error.message);
    ok(res, data ?? []);
  } catch (err) { next(err); }
}
