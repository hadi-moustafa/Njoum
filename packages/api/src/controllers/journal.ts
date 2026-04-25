// ============================================================
// Journal Controller
// All content is AES-256-GCM encrypted before insert,
// decrypted on read. The DB never holds plaintext.
//
// GET    /api/v1/journal          — list own entries (titles only)
// POST   /api/v1/journal          — create entry
// GET    /api/v1/journal/:id      — get single entry (decrypted)
// PATCH  /api/v1/journal/:id      — update entry
// DELETE /api/v1/journal/:id      — soft delete
// ============================================================
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../models/supabase';
import { encrypt, decrypt } from '../services/encryption';
import { ok, created, noContent, paginated } from '../services/response';
import { AppError } from '../middleware/errorHandler';
import { DEFAULT_PAGE_SIZE } from '@njoum/shared';

const CreateJournalSchema = z.object({
  title:           z.string().max(200).optional(),
  content:         z.string().min(1).max(50_000),  // plaintext from client
  mood_score:      z.number().int().min(1).max(5).optional(),
  is_cloud_backed: z.boolean().default(true),
});

const UpdateJournalSchema = CreateJournalSchema.partial();

// ── GET /api/v1/journal ───────────────────────────────────────
export async function listJournal(req: Request, res: Response, next: NextFunction) {
  try {
    const page  = Math.max(1, parseInt(req.query['page'] as string ?? '1', 10));
    const limit = Math.min(DEFAULT_PAGE_SIZE, 50);
    const from  = (page - 1) * limit;

    const { data, error, count } = await supabaseAdmin
      .from('journal_entries')
      .select('id, title, mood_score, is_cloud_backed, created_at, updated_at', { count: 'exact' })
      .eq('user_id', req.user!.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (error) throw new AppError(500, 'DB_ERROR', error.message);

    // Return titles only in list view — content is only returned on single fetch
    paginated(res, data ?? [], page, count ?? 0, limit);
  } catch (err) { next(err); }
}

// ── GET /api/v1/journal/:id ───────────────────────────────────
export async function getJournalEntry(req: Request, res: Response, next: NextFunction) {
  try {
    const { data, error } = await supabaseAdmin
      .from('journal_entries')
      .select('id, title, content_encrypted, mood_score, is_cloud_backed, created_at, updated_at')
      .eq('id', req.params.id!)
      .eq('user_id', req.user!.id)
      .is('deleted_at', null)
      .single();

    if (error || !data) throw new AppError(404, 'NOT_FOUND', 'Journal entry not found.');

    // Decrypt content before returning
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
        title:             body.title,
        content_encrypted: encrypt(body.content),
        mood_score:        body.mood_score,
        is_cloud_backed:   body.is_cloud_backed,
      })
      .select('id, title, mood_score, created_at')
      .single();

    if (error) throw new AppError(400, 'INSERT_FAILED', error.message);

    created(res, data);
  } catch (err) { next(err); }
}

// ── PATCH /api/v1/journal/:id ─────────────────────────────────
export async function updateJournalEntry(req: Request, res: Response, next: NextFunction) {
  try {
    const body = UpdateJournalSchema.parse(req.body);

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (body.title      !== undefined) updates['title']             = body.title;
    if (body.mood_score !== undefined) updates['mood_score']        = body.mood_score;
    if (body.content    !== undefined) updates['content_encrypted'] = encrypt(body.content);

    const { data, error } = await supabaseAdmin
      .from('journal_entries')
      .update(updates)
      .eq('id', req.params.id!)
      .eq('user_id', req.user!.id)
      .is('deleted_at', null)
      .select('id, title, mood_score, updated_at')
      .single();

    if (error || !data) throw new AppError(404, 'NOT_FOUND', 'Journal entry not found.');

    ok(res, data);
  } catch (err) { next(err); }
}

// ── DELETE /api/v1/journal/:id ────────────────────────────────
export async function deleteJournalEntry(req: Request, res: Response, next: NextFunction) {
  try {
    const { error, count } = await supabaseAdmin
      .from('journal_entries')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', req.params.id!)
      .eq('user_id', req.user!.id)
      .is('deleted_at', null);

    if (error) throw new AppError(400, 'DELETE_FAILED', error.message);
    if (!count) throw new AppError(404, 'NOT_FOUND', 'Journal entry not found.');

    noContent(res);
  } catch (err) { next(err); }
}
