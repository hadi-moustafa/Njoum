// ============================================================
// Events Controller
// Actual schema: url (not join_url), is_online (not is_virtual),
// organizer_id (not created_by), country/region (no location).
// No deleted_at column.
// ============================================================
import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../models/supabase';
import { ok, paginated } from '../services/response';
import { AppError } from '../middleware/errorHandler';
import { DEFAULT_PAGE_SIZE } from '@njoum/shared';

// ── GET /api/v1/events ────────────────────────────────────────
export async function listEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const type     = req.query['type'] as string | undefined;
    const page     = Math.max(1, parseInt(req.query['page'] as string ?? '1', 10));
    const limit    = DEFAULT_PAGE_SIZE;
    const from     = (page - 1) * limit;
    const upcoming = req.query['upcoming'] !== 'false';

    let query = supabaseAdmin
      .from('events')
      .select('id, title, description, event_type, starts_at, ends_at, country, region, is_online, url, created_at', { count: 'exact' })
      .order('starts_at', { ascending: true })
      .range(from, from + limit - 1);

    if (upcoming) {
      query = query.gte('starts_at', new Date().toISOString());
    }
    if (type) query = query.eq('event_type', type);

    const { data, error, count } = await query;
    if (error) throw new AppError(500, 'DB_ERROR', error.message);

    paginated(res, data ?? [], page, count ?? 0, limit);
  } catch (err) { next(err); }
}

// ── GET /api/v1/events/:id ────────────────────────────────────
export async function getEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const { data, error } = await supabaseAdmin
      .from('events')
      .select('id, title, description, event_type, starts_at, ends_at, country, region, is_online, url, created_at')
      .eq('id', req.params.id!)
      .single();

    if (error || !data) throw new AppError(404, 'NOT_FOUND', 'Event not found.');
    ok(res, data);
  } catch (err) { next(err); }
}
