// ============================================================
// Events Controller
// Actual schema columns: created_by, is_virtual, join_url, location
// (not organizer_id / is_online / url)
// ============================================================
import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../models/supabase';
import { ok, paginated } from '../services/response';
import { AppError } from '../middleware/errorHandler';
import { DEFAULT_PAGE_SIZE } from '@njoum/shared';

const EVENT_COLS = 'id, title, description, event_type, starts_at, ends_at, location, is_virtual, join_url, created_by, created_at';

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
      .select(EVENT_COLS, { count: 'exact' })
      .is('deleted_at', null)
      .order('starts_at', { ascending: true })
      .range(from, from + limit - 1);

    if (upcoming) query = query.gte('starts_at', new Date().toISOString());
    if (type)     query = query.eq('event_type', type);

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
      .select(EVENT_COLS)
      .eq('id', req.params['id']!)
      .is('deleted_at', null)
      .single();

    if (error || !data) throw new AppError(404, 'NOT_FOUND', 'Event not found.');
    ok(res, data);
  } catch (err) { next(err); }
}
