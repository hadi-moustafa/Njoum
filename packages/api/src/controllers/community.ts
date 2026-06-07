// ============================================================
// Community Controller
//
// GET    /api/v1/community/groups                  — list groups
// POST   /api/v1/community/groups                  — create group
// POST   /api/v1/community/groups/:id/join         — join group
// DELETE /api/v1/community/groups/:id/leave        — leave group
// GET    /api/v1/community/groups/:id/posts        — list posts
// POST   /api/v1/community/groups/:id/posts        — create post (enters moderation)
// POST   /api/v1/community/posts/:id/reactions     — react to post
// DELETE /api/v1/community/posts/:id/reactions/:type — remove reaction
// POST   /api/v1/community/posts/:id/comments      — add comment
// POST   /api/v1/community/posts/:id/report        — report post
// ============================================================
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../models/supabase';
import { ok, created, noContent, paginated } from '../services/response';
import { AppError } from '../middleware/errorHandler';
import { moderateContent, shouldAutoHide } from '../services/moderation';
import { DEFAULT_PAGE_SIZE } from '@njoum/shared';

// ── Schemas ───────────────────────────────────────────────────

const CreateGroupSchema = z.object({
  name:        z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  category:    z.enum(['survivors','students','career','general','mental_health','custom']),
  is_private:  z.boolean().default(false),
});

const CreatePostSchema = z.object({
  content:      z.string().min(1).max(5000),
  media_urls:   z.array(z.string().url()).max(5).default([]),
  is_anonymous: z.boolean().default(false),
});

const CreateCommentSchema = z.object({
  content:      z.string().min(1).max(2000),
  is_anonymous: z.boolean().default(false),
});

const ReactionSchema = z.object({
  reaction_type: z.enum(['heart','hug','support','star']),
});

const ReportSchema = z.object({
  reason: z.string().min(5).max(500),
});

// ── GET /api/v1/community/groups ─────────────────────────────
export async function listGroups(req: Request, res: Response, next: NextFunction) {
  try {
    const category = req.query['category'] as string | undefined;

    let query = supabaseAdmin
      .from('community_groups')
      .select('id, name, description, category, is_private, member_count, created_at')
      .eq('is_active', true)
      .order('name');

    if (category) query = query.eq('category', category);

    const { data, error } = await query;
    if (error) throw new AppError(500, 'DB_ERROR', error.message);

    ok(res, data ?? []);
  } catch (err) { next(err); }
}

// ── POST /api/v1/community/groups ────────────────────────────
export async function createGroup(req: Request, res: Response, next: NextFunction) {
  try {
    const body = CreateGroupSchema.parse(req.body);

    const { data: group, error: groupError } = await supabaseAdmin
      .from('community_groups')
      .insert({ ...body, creator_id: req.user!.id })
      .select('id, name, category, is_private, created_at')
      .single();

    if (groupError) throw new AppError(400, 'INSERT_FAILED', groupError.message);

    // Auto-join creator as admin
    await supabaseAdmin.from('group_memberships').insert({
      group_id: group.id,
      user_id:  req.user!.id,
      role:     'admin',
    });

    created(res, group);
  } catch (err) { next(err); }
}

// ── POST /api/v1/community/groups/:id/join ───────────────────
export async function joinGroup(req: Request, res: Response, next: NextFunction) {
  try {
    const { data: group } = await supabaseAdmin
      .from('community_groups')
      .select('id, is_private')
      .eq('id', req.params.id!)
      .eq('is_active', true)
      .single();

    if (!group) throw new AppError(404, 'NOT_FOUND', 'Group not found.');

    // Private groups require admin approval — for now, just insert with pending note
    const { error } = await supabaseAdmin.from('group_memberships').insert({
      group_id: req.params.id,
      user_id:  req.user!.id,
      role:     'member',
    });

    if (error) {
      if (error.code === '23505') throw new AppError(409, 'ALREADY_MEMBER', 'Already a member of this group.');
      throw new AppError(400, 'JOIN_FAILED', error.message);
    }

    ok(res, { joined: true, group_id: req.params.id });
  } catch (err) { next(err); }
}

// ── DELETE /api/v1/community/groups/:id/leave ────────────────
export async function leaveGroup(req: Request, res: Response, next: NextFunction) {
  try {
    const { error, count } = await supabaseAdmin
      .from('group_memberships')
      .delete()
      .eq('group_id', req.params.id!)
      .eq('user_id', req.user!.id);

    if (error) throw new AppError(400, 'LEAVE_FAILED', error.message);
    if (!count) throw new AppError(404, 'NOT_FOUND', 'Membership not found.');
    noContent(res);
  } catch (err) { next(err); }
}

