// ============================================================
// Admin Controller — requires admin role on all routes
//
// GET    /api/v1/admin/users                  — list all users
// GET    /api/v1/admin/users/:id              — user detail
// PATCH  /api/v1/admin/users/:id/role         — change role
// PATCH  /api/v1/admin/users/:id/ban          — ban user
// PATCH  /api/v1/admin/users/:id/unban        — unban user
//
// GET    /api/v1/admin/reports                — moderation queue
// PATCH  /api/v1/admin/reports/:id/resolve    — resolve report
// PATCH  /api/v1/admin/reports/:id/dismiss    — dismiss report
// PATCH  /api/v1/admin/posts/:id/remove       — remove post
//
// GET    /api/v1/admin/hotlines               — all hotlines (including inactive)
// POST   /api/v1/admin/hotlines               — create hotline
// PATCH  /api/v1/admin/hotlines/:id           — update hotline
// GET    /api/v1/admin/hotlines/reports       — hotline reports
// PATCH  /api/v1/admin/hotlines/reports/:id/resolve
//
// GET    /api/v1/admin/audit-logs             — audit log viewer
// ============================================================
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../models/supabase';
import { syncRoleToAuth, banUser, unbanUser } from '../services/authAdmin';
import { ok, created, paginated } from '../services/response';
import { AppError } from '../middleware/errorHandler';
import { UserRole, DEFAULT_PAGE_SIZE } from '@njoum/shared';

// ── Helpers ───────────────────────────────────────────────────

async function writeAuditLog(params: {
  actor_id: string;
  action: string;
  target_type?: string;
  target_id?: string;
  metadata?: Record<string, unknown>;
}) {
  await supabaseAdmin.from('audit_logs').insert({
    actor_id:    params.actor_id,
    action:      params.action,
    target_type: params.target_type,
    target_id:   params.target_id,
    metadata:    params.metadata ?? {},
  });
}

// ── Users ─────────────────────────────────────────────────────

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const page   = Math.max(1, parseInt(req.query['page'] as string ?? '1', 10));
    const limit  = DEFAULT_PAGE_SIZE;
    const from   = (page - 1) * limit;
    const search = req.query['search'] as string | undefined;
    const role   = req.query['role'] as string | undefined;

    let query = supabaseAdmin
      .from('users')
      .select('id, email, full_name, display_name, role, country_code, is_verified, last_seen_at, created_at, deleted_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (role)   query = query.eq('role', role);
    if (search) query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);

    const { data, error, count } = await query;
    if (error) throw new AppError(500, 'DB_ERROR', error.message);

    paginated(res, data ?? [], page, count ?? 0, limit);
  } catch (err) { next(err); }
}

export async function getUserDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', req.params.id!)
      .single();

    if (error || !data) throw new AppError(404, 'NOT_FOUND', 'User not found.');
    ok(res, data);
  } catch (err) { next(err); }
}

export async function changeUserRole(req: Request, res: Response, next: NextFunction) {
  try {
    const { role } = z.object({
      role: z.enum(['girl','parent','mentor','content_admin','community_moderator','super_admin']),
    }).parse(req.body);

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ role })
      .eq('id', req.params.id!)
      .select('id, role')
      .single();

    if (error || !data) throw new AppError(404, 'NOT_FOUND', 'User not found.');

    // Sync the new role into the Supabase Auth JWT claims
    await syncRoleToAuth(req.params.id!, role as UserRole);

    await writeAuditLog({
      actor_id:    req.user!.id,
      action:      'user.role_changed',
      target_type: 'user',
      target_id:   req.params.id,
      metadata:    { new_role: role },
    });

    ok(res, data);
  } catch (err) { next(err); }
}

export async function banUserHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { reason } = z.object({ reason: z.string().min(3).max(500) }).parse(req.body);

    // Soft-delete in our users table
    const { error } = await supabaseAdmin
      .from('users')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', req.params.id!);

    if (error) throw new AppError(400, 'BAN_FAILED', error.message);

    // Revoke all Supabase Auth sessions
    await banUser(req.params.id!);

    await writeAuditLog({
      actor_id:    req.user!.id,
      action:      'user.banned',
      target_type: 'user',
      target_id:   req.params.id,
      metadata:    { reason },
    });

    ok(res, { banned: true });
  } catch (err) { next(err); }
}

export async function unbanUserHandler(req: Request, res: Response, next: NextFunction) {
  try {
    await supabaseAdmin
      .from('users')
      .update({ deleted_at: null })
      .eq('id', req.params.id!);

    await unbanUser(req.params.id!);

    await writeAuditLog({
      actor_id:    req.user!.id,
      action:      'user.unbanned',
      target_type: 'user',
      target_id:   req.params.id,
    });

    ok(res, { unbanned: true });
  } catch (err) { next(err); }
}

// ── Moderation / Reports ──────────────────────────────────────

