import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  getMe,
  updateMe,
  getEmergencyContacts,
  addEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
} from '../controllers/users';

const router = Router();

// All user routes require authentication
router.use(requireAuth);

router.get('/',                           getMe);
router.patch('/',                         updateMe);
router.get('/emergency-contacts',         getEmergencyContacts);
router.post('/emergency-contacts',        addEmergencyContact);
router.patch('/emergency-contacts/:id',   updateEmergencyContact);
router.delete('/emergency-contacts/:id',  deleteEmergencyContact);

export default router;
