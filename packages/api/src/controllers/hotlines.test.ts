// Integration tests for the hotlines controller using supertest + mocked Supabase.
import express from 'express';
import request from 'supertest';
import { errorHandler } from '../middleware/errorHandler';

// ── Mock Supabase admin client ────────────────────────────────
const mockSelect    = jest.fn();
const mockEq        = jest.fn();
const mockOrder     = jest.fn();
const mockInsert    = jest.fn();
const mockSingle    = jest.fn();

// Chain-builder: each method returns `this`-like object
function buildChain(terminal: jest.Mock) {
  const chain: Record<string, jest.Mock> = {};
  const methods = ['select', 'eq', 'order', 'insert', 'single', 'update', 'limit'];
  methods.forEach(m => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  // terminal resolves the chain
  chain['then'] = terminal;
  return chain;
}

const fakeChain = {
  select: jest.fn().mockReturnThis(),
  eq:     jest.fn().mockReturnThis(),
  order:  jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis(),
  limit:  jest.fn().mockReturnThis(),
};

jest.mock('../models/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(() => fakeChain),
  },
}));

// Re-import after mocks
import { listHotlines, getLocalHotlines } from './hotlines';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.get('/hotlines',       listHotlines);
  app.get('/hotlines/local', getLocalHotlines);
  app.use(errorHandler);
  return app;
}

const SAMPLE_HOTLINES = [
  { id: '1', country_code: 'LB', name: 'طوارئ', number: '112', category: 'police', is_24h: true },
];

describe('GET /hotlines', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: chain resolves with data
    fakeChain.select.mockReturnThis();
    fakeChain.eq.mockReturnThis();
    fakeChain.order.mockReturnThis();
    // Make the chain thenable
    (fakeChain as any)[Symbol.for('nodejs.util.promisify.custom')] = undefined;
  });

  it('returns 200 with hotline list', async () => {
    // Override the chain to resolve
    const { supabaseAdmin } = require('../models/supabase');
    supabaseAdmin.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq:     jest.fn().mockReturnThis(),
      order:  jest.fn().mockResolvedValue({ data: SAMPLE_HOTLINES, error: null }),
    });

    const app = buildApp();
    const res = await request(app).get('/hotlines?country=LB');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('returns 400 for invalid country code length', async () => {
    const app = buildApp();
    const res = await request(app).get('/hotlines?country=LBNN');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for unknown category', async () => {
    const app = buildApp();
    const res = await request(app).get('/hotlines?category=invalid');
    expect(res.status).toBe(400);
  });
});
