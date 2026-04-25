import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';
import { triggerSos, cancelSos, resolveSos, getActiveSos } from '../controllers/sos';

const router = Router();

router.use(requireAuth);

// Strict rate limit on the trigger endpoint — prevents accidental spam
router.post('/',              authRateLimiter, triggerSos);
router.patch('/:id/cancel',   cancelSos);
router.patch('/:id/resolve',  resolveSos);
router.get('/active',         getActiveSos);

export default router;
