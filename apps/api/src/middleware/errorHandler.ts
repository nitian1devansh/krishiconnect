import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  console.error(`[Error] ${req.method} ${req.url}:`, err);

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message
      })),
    });
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Handle Prisma known errors
  if (err?.code === 'P2002') {
    const target = err.meta?.target ? ` (${err.meta.target})` : '';
    return res.status(409).json({
      success: false,
      message: `A duplicate record already exists${target}.`,
    });
  }

  if (err?.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Requested record was not found.',
    });
  }

  // Generic fallback error
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'An unexpected error occurred. Please try again.' 
    : err.message || 'Internal Server Error';

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

