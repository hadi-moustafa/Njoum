import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { listMoodLogs, createMoodLog, getMoodStreak } from '../controllers/mood';

const router = Router();

router.use(requireAuth);

router.get('/',        listMoodLogs);
router.post('/',       createMoodLog);
router.get('/streak',  getMoodStreak);

export default router;
