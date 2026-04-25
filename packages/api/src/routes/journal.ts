import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { listJournal, getJournalEntry, createJournalEntry, updateJournalEntry, deleteJournalEntry } from '../controllers/journal';

const router = Router();

router.use(requireAuth);

router.get('/',      listJournal);
router.post('/',     createJournalEntry);
router.get('/:id',   getJournalEntry);
router.patch('/:id', updateJournalEntry);
router.delete('/:id',deleteJournalEntry);

export default router;
