import { Request, Response } from 'express';
import aiService from '../services/aiService';
import { AuthRequest } from '../middleware/auth';
import fs from 'fs';

export const smartSearch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== 'string') {
      res.status(400).json({ error: 'Search query is required' });
      return;
    }

    if (query.length > 200) {
      res.status(400).json({ error: 'Search query too long (max 200 characters)' });
      return;
    }

    const result = await aiService.smartSearch(query);

    res.json({
      success: true,
      provider: aiService.getProvider(),
      result,
    });
  } catch (error) {
    console.error('Smart search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
};

export const identifyPlant = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Image file is required' });
      return;
    }

    // Read the uploaded file as base64
    const imageBuffer = fs.readFileSync(req.file.path);
    const imageBase64 = imageBuffer.toString('base64');

    const result = await aiService.identifyPlant(imageBase64, true);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      provider: aiService.getProvider(),
      result,
    });
  } catch (error) {
    console.error('Plant identification error:', error);

    // Clean up file on error
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch {
        // Ignore cleanup errors
      }
    }

    res.status(500).json({ error: 'Plant identification failed' });
  }
};

export const getCareTips = async (req: Request, res: Response): Promise<void> => {
  try {
    const { plantName } = req.params;

    if (!plantName || plantName.length > 100) {
      res.status(400).json({ error: 'Valid plant name is required' });
      return;
    }

    const tips = await aiService.getCareTips(plantName);

    res.json({
      success: true,
      provider: aiService.getProvider(),
      plantName,
      tips,
    });
  } catch (error) {
    console.error('Get care tips error:', error);
    res.status(500).json({ error: 'Failed to get care tips' });
  }
};

export const getAIStatus = async (_req: Request, res: Response): Promise<void> => {
  try {
    const provider = aiService.getProvider();

    res.json({
      available: provider !== null,
      provider: provider || 'none',
      features: {
        smartSearch: provider !== null,
        plantIdentification: provider !== null,
        careTips: provider !== null,
      },
    });
  } catch (error) {
    console.error('AI status error:', error);
    res.status(500).json({ error: 'Failed to get AI status' });
  }
};
