import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiResponse } from '@njoum/shared';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Central error handler — always returns the standard envelope
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Zod validation errors → 400
  if (err instanceof ZodError) {
    const body: ApiResponse = {
      success: false,
      data: null,
      error: { code: 'VALIDATION_ERROR', message: err.errors.map(e => e.message).join(', ') },
      meta: null,
    };
    res.status(400).json(body);
    return;
  }

  // Known application errors
  if (err instanceof AppError) {
    const body: ApiResponse = {
      success: false,
      data: null,
      error: { code: err.code, message: err.message },
      meta: null,
    };
    res.status(err.statusCode).json(body);
    return;
  }

  // Unknown — log and return 500 (never leak internals)
  console.error('[Unhandled Error]', err);
  const body: ApiResponse = {
    success: false,
    data: null,
    error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
    meta: null,
  };
  res.status(500).json(body);
}
