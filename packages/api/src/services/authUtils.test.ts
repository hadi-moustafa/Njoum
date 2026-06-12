// Unit tests for the shared auth utilities used by the Google Sign-In flow.
// These cover URL parsing, origin resolution, and user upsert payload building
// — all of which are pure functions with no framework dependencies.
import {
  extractCodeFromCallbackUrl,
  extractTokensFromCallbackUrl,
  resolveOrigin,
  buildUserUpsertPayload,
} from '@njoum/shared';

// ─────────────────────────────────────────────────────────────
// extractCodeFromCallbackUrl
// ─────────────────────────────────────────────────────────────
describe('extractCodeFromCallbackUrl', () => {
  it('extracts code from a standard PKCE callback URL', () => {
    const url = 'njoum://auth/callback?code=abc123xyz';
    expect(extractCodeFromCallbackUrl(url)).toBe('abc123xyz');
  });

  it('extracts code when other query params are present before it', () => {
    const url = 'njoum://auth/callback?state=xyz&code=pkce_code_here';
    expect(extractCodeFromCallbackUrl(url)).toBe('pkce_code_here');
  });

  it('extracts code when other query params appear after it', () => {
    const url = 'https://njoum.vercel.app/auth/callback?code=abc&session_id=999';
    expect(extractCodeFromCallbackUrl(url)).toBe('abc');
  });

  it('decodes URL-encoded characters in the code', () => {
    const url = 'njoum://auth/callback?code=abc%2Bdef%3D%3D';
    expect(extractCodeFromCallbackUrl(url)).toBe('abc+def==');
  });

  it('returns null when no code param exists', () => {
    const url = 'njoum://auth/callback?error=access_denied';
    expect(extractCodeFromCallbackUrl(url)).toBeNull();
  });

  it('returns null for a URL with only a hash fragment (implicit flow)', () => {
    const url = 'njoum://auth/callback#access_token=tok&refresh_token=ref';
    expect(extractCodeFromCallbackUrl(url)).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(extractCodeFromCallbackUrl('')).toBeNull();
  });

  it('does not confuse access_token in hash with a code query param', () => {
    const url = 'njoum://auth/callback#access_token=should_not_match';
    expect(extractCodeFromCallbackUrl(url)).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────
// extractTokensFromCallbackUrl
// ─────────────────────────────────────────────────────────────
describe('extractTokensFromCallbackUrl', () => {
  it('extracts both tokens from a hash fragment (implicit flow)', () => {
    const url = 'njoum://auth/callback#access_token=AT_123&refresh_token=RT_456&token_type=bearer';
    expect(extractTokensFromCallbackUrl(url)).toEqual({
      accessToken:  'AT_123',
      refreshToken: 'RT_456',
    });
  });

  it('decodes URL-encoded tokens', () => {
    const url = 'njoum://auth/callback#access_token=a%2Bb&refresh_token=c%2Bd';
    expect(extractTokensFromCallbackUrl(url)).toEqual({
      accessToken:  'a+b',
      refreshToken: 'c+d',
    });
  });

  it('returns null when access_token is missing', () => {
    const url = 'njoum://auth/callback#refresh_token=RT_456';
    expect(extractTokensFromCallbackUrl(url)).toBeNull();
  });

  it('returns null when refresh_token is missing', () => {
    const url = 'njoum://auth/callback#access_token=AT_123';
    expect(extractTokensFromCallbackUrl(url)).toBeNull();
  });

  it('returns null for a PKCE flow URL (no hash tokens)', () => {
    const url = 'njoum://auth/callback?code=pkce_code';
    expect(extractTokensFromCallbackUrl(url)).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(extractTokensFromCallbackUrl('')).toBeNull();
  });

  it('handles long real-world-looking JWT tokens', () => {
    const at = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyJ9.sig';
    const rt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJyZWZyZXNoIn0.sig';
    const url = `njoum://auth/callback#access_token=${at}&refresh_token=${rt}`;
    expect(extractTokensFromCallbackUrl(url)).toEqual({ accessToken: at, refreshToken: rt });
  });
});

// ─────────────────────────────────────────────────────────────
// resolveOrigin
// ─────────────────────────────────────────────────────────────
describe('resolveOrigin', () => {
  it('uses x-forwarded headers when present (Vercel production)', () => {
    expect(resolveOrigin('https', 'njoum.vercel.app', 'http:', 'localhost:3000'))
      .toBe('https://njoum.vercel.app');
  });

  it('falls back to nextUrl values when no forwarded headers (localhost dev)', () => {
    expect(resolveOrigin(null, null, 'http:', 'localhost:3000'))
      .toBe('http://localhost:3000');
  });

  it('strips the trailing colon from the fallback protocol', () => {
    expect(resolveOrigin(null, null, 'https:', 'example.com'))
      .toBe('https://example.com');
  });

  it('uses forwarded proto but falls back on host when only proto is forwarded', () => {
    expect(resolveOrigin('https', null, 'http:', 'localhost:3000'))
      .toBe('https://localhost:3000');
  });

  it('uses fallback proto but forwarded host when only host is forwarded', () => {
    expect(resolveOrigin(null, 'njoum.vercel.app', 'http:', 'localhost:3000'))
      .toBe('http://njoum.vercel.app');
  });
});

// ─────────────────────────────────────────────────────────────
// buildUserUpsertPayload
// ─────────────────────────────────────────────────────────────
describe('buildUserUpsertPayload', () => {
  it('builds a complete payload from Google metadata', () => {
    const payload = buildUserUpsertPayload(
      'user-uuid-123',
      'hadi@gmail.com',
      { full_name: 'Hadi Moustafa', avatar_url: 'https://lh3.googleusercontent.com/photo.jpg' },
    );
    expect(payload).toEqual({
      id:         'user-uuid-123',
      email:      'hadi@gmail.com',
      full_name:  'Hadi Moustafa',
      avatar_url: 'https://lh3.googleusercontent.com/photo.jpg',
      role:       'girl',
    });
  });

  it('falls back to meta.name when full_name is absent', () => {
    const payload = buildUserUpsertPayload('uid', 'test@gmail.com', { name: 'Test User' });
    expect(payload.full_name).toBe('Test User');
  });

  it('falls back to email prefix when name metadata is absent', () => {
    const payload = buildUserUpsertPayload('uid', 'fatima@example.com', {});
    expect(payload.full_name).toBe('fatima');
  });

  it('falls back to empty string when email is also absent', () => {
    const payload = buildUserUpsertPayload('uid', null, null);
    expect(payload.full_name).toBe('');
    expect(payload.email).toBe('');
  });

  it('sets avatar_url to null when not in metadata', () => {
    const payload = buildUserUpsertPayload('uid', 'a@b.com', { full_name: 'Ana' });
    expect(payload.avatar_url).toBeNull();
  });

  it('always sets role to "girl" — never overwrites an existing admin (ignoreDuplicates is caller responsibility)', () => {
    const payload = buildUserUpsertPayload('uid', 'admin@example.com', {});
    expect(payload.role).toBe('girl');
  });

  it('handles undefined meta gracefully', () => {
    expect(() => buildUserUpsertPayload('uid', 'a@b.com', undefined)).not.toThrow();
  });
});
