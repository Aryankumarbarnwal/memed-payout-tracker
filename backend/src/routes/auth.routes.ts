import { Router } from 'express';
import * as controller from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/signup', controller.signup);
router.post('/login', controller.login);
router.get('/me', authenticate, controller.me);

export default router;