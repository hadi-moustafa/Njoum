// ============================================================
// Journal Controller
// Actual schema: no title, no mood_score, no deleted_at.
// Columns: id, user_id, content_encrypted, is_cloud_backed,
//          created_at, updated_at
// ============================================================
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../models/supabase';
import { encrypt, decrypt } from '../services/encryption';
import { ok, created, noContent, paginated } from '../services/response';
import { AppError } from '../middleware/errorHandler';
import { DEFAULT_PAGE_SIZE } from '@njoum/shared';

const CreateJournalSchema = z.object({
  content:         z.string().min(1).max(50_000),
  is_cloud_backed: z.boolean().default(true),
});

// ── GET /api/v1/journal ───────────────────────────────────────
export async function listJournal(req: Request, res: Response, next: NextFunction) {
  try {
    const page  = Math.max(1, parseInt(req.query['page'] as string ?? '1', 10));
    const limit = Math.min(DEFAULT_PAGE_SIZE, 50);
    const from  = (page - 1) * limit;

    const { data, error, count } = await supabaseAdmin
      .from('journal_entries')
      .select('id, is_cloud_backed, created_at, updated_at', { count: 'exact' })
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (error) throw new AppError(500, 'DB_ERROR', error.message);

    paginated(res, data ?? [], page, count ?? 0, limit);
  } catch (err) { next(err); }
}

// ── GET /api/v1/journal/:id ───────────────────────────────────
export async function getJournalEntry(req: Request, res: Response, next: NextFunction) {
  try {
    const { data, error } = await supabaseAdmin
      .from('journal_entries')
      .select('id, content_encrypted, is_cloud_backed, created_at, updated_at')
      .eq('id', req.params.id!)
      .eq('user_id', req.user!.id)
      .single();

    if (error || !data) throw new AppError(404, 'NOT_FOUND', 'Journal entry not found.');

    const decrypted = { ...data, content: decrypt(data.content_encrypted) };
    delete (decrypted as any).content_encrypted;

    ok(res, decrypted);
  } catch (err) { next(err); }
}

// ── POST /api/v1/journal ──────────────────────────────────────
export async function createJournalEntry(req: Request, res: Response, next: NextFunction) {
  try {
    const body = CreateJournalSchema.parse(req.body);

    const { data, error } = await supabaseAdmin
      .from('journal_entries')
      .insert({
        user_id:           req.user!.id,
        content_encrypted: encrypt(body.content),
        is_cloud_backed:   body.is_cloud_backed,
      })
      .select('id, created_at')
      .single();

    if (error) throw new AppError(400, 'INSERT_FAILED', error.message);

    created(res, data);
  } catch (err) { next(err); }
}

// ── PATCH /api/v1/journal/:id ─────────────────────────────────
export async function updateJournalEntry(req: Request, res: Response, next: NextFunction) {
  try {
    const schema = z.object({ content: z.string().min(1).max(50_000) });
    const { content } = schema.parse(req.body);

    const { data, error } = await supabaseAdmin
      .from('journal_entries')
      .update({ content_encrypted: encrypt(content), updated_at: new Date().toISOString() })
      .eq('id', req.params.id!)
      .eq('user_id', req.user!.id)
      .select('id, updated_at')
      .single();

    if (error || !data) throw new AppError(404, 'NOT_FOUND', 'Journal entry not found.');

    ok(res, data);
  } catch (err) { next(err); }
}

// ── DELETE /api/v1/journal/:id ────────────────────────────────
// No deleted_at in actual schema — hard delete is fine for journal
export async function deleteJournalEntry(req: Request, res: Response, next: NextFunction) {
  try {
    const { error, count } = await supabaseAdmin
      .from('journal_entries')
      .delete()
      .eq('id', req.params.id!)
      .eq('user_id', req.user!.id);

    if (error) throw new AppError(400, 'DELETE_FAILED', error.message);
    if (!count) throw new AppError(404, 'NOT_FOUND', 'Journal entry not found.');

    noContent(res);
  } catch (err) { next(err); }
}
