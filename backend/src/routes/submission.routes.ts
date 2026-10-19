import { Router } from 'express';
import * as controller from '../controllers/submission.controller';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, requireRole('creator'), controller.create);
router.get('/mine', authenticate, requireRole('creator'), controller.listMine);

// platform data simulate karta hai, isliye auth nahi (assignment ki requirement)
router.patch('/:id/views', controller.updateViews);

export default router;