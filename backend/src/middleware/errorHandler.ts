import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[ERROR] ${req.method} ${req.url} - ${message}`, err.stack);

  if (err instanceof ZodError) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation Error',
      errors: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message
      }))
    });
  }

  res.status(statusCode).json({
    status: 'error',
    message: statusCode === 500 && process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : message
  });
};