// ── GET /api/v1/community/groups/:id/posts ───────────────────
export async function listPosts(req: Request, res: Response, next: NextFunction) {
  try {
    const page  = Math.max(1, parseInt(req.query['page'] as string ?? '1', 10));
    const limit = DEFAULT_PAGE_SIZE;
    const from  = (page - 1) * limit;

    // Verify membership
    const { data: membership } = await supabaseAdmin
      .from('group_memberships')
      .select('role')
      .eq('group_id', req.params.id!)
      .eq('user_id', req.user!.id)
      .single();

    if (!membership) throw new AppError(403, 'NOT_MEMBER', 'You must be a member to view posts.');

    const { data, error, count } = await supabaseAdmin
      .from('posts')
      .select(
        'id, content, media_urls, is_anonymous, created_at, updated_at, author_id',
        { count: 'exact' },
      )
      .eq('group_id', req.params.id!)
      .eq('is_removed', false)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (error) throw new AppError(500, 'DB_ERROR', error.message);

    // Hide author_id for anonymous posts (non-admins)
    const isAdmin = ['admin','moderator'].includes(req.user!.role) || membership.role !== 'member';
    const posts = (data ?? []).map(p => {
      if (p.is_anonymous && !isAdmin) {
        const { author_id: _, ...rest } = p;
        return rest;
      }
      return p;
    });

    paginated(res, posts, page, count ?? 0, limit);
  } catch (err) { next(err); }
}

// ── POST /api/v1/community/groups/:id/posts ──────────────────
// Posts enter moderation — is_flagged defaults FALSE, visible after moderation pass
export async function createPost(req: Request, res: Response, next: NextFunction) {
  try {
    const body = CreatePostSchema.parse(req.body);

    // Verify membership
    const { data: membership } = await supabaseAdmin
      .from('group_memberships')
      .select('role')
      .eq('group_id', req.params.id!)
      .eq('user_id', req.user!.id)
      .single();

    if (!membership) throw new AppError(403, 'NOT_MEMBER', 'You must be a member to post.');

    // AI moderation — runs in parallel with insert preparation
    const modResult = await moderateContent(body.content);
    const autoHide  = shouldAutoHide(modResult);

    const { data, error } = await supabaseAdmin
      .from('posts')
      .insert({
        group_id:     req.params.id,
        author_id:    req.user!.id,
        content:      body.content,
        media_urls:   body.media_urls,
        is_anonymous: body.is_anonymous,
        is_flagged:   modResult.flagged,  // enters human review queue
        is_removed:   autoHide,           // auto-hidden for high-severity violations
      })
      .select('id, content, is_anonymous, created_at')
      .single();

    if (error) throw new AppError(400, 'INSERT_FAILED', error.message);

    // Return without author_id if anonymous
    if (body.is_anonymous) {
      const { ...rest } = data as any;
      created(res, rest);
    } else {
      created(res, data);
    }
  } catch (err) { next(err); }
}

// ── POST /api/v1/community/posts/:id/reactions ───────────────
export async function addReaction(req: Request, res: Response, next: NextFunction) {
  try {
    const { reaction_type } = ReactionSchema.parse(req.body);

    const { error } = await supabaseAdmin.from('post_reactions').insert({
      post_id:       req.params.id,
      user_id:       req.user!.id,
      reaction_type,
    });

    if (error) {
      if (error.code === '23505') throw new AppError(409, 'ALREADY_REACTED', 'Already reacted with this type.');
      throw new AppError(400, 'REACTION_FAILED', error.message);
    }

    ok(res, { reacted: true, reaction_type });
  } catch (err) { next(err); }
}

// ── DELETE /api/v1/community/posts/:id/reactions/:type ───────
export async function removeReaction(req: Request, res: Response, next: NextFunction) {
  try {
    const reaction_type = z.enum(['heart','hug','support','star']).parse(req.params['type']);

    const { error, count } = await supabaseAdmin
      .from('post_reactions')
      .delete()
      .eq('post_id', req.params.id!)
      .eq('user_id', req.user!.id)
      .eq('reaction_type', reaction_type);

    if (error) throw new AppError(400, 'DELETE_FAILED', error.message);
    if (!count) throw new AppError(404, 'NOT_FOUND', 'Reaction not found.');
    noContent(res);
  } catch (err) { next(err); }
}

// ── POST /api/v1/community/posts/:id/comments ────────────────
export async function addComment(req: Request, res: Response, next: NextFunction) {
  try {
    const body = CreateCommentSchema.parse(req.body);

    const { data, error } = await supabaseAdmin
      .from('comments')
      .insert({
        post_id:      req.params.id,
        author_id:    req.user!.id,
        content:      body.content,
        is_anonymous: body.is_anonymous,
      })
      .select('id, content, is_anonymous, created_at')
      .single();

    if (error) throw new AppError(400, 'INSERT_FAILED', error.message);
    created(res, data);
  } catch (err) { next(err); }
}

// ── POST /api/v1/community/posts/:id/report ──────────────────
export async function reportPost(req: Request, res: Response, next: NextFunction) {
  try {
    const { reason } = ReportSchema.parse(req.body);

    // Mark the post as flagged
    await supabaseAdmin
      .from('posts')
      .update({ is_flagged: true })
      .eq('id', req.params.id!);

    const { data, error } = await supabaseAdmin
      .from('content_reports')
      .insert({
        reported_by: req.user!.id,   // actual column name
        target_type: 'post',
        target_id:   req.params.id,
        reason,
        status:      'open',
      })
      .select('id, status, created_at')
      .single();

    if (error) throw new AppError(400, 'REPORT_FAILED', error.message);
    created(res, data);
  } catch (err) { next(err); }
}
