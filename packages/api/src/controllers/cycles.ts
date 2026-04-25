// ============================================================
// Cycle Tracker Controller
// All cycle notes are AES-256 encrypted.
// Predictions are computed in cyclePredictor.ts — never stored.
//
// GET    /api/v1/cycles              — list own cycles
// POST   /api/v1/cycles              — log a new cycle
// PATCH  /api/v1/cycles/:id          — update cycle (end date, symptoms…)
// GET    /api/v1/cycles/prediction   — predict next period
// GET    /api/v1/cycles/reminders    — list reminders
// POST   /api/v1/cycles/reminders    — create reminder
// PATCH  /api/v1/cycles/reminders/:id
// DELETE /api/v1/cycles/reminders/:id
// ============================================================
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../models/supabase';
import { encrypt, decrypt } from '../services/encryption';
import { predictNextCycle } from '../services/cyclePredictor';
import { ok, created, noContent } from '../services/response';
import { AppError } from '../middleware/errorHandler';

// ── Schemas ───────────────────────────────────────────────────

const CreateCycleSchema = z.object({
  start_date:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  flow_intensity: z.enum(['spotting','light','medium','heavy']).optional(),
  symptoms:       z.array(z.string().max(50)).max(20).default([]),
  notes:          z.string().max(2000).optional(),  // plaintext — encrypted before storage
});

const UpdateCycleSchema = CreateCycleSchema.partial();

const ReminderSchema = z.object({
  reminder_type: z.enum(['period_due','pill','hydration','custom']),
  days_before:   z.number().int().min(0).max(30).default(3),
  custom_label:  z.string().max(100).optional(),
  is_active:     z.boolean().default(true),
});

// ── GET /api/v1/cycles ────────────────────────────────────────
export async function listCycles(req: Request, res: Response, next: NextFunction) {
  try {
    const { data, error } = await supabaseAdmin
      .from('menstrual_cycles')
      .select('id, start_date, end_date, flow_intensity, symptoms, created_at')
      .eq('user_id', req.user!.id)
      .order('start_date', { ascending: false })
      .limit(24);  // last 24 cycles (~2 years)

    if (error) throw new AppError(500, 'DB_ERROR', error.message);

    // notes_encrypted is intentionally omitted from list — fetch single for that
    ok(res, data ?? []);
  } catch (err) { next(err); }
}

// ── POST /api/v1/cycles ───────────────────────────────────────
export async function createCycle(req: Request, res: Response, next: NextFunction) {
  try {
    const body = CreateCycleSchema.parse(req.body);

    const { data, error } = await supabaseAdmin
      .from('menstrual_cycles')
      .insert({
        user_id:         req.user!.id,
        start_date:      body.start_date,
        end_date:        body.end_date,
        flow_intensity:  body.flow_intensity,
        symptoms:        body.symptoms,
        notes_encrypted: body.notes ? encrypt(body.notes) : null,
      })
      .select('id, start_date, end_date, flow_intensity, symptoms, created_at')
      .single();

    if (error) throw new AppError(400, 'INSERT_FAILED', error.message);

    created(res, data);
  } catch (err) { next(err); }
}

// ── PATCH /api/v1/cycles/:id ──────────────────────────────────
export async function updateCycle(req: Request, res: Response, next: NextFunction) {
  try {
    const body = UpdateCycleSchema.parse(req.body);

    const updates: Record<string, unknown> = {};
    if (body.end_date        !== undefined) updates['end_date']        = body.end_date;
    if (body.flow_intensity  !== undefined) updates['flow_intensity']  = body.flow_intensity;
    if (body.symptoms        !== undefined) updates['symptoms']        = body.symptoms;
    if (body.notes           !== undefined) updates['notes_encrypted'] = encrypt(body.notes);

    const { data, error } = await supabaseAdmin
      .from('menstrual_cycles')
      .update(updates)
      .eq('id', req.params.id!)
      .eq('user_id', req.user!.id)
      .select('id, start_date, end_date, flow_intensity, symptoms')
      .single();

    if (error || !data) throw new AppError(404, 'NOT_FOUND', 'Cycle not found.');

    ok(res, data);
  } catch (err) { next(err); }
}

// ── GET /api/v1/cycles/prediction ────────────────────────────
export async function getCyclePrediction(req: Request, res: Response, next: NextFunction) {
  try {
    const { data, error } = await supabaseAdmin
      .from('menstrual_cycles')
      .select('start_date, end_date')
      .eq('user_id', req.user!.id)
      .order('start_date', { ascending: true })
      .limit(12);

    if (error) throw new AppError(500, 'DB_ERROR', error.message);

    const prediction = predictNextCycle(data ?? []);
    ok(res, prediction);
  } catch (err) { next(err); }
}

// ── GET /api/v1/cycles/reminders ─────────────────────────────
export async function listReminders(req: Request, res: Response, next: NextFunction) {
  try {
    const { data, error } = await supabaseAdmin
      .from('cycle_reminders')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('created_at');

    if (error) throw new AppError(500, 'DB_ERROR', error.message);
    ok(res, data ?? []);
  } catch (err) { next(err); }
}

// ── POST /api/v1/cycles/reminders ────────────────────────────
export async function createReminder(req: Request, res: Response, next: NextFunction) {
  try {
    const body = ReminderSchema.parse(req.body);

    const { data, error } = await supabaseAdmin
      .from('cycle_reminders')
      .insert({ ...body, user_id: req.user!.id })
      .select('*')
      .single();

    if (error) throw new AppError(400, 'INSERT_FAILED', error.message);
    created(res, data);
  } catch (err) { next(err); }
}

// ── PATCH /api/v1/cycles/reminders/:id ───────────────────────
export async function updateReminder(req: Request, res: Response, next: NextFunction) {
  try {
    const body = ReminderSchema.partial().parse(req.body);

    const { data, error } = await supabaseAdmin
      .from('cycle_reminders')
      .update(body)
      .eq('id', req.params.id!)
      .eq('user_id', req.user!.id)
      .select('*')
      .single();

    if (error || !data) throw new AppError(404, 'NOT_FOUND', 'Reminder not found.');
    ok(res, data);
  } catch (err) { next(err); }
}

// ── DELETE /api/v1/cycles/reminders/:id ──────────────────────
export async function deleteReminder(req: Request, res: Response, next: NextFunction) {
  try {
    const { error, count } = await supabaseAdmin
      .from('cycle_reminders')
      .delete()
      .eq('id', req.params.id!)
      .eq('user_id', req.user!.id);

    if (error) throw new AppError(400, 'DELETE_FAILED', error.message);
    if (!count) throw new AppError(404, 'NOT_FOUND', 'Reminder not found.');
    noContent(res);
  } catch (err) { next(err); }
}
