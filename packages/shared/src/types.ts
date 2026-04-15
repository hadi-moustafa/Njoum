// ============================================================
// Njoum — Shared TypeScript Types
// Used by both packages/api and apps/mobile + apps/web
// ============================================================

// ── Users ────────────────────────────────────────────────────
export type UserRole =
  | 'girl'
  | 'parent'
  | 'mentor'
  | 'content_admin'
  | 'community_moderator'
  | 'super_admin';

export type AgeRange = '10-12' | '13-17' | '18-24' | '25+';

export interface User {
  id: string;
  email: string;
  phone?: string;
  full_name?: string;
  display_name?: string;
  avatar_url?: string;
  role: UserRole;
  age_range?: AgeRange;
  country_code?: string;
  language: string;
  safe_word?: string;
  is_verified: boolean;
  last_seen_at?: string;
  created_at: string;
  deleted_at?: string;
}

// ── SOS ──────────────────────────────────────────────────────
export type SosTriggerMethod = 'button' | 'shake' | 'volume' | 'safe_word';
export type SosNotificationChannel = 'sms' | 'push' | 'both';
export type SosNotificationStatus = 'pending' | 'sent' | 'failed';

export interface SosEvent {
  id: string;
  user_id: string;
  trigger_method: SosTriggerMethod;
  latitude?: number;
  longitude?: number;
  address?: string;
  cancelled: boolean;
  cancelled_at?: string;
  resolved_at?: string;
  created_at: string;
}

// ── Hotlines ─────────────────────────────────────────────────
export type HotlineCategory =
  | 'police'
  | 'fire'
  | 'mental_health'
  | 'domestic_violence'
  | 'legal_aid'
  | 'child_protection'
  | 'eating_disorder'
  | 'addiction';

export interface Hotline {
  id: string;
  country_code: string;
  name: string;
  number: string;
  category: HotlineCategory;
  description?: string;
  is_active: boolean;
  is_24h: boolean;
  last_checked_at?: string;
  created_at: string;
}

// ── Mood ─────────────────────────────────────────────────────
export interface MoodLog {
  id: string;
  user_id: string;
  score: 1 | 2 | 3 | 4 | 5;
  emoji?: string;
  note?: string;
  logged_at: string; // DATE as ISO string
  created_at: string;
}

// ── Journal ──────────────────────────────────────────────────
export interface JournalEntry {
  id: string;
  user_id: string;
  title?: string;
  content_encrypted: string; // AES-256 ciphertext
  mood_score?: 1 | 2 | 3 | 4 | 5;
  is_cloud_backed: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

// ── Cycles ───────────────────────────────────────────────────
export type FlowIntensity = 'spotting' | 'light' | 'medium' | 'heavy';
export type ReminderType = 'period_due' | 'pill' | 'hydration' | 'custom';

export interface MenstrualCycle {
  id: string;
  user_id: string;
  start_date: string;
  end_date?: string;
  flow_intensity?: FlowIntensity;
  symptoms: string[];
  notes_encrypted?: string;
  created_at: string;
}

// ── Community ────────────────────────────────────────────────
export type GroupCategory =
  | 'survivors'
  | 'students'
  | 'career'
  | 'general'
  | 'mental_health'
  | 'custom';

export type ReactionType = 'heart' | 'hug' | 'support' | 'star';
export type ContentReportStatus = 'open' | 'under_review' | 'resolved' | 'dismissed';
export type ContentReportTarget = 'post' | 'comment' | 'user';

export interface Post {
  id: string;
  group_id: string;
  author_id: string; // never returned to non-admin when is_anonymous = true
  content: string;
  media_urls: string[];
  is_anonymous: boolean;
  is_flagged: boolean;
  is_removed: boolean;
  created_at: string;
  updated_at: string;
}

// ── Scouts ───────────────────────────────────────────────────
export type AgeTier = 'brownie_6_8' | 'guide_9_12' | 'senior_13_17';

export interface Badge {
  id: string;
  name: string;
  description?: string;
  module: 'scouts' | 'self_defence' | 'wellness' | 'safety' | 'community';
  category?: string;
  icon_url?: string;
  created_at: string;
}

// ── Content ──────────────────────────────────────────────────
export type ContentModule =
  | 'safety'
  | 'mental_health'
  | 'legal'
  | 'wellness'
  | 'self_defence';

export type ScenarioCategory =
  | 'grabbed'
  | 'followed'
  | 'attacked'
  | 'online_safety'
  | 'general';

export type QuizDifficulty = 'beginner' | 'intermediate' | 'advanced';

// ── Notifications ────────────────────────────────────────────
export type NotificationType =
  | 'sos_alert'
  | 'period_reminder'
  | 'affirmation'
  | 'badge_earned'
  | 'journey_alert'
  | 'moderation'
  | 'general';

export type NotificationStatus = 'queued' | 'sent' | 'failed';
export type NotificationChannel = 'push' | 'sms' | 'email';

// ── API Response Envelope ────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string } | null;
  meta: { page?: number; total?: number; [key: string]: unknown } | null;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}
