import { Router, Request, Response, NextFunction } from 'express';
import {
  getPosts,
  getPostById,
  getPostsByUser,
  createPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  checkLiked,
} from '../controllers/postController';
import {
  getComments,
  createComment,
  deleteComment,
} from '../controllers/commentController';
import { authenticate, optionalAuth } from '../middleware/auth';
import { uploadLimiter } from '../middleware/rateLimiter';
import { uploadPostImage } from '../config/multer';

const router = Router();

// Multer error handler wrapper
const handleImageUpload = (req: Request, res: Response, next: NextFunction) => {
  uploadPostImage(req, res, (err: unknown) => {
    if (err) {
      const error = err as Error;
      if (error.message.includes('Only image files')) {
        return res.status(400).json({ success: false, message: error.message });
      }
      if (error.message.includes('File too large')) {
        return res.status(400).json({ success: false, message: 'Image size exceeds 10MB limit' });
      }
      return res.status(400).json({ success: false, message: 'Image upload failed' });
    }
    next();
  });
};

// Post routes
router.get('/', optionalAuth, getPosts);
router.get('/:id', optionalAuth, getPostById);
router.get('/user/:userId', optionalAuth, getPostsByUser);
router.post('/', authenticate, uploadLimiter, handleImageUpload, createPost);
router.put('/:id', authenticate, handleImageUpload, updatePost);
router.delete('/:id', authenticate, deletePost);

// Like routes
router.post('/:id/like', authenticate, likePost);
router.delete('/:id/like', authenticate, unlikePost);
router.get('/:id/liked', authenticate, checkLiked);

// Comment routes
router.get('/:postId/comments', optionalAuth, getComments);
router.post('/:postId/comments', authenticate, createComment);
router.delete('/:postId/comments/:commentId', authenticate, deleteComment);

export default router;
