import { Request, Response } from 'express';
import { ApiResponse } from '@njoum/shared';

export function notFound(_req: Request, res: Response): void {
  const body: ApiResponse = {
    success: false,
    data: null,
    error: { code: 'NOT_FOUND', message: 'The requested route does not exist.' },
    meta: null,
  };
  res.status(404).json(body);
}
