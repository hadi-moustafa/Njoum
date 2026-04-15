-- ============================================================
-- Njoum — Core Database Migration
-- Created: 2026-04-15
-- Description: All 25 core tables for the Njoum platform
-- ============================================================

-- Enable UUID extension (already on Supabase, but safe to re-run)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- 1. USERS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  phone         TEXT,
  full_name     TEXT,
  display_name  TEXT,
  avatar_url    TEXT,
  role          TEXT NOT NULL DEFAULT 'girl'
                  CHECK (role IN ('girl','parent','mentor','content_admin','community_moderator','super_admin')),
  age_range     TEXT CHECK (age_range IN ('10-12','13-17','18-24','25+')),
  country_code  TEXT,                       -- ISO 3166-1 alpha-2 e.g. 'LB'
  language      TEXT NOT NULL DEFAULT 'ar', -- ISO 639-1
  safe_word     TEXT,                       -- triggers discreet SOS
  is_verified   BOOLEAN NOT NULL DEFAULT FALSE,
  last_seen_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ                 -- soft-delete; filter WHERE deleted_at IS NULL
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 2. EMERGENCY CONTACTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE emergency_contacts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  phone          TEXT NOT NULL,
  relationship   TEXT,                      -- e.g. 'mother', 'friend'
  notify_order   INTEGER NOT NULL CHECK (notify_order BETWEEN 1 AND 5),
  notify_on_sos  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, notify_order)
);

ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 3. SOS EVENTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE sos_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trigger_method  TEXT NOT NULL
                    CHECK (trigger_method IN ('button','shake','volume','safe_word')),
  latitude        DOUBLE PRECISION,
  longitude       DOUBLE PRECISION,
  address         TEXT,
  cancelled       BOOLEAN NOT NULL DEFAULT FALSE,
  cancelled_at    TIMESTAMPTZ,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE sos_events ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 4. SOS NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE sos_notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sos_event_id    UUID NOT NULL REFERENCES sos_events(id) ON DELETE CASCADE,
  contact_id      UUID NOT NULL REFERENCES emergency_contacts(id) ON DELETE CASCADE,
  channel         TEXT NOT NULL CHECK (channel IN ('sms','push','both')),
  tracking_link   TEXT,                     -- expires after 60 min
  expires_at      TIMESTAMPTZ,              -- set to NOW() + INTERVAL '60 minutes' on insert
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','sent','failed')),
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE sos_notifications ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 5. JOURNEY TRACKS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE journey_tracks (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  destination       TEXT,
  expected_arrival  TIMESTAMPTZ NOT NULL,
  marked_safe       BOOLEAN NOT NULL DEFAULT FALSE,
  marked_safe_at    TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE journey_tracks ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 6. HOTLINES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE hotlines (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code    TEXT NOT NULL,
  name            TEXT NOT NULL,
  number          TEXT NOT NULL,
  category        TEXT NOT NULL
                    CHECK (category IN ('police','fire','mental_health','domestic_violence',
                                        'legal_aid','child_protection','eating_disorder','addiction')),
  description     TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  is_24h          BOOLEAN NOT NULL DEFAULT FALSE,
  verified_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  last_checked_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE hotlines ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 7. HOTLINE REPORTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE hotline_reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotline_id  UUID NOT NULL REFERENCES hotlines(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reason      TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'open'
                CHECK (status IN ('open','reviewed','resolved')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE hotline_reports ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 8. MOOD LOGS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE mood_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score      INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
  emoji      TEXT,
  note       TEXT,
  logged_at  DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, logged_at)                -- one log per user per day
);

ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 9. JOURNAL ENTRIES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE journal_entries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title             TEXT,
  content_encrypted TEXT NOT NULL,           -- AES-256 ciphertext; never plaintext
  mood_score        INTEGER CHECK (mood_score BETWEEN 1 AND 5),
  is_cloud_backed   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ
);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 10. MENSTRUAL CYCLES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE menstrual_cycles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_date      DATE NOT NULL,
  end_date        DATE,
  flow_intensity  TEXT CHECK (flow_intensity IN ('spotting','light','medium','heavy')),
  symptoms        JSONB DEFAULT '[]',        -- e.g. ["cramps","bloating","mood_swings"]
  notes_encrypted TEXT,                      -- AES-256 encrypted personal notes
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE menstrual_cycles ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 11. CYCLE REMINDERS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE cycle_reminders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reminder_type   TEXT NOT NULL
                    CHECK (reminder_type IN ('period_due','pill','hydration','custom')),
  days_before     INTEGER NOT NULL DEFAULT 3,
  custom_label    TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE cycle_reminders ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 12. COMMUNITY GROUPS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE community_groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  category    TEXT NOT NULL
                CHECK (category IN ('survivors','students','career','general','mental_health','custom')),
  is_private  BOOLEAN NOT NULL DEFAULT FALSE,
  avatar_url  TEXT,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ
);

