// ============================================================
// Mentor Controller
//
// GET    /mentor/available          — list mentors (with bio, country)
// GET    /mentor/my                 — girl's active assignment
// GET    /mentor/my/feed            — events + activities posted by girl's mentor
// GET    /mentor/mentees            — mentor's assigned girls
// POST   /mentor/request            — girl requests a specific mentor by mentor_id
// PATCH  /mentor/:id/accept         — mentor accepts pending request
// PATCH  /mentor/:id/end            — either party ends assignment
// POST   /mentor/events             — mentor creates an event
// POST   /mentor/activities         — mentor creates a scout activity
// ============================================================
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../models/supabase';
import { ok, created } from '../services/response';
import { AppError } from '../middleware/errorHandler';

// ── Schemas ───────────────────────────────────────────────────
const RequestMentorSchema = z.object({
  mentor_id: z.string().uuid('mentor_id must be a UUID'),
  message:   z.string().max(500).optional(),
});

const CreateEventSchema = z.object({
  title:       z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  event_type:  z.enum(['workshop','webinar','meetup','troop_meeting','community_service']),
  starts_at:   z.string().datetime(),
  ends_at:     z.string().datetime().optional(),
  location:    z.string().max(300).optional(),
  is_virtual:  z.boolean().default(false),
  join_url:    z.string().url().optional(),
});

const CreateActivitySchema = z.object({
  title:              z.string().min(2).max(200),
  description:        z.string().max(1000).optional(),
  module:             z.string().optional(),
  difficulty:         z.enum(['beginner','intermediate','advanced']).optional(),
  estimated_minutes:  z.number().int().positive().optional(),
  is_offline_capable: z.boolean().default(false),
  badge_id:           z.string().uuid().optional(),
});

// ── GET /mentor/available ─────────────────────────────────────
export async function listAvailableMentors(req: Request, res: Response, next: NextFunction) {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, full_name, avatar_url, country, age_range')
      .eq('role', 'mentor')
      .is('deleted_at', null)
      .limit(50);

    if (error) throw new AppError(500, 'DB_ERROR', error.message);
    ok(res, data ?? []);
  } catch (err) { next(err); }
}

