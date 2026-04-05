import { Router } from 'express';
import { search, analyze } from '../controllers/searchController';
import { authenticate } from '../middleware/auth';
import { aiRateLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * @swagger
 * /search:
 *   get:
 *     summary: AI-powered search for posts
 *     tags: [Search]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Search results
 *       400:
 *         description: Missing query parameter
 */
router.get('/', aiRateLimiter, search);

/**
 * @swagger
 * /search/analyze:
 *   post:
 *     summary: Analyze post content with AI
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Analysis result
 *       401:
 *         description: Not authenticated
 */
router.post('/analyze', authenticate, aiRateLimiter, analyze);

export default router;