ALTER TABLE community_groups ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 13. GROUP MEMBERSHIPS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE group_memberships (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   UUID NOT NULL REFERENCES community_groups(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'member'
               CHECK (role IN ('member','moderator','admin')),
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (group_id, user_id)
);

ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 14. POSTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE posts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id     UUID NOT NULL REFERENCES community_groups(id) ON DELETE CASCADE,
  author_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  media_urls   JSONB DEFAULT '[]',
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  is_flagged   BOOLEAN NOT NULL DEFAULT FALSE,
  is_removed   BOOLEAN NOT NULL DEFAULT FALSE,  -- soft-delete by moderator
  removed_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 15. COMMENTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE comments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id      UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  is_flagged   BOOLEAN NOT NULL DEFAULT FALSE,
  is_removed   BOOLEAN NOT NULL DEFAULT FALSE,
  removed_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 16. POST REACTIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE post_reactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id       UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('heart','hug','support','star')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, user_id, reaction_type)
);

ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 17. CONTENT REPORTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE content_reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('post','comment','user')),
  target_id   UUID NOT NULL,
  reason      TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'open'
                CHECK (status IN ('open','under_review','resolved','dismissed')),
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 18. MENTOR ASSIGNMENTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE mentor_assignments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mentee_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status     TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','active','ended')),
  started_at TIMESTAMPTZ,
  ended_at   TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (mentor_id, mentee_id)
);

ALTER TABLE mentor_assignments ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 19. BADGES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE badges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  module      TEXT NOT NULL
                CHECK (module IN ('scouts','self_defence','wellness','safety','community')),
  category    TEXT,
  icon_url    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 20. USER BADGES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE user_badges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id    UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  awarded_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  evidence_url TEXT,
  awarded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, badge_id)
);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 21. SCOUTS TROOPS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE scouts_troops (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  region      TEXT,
  country_code TEXT,
  age_tier    TEXT NOT NULL
                CHECK (age_tier IN ('brownie_6_8','guide_9_12','senior_13_17')),
  leader_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE scouts_troops ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 22. TROOP MEMBERS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE troop_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  troop_id   UUID NOT NULL REFERENCES scouts_troops(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id  UUID REFERENCES users(id) ON DELETE SET NULL,  -- nullable for 18+
  status     TEXT NOT NULL DEFAULT 'active'
               CHECK (status IN ('active','inactive','graduated')),
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (troop_id, user_id)
);

ALTER TABLE troop_members ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 23. ACTIVITIES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE activities (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title              TEXT NOT NULL,
  description        TEXT,
  module             TEXT,
  badge_id           UUID REFERENCES badges(id) ON DELETE SET NULL,
  is_offline_capable BOOLEAN NOT NULL DEFAULT FALSE,
  difficulty         TEXT CHECK (difficulty IN ('beginner','intermediate','advanced')),
  estimated_minutes  INTEGER,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 24. ACTIVITY COMPLETIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE activity_completions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id  UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  evidence_url TEXT,
  verified_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (activity_id, user_id)
);

ALTER TABLE activity_completions ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 25. CONTENT ARTICLES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE content_articles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  module       TEXT NOT NULL
                 CHECK (module IN ('safety','mental_health','legal','wellness','self_defence')),
  language     TEXT NOT NULL DEFAULT 'ar',
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  author_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  cover_url    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ
);

