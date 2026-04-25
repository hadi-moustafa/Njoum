// ============================================================
// Hotlines Controller
// GET  /api/v1/hotlines           — list (filterable)
// GET  /api/v1/hotlines/local     — auto-detect country from header
// POST /api/v1/hotlines/:id/report — user reports incorrect number
// ============================================================
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../models/supabase';
import { ok, created } from '../services/response';
import { AppError } from '../middleware/errorHandler';

const ListQuerySchema = z.object({
  country:  z.string().length(2).toUpperCase().optional(),
  category: z.enum([
    'police','fire','mental_health','domestic_violence',
    'legal_aid','child_protection','eating_disorder','addiction',
  ]).optional(),
});

const ReportSchema = z.object({
  reason: z.string().min(5).max(500),
});

// ── GET /api/v1/hotlines ──────────────────────────────────────
export async function listHotlines(req: Request, res: Response, next: NextFunction) {
  try {
    const { country, category } = ListQuerySchema.parse(req.query);

    let query = supabaseAdmin
      .from('hotlines')
      .select('id, country_code, name, number, category, description, is_24h')
      .eq('is_active', true)
      .order('category')
      .order('name');

    if (country)   query = query.eq('country_code', country);
    if (category)  query = query.eq('category', category);

    const { data, error } = await query;
    if (error) throw new AppError(500, 'DB_ERROR', error.message);

    ok(res, data ?? []);
  } catch (err) { next(err); }
}

// ── GET /api/v1/hotlines/local ────────────────────────────────
// Reads country from Accept-Language or X-Country header
export async function getLocalHotlines(req: Request, res: Response, next: NextFunction) {
  try {
    // Mobile app sends X-Country: LB header based on device locale / GPS
    const country = (req.headers['x-country'] as string)?.toUpperCase()
      ?? req.user?.['country_code']
      ?? 'LB'; // default to Lebanon

    const { data, error } = await supabaseAdmin
      .from('hotlines')
      .select('id, country_code, name, number, category, description, is_24h')
      .eq('is_active', true)
      .eq('country_code', country)
      .order('category');

    if (error) throw new AppError(500, 'DB_ERROR', error.message);

    ok(res, data ?? []);
  } catch (err) { next(err); }
}

// ── POST /api/v1/hotlines/:id/report ─────────────────────────
export async function reportHotline(req: Request, res: Response, next: NextFunction) {
  try {
    const { reason } = ReportSchema.parse(req.body);

    // Verify hotline exists
    const { data: hotline } = await supabaseAdmin
      .from('hotlines')
      .select('id')
      .eq('id', req.params.id!)
      .single();

    if (!hotline) throw new AppError(404, 'NOT_FOUND', 'Hotline not found.');

    const { data, error } = await supabaseAdmin
      .from('hotline_reports')
      .insert({
        hotline_id:  req.params.id,
        reporter_id: req.user!.id,
        reason,
        status:      'open',
      })
      .select('id, hotline_id, reason, status, created_at')
      .single();

    if (error) throw new AppError(400, 'INSERT_FAILED', error.message);

    created(res, data);
  } catch (err) { next(err); }
}
