import { Router } from 'express';
import { search, analyze } from '../controllers/searchController';
import { authenticate } from '../middleware/auth';
import { aiRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/', aiRateLimiter, search);
router.post('/analyze', authenticate, aiRateLimiter, analyze);

export default router;
