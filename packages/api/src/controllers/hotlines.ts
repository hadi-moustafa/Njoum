// ============================================================
// Hotlines Controller
// Actual schema: phone (not number), country (not country_code),
// no description, no is_24h. reported_by (not reporter_id).
// ============================================================
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../models/supabase';
import { ok, created } from '../services/response';
import { AppError } from '../middleware/errorHandler';

const ListQuerySchema = z.object({
  country:  z.string().length(2).toUpperCase().optional(),
  category: z.string().optional(),
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
      .select('id, country, name, phone, category, is_verified, is_active, region, website_url')
      .eq('is_active', true)
      .order('category')
      .order('name');

    if (country)  query = query.eq('country', country);
    if (category) query = query.eq('category', category);

    const { data, error } = await query;
    if (error) throw new AppError(500, 'DB_ERROR', error.message);

    ok(res, data ?? []);
  } catch (err) { next(err); }
}

// ── GET /api/v1/hotlines/local ────────────────────────────────
export async function getLocalHotlines(req: Request, res: Response, next: NextFunction) {
  try {
    const country = (req.headers['x-country'] as string)?.toUpperCase()
      ?? req.user?.['country']
      ?? 'LB';

    const { data, error } = await supabaseAdmin
      .from('hotlines')
      .select('id, country, name, phone, category, is_verified, region, website_url')
      .eq('is_active', true)
      .eq('country', country)
      .order('category');

    if (error) throw new AppError(500, 'DB_ERROR', error.message);

    ok(res, data ?? []);
  } catch (err) { next(err); }
}

// ── POST /api/v1/hotlines/:id/report ─────────────────────────
export async function reportHotline(req: Request, res: Response, next: NextFunction) {
  try {
    const { reason } = ReportSchema.parse(req.body);

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
        reported_by: req.user!.id,   // actual column name
        reason,
        status:      'open',
      })
      .select('id, hotline_id, reason, status, created_at')
      .single();

    if (error) throw new AppError(400, 'INSERT_FAILED', error.message);

    created(res, data);
  } catch (err) { next(err); }
}
