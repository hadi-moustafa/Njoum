import { AppError, errorHandler } from './errorHandler';
import { ZodError, z } from 'zod';
import type { Request, Response, NextFunction } from 'express';

function makeRes() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json:   jest.fn().mockReturnThis(),
  };
  return res as unknown as Response;
}

const REQ  = {} as Request;
const NEXT = jest.fn() as unknown as NextFunction;

describe('AppError', () => {
  it('stores statusCode and code properties', () => {
    const err = new AppError(404, 'NOT_FOUND', 'Resource missing');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.message).toBe('Resource missing');
    expect(err.name).toBe('AppError');
  });
});

describe('errorHandler', () => {
  it('handles AppError with correct status and envelope', () => {
    const res = makeRes();
    const err = new AppError(403, 'FORBIDDEN', 'No access');
    errorHandler(err, REQ, res, NEXT);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error:   expect.objectContaining({ code: 'FORBIDDEN' }),
    }));
  });

  it('handles ZodError with 400 and VALIDATION_ERROR code', () => {
    const res = makeRes();
    let zodErr: ZodError;
    try {
      z.object({ name: z.string() }).parse({ name: 123 });
    } catch (e) {
      zodErr = e as ZodError;
    }
    errorHandler(zodErr!, REQ, res, NEXT);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.objectContaining({ code: 'VALIDATION_ERROR' }),
    }));
  });

  it('handles unknown errors with 500 and INTERNAL_ERROR', () => {
    const res = makeRes();
    errorHandler(new Error('boom'), REQ, res, NEXT);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.objectContaining({ code: 'INTERNAL_ERROR' }),
    }));
  });

  it('never leaks error internals in the 500 response message', () => {
    const res = makeRes();
    errorHandler(new Error('secret database password'), REQ, res, NEXT);
    const body = (res.json as jest.Mock).mock.calls[0][0];
    expect(body.error.message).not.toContain('secret database password');
  });
});