ALTER TABLE content_articles ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 26. SAFETY QUIZZES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE safety_quizzes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  module      TEXT NOT NULL,
  difficulty  TEXT NOT NULL CHECK (difficulty IN ('beginner','intermediate','advanced')),
  language    TEXT NOT NULL DEFAULT 'ar',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE safety_quizzes ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 27. QUIZ QUESTIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE quiz_questions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id              UUID NOT NULL REFERENCES safety_quizzes(id) ON DELETE CASCADE,
  question_text        TEXT NOT NULL,
  options              JSONB NOT NULL,  -- array of strings e.g. ["Run","Shout","Freeze","Call"]
  correct_option_index INTEGER NOT NULL, -- 0-based index
  explanation          TEXT,
  sort_order           INTEGER NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 28. QUIZ ATTEMPTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE quiz_attempts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id      UUID NOT NULL REFERENCES safety_quizzes(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score        INTEGER NOT NULL,
  total        INTEGER NOT NULL,
  answers      JSONB NOT NULL DEFAULT '[]',  -- [{question_id, chosen_index, correct}]
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 29. SELF DEFENCE VIDEOS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE self_defence_videos (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title              TEXT NOT NULL,
  description        TEXT,
  video_url          TEXT NOT NULL,
  thumbnail_url      TEXT,
  scenario_category  TEXT NOT NULL
                       CHECK (scenario_category IN ('grabbed','followed','attacked','online_safety','general')),
  language           TEXT NOT NULL DEFAULT 'ar',
  duration_seconds   INTEGER,
  is_offline_capable BOOLEAN NOT NULL DEFAULT FALSE,
  is_published       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE self_defence_videos ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 30. LEGAL GUIDES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE legal_guides (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  category     TEXT NOT NULL
                 CHECK (category IN ('police_report','restraining_order','online_harassment','rights','reporting')),
  country_code TEXT NOT NULL,
  language     TEXT NOT NULL DEFAULT 'ar',
  version      INTEGER NOT NULL DEFAULT 1,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  author_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE legal_guides ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 31. LEGAL AID ORGS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE legal_aid_orgs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  description  TEXT,
  website      TEXT,
  phone        TEXT,
  email        TEXT,
  country_code TEXT NOT NULL,
  city         TEXT,
  is_free      BOOLEAN NOT NULL DEFAULT TRUE,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE legal_aid_orgs ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 32. EVENTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  description  TEXT,
  event_type   TEXT NOT NULL
                 CHECK (event_type IN ('workshop','webinar','meetup','troop_meeting','community_service')),
  starts_at    TIMESTAMPTZ NOT NULL,
  ends_at      TIMESTAMPTZ,
  location     TEXT,
  is_virtual   BOOLEAN NOT NULL DEFAULT FALSE,
  join_url     TEXT,
  troop_id     UUID REFERENCES scouts_troops(id) ON DELETE SET NULL,
  group_id     UUID REFERENCES community_groups(id) ON DELETE SET NULL,
  created_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at   TIMESTAMPTZ
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 33. PUSH NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE push_notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL
               CHECK (type IN ('sos_alert','period_reminder','affirmation','badge_earned',
                               'journey_alert','moderation','general')),
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  data       JSONB DEFAULT '{}',
  status     TEXT NOT NULL DEFAULT 'queued'
               CHECK (status IN ('queued','sent','failed')),
  sent_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE push_notifications ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 34. NOTIFICATION PREFERENCES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE notification_preferences (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel     TEXT NOT NULL CHECK (channel IN ('push','sms','email')),
  notif_type  TEXT NOT NULL,              -- matches push_notifications.type values
  is_enabled  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, channel, notif_type)
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- 35. AUDIT LOGS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,              -- e.g. 'hotline.deactivated', 'user.banned'
  target_type TEXT,                       -- e.g. 'hotline', 'user', 'post'
  target_id   UUID,
  metadata    JSONB DEFAULT '{}',         -- before/after values, IP, etc.
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit logs are append-only — no RLS UPDATE/DELETE
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- INDEXES — cover common query patterns
-- ─────────────────────────────────────────────────────────────
CREATE INDEX idx_users_email           ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_role            ON users(role)  WHERE deleted_at IS NULL;
CREATE INDEX idx_sos_events_user       ON sos_events(user_id, created_at DESC);
CREATE INDEX idx_sos_notif_event       ON sos_notifications(sos_event_id);
CREATE INDEX idx_hotlines_country_cat  ON hotlines(country_code, category) WHERE is_active = TRUE;
CREATE INDEX idx_mood_logs_user_date   ON mood_logs(user_id, logged_at DESC);
CREATE INDEX idx_journal_user          ON journal_entries(user_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_cycles_user           ON menstrual_cycles(user_id, start_date DESC);
CREATE INDEX idx_posts_group           ON posts(group_id, created_at DESC) WHERE is_removed = FALSE;
CREATE INDEX idx_comments_post         ON comments(post_id, created_at ASC) WHERE is_removed = FALSE;
CREATE INDEX idx_content_reports_open  ON content_reports(status) WHERE status = 'open';
CREATE INDEX idx_articles_module_lang  ON content_articles(module, language) WHERE is_published = TRUE AND deleted_at IS NULL;
CREATE INDEX idx_videos_category       ON self_defence_videos(scenario_category) WHERE is_published = TRUE;
CREATE INDEX idx_push_notif_user       ON push_notifications(user_id, created_at DESC);
CREATE INDEX idx_audit_actor           ON audit_logs(actor_id, created_at DESC);
CREATE INDEX idx_audit_target          ON audit_logs(target_type, target_id);

-- ─────────────────────────────────────────────────────────────
-- ROW-LEVEL SECURITY POLICIES
-- (minimal bootstrap — expand per feature as needed)
-- ─────────────────────────────────────────────────────────────

-- Users: own data only (non-admins)
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid()
      AND u.role IN ('super_admin','content_admin','community_moderator')
  ));

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Emergency contacts: own only
CREATE POLICY "emergency_contacts_own" ON emergency_contacts
  FOR ALL USING (auth.uid() = user_id);

-- SOS events: own only
CREATE POLICY "sos_events_own" ON sos_events
  FOR ALL USING (auth.uid() = user_id);

-- Mood logs: own only
CREATE POLICY "mood_logs_own" ON mood_logs
  FOR ALL USING (auth.uid() = user_id);

-- Journal entries: own only
CREATE POLICY "journal_own" ON journal_entries
  FOR ALL USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Menstrual cycles: own only
CREATE POLICY "cycles_own" ON menstrual_cycles
  FOR ALL USING (auth.uid() = user_id);

-- Hotlines: public read
CREATE POLICY "hotlines_public_read" ON hotlines
  FOR SELECT USING (is_active = TRUE);

-- Content articles: public read if published
CREATE POLICY "articles_public_read" ON content_articles
  FOR SELECT USING (is_published = TRUE AND deleted_at IS NULL);

-- Posts: readable by group members
CREATE POLICY "posts_group_members_read" ON posts
  FOR SELECT USING (
    is_removed = FALSE AND
    EXISTS (
      SELECT 1 FROM group_memberships gm
      WHERE gm.group_id = posts.group_id AND gm.user_id = auth.uid()
    )
  );

-- Audit logs: admin read only
CREATE POLICY "audit_logs_admin_read" ON audit_logs
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid()
      AND u.role IN ('super_admin','content_admin')
  ));
