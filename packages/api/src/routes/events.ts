import { Router } from 'express';
import { listEvents, getEvent } from '../controllers/events';

const router = Router();

// Events are public (no auth required to browse)
router.get('/',     listEvents);
router.get('/:id',  getEvent);

export default router;
