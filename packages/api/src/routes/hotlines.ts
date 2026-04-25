import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { listHotlines, getLocalHotlines, reportHotline } from '../controllers/hotlines';

const router = Router();

// Hotlines list is public (needed for offline cache on first load)
router.get('/',        listHotlines);
router.get('/local',   getLocalHotlines);

// Reporting requires auth
router.post('/:id/report', requireAuth, reportHotline);

export default router;
