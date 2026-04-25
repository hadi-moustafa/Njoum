import { ok, created, noContent, paginated } from './response';
import type { Response } from 'express';

function makeRes() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json:   jest.fn().mockReturnThis(),
    end:    jest.fn().mockReturnThis(),
  };
  return res as unknown as Response;
}

describe('response helpers', () => {
  describe('ok()', () => {
    it('responds 200 with success envelope', () => {
      const res = makeRes();
      ok(res, { id: '1' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true, data: { id: '1' }, error: null, meta: null,
      });
    });

    it('accepts a custom status code', () => {
      const res = makeRes();
      ok(res, null, null, 202);
      expect(res.status).toHaveBeenCalledWith(202);
    });

    it('includes meta when provided', () => {
      const res = makeRes();
      ok(res, [], { page: 1, total: 0, pages: 0, limit: 20 });
      const body = (res.json as jest.Mock).mock.calls[0][0];
      expect(body.meta).toEqual({ page: 1, total: 0, pages: 0, limit: 20 });
    });
  });

  describe('created()', () => {
    it('responds 201', () => {
      const res = makeRes();
      created(res, { id: 'new' });
      expect(res.status).toHaveBeenCalledWith(201);
      expect((res.json as jest.Mock).mock.calls[0][0].success).toBe(true);
    });
  });

  describe('noContent()', () => {
    it('responds 204 with no body', () => {
      const res = makeRes();
      noContent(res);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.end).toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe('paginated()', () => {
    it('includes correct meta', () => {
      const res = makeRes();
      paginated(res, [1, 2, 3], 2, 45, 20);
      const body = (res.json as jest.Mock).mock.calls[0][0];
      expect(body.meta).toEqual({ page: 2, total: 45, pages: 3, limit: 20 });
    });

    it('computes pages ceiling correctly', () => {
      const res = makeRes();
      paginated(res, [], 1, 21, 20);
      const body = (res.json as jest.Mock).mock.calls[0][0];
      expect(body.meta.pages).toBe(2);
    });
  });
});
