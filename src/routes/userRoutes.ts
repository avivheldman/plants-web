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

const handleMulterUpload = (req: Request, res: Response, next: NextFunction) => {
  uploadProfilePhoto(req, res, (err: unknown) => {
    if (err) {
      const error = err as Error;
      if (error.message.includes('Only image files')) {
        res.status(400).json({ error: error.message });
        return;
      }
      if (error.message.includes('File too large')) {
        res.status(400).json({ error: 'File size exceeds 5MB limit' });
        return;
      }
      res.status(400).json({ error: 'File upload failed' });
      return;
    }
    next();
  });
};

router.use(authenticate);

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 *       401:
 *         description: Not authenticated
 */
router.get('/profile', getProfile);

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Update current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 *       401:
 *         description: Not authenticated
 */
router.put('/profile', updateProfile);

/**
 * @swagger
 * /users/profile/photo:
 *   post:
 *     summary: Upload profile photo
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photoUrl:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Photo uploaded
 *       400:
 *         description: Invalid file
 */
router.post('/profile/photo', handleMulterUpload, uploadPhoto);

/**
 * @swagger
 * /users/profile/photo:
 *   delete:
 *     summary: Delete profile photo
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Photo deleted
 *       401:
 *         description: Not authenticated
 */
router.delete('/profile/photo', deletePhoto);

/**
 * @swagger
 * /users/password:
 *   put:
 *     summary: Change password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password changed
 *       400:
 *         description: Invalid current password
 */
router.put('/password', changePassword);

/**
 * @swagger
 * /users/{userId}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User data
 *       404:
 *         description: User not found
 */
router.get('/:userId', getUserById);

export default router;
