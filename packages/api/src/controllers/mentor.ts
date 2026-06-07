// ============================================================
// Mentor Matching Controller
//
// GET    /api/v1/mentor/my          — current user's assignment (mentee view)
// GET    /api/v1/mentor/mentees     — current user's mentees (mentor view)
// POST   /api/v1/mentor/request     — request a mentor (creates pending assignment)
// PATCH  /api/v1/mentor/:id/accept  — mentor accepts a request
// PATCH  /api/v1/mentor/:id/end     — either party ends the assignment
// GET    /api/v1/mentor/available   — list users with mentor role available
// ============================================================
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../models/supabase';
import { ok, created } from '../services/response';
import { AppError } from '../middleware/errorHandler';

const RequestMentorSchema = z.object({
  message: z.string().max(500).optional(),
});

// ── GET /api/v1/mentor/available ─────────────────────────────
export async function listAvailableMentors(req: Request, res: Response, next: NextFunction) {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, full_name, avatar_url, country')
      .eq('role', 'mentor')
      .is('deleted_at', null)
      .limit(20);

    if (error) throw new AppError(500, 'DB_ERROR', error.message);
    ok(res, data ?? []);
  } catch (err) { next(err); }
}

// ── GET /api/v1/mentor/my ─────────────────────────────────────
export async function getMyMentor(req: Request, res: Response, next: NextFunction) {
  try {
    const { data, error } = await supabaseAdmin
      .from('mentor_assignments')
      .select(`
        id, status, assigned_at, ended_at, created_at,
        mentor:mentor_id ( id, full_name, avatar_url )
      `)
      .eq('mentee_id', req.user!.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new AppError(500, 'DB_ERROR', error.message);
    ok(res, data ?? null);
  } catch (err) { next(err); }
}

// ── GET /api/v1/mentor/mentees ────────────────────────────────
export async function getMyMentees(req: Request, res: Response, next: NextFunction) {
  try {
    const { data, error } = await supabaseAdmin
      .from('mentor_assignments')
      .select(`
        id, status, assigned_at, created_at,
        mentee:mentee_id ( id, full_name, avatar_url, age_range )
      `)
      .eq('mentor_id', req.user!.id)
      .order('created_at', { ascending: false });

    if (error) throw new AppError(500, 'DB_ERROR', error.message);
    ok(res, data ?? []);
  } catch (err) { next(err); }
}

// ── POST /api/v1/mentor/request ──────────────────────────────
export async function requestMentor(req: Request, res: Response, next: NextFunction) {
  try {
    const body   = RequestMentorSchema.parse(req.body);
    const userId = req.user!.id;

    // Check no active assignment already
    const { data: existing } = await supabaseAdmin
      .from('mentor_assignments')
      .select('id, status')
      .eq('mentee_id', userId)
      .in('status', ['pending', 'active'])
      .limit(1)
      .maybeSingle();

    if (existing) {
      throw new AppError(409, 'ALREADY_ASSIGNED', `You already have a ${existing.status} mentor assignment.`);
    }

    // Pick the mentor with fewest active mentees (simple load-balancing)
    const { data: mentors } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('role', 'mentor')
      .is('deleted_at', null);

    if (!mentors?.length) {
      throw new AppError(503, 'NO_MENTORS', 'No mentors are currently available. Please try again later.');
    }

    // Pick first available (could be enhanced with load balancing)
    const mentorId = mentors[0]!.id;

    const { data, error } = await supabaseAdmin
      .from('mentor_assignments')
      .insert({
        mentee_id: userId,
        mentor_id: mentorId,
        status:    'pending',
      })
      .select('*')
      .single();

    if (error) throw new AppError(400, 'INSERT_FAILED', error.message);

    created(res, data);
  } catch (err) { next(err); }
}

// ── PATCH /api/v1/mentor/:id/accept ──────────────────────────
export async function acceptMentor(req: Request, res: Response, next: NextFunction) {
  try {
    const { data: assignment } = await supabaseAdmin
      .from('mentor_assignments')
      .select('id, mentor_id, status')
      .eq('id', req.params.id!)
      .single();

    if (!assignment) throw new AppError(404, 'NOT_FOUND', 'Assignment not found.');
    if (assignment.mentor_id !== req.user!.id) throw new AppError(403, 'FORBIDDEN', 'Only the mentor can accept.');
    if (assignment.status !== 'pending') throw new AppError(409, 'INVALID_STATE', 'Assignment is not pending.');

    const { data, error } = await supabaseAdmin
      .from('mentor_assignments')
      .update({ status: 'active', assigned_at: new Date().toISOString() })
      .eq('id', req.params.id!)
      .select('*')
      .single();

    if (error) throw new AppError(500, 'DB_ERROR', error.message);
    ok(res, data);
  } catch (err) { next(err); }
}

// ── PATCH /api/v1/mentor/:id/end ──────────────────────────────
export async function endMentor(req: Request, res: Response, next: NextFunction) {
  try {
    const { data: assignment } = await supabaseAdmin
      .from('mentor_assignments')
      .select('id, mentor_id, mentee_id, status')
      .eq('id', req.params.id!)
      .single();

    if (!assignment) throw new AppError(404, 'NOT_FOUND', 'Assignment not found.');
    const userId = req.user!.id;
    if (assignment.mentor_id !== userId && assignment.mentee_id !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'Not your assignment.');
    }
    if (assignment.status === 'ended') throw new AppError(409, 'ALREADY_ENDED', 'Assignment already ended.');

    const { data, error } = await supabaseAdmin
      .from('mentor_assignments')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', req.params.id!)
      .select('*')
      .single();

    if (error) throw new AppError(500, 'DB_ERROR', error.message);
    ok(res, data);
  } catch (err) { next(err); }
}
