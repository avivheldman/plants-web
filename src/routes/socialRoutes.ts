import { Router } from 'express';
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
} from '../controllers/commentController';
import {
  likePost,
  unlikePost,
  checkLike,
  getLikedPosts,
  getPostLikers,
} from '../controllers/likeController';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

// Comment routes
router.get('/posts/:postId/comments', optionalAuth, getComments);
router.post('/posts/:postId/comments', authenticate, createComment);
router.put('/comments/:commentId', authenticate, updateComment);
router.delete('/comments/:commentId', authenticate, deleteComment);

// Like routes
router.post('/posts/:postId/like', authenticate, likePost);
router.delete('/posts/:postId/like', authenticate, unlikePost);
router.get('/posts/:postId/like', authenticate, checkLike);
router.get('/posts/:postId/likers', optionalAuth, getPostLikers);
router.get('/likes', authenticate, getLikedPosts);

export default router;
