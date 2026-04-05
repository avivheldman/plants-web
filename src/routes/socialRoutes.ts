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

/**
 * @swagger
 * /social/posts/{postId}/comments:
 *   get:
 *     summary: Get comments for a post
 *     tags: [Social]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of comments
 *       400:
 *         description: Invalid post ID
 */
router.get('/posts/:postId/comments', optionalAuth, getComments);

/**
 * @swagger
 * /social/posts/{postId}/comments:
 *   post:
 *     summary: Add a comment to a post
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment created
 *       400:
 *         description: Missing text
 *       401:
 *         description: Not authenticated
 */
router.post('/posts/:postId/comments', authenticate, createComment);

/**
 * @swagger
 * /social/comments/{commentId}:
 *   put:
 *     summary: Update a comment
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Comment updated
 *       403:
 *         description: Not authorized
 */
router.put('/comments/:commentId', authenticate, updateComment);

/**
 * @swagger
 * /social/comments/{commentId}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comment deleted
 *       403:
 *         description: Not authorized
 */
router.delete('/comments/:commentId', authenticate, deleteComment);

/**
 * @swagger
 * /social/posts/{postId}/like:
 *   post:
 *     summary: Like a post
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Post liked
 *       409:
 *         description: Already liked
 */
router.post('/posts/:postId/like', authenticate, likePost);

/**
 * @swagger
 * /social/posts/{postId}/like:
 *   delete:
 *     summary: Unlike a post
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post unliked
 *       404:
 *         description: Like not found
 */
router.delete('/posts/:postId/like', authenticate, unlikePost);

/**
 * @swagger
 * /social/posts/{postId}/like:
 *   get:
 *     summary: Check if current user liked a post
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Like status
 */
router.get('/posts/:postId/like', authenticate, checkLike);

/**
 * @swagger
 * /social/posts/{postId}/likers:
 *   get:
 *     summary: Get users who liked a post
 *     tags: [Social]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/posts/:postId/likers', optionalAuth, getPostLikers);

/**
 * @swagger
 * /social/likes:
 *   get:
 *     summary: Get posts liked by current user
 *     tags: [Social]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of liked posts
 *       401:
 *         description: Not authenticated
 */
router.get('/likes', authenticate, getLikedPosts);

export default router;
