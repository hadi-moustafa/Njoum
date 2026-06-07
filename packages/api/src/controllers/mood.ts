// ============================================================
// Mood Logs Controller
// Actual schema: log_date (not logged_at), no unique constraint
// enforced via upsert onConflict.
// ============================================================
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../models/supabase';
import { ok, created } from '../services/response';
import { AppError } from '../middleware/errorHandler';

const CreateMoodSchema = z.object({
  score:    z.number().int().min(1).max(5),
  emoji:    z.string().max(10).optional(),
  note:     z.string().max(500).optional(),
  log_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// ── GET /api/v1/mood-logs ─────────────────────────────────────
export async function listMoodLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const days  = parseInt(req.query['days'] as string ?? '90', 10);
    const since = new Date();
    since.setDate(since.getDate() - Math.min(days, 365));

    const { data, error } = await supabaseAdmin
      .from('mood_logs')
      .select('id, score, emoji, note, log_date, created_at')
      .eq('user_id', req.user!.id)
      .gte('log_date', since.toISOString().split('T')[0]!)
      .order('log_date', { ascending: false });

    if (error) throw new AppError(500, 'DB_ERROR', error.message);

    ok(res, data ?? []);
  } catch (err) { next(err); }
}

// ── POST /api/v1/mood-logs ────────────────────────────────────
export async function createMoodLog(req: Request, res: Response, next: NextFunction) {
  try {
    const body    = CreateMoodSchema.parse(req.body);
    const logDate = body.log_date ?? new Date().toISOString().split('T')[0]!;

    const { data, error } = await supabaseAdmin
      .from('mood_logs')
      .upsert(
        { score: body.score, emoji: body.emoji, note: body.note, log_date: logDate, user_id: req.user!.id },
        { onConflict: 'user_id,log_date' },
      )
      .select('id, score, emoji, note, log_date, created_at')
      .single();

    if (error) throw new AppError(400, 'INSERT_FAILED', error.message);

    created(res, data);
  } catch (err) { next(err); }
}

// ── GET /api/v1/mood-logs/streak ─────────────────────────────
export async function getMoodStreak(req: Request, res: Response, next: NextFunction) {
  try {
    const { data, error } = await supabaseAdmin
      .from('mood_logs')
      .select('log_date')
      .eq('user_id', req.user!.id)
      .order('log_date', { ascending: false })
      .limit(365);

    if (error) throw new AppError(500, 'DB_ERROR', error.message);

    const dates  = new Set((data ?? []).map(r => r.log_date));
    let streak   = 0;
    const cursor = new Date();

    if (!dates.has(cursor.toISOString().split('T')[0]!)) {
      cursor.setDate(cursor.getDate() - 1);
    }

    while (dates.has(cursor.toISOString().split('T')[0]!)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    ok(res, { streak });
  } catch (err) { next(err); }
}
