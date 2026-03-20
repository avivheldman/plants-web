import { Request, Response, NextFunction } from 'express';

export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
};

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal Server Error' });
};
