import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  logger.error('Unhandled error', {
    message: err.message,
    stack:   err.stack,
    url:     req.url,
    method:  req.method,
  });

  const status  = (err as any).status ?? 500;
  const message = env.isProd ? 'Something went wrong. Please try again.' : err.message;

  res.status(status).json({ success: false, message });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} not found.` });
}
