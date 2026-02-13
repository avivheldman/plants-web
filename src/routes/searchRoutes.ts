import { Router, Request, Response, NextFunction } from 'express';
import {
  smartSearch,
  identifyPlant,
  getCareTips,
  getAIStatus,
} from '../controllers/searchController';
import { authenticate, optionalAuth } from '../middleware/auth';
import { aiLimiter, searchLimiter } from '../middleware/rateLimiter';
import { uploadPostImage } from '../config/multer';

const router = Router();

// Multer error handler wrapper
const handleImageUpload = (req: Request, res: Response, next: NextFunction) => {
  uploadPostImage(req, res, (err: unknown) => {
    if (err) {
      const error = err as Error;
      if (error.message.includes('Only image files')) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.includes('File too large')) {
        return res.status(400).json({ error: 'Image size exceeds 10MB limit' });
      }
      return res.status(400).json({ error: 'Image upload failed' });
    }
    next();
  });
};

// AI status endpoint (public)
router.get('/status', getAIStatus);

// Smart search (public with rate limiting)
router.get('/smart', searchLimiter, optionalAuth, smartSearch);

// Plant identification (requires auth + stricter rate limiting)
router.post('/identify', authenticate, aiLimiter, handleImageUpload, identifyPlant);

// Get care tips for a plant (public with rate limiting)
router.get('/care/:plantName', searchLimiter, getCareTips);

export default router;
