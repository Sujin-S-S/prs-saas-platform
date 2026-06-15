import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { AppError } from './errorHandler';

// Standard rate limiter: max 100 requests per minute per IP
const rateLimiter = new RateLimiterMemory({
  points: 100, // Number of points
  duration: 60, // Per 60 seconds
});

export const rateLimiterMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';

  rateLimiter
    .consume(ip)
    .then(() => {
      next();
    })
    .catch(() => {
      next(new AppError('Too many requests, please try again later.', 429));
    });
};
