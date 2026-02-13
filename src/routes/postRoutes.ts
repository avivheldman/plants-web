import { Router } from 'express';
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
import { getComments, createComment, deleteComment } from '../controllers/commentController';
import { authMiddleware } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// Public routes
router.get('/', getPosts);
router.get('/:id', getPostById);
router.get('/user/:userId', getPostsByUser);

// Protected routes - require authentication
router.post('/', authMiddleware, upload.single('image'), createPost);
router.put('/:id', authMiddleware, upload.single('image'), updatePost);
router.delete('/:id', authMiddleware, deletePost);

// Like routes
router.post('/:id/like', authMiddleware, likePost);
router.delete('/:id/like', authMiddleware, unlikePost);
router.get('/:id/liked', authMiddleware, checkLiked);

// Comment routes
router.get('/:postId/comments', getComments);
router.post('/:postId/comments', authMiddleware, createComment);
router.delete('/:postId/comments/:commentId', authMiddleware, deleteComment);

export default router;
