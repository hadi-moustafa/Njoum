// GET /api/v1/badges/:badgeId/certificate — download PDF certificate
import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { supabaseAdmin } from '../models/supabase';
import { generateBadgeCertificate } from '../services/badgeCertificate';
import { AppError } from '../middleware/errorHandler';

const router = Router();

router.get('/:badgeId/certificate', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { badgeId } = req.params;
    const userId = req.user!.id;

    // Verify the user actually earned this badge
    const { data: award, error: awardErr } = await supabaseAdmin
      .from('user_badges')
      .select(`
        awarded_at,
        badges ( name, module ),
        awarded_by_user:users!awarded_by ( display_name ),
        troop:scouts_troops ( name )
      `)
      .eq('badge_id', badgeId)
      .eq('user_id', userId)
      .single();

    if (awardErr || !award) throw new AppError(404, 'NOT_FOUND', 'Badge not awarded to this user.');

    // Get recipient name
    const { data: recipient } = await supabaseAdmin
      .from('users')
      .select('display_name')
      .eq('id', userId)
      .single();

    const badge     = (award as any).badges;
    const leader    = (award as any).awarded_by_user;
    const troop     = (award as any).troop;

    const pdfBuffer = await generateBadgeCertificate({
      recipientName: recipient?.display_name ?? 'نجمتنا',
      badgeName:     badge?.name     ?? 'شارة',
      badgeModule:   badge?.module   ?? '',
      awardedBy:     leader?.display_name ?? 'قائدة الفرقة',
      awardedAt:     (award as any).awarded_at,
      troopName:     troop?.name,
    });

    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="njoum-badge-${badgeId}.pdf"`,
      'Content-Length':      pdfBuffer.length.toString(),
    });
    res.end(pdfBuffer);
  } catch (err) { next(err); }
});

export default router;
