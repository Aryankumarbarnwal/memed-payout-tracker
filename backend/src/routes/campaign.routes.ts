import { Router } from 'express';
import * as controller from '../controllers/campaign.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', requireRole('brand'), controller.create);
router.get('/mine', requireRole('brand'), controller.listMine);
router.get('/', requireRole('creator'), controller.listLive);

export default router;