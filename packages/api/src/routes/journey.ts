import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { listJourneys, startJourney, markJourneySafe, cancelJourney } from '../controllers/journey';

const router = Router();

router.use(requireAuth);

router.get('/',                listJourneys);
router.post('/',               startJourney);
router.patch('/:id/safe',      markJourneySafe);
router.patch('/:id/cancel',    cancelJourney);

export default router;
