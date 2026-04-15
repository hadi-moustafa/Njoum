// ============================================================
// Njoum — Shared Constants
// ============================================================

// ── Brand colours ────────────────────────────────────────────
export const COLORS = {
  primary:    '#B5586A', // buttons, active states, logo
  accent:     '#C8956A', // icons, badges, progress bars
  depth:      '#7A4E7A', // mental health section, journal
  background: '#FDF6F0', // page background (light mode)
  text:       '#2A1520', // body text
  emergency:  '#E53E3E', // SOS button only — never decorative
  success:    '#38A169', // safe state confirmations, completed badges
  dark:       '#1A0D10', // dark mode surface
} as const;

// ── Auth (Supabase manages token TTLs — these are for reference only) ────────
// Access token TTL is configured in Supabase dashboard (default: 3600s / 1h)
// Refresh token TTL is configured in Supabase dashboard (default: 7 days)
export const SUPABASE_ACCESS_TOKEN_TTL_SECONDS = 3600;
export const SUPABASE_REFRESH_TOKEN_TTL_DAYS   = 7;

// ── SOS ──────────────────────────────────────────────────────
export const SOS_GRACE_PERIOD_SECONDS    = 10;   // cancel window after trigger
export const SOS_TRACKING_LINK_TTL_MINS  = 60;   // tracking URL expiry
export const SOS_MAX_CONTACTS            = 5;

// ── Pagination ───────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE     = 100;

// ── Rate limiting ────────────────────────────────────────────
export const LOGIN_RATE_LIMIT_PER_MINUTE = 10;

// ── Security ─────────────────────────────────────────────────
export const BCRYPT_COST_FACTOR = 12;

// ── File uploads ─────────────────────────────────────────────
export const MAX_UPLOAD_SIZE_MB       = 50;
export const ALLOWED_IMAGE_TYPES      = ['image/jpeg', 'image/png', 'image/webp'];
export const ALLOWED_VIDEO_TYPES      = ['video/mp4', 'video/webm'];

// ── Cycle defaults ───────────────────────────────────────────
export const DEFAULT_CYCLE_LENGTH_DAYS  = 28;
export const DEFAULT_PERIOD_LENGTH_DAYS = 5;

// ── Supported locales ────────────────────────────────────────
export const SUPPORTED_LANGUAGES = ['ar', 'en', 'fr'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

// ── User roles ordered by privilege ──────────────────────────
export const ROLE_HIERARCHY = [
  'girl',
  'parent',
  'mentor',
  'content_admin',
  'community_moderator',
  'super_admin',
] as const;

export const ADMIN_ROLES = [
  'content_admin',
  'community_moderator',
  'super_admin',
] as const;