// ── GET /mentor/my ────────────────────────────────────────────
export async function getMyMentor(req: Request, res: Response, next: NextFunction) {
  try {
    const { data, error } = await supabaseAdmin
      .from('mentor_assignments')
      .select(`
        id, status, started_at, ended_at, created_at,
        mentor:mentor_id ( id, full_name, avatar_url, country )
      `)
      .eq('mentee_id', req.user!.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new AppError(500, 'DB_ERROR', error.message);
    ok(res, data ?? null);
  } catch (err) { next(err); }
}

// ── GET /mentor/my/feed ───────────────────────────────────────
// Returns events and activities created by the girl's active mentor.
export async function getMyMentorFeed(req: Request, res: Response, next: NextFunction) {
  try {
    // 1. Find the active mentor assignment
    const { data: assignment } = await supabaseAdmin
      .from('mentor_assignments')
      .select('mentor_id')
      .eq('mentee_id', req.user!.id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();

    if (!assignment) {
      ok(res, { events: [], activities: [] });
      return;
    }

    const mentorId = assignment.mentor_id;

    // 2. Fetch events created by the mentor (upcoming first)
    const { data: events } = await supabaseAdmin
      .from('events')
      .select('id, title, description, event_type, starts_at, ends_at, location, is_virtual, join_url')
      .eq('created_by', mentorId)
      .is('deleted_at', null)
      .gte('starts_at', new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString()) // last 7 days + future
      .order('starts_at', { ascending: true })
      .limit(20);

    // 3. Fetch activities created by the mentor
    const { data: activities } = await supabaseAdmin
      .from('activities')
      .select('id, title, description, module, difficulty, estimated_minutes, is_offline_capable, badge_id')
      .eq('created_by', mentorId)
      .order('created_at', { ascending: false })
      .limit(20);

    ok(res, {
      mentor_id: mentorId,
      events:    events    ?? [],
      activities:activities ?? [],
    });
  } catch (err) { next(err); }
}

// ── GET /mentor/mentees ───────────────────────────────────────
export async function getMyMentees(req: Request, res: Response, next: NextFunction) {
  try {
    const { data, error } = await supabaseAdmin
      .from('mentor_assignments')
      .select(`
        id, status, started_at, created_at,
        mentee:mentee_id ( id, full_name, avatar_url, age_range, country )
      `)
      .eq('mentor_id', req.user!.id)
      .order('created_at', { ascending: false });

    if (error) throw new AppError(500, 'DB_ERROR', error.message);
    ok(res, data ?? []);
  } catch (err) { next(err); }
}

// ── POST /mentor/request ─────────────────────────────────────
// Girl requests a SPECIFIC mentor by mentor_id.
export async function requestMentor(req: Request, res: Response, next: NextFunction) {
  try {
    const { mentor_id, message } = RequestMentorSchema.parse(req.body);
    const userId = req.user!.id;

    // Prevent requesting yourself
    if (mentor_id === userId) {
      throw new AppError(400, 'INVALID_REQUEST', 'You cannot request yourself as a mentor.');
    }

    // Ensure the target user actually has the mentor role
    const { data: mentor } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('id', mentor_id)
      .eq('role', 'mentor')
      .is('deleted_at', null)
      .maybeSingle();

    if (!mentor) throw new AppError(404, 'NOT_FOUND', 'Mentor not found.');

    // Check no active/pending assignment already
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

    const { data, error } = await supabaseAdmin
      .from('mentor_assignments')
      .insert({
        mentee_id: userId,
        mentor_id,
        status:    'pending',
        ...(message ? { message } : {}),
      })
      .select(`
        id, status, created_at,
        mentor:mentor_id ( id, full_name, avatar_url )
      `)
      .single();

    if (error) throw new AppError(400, 'INSERT_FAILED', error.message);
    created(res, data);
  } catch (err) { next(err); }
}

// ── PATCH /mentor/:id/accept ──────────────────────────────────
export async function acceptMentor(req: Request, res: Response, next: NextFunction) {
  try {
    const { data: assignment } = await supabaseAdmin
      .from('mentor_assignments')
      .select('id, mentor_id, status')
      .eq('id', req.params['id']!)
      .single();

    if (!assignment) throw new AppError(404, 'NOT_FOUND', 'Assignment not found.');
    if (assignment.mentor_id !== req.user!.id) throw new AppError(403, 'FORBIDDEN', 'Only the mentor can accept.');
    if (assignment.status !== 'pending') throw new AppError(409, 'INVALID_STATE', 'Assignment is not pending.');

    const { data, error } = await supabaseAdmin
      .from('mentor_assignments')
      .update({ status: 'active', started_at: new Date().toISOString() })
      .eq('id', req.params['id']!)
      .select('*')
      .single();

    if (error) throw new AppError(500, 'DB_ERROR', error.message);
    ok(res, data);
  } catch (err) { next(err); }
}

// ── PATCH /mentor/:id/end ─────────────────────────────────────
export async function endMentor(req: Request, res: Response, next: NextFunction) {
  try {
    const { data: assignment } = await supabaseAdmin
      .from('mentor_assignments')
      .select('id, mentor_id, mentee_id, status')
      .eq('id', req.params['id']!)
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
      .eq('id', req.params['id']!)
      .select('*')
      .single();

    if (error) throw new AppError(500, 'DB_ERROR', error.message);
    ok(res, data);
  } catch (err) { next(err); }
}

// ── POST /mentor/events ───────────────────────────────────────
// Mentor creates an event visible to their mentees.
export async function createMentorEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    if (user.role !== 'mentor' && user.role !== 'super_admin' && user.role !== 'content_admin') {
      throw new AppError(403, 'FORBIDDEN', 'Only mentors can create mentor events.');
    }

    const body = CreateEventSchema.parse(req.body);

    const { data, error } = await supabaseAdmin
      .from('events')
      .insert({
        ...body,
        created_by: user.id,
      })
      .select('*')
      .single();

    if (error) throw new AppError(400, 'INSERT_FAILED', error.message);
    created(res, data);
  } catch (err) { next(err); }
}

// ── POST /mentor/activities ───────────────────────────────────
// Mentor creates a scout activity for their mentees.
export async function createMentorActivity(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    if (user.role !== 'mentor' && user.role !== 'super_admin' && user.role !== 'content_admin') {
      throw new AppError(403, 'FORBIDDEN', 'Only mentors can create activities.');
    }

    const body = CreateActivitySchema.parse(req.body);

    const { data, error } = await supabaseAdmin
      .from('activities')
      .insert({
        ...body,
        created_by: user.id,
      })
      .select('*')
      .single();

    if (error) throw new AppError(400, 'INSERT_FAILED', error.message);
    created(res, data);
  } catch (err) { next(err); }
}
