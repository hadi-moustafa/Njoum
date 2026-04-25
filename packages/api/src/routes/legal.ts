import { Router } from 'express';
import { listLegalGuides, getLegalGuide, listLegalAidOrgs } from '../controllers/legal';

const router = Router();

// All legal content is public (no auth required — emergency access)
router.get('/guides',        listLegalGuides);
router.get('/guides/:id',    getLegalGuide);
router.get('/aid-orgs',      listLegalAidOrgs);

export default router;
