import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: 'Route not found' });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  const e = err as { name?: string; code?: number };

  // invalid ObjectId, e.g. /api/campaigns/abc
  if (e.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid id' });
  }

  // mongo duplicate key (unique index)
  if (e.code === 11000) {
    return res.status(409).json({ error: 'Duplicate value' });
  }

  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}