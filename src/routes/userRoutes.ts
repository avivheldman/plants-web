import { Router, Request, Response, NextFunction } from 'express';
import {
  getProfile,
  getUserById,
  updateProfile,
  uploadPhoto,
  deletePhoto,
  changePassword,
} from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { uploadProfilePhoto } from '../config/multer';

const router = Router();

// Multer error handler wrapper
const handleMulterUpload = (req: Request, res: Response, next: NextFunction) => {
  uploadProfilePhoto(req, res, (err: unknown) => {
    if (err) {
      const error = err as Error;
      if (error.message.includes('Only image files')) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.includes('File too large')) {
        return res.status(400).json({ error: 'File size exceeds 5MB limit' });
      }
      return res.status(400).json({ error: 'File upload failed' });
    }
    next();
  });
};

// All routes require authentication
router.use(authenticate);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/profile/photo', handleMulterUpload, uploadPhoto);
router.delete('/profile/photo', deletePhoto);
router.put('/password', changePassword);

// Get other user's public profile
router.get('/:userId', getUserById);

export default router;
