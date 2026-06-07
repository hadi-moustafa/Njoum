-- ============================================================
-- Njoum — Phase 7 Migration
-- Date: 2026-06-06
-- Based on the ACTUAL database schema (not the original migration file).
-- Only adds columns and policies that are confirmed missing.
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Add push_token to users (the only new column needed)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_token TEXT;

-- ─────────────────────────────────────────────────────────────
-- 2. RLS for JOURNEY TRACKS
-- ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'journey_tracks' AND policyname = 'journey_tracks_own'
  ) THEN
    EXECUTE 'CREATE POLICY "journey_tracks_own" ON journey_tracks FOR ALL USING (auth.uid() = user_id)';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 3. RLS for EVENTS
--    Actual schema has NO deleted_at — use simple TRUE
-- ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'events_public_read'
  ) THEN
    EXECUTE 'CREATE POLICY "events_public_read" ON events FOR SELECT USING (TRUE)';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'events_admin_write'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "events_admin_write" ON events FOR ALL USING (
        EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('super_admin','content_admin'))
      )
    $p$;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 4. RLS for MENTOR ASSIGNMENTS
-- ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'mentor_assignments' AND policyname = 'mentor_assignments_own'
  ) THEN
    EXECUTE 'CREATE POLICY "mentor_assignments_own" ON mentor_assignments FOR ALL USING (auth.uid() = mentor_id OR auth.uid() = mentee_id)';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'mentor_assignments' AND policyname = 'mentor_admin_read'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "mentor_admin_read" ON mentor_assignments FOR SELECT USING (
        EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('super_admin','community_moderator'))
      )
    $p$;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 5. RLS for BADGES
-- ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'badges' AND policyname = 'badges_public_read'
  ) THEN
    EXECUTE 'CREATE POLICY "badges_public_read" ON badges FOR SELECT USING (TRUE)';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 6. RLS for USER BADGES
-- ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_badges' AND policyname = 'user_badges_own'
  ) THEN
    EXECUTE 'CREATE POLICY "user_badges_own" ON user_badges FOR ALL USING (auth.uid() = user_id)';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_badges' AND policyname = 'user_badges_admin_read'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "user_badges_admin_read" ON user_badges FOR SELECT USING (
        EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('super_admin','content_admin'))
      )
    $p$;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 7. RLS for SCOUTS
-- ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'scouts_troops' AND policyname = 'scouts_troops_public_read'
  ) THEN
    EXECUTE 'CREATE POLICY "scouts_troops_public_read" ON scouts_troops FOR SELECT USING (TRUE)';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'activities' AND policyname = 'activities_public_read'
  ) THEN
    EXECUTE 'CREATE POLICY "activities_public_read" ON activities FOR SELECT USING (TRUE)';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'troop_members' AND policyname = 'troop_members_own'
  ) THEN
    EXECUTE 'CREATE POLICY "troop_members_own" ON troop_members FOR ALL USING (auth.uid() = user_id)';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'activity_completions' AND policyname = 'completions_own'
  ) THEN
    EXECUTE 'CREATE POLICY "completions_own" ON activity_completions FOR ALL USING (auth.uid() = user_id)';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 8. RLS for SELF DEFENCE VIDEOS
-- ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'self_defence_videos' AND policyname = 'videos_public_read'
  ) THEN
    EXECUTE 'CREATE POLICY "videos_public_read" ON self_defence_videos FOR SELECT USING (is_published = TRUE)';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 9. RLS for LEGAL GUIDES + AID ORGS
-- ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'legal_guides' AND policyname = 'legal_guides_public_read'
  ) THEN
    EXECUTE 'CREATE POLICY "legal_guides_public_read" ON legal_guides FOR SELECT USING (is_published = TRUE)';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'legal_aid_orgs' AND policyname = 'legal_aid_orgs_public_read'
  ) THEN
    EXECUTE 'CREATE POLICY "legal_aid_orgs_public_read" ON legal_aid_orgs FOR SELECT USING (is_active = TRUE)';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 10. RLS for QUIZZES + QUESTIONS + ATTEMPTS
--     Actual safety_quizzes has NO is_active column — use TRUE
-- ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'safety_quizzes' AND policyname = 'quizzes_public_read'
  ) THEN
    EXECUTE 'CREATE POLICY "quizzes_public_read" ON safety_quizzes FOR SELECT USING (TRUE)';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'quiz_questions' AND policyname = 'quiz_questions_public_read'
  ) THEN
    EXECUTE 'CREATE POLICY "quiz_questions_public_read" ON quiz_questions FOR SELECT USING (TRUE)';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'quiz_attempts' AND policyname = 'quiz_attempts_own'
  ) THEN
    EXECUTE 'CREATE POLICY "quiz_attempts_own" ON quiz_attempts FOR ALL USING (auth.uid() = user_id)';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 11. RLS for COMMUNITY GROUPS + MEMBERSHIPS
--     Actual community_groups has NO deleted_at — uses is_active
-- ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'community_groups' AND policyname = 'groups_public_read'
  ) THEN
    EXECUTE 'CREATE POLICY "groups_public_read" ON community_groups FOR SELECT USING (is_active = TRUE)';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'group_memberships' AND policyname = 'memberships_own'
  ) THEN
    EXECUTE 'CREATE POLICY "memberships_own" ON group_memberships FOR ALL USING (auth.uid() = user_id)';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 12. RLS for NOTIFICATION PREFERENCES
-- ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notification_preferences' AND policyname = 'notif_prefs_own'
  ) THEN
    EXECUTE 'CREATE POLICY "notif_prefs_own" ON notification_preferences FOR ALL USING (auth.uid() = user_id)';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 13. RLS for HOTLINE REPORTS
--     Actual column is reported_by (not reporter_id)
-- ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'hotline_reports' AND policyname = 'hotline_reports_insert'
  ) THEN
    EXECUTE 'CREATE POLICY "hotline_reports_insert" ON hotline_reports FOR INSERT WITH CHECK (auth.uid() = reported_by)';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'hotline_reports' AND policyname = 'hotline_reports_admin'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "hotline_reports_admin" ON hotline_reports FOR SELECT USING (
        EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('super_admin','content_admin'))
      )
    $p$;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 14. RLS for CONTENT REPORTS
--     Actual column is reported_by (not reporter_id)
-- ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'content_reports' AND policyname = 'content_reports_insert'
  ) THEN
    EXECUTE 'CREATE POLICY "content_reports_insert" ON content_reports FOR INSERT WITH CHECK (auth.uid() = reported_by)';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'content_reports' AND policyname = 'content_reports_admin'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "content_reports_admin" ON content_reports FOR ALL USING (
        EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('super_admin','community_moderator'))
      )
    $p$;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 15. RLS for PUSH NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'push_notifications' AND policyname = 'push_notif_own'
  ) THEN
    EXECUTE 'CREATE POLICY "push_notif_own" ON push_notifications FOR SELECT USING (auth.uid() = user_id)';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 16. Indexes
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_events_starts_at    ON events(starts_at);
CREATE INDEX IF NOT EXISTS idx_journey_user        ON journey_tracks(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mentor_mentee       ON mentor_assignments(mentee_id, status);
CREATE INDEX IF NOT EXISTS idx_user_badges_user    ON user_badges(user_id, earned_at DESC);
