// ============================================================
// Scouts Controller
//
// GET  /api/v1/scouts/troops                  — list troops
// GET  /api/v1/scouts/troops/:id              — troop detail + members
// GET  /api/v1/scouts/activities              — list activities
// GET  /api/v1/scouts/activities/:id          — activity detail
// POST /api/v1/scouts/activities/:id/complete — log completion
// GET  /api/v1/badges                         — all badges
// GET  /api/v1/users/me/badges                — own earned badges
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
      .select('id, name, region, country_code, age_tier')
      .order('name');

    if (country)  query = query.eq('country_code', country.toUpperCase());
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
      .select('id, name, region, country_code, age_tier, leader_id')
      .eq('id', req.params.id!)
      .single();

    if (error || !troop) throw new AppError(404, 'NOT_FOUND', 'Troop not found.');

    // Fetch members (excluding sensitive columns)
    const { data: members } = await supabaseAdmin
      .from('troop_members')
      .select('user_id, status, joined_at, users(display_name, avatar_url)')
      .eq('troop_id', req.params.id!)
      .eq('status', 'active');

    ok(res, { ...troop, members: members ?? [] });
  } catch (err) { next(err); }
}

// ── GET /api/v1/scouts/activities ────────────────────────────
export async function listActivities(req: Request, res: Response, next: NextFunction) {
  try {
    const offline_only = req.query['offline_only'] === 'true';
    const badge_id     = req.query['badge_id'] as string | undefined;

    let query = supabaseAdmin
      .from('activities')
      .select('id, title, description, module, badge_id, is_offline_capable, difficulty, estimated_minutes')
      .order('module')
      .order('difficulty');

    if (offline_only) query = query.eq('is_offline_capable', true);
    if (badge_id)     query = query.eq('badge_id', badge_id);

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
      .select('id, title, description, module, badge_id, is_offline_capable, difficulty, estimated_minutes')
      .eq('id', req.params.id!)
      .single();

    if (error || !data) throw new AppError(404, 'NOT_FOUND', 'Activity not found.');
    ok(res, data);
  } catch (err) { next(err); }
}

// ── POST /api/v1/scouts/activities/:id/complete ──────────────
export async function completeActivity(req: Request, res: Response, next: NextFunction) {
  try {
    const Schema = z.object({ evidence_url: z.string().url().optional() });
    const { evidence_url } = Schema.parse(req.body);

    // Check activity exists
    const { data: activity } = await supabaseAdmin
      .from('activities')
      .select('id, badge_id')
      .eq('id', req.params.id!)
      .single();

    if (!activity) throw new AppError(404, 'NOT_FOUND', 'Activity not found.');

    const { data, error } = await supabaseAdmin
      .from('activity_completions')
      .upsert(
        { activity_id: req.params.id, user_id: req.user!.id, evidence_url },
        { onConflict: 'activity_id,user_id' },
      )
      .select('id, activity_id, evidence_url, created_at')
      .single();

    if (error) throw new AppError(400, 'COMPLETION_FAILED', error.message);

    created(res, data);
  } catch (err) { next(err); }
}

// ── GET /api/v1/badges ────────────────────────────────────────
export async function listBadges(_req: Request, res: Response, next: NextFunction) {
  try {
    const { data, error } = await supabaseAdmin
      .from('badges')
      .select('id, name, description, module, category, icon_url')
      .order('module')
      .order('name');

    if (error) throw new AppError(500, 'DB_ERROR', error.message);
    ok(res, data ?? []);
  } catch (err) { next(err); }
}

// ── GET /api/v1/users/me/badges ───────────────────────────────
export async function getMyBadges(req: Request, res: Response, next: NextFunction) {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_badges')
      .select('id, badge_id, evidence_url, awarded_at, badges(name, description, module, category, icon_url)')
      .eq('user_id', req.user!.id)
      .order('awarded_at', { ascending: false });

    if (error) throw new AppError(500, 'DB_ERROR', error.message);
    ok(res, data ?? []);
  } catch (err) { next(err); }
}
