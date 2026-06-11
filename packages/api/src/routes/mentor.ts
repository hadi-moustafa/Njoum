import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  listAvailableMentors,
  getMyMentor,
  getMyMentorFeed,
  getMyMentees,
  requestMentor,
  acceptMentor,
  endMentor,
  createMentorEvent,
  createMentorActivity,
} from '../controllers/mentor';

const router = Router();

router.use(requireAuth);

// Girl routes
router.get('/available',       listAvailableMentors);
router.get('/my',              getMyMentor);
router.get('/my/feed',         getMyMentorFeed);
router.post('/request',        requestMentor);

// Mentor routes
router.get('/mentees',         getMyMentees);
router.post('/events',         createMentorEvent);
router.post('/activities',     createMentorActivity);

// Shared
router.patch('/:id/accept',    acceptMentor);
router.patch('/:id/end',       endMentor);

export default router;
