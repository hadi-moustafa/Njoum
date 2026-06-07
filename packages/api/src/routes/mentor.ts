import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  listAvailableMentors,
  getMyMentor,
  getMyMentees,
  requestMentor,
  acceptMentor,
  endMentor,
} from '../controllers/mentor';

const router = Router();

router.use(requireAuth);

router.get('/available',    listAvailableMentors);
router.get('/my',           getMyMentor);
router.get('/mentees',      getMyMentees);
router.post('/request',     requestMentor);
router.patch('/:id/accept', acceptMentor);
router.patch('/:id/end',    endMentor);

export default router;
