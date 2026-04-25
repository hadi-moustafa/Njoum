// ============================================================
// Content & Education Controller
//
// GET  /api/v1/content/articles           — list articles
// GET  /api/v1/content/articles/:id       — single article
// GET  /api/v1/content/videos             — list self-defence videos
// GET  /api/v1/content/quizzes            — list quizzes
// GET  /api/v1/content/quizzes/:id        — quiz with questions
// POST /api/v1/content/quizzes/:id/attempt — submit quiz attempt
// ============================================================
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../models/supabase';
import { ok, created, paginated } from '../services/response';
import { AppError } from '../middleware/errorHandler';
import { DEFAULT_PAGE_SIZE } from '@njoum/shared';

// ── GET /api/v1/content/articles ─────────────────────────────
export async function listArticles(req: Request, res: Response, next: NextFunction) {
  try {
    const module   = req.query['module'] as string | undefined;
    const language = (req.query['lang'] as string)
      ?? req.headers['accept-language']?.split(',')[0]?.split('-')[0]
      ?? 'ar';
    const page  = Math.max(1, parseInt(req.query['page'] as string ?? '1', 10));
    const limit = DEFAULT_PAGE_SIZE;
    const from  = (page - 1) * limit;

    let query = supabaseAdmin
      .from('content_articles')
      .select('id, title, module, language, cover_url, created_at', { count: 'exact' })
      .eq('is_published', true)
      .is('deleted_at', null)
      .eq('language', language)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (module) query = query.eq('module', module);

    const { data, error, count } = await query;
    if (error) throw new AppError(500, 'DB_ERROR', error.message);

    paginated(res, data ?? [], page, count ?? 0, limit);
  } catch (err) { next(err); }
}

// ── GET /api/v1/content/articles/:id ─────────────────────────
export async function getArticle(req: Request, res: Response, next: NextFunction) {
  try {
    const { data, error } = await supabaseAdmin
      .from('content_articles')
      .select('id, title, body, module, language, cover_url, created_at, updated_at')
      .eq('id', req.params.id!)
      .eq('is_published', true)
      .is('deleted_at', null)
      .single();

    if (error || !data) throw new AppError(404, 'NOT_FOUND', 'Article not found.');
    ok(res, data);
  } catch (err) { next(err); }
}

// ── GET /api/v1/content/videos ───────────────────────────────
export async function listVideos(req: Request, res: Response, next: NextFunction) {
  try {
    const category = req.query['category'] as string | undefined;
    const language = (req.query['lang'] as string) ?? 'ar';

    let query = supabaseAdmin
      .from('self_defence_videos')
      .select('id, title, description, thumbnail_url, scenario_category, language, duration_seconds, is_offline_capable')
      .eq('is_published', true)
      .eq('language', language)
      .order('scenario_category');

    if (category) query = query.eq('scenario_category', category);

    const { data, error } = await query;
    if (error) throw new AppError(500, 'DB_ERROR', error.message);

    ok(res, data ?? []);
  } catch (err) { next(err); }
}

// ── GET /api/v1/content/quizzes ──────────────────────────────
export async function listQuizzes(req: Request, res: Response, next: NextFunction) {
  try {
    const language = (req.query['lang'] as string) ?? 'ar';
    const module   = req.query['module'] as string | undefined;

    let query = supabaseAdmin
      .from('safety_quizzes')
      .select('id, title, module, difficulty, language')
      .eq('is_active', true)
      .eq('language', language)
      .order('difficulty');

    if (module) query = query.eq('module', module);

    const { data, error } = await query;
    if (error) throw new AppError(500, 'DB_ERROR', error.message);

    ok(res, data ?? []);
  } catch (err) { next(err); }
}

// ── GET /api/v1/content/quizzes/:id ──────────────────────────
export async function getQuiz(req: Request, res: Response, next: NextFunction) {
  try {
    const { data: quiz, error } = await supabaseAdmin
      .from('safety_quizzes')
      .select('id, title, module, difficulty, language')
      .eq('id', req.params.id!)
      .eq('is_active', true)
      .single();

    if (error || !quiz) throw new AppError(404, 'NOT_FOUND', 'Quiz not found.');

    const { data: questions } = await supabaseAdmin
      .from('quiz_questions')
      .select('id, question_text, options, sort_order')
      // correct_option_index is intentionally omitted — only sent after attempt
      .eq('quiz_id', req.params.id!)
      .order('sort_order');

    ok(res, { ...quiz, questions: questions ?? [] });
  } catch (err) { next(err); }
}

// ── POST /api/v1/content/quizzes/:id/attempt ─────────────────
export async function submitQuizAttempt(req: Request, res: Response, next: NextFunction) {
  try {
    const AnswerSchema = z.object({
      answers: z.array(z.object({
        question_id:   z.string().uuid(),
        chosen_index:  z.number().int().min(0),
      })),
    });

    const { answers } = AnswerSchema.parse(req.body);

    // Fetch correct answers
    const { data: questions, error } = await supabaseAdmin
      .from('quiz_questions')
      .select('id, correct_option_index, explanation')
      .eq('quiz_id', req.params.id!);

    if (error || !questions?.length) throw new AppError(404, 'NOT_FOUND', 'Quiz not found.');

    const correctMap = new Map(questions.map(q => [q.id, q.correct_option_index]));

    let score = 0;
    const gradedAnswers = answers.map(a => {
      const correct = correctMap.get(a.question_id) === a.chosen_index;
      if (correct) score++;
      return { ...a, correct };
    });

    // Save attempt
    const { data: attempt } = await supabaseAdmin
      .from('quiz_attempts')
      .insert({
        quiz_id:      req.params.id,
        user_id:      req.user!.id,
        score,
        total:        questions.length,
        answers:      gradedAnswers,
        completed_at: new Date().toISOString(),
      })
      .select('id, score, total, completed_at')
      .single();

    // Return graded answers + explanations
    const explanations = Object.fromEntries(
      questions.map(q => [q.id, { correct_index: q.correct_option_index, explanation: q.explanation }])
    );

    created(res, {
      attempt_id:   attempt?.id,
      score,
      total:        questions.length,
      percentage:   Math.round((score / questions.length) * 100),
      answers:      gradedAnswers,
      explanations,
    });
  } catch (err) { next(err); }
}
