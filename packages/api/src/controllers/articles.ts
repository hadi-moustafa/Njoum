// ============================================================
// Admin Articles Controller
// POST   /api/v1/admin/articles        — create article
// PATCH  /api/v1/admin/articles/:id    — update article
// DELETE /api/v1/admin/articles/:id    — soft-delete article
// ============================================================
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../models/supabase';
import { ok, created, noContent } from '../services/response';
import { AppError } from '../middleware/errorHandler';

const ArticleSchema = z.object({
  title:        z.string().min(3).max(300),
  content:      z.string().min(1),
  module:       z.enum(['safety','mental_health','legal','wellness','self_defence']),
  language:     z.enum(['ar','en','fr']).default('ar'),
  cover_url:    z.string().url().optional(),
  is_published: z.boolean().default(false),
});

export async function createArticle(req: Request, res: Response, next: NextFunction) {
  try {
    const body = ArticleSchema.parse(req.body);
    const { data, error } = await supabaseAdmin
      .from('content_articles')
      .insert({ ...body, author_id: req.user!.id })
      .select('id, title, module, language, is_published, created_at')
      .single();
    if (error) throw new AppError(500, 'DB_ERROR', error.message);
    created(res, data);
  } catch (err) { next(err); }
}

export async function updateArticle(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const body   = ArticleSchema.partial().parse(req.body);

    const { data, error } = await supabaseAdmin
      .from('content_articles')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null)
      .select('id, title, is_published, updated_at')
      .single();

    if (error || !data) throw new AppError(404, 'NOT_FOUND', 'Article not found.');
    ok(res, data);
  } catch (err) { next(err); }
}

export async function deleteArticle(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from('content_articles')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw new AppError(500, 'DB_ERROR', error.message);
    noContent(res);
  } catch (err) { next(err); }
}
