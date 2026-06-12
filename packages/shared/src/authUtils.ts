// ============================================================
// Pure auth utility functions — no framework dependencies.
// Shared between the web callback route and the mobile sign-in screen.
// Fully unit-testable without mocking any framework.
// ============================================================

// ── OAuth callback URL parsing ────────────────────────────────

/**
 * Extracts the PKCE `code` from an OAuth callback URL query string.
 * Supabase uses PKCE by default: the callback contains ?code=<value>.
 */
export function extractCodeFromCallbackUrl(url: string): string | null {
  const match = url.match(/[?&]code=([^&#]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Extracts access_token + refresh_token from an OAuth callback URL
 * hash fragment (implicit flow fallback).
 * Returns null if either token is missing.
 */
export function extractTokensFromCallbackUrl(
  url: string,
): { accessToken: string; refreshToken: string } | null {
  const atMatch = url.match(/[#&]access_token=([^&#]+)/);
  const rtMatch = url.match(/[#&]refresh_token=([^&#]+)/);
  const at = atMatch ? decodeURIComponent(atMatch[1]) : null;
  const rt = rtMatch ? decodeURIComponent(rtMatch[1]) : null;
  return at && rt ? { accessToken: at, refreshToken: rt } : null;
}

// ── Origin resolution (web, Vercel-aware) ─────────────────────

/**
 * Resolves the public-facing base URL for the server.
 * Uses x-forwarded-* headers when behind a Vercel/proxy, otherwise
 * falls back to the values from the parsed request URL.
 */
export function resolveOrigin(
  forwardedProto: string | null,
  forwardedHost:  string | null,
  fallbackProtocol: string,
  fallbackHost:     string,
): string {
  const proto = forwardedProto ?? fallbackProtocol.replace(':', '');
  const host  = forwardedHost  ?? fallbackHost;
  return `${proto}://${host}`;
}

// ── User data preparation for upsert ─────────────────────────

export interface OAuthUserMeta {
  full_name?: unknown;
  name?:      unknown;
  avatar_url?: unknown;
}

export interface UserUpsertPayload {
  id:         string;
  email:      string;
  full_name:  string;
  avatar_url: string | null;
  role:       'girl';
}

/**
 * Builds the upsert payload for public.users from Supabase Auth user data.
 * Always uses role:'girl' — admins are promoted manually in the DB.
 * ignoreDuplicates must be set by the caller so existing admin rows are never overwritten.
 */
export function buildUserUpsertPayload(
  id:    string,
  email: string | null | undefined,
  meta:  OAuthUserMeta | null | undefined,
): UserUpsertPayload {
  return {
    id,
    email:      email ?? '',
    full_name:  String(meta?.full_name ?? meta?.name ?? email?.split('@')[0] ?? ''),
    avatar_url: meta?.avatar_url ? String(meta.avatar_url) : null,
    role:       'girl',
  };
}
