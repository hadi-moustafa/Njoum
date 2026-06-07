import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  listTroops, getTroop,
  listActivities, getActivity, completeActivity,
  getMyCompletions, completeActivityByBody,
  listBadges, getMyBadges,
} from '../controllers/scouts';

const router = Router();

// Public — needed for offline cache
router.get('/troops',                    listTroops);
router.get('/troops/:id',                getTroop);
router.get('/activities',                listActivities);
router.get('/activities/:id',            getActivity);
router.get('/badges',                    listBadges);

// Auth required
router.post('/activities/:id/complete',  requireAuth, completeActivity);
router.get('/my-completions',            requireAuth, getMyCompletions);
router.post('/complete',                 requireAuth, completeActivityByBody);
router.get('/me/badges',                 requireAuth, getMyBadges);

export default router;
