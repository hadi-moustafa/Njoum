// Integration tests for the Google OAuth callback route handler.
// Mocks all Supabase I/O — tests routing logic, origin resolution,
// upsert payload, and redirect destinations.

// ── Mocks (must be before any imports that use them) ──────────

const mockExchangeCodeForSession = jest.fn();
const mockUpsert                 = jest.fn();
const mockFrom                   = jest.fn(() => ({ upsert: mockUpsert }));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: { exchangeCodeForSession: mockExchangeCodeForSession },
  })),
}));

jest.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: { from: mockFrom },
}));

// Minimal NextResponse mock — we only use .redirect() in this route.
const mockRedirect = jest.fn((url: string) => ({ redirectedTo: url }));
jest.mock('next/server', () => ({
  NextResponse: { redirect: mockRedirect },
  NextRequest:  jest.requireActual('next/server').NextRequest,
}));

// ── Helpers ───────────────────────────────────────────────────

import { GET } from './route';

/** Build a minimal fake NextRequest without importing the real Next.js class. */
function fakeRequest(
  url:     string,
  headers: Record<string, string> = {},
): any {
  const parsed = new URL(url);
  return {
    url,
    nextUrl: {
      protocol:    parsed.protocol,
      host:        parsed.host,
      searchParams: parsed.searchParams,
    },
    headers: { get: (key: string) => headers[key] ?? null },
  };
}

const FAKE_USER = {
  id:            'user-uuid-abc',
  email:         'hadi@gmail.com',
  user_metadata: { full_name: 'Hadi Moustafa', avatar_url: 'https://example.com/photo.jpg' },
};

// ── Tests ─────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mockUpsert.mockResolvedValue({ error: null });
});

describe('GET /auth/callback — happy path', () => {
  it('exchanges the code, upserts the user, and redirects to /dashboard', async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data:  { user: FAKE_USER, session: { access_token: 'tok' } },
      error: null,
    });

    const req = fakeRequest('https://njoum.vercel.app/auth/callback?code=validcode123');
    await GET(req);

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('validcode123');
    expect(mockFrom).toHaveBeenCalledWith('users');
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id:        'user-uuid-abc',
        email:     'hadi@gmail.com',
        full_name: 'Hadi Moustafa',
        role:      'girl',
      }),
      { onConflict: 'id', ignoreDuplicates: true },
    );
    expect(mockRedirect).toHaveBeenCalledWith(expect.stringContaining('/dashboard'));
  });

  it('redirects to the correct production origin (Vercel x-forwarded headers)', async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: FAKE_USER, session: {} }, error: null,
    });

    const req = fakeRequest(
      'http://internal-proxy/auth/callback?code=abc',
      { 'x-forwarded-proto': 'https', 'x-forwarded-host': 'njoum.vercel.app' },
    );
    await GET(req);

    expect(mockRedirect).toHaveBeenCalledWith('https://njoum.vercel.app/dashboard');
  });

  it('redirects to localhost origin when no forwarded headers (local dev)', async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: FAKE_USER, session: {} }, error: null,
    });

    const req = fakeRequest('http://localhost:3000/auth/callback?code=abc');
    await GET(req);

    expect(mockRedirect).toHaveBeenCalledWith('http://localhost:3000/dashboard');
  });

  it('passes ignoreDuplicates:true to protect existing admin roles', async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: FAKE_USER, session: {} }, error: null,
    });

    await GET(fakeRequest('https://njoum.vercel.app/auth/callback?code=abc'));

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ ignoreDuplicates: true }),
    );
  });
});

describe('GET /auth/callback — error cases', () => {
  it('redirects to /login?error=oauth_error when OAuth error param is present', async () => {
    const req = fakeRequest(
      'https://njoum.vercel.app/auth/callback?error=access_denied&error_description=User+cancelled',
    );
    await GET(req);

    expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.stringContaining('/login?error=oauth_error'),
    );
  });

  it('redirects to /login when no code and no error (e.g. direct browser hit)', async () => {
    const req = fakeRequest('https://njoum.vercel.app/auth/callback');
    await GET(req);

    expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
    expect(mockRedirect).toHaveBeenCalledWith(expect.stringContaining('/login'));
    expect(mockRedirect).not.toHaveBeenCalledWith(expect.stringContaining('oauth_error'));
  });

  it('redirects to /login?error=oauth_error when code exchange fails', async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'code verifier mismatch' },
    });

    const req = fakeRequest('https://njoum.vercel.app/auth/callback?code=badcode');
    await GET(req);

    expect(mockUpsert).not.toHaveBeenCalled();
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.stringContaining('/login?error=oauth_error'),
    );
  });

  it('redirects to /login?error=oauth_error when exchange returns no user', async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { user: null, session: null }, error: null,
    });

    await GET(fakeRequest('https://njoum.vercel.app/auth/callback?code=abc'));

    expect(mockUpsert).not.toHaveBeenCalled();
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.stringContaining('/login?error=oauth_error'),
    );
  });
});

describe('GET /auth/callback — upsert payload correctness', () => {
  it('falls back to email prefix when Google provides no name', async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: {
        user:    { id: 'uid', email: 'noname@gmail.com', user_metadata: {} },
        session: {},
      },
      error: null,
    });

    await GET(fakeRequest('https://njoum.vercel.app/auth/callback?code=abc'));

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ full_name: 'noname' }),
      expect.any(Object),
    );
  });

  it('prefers full_name over name in metadata', async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: {
        user: {
          id: 'uid', email: 'a@b.com',
          user_metadata: { full_name: 'Full Name', name: 'Short Name' },
        },
        session: {},
      },
      error: null,
    });

    await GET(fakeRequest('https://njoum.vercel.app/auth/callback?code=abc'));

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ full_name: 'Full Name' }),
      expect.any(Object),
    );
  });

  it('sets avatar_url to null when metadata has no avatar', async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: {
        user: { id: 'uid', email: 'a@b.com', user_metadata: { full_name: 'Test' } },
        session: {},
      },
      error: null,
    });

    await GET(fakeRequest('https://njoum.vercel.app/auth/callback?code=abc'));

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ avatar_url: null }),
      expect.any(Object),
    );
  });
});