export async function listReports(req: Request, res: Response, next: NextFunction) {
  try {
    const page   = Math.max(1, parseInt(req.query['page'] as string ?? '1', 10));
    const limit  = DEFAULT_PAGE_SIZE;
    const from   = (page - 1) * limit;
    const status = (req.query['status'] as string) ?? 'open';

    const { data, error, count } = await supabaseAdmin
      .from('content_reports')
      .select('id, reporter_id, target_type, target_id, reason, status, created_at', { count: 'exact' })
      .eq('status', status)
      .order('created_at', { ascending: true })
      .range(from, from + limit - 1);

    if (error) throw new AppError(500, 'DB_ERROR', error.message);
    paginated(res, data ?? [], page, count ?? 0, limit);
  } catch (err) { next(err); }
}

export async function resolveReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { data, error } = await supabaseAdmin
      .from('content_reports')
      .update({ status: 'resolved', reviewed_by: req.user!.id, reviewed_at: new Date().toISOString() })
      .eq('id', req.params.id!)
      .select('id, status')
      .single();

    if (error || !data) throw new AppError(404, 'NOT_FOUND', 'Report not found.');

    await writeAuditLog({ actor_id: req.user!.id, action: 'report.resolved', target_type: 'content_report', target_id: req.params.id });
    ok(res, data);
  } catch (err) { next(err); }
}

export async function dismissReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { data, error } = await supabaseAdmin
      .from('content_reports')
      .update({ status: 'dismissed', reviewed_by: req.user!.id, reviewed_at: new Date().toISOString() })
      .eq('id', req.params.id!)
      .select('id, status')
      .single();

    if (error || !data) throw new AppError(404, 'NOT_FOUND', 'Report not found.');
    ok(res, data);
  } catch (err) { next(err); }
}

export async function removePost(req: Request, res: Response, next: NextFunction) {
  try {
    const { data, error } = await supabaseAdmin
      .from('posts')
      .update({ is_removed: true, removed_by: req.user!.id })
      .eq('id', req.params.id!)
      .select('id, is_removed')
      .single();

    if (error || !data) throw new AppError(404, 'NOT_FOUND', 'Post not found.');

    await writeAuditLog({ actor_id: req.user!.id, action: 'content.deleted', target_type: 'post', target_id: req.params.id });
    ok(res, data);
  } catch (err) { next(err); }
}

// ── Hotlines ──────────────────────────────────────────────────

const HotlineSchema = z.object({
  country_code: z.string().length(2).toUpperCase(),
  name:         z.string().min(2).max(200),
  number:       z.string().min(3).max(30),
  category:     z.enum(['police','fire','mental_health','domestic_violence','legal_aid','child_protection','eating_disorder','addiction']),
  description:  z.string().max(500).optional(),
  is_active:    z.boolean().default(true),
  is_24h:       z.boolean().default(false),
});

export async function adminListHotlines(req: Request, res: Response, next: NextFunction) {
  try {
    const country = req.query['country'] as string | undefined;

    let query = supabaseAdmin
      .from('hotlines')
      .select('*')
      .order('country_code')
      .order('category');

    if (country) query = query.eq('country_code', country.toUpperCase());

    const { data, error } = await query;
    if (error) throw new AppError(500, 'DB_ERROR', error.message);
    ok(res, data ?? []);
  } catch (err) { next(err); }
}

export async function createHotline(req: Request, res: Response, next: NextFunction) {
  try {
    const body = HotlineSchema.parse(req.body);

    const { data, error } = await supabaseAdmin
      .from('hotlines')
      .insert({ ...body, verified_by: req.user!.id, last_checked_at: new Date().toISOString() })
      .select('*')
      .single();

    if (error) throw new AppError(400, 'INSERT_FAILED', error.message);

    await writeAuditLog({ actor_id: req.user!.id, action: 'hotline.created', target_type: 'hotline', target_id: data.id });
    created(res, data);
  } catch (err) { next(err); }
}

export async function updateHotline(req: Request, res: Response, next: NextFunction) {
  try {
    const body = HotlineSchema.partial().parse(req.body);

    const { data, error } = await supabaseAdmin
      .from('hotlines')
      .update({ ...body, verified_by: req.user!.id, last_checked_at: new Date().toISOString() })
      .eq('id', req.params.id!)
      .select('*')
      .single();

    if (error || !data) throw new AppError(404, 'NOT_FOUND', 'Hotline not found.');

    await writeAuditLog({ actor_id: req.user!.id, action: data.is_active ? 'hotline.updated' : 'hotline.deactivated', target_type: 'hotline', target_id: req.params.id });
    ok(res, data);
  } catch (err) { next(err); }
}

export async function listHotlineReports(req: Request, res: Response, next: NextFunction) {
  try {
    const status = (req.query['status'] as string) ?? 'open';
    const { data, error } = await supabaseAdmin
      .from('hotline_reports')
      .select('id, hotline_id, reporter_id, reason, status, created_at, hotlines(name, number, country_code)')
      .eq('status', status)
      .order('created_at');

    if (error) throw new AppError(500, 'DB_ERROR', error.message);
    ok(res, data ?? []);
  } catch (err) { next(err); }
}

