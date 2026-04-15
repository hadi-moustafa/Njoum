// ============================================================
// Standard API response helpers
// Always use these — never manually construct response bodies.
// ============================================================
import { Response } from 'express';
import { ApiResponse } from '@njoum/shared';

export function ok<T>(res: Response, data: T, meta?: ApiResponse['meta'], status = 200): void {
  const body: ApiResponse<T> = { success: true, data, error: null, meta: meta ?? null };
  res.status(status).json(body);
}

export function created<T>(res: Response, data: T): void {
  ok(res, data, null, 201);
}

export function noContent(res: Response): void {
  res.status(204).end();
}

export function paginated<T>(
  res: Response,
  data: T[],
  page: number,
  total: number,
  limit: number,
): void {
  ok(res, data, { page, total, pages: Math.ceil(total / limit), limit });
}
