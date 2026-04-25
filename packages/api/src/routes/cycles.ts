import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  listCycles, createCycle, updateCycle, getCyclePrediction,
  listReminders, createReminder, updateReminder, deleteReminder,
} from '../controllers/cycles';

const router = Router();

router.use(requireAuth);

router.get('/',                    listCycles);
router.post('/',                   createCycle);
router.patch('/:id',               updateCycle);
router.get('/prediction',          getCyclePrediction);
router.get('/reminders',           listReminders);
router.post('/reminders',          createReminder);
router.patch('/reminders/:id',     updateReminder);
router.delete('/reminders/:id',    deleteReminder);

export default router;