export async function resolveHotlineReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { data, error } = await supabaseAdmin
      .from('hotline_reports')
      .update({ status: 'resolved' })
      .eq('id', req.params.id!)
      .select('id, status')
      .single();

    if (error || !data) throw new AppError(404, 'NOT_FOUND', 'Report not found.');
    ok(res, data);
  } catch (err) { next(err); }
}

// ── Analytics ─────────────────────────────────────────────────

export async function getStats(req: Request, res: Response, next: NextFunction) {
  try {
    const [usersRes, sosRes, reportsRes, articlesRes] = await Promise.all([
      supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).is('deleted_at', null),
      supabaseAdmin.from('sos_events').select('id', { count: 'exact', head: true }).is('resolved_at', null).eq('cancelled', false),
      supabaseAdmin.from('content_reports').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      supabaseAdmin.from('content_articles').select('id', { count: 'exact', head: true }).eq('is_published', true),
    ]);
    ok(res, {
      total_users:    usersRes.count    ?? 0,
      active_sos:     sosRes.count      ?? 0,
      open_reports:   reportsRes.count  ?? 0,
      total_articles: articlesRes.count ?? 0,
    });
  } catch (err) { next(err); }
}

export async function getRecentSos(req: Request, res: Response, next: NextFunction) {
  try {
    const { data, error } = await supabaseAdmin
      .from('sos_events')
      .select('id, user_id, trigger_method, cancelled, resolved_at, created_at')
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw new AppError(500, 'DB_ERROR', error.message);
    ok(res, data ?? []);
  } catch (err) { next(err); }
}

export async function getMoodAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const days = parseInt(req.query['days'] as string ?? '30', 10);
    const since = new Date(Date.now() - days * 86_400_000).toISOString();
    const { data, error } = await supabaseAdmin
      .from('mood_logs')
      .select('score, logged_at')
      .gte('logged_at', since)
      .order('logged_at', { ascending: true });
    if (error) throw new AppError(500, 'DB_ERROR', error.message);

    // Group by date
    const byDate = (data ?? []).reduce<Record<string, number[]>>((acc, row) => {
      const date = row.logged_at.split('T')[0]!;
      if (!acc[date]) acc[date] = [];
      acc[date]!.push(row.score);
      return acc;
    }, {});

    const result = Object.entries(byDate).map(([date, scores]) => ({
      date,
      avg_score: scores.reduce((a, b) => a + b, 0) / scores.length,
      count:     scores.length,
    }));
    ok(res, result);
  } catch (err) { next(err); }
}

export async function getSosAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const months = parseInt(req.query['months'] as string ?? '6', 10);
    const since  = new Date();
    since.setMonth(since.getMonth() - months);
    const { data, error } = await supabaseAdmin
      .from('sos_events')
      .select('cancelled, resolved_at, created_at')
      .gte('created_at', since.toISOString());
    if (error) throw new AppError(500, 'DB_ERROR', error.message);

    const byMonth = (data ?? []).reduce<Record<string, { total: number; cancelled: number; resolved: number }>>((acc, e) => {
      const m = e.created_at.slice(0, 7);
      if (!acc[m]) acc[m] = { total: 0, cancelled: 0, resolved: 0 };
      acc[m]!.total++;
      if (e.cancelled)   acc[m]!.cancelled++;
      if (e.resolved_at) acc[m]!.resolved++;
      return acc;
    }, {});

    ok(res, Object.entries(byMonth).map(([month, s]) => ({ month, ...s })));
  } catch (err) { next(err); }
}

export async function getModuleAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const [articlesRes, attemptsRes] = await Promise.all([
      supabaseAdmin.from('content_articles').select('module').eq('is_published', true),
      supabaseAdmin.from('quiz_attempts').select('quiz_id, safety_quizzes(module)'),
    ]);

    const articlesByModule = (articlesRes.data ?? []).reduce<Record<string, number>>((acc, r) => {
      acc[r.module] = (acc[r.module] ?? 0) + 1; return acc;
    }, {});
    const attemptsByModule = (attemptsRes.data ?? []).reduce<Record<string, number>>((acc, r: any) => {
      const m = r.safety_quizzes?.module ?? 'unknown';
      acc[m] = (acc[m] ?? 0) + 1; return acc;
    }, {});

    const modules = new Set([...Object.keys(articlesByModule), ...Object.keys(attemptsByModule)]);
    ok(res, [...modules].map(m => ({
      module:        m,
      article_count: articlesByModule[m] ?? 0,
      quiz_attempts: attemptsByModule[m] ?? 0,
    })));
  } catch (err) { next(err); }
}

// ── Audit Logs ────────────────────────────────────────────────

export async function listAuditLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const page  = Math.max(1, parseInt(req.query['page'] as string ?? '1', 10));
    const limit = DEFAULT_PAGE_SIZE;
    const from  = (page - 1) * limit;

    const { data, error, count } = await supabaseAdmin
      .from('audit_logs')
      .select('id, actor_id, action, target_type, target_id, metadata, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (error) throw new AppError(500, 'DB_ERROR', error.message);
    paginated(res, data ?? [], page, count ?? 0, limit);
  } catch (err) { next(err); }
}
