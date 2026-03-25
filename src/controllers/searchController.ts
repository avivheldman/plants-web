import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { smartSearch, analyzePostContent } from '../services/aiService';

export const search = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      res.status(400).json({ error: 'Search query is required' });
      return;
    }

    if (q.length > 200) {
      res.status(400).json({ error: 'Search query too long (max 200 characters)' });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 10;
    const results = await smartSearch(q.trim(), Math.min(limit, 50));

    res.json({ success: true, data: results, query: q.trim() });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
};

export const analyze = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      res.status(400).json({ error: 'Title and content are required' });
      return;
    }

    const analysis = await analyzePostContent(title, content);

    res.json({ success: true, data: analysis });
  } catch (error) {
    console.error('Analyze error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
};
