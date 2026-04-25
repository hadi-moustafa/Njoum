import { requireAuth, requireRole } from './auth';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

const SECRET = process.env['SUPABASE_JWT_SECRET']!;

function makeReq(overrides: Partial<Request> = {}): Request {
  return {
    headers: {},
    ...overrides,
  } as unknown as Request;
}

function makeRes(): Response {
  return {} as Response;
}

function makeNext(): jest.Mock<NextFunction> {
  return jest.fn() as unknown as jest.Mock<NextFunction>;
}

function validToken(payload: object = {}): string {
  return jwt.sign(
    { sub: 'user-123', email: 'test@example.com', aud: 'authenticated', app_metadata: { role: 'girl' }, ...payload },
    SECRET,
    { expiresIn: '1h' }
  );
}

describe('requireAuth middleware', () => {
  it('calls next with 401 when no Authorization header', () => {
    const next = makeNext();
    requireAuth(makeReq(), makeRes(), next as unknown as NextFunction);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401, code: 'UNAUTHORIZED' }));
  });

  it('calls next with 401 when header does not start with Bearer', () => {
    const next = makeNext();
    requireAuth(makeReq({ headers: { authorization: 'Basic abc' } }), makeRes(), next as unknown as NextFunction);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('calls next with 401 when token is invalid', () => {
    const next = makeNext();
    requireAuth(
      makeReq({ headers: { authorization: 'Bearer bad.token.here' } }),
      makeRes(),
      next as unknown as NextFunction,
    );
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401, code: 'TOKEN_INVALID' }));
  });

  it('calls next with 401 when token is expired', () => {
    const expired = jwt.sign(
      { sub: 'u', email: 'e@e.com', aud: 'authenticated' },
      SECRET,
      { expiresIn: '-1s' }
    );
    const next = makeNext();
    requireAuth(
      makeReq({ headers: { authorization: `Bearer ${expired}` } }),
      makeRes(),
      next as unknown as NextFunction,
    );
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('attaches user and calls next() with no error for valid token', () => {
    const token = validToken({ app_metadata: { role: 'mentor' } });
    const req   = makeReq({ headers: { authorization: `Bearer ${token}` } });
    const next  = makeNext();
    requireAuth(req, makeRes(), next as unknown as NextFunction);
    expect(next).toHaveBeenCalledWith(); // no error arg
    expect(req.user).toEqual({ id: 'user-123', email: 'test@example.com', role: 'mentor' });
  });

  it('defaults role to "girl" when app_metadata.role is absent', () => {
    const token = jwt.sign({ sub: 'u', email: 'e@e.com', aud: 'authenticated' }, SECRET, { expiresIn: '1h' });
    const req   = makeReq({ headers: { authorization: `Bearer ${token}` } });
    const next  = makeNext();
    requireAuth(req, makeRes(), next as unknown as NextFunction);
    expect(req.user?.role).toBe('girl');
  });
});

describe('requireRole middleware', () => {
  it('calls next with 403 when user role is not in allowed list', () => {
    const req  = { user: { id: 'u', email: 'e', role: 'girl' } } as unknown as Request;
    const next = makeNext();
    requireRole('super_admin')(req, makeRes(), next as unknown as NextFunction);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it('calls next() with no error when role matches', () => {
    const req  = { user: { id: 'u', email: 'e', role: 'super_admin' } } as unknown as Request;
    const next = makeNext();
    requireRole('super_admin', 'content_admin')(req, makeRes(), next as unknown as NextFunction);
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next with 401 when req.user is absent', () => {
    const req  = {} as Request;
    const next = makeNext();
    requireRole('super_admin')(req, makeRes(), next as unknown as NextFunction);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
});
