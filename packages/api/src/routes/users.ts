import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  getMe,
  updateMe,
  getEmergencyContacts,
  addEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
  getNotificationPreferences,
  updateNotificationPreference,
  getMyBadges,
} from '../controllers/users';

const router = Router();

// All user routes require authentication
router.use(requireAuth);

router.get('/',                           getMe);
router.patch('/',                         updateMe);
router.get('/emergency-contacts',                    getEmergencyContacts);
router.post('/emergency-contacts',                   addEmergencyContact);
router.patch('/emergency-contacts/:id',              updateEmergencyContact);
router.delete('/emergency-contacts/:id',             deleteEmergencyContact);
router.get('/notification-preferences',              getNotificationPreferences);
router.patch('/notification-preferences/:id',        updateNotificationPreference);
router.get('/badges',                                getMyBadges);

export default router;
