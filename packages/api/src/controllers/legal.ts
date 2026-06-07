// ============================================================
// Legal Controller
//
// GET /api/v1/legal/guides     — list published guides
// GET /api/v1/legal/guides/:id — single guide
// GET /api/v1/legal/aid-orgs   — list free legal aid orgs
// ============================================================
import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../models/supabase';
import { ok } from '../services/response';
import { AppError } from '../middleware/errorHandler';

// ── GET /api/v1/legal/guides ──────────────────────────────────
export async function listLegalGuides(req: Request, res: Response, next: NextFunction) {
  try {
    const country  = (req.query['country'] as string)?.toUpperCase();
    const category = req.query['category'] as string | undefined;
    const language = (req.query['lang'] as string)
      ?? req.headers['accept-language']?.split(',')[0]?.split('-')[0]
      ?? 'ar';

    let query = supabaseAdmin
      .from('legal_guides')
      .select('id, title, category, country, language, version, updated_at')
      .eq('is_published', true)
      .eq('language', language)
      .order('category');

    if (country)  query = query.eq('country', country);
    if (category) query = query.eq('category', category);

    const { data, error } = await query;
    if (error) throw new AppError(500, 'DB_ERROR', error.message);

    ok(res, data ?? []);
  } catch (err) { next(err); }
}

// ── GET /api/v1/legal/guides/:id ─────────────────────────────
export async function getLegalGuide(req: Request, res: Response, next: NextFunction) {
  try {
    const { data, error } = await supabaseAdmin
      .from('legal_guides')
      .select('id, title, body, category, country, language, version, updated_at')
      .eq('id', req.params.id!)
      .eq('is_published', true)
      .single();

    if (error || !data) throw new AppError(404, 'NOT_FOUND', 'Legal guide not found.');
    ok(res, data);
  } catch (err) { next(err); }
}

// ── GET /api/v1/legal/aid-orgs ────────────────────────────────
export async function listLegalAidOrgs(req: Request, res: Response, next: NextFunction) {
  try {
    const country = (req.query['country'] as string)?.toUpperCase();

    let query = supabaseAdmin
      .from('legal_aid_orgs')
      .select('id, name, description, website, phone, email, country, city, is_free')
      .eq('is_active', true)
      .order('name');

    if (country) query = query.eq('country', country);

    const { data, error } = await query;
    if (error) throw new AppError(500, 'DB_ERROR', error.message);

    ok(res, data ?? []);
  } catch (err) { next(err); }
}
