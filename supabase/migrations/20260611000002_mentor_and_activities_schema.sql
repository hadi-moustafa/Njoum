-- ============================================================
-- Njoum — Mentor system + activities schema fix
-- Created: 2026-06-11
--
-- Changes:
--   1. activities: add created_by (FK to users) so mentors can
--      create activities visible to their mentees.
--   2. mentor_assignments: add message column for the request note.
--   3. RLS policies: mentors can insert activities/events they own;
--      girls can read activities created by their active mentor.
-- ============================================================

-- 1. Add created_by to activities
ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_activities_created_by ON activities(created_by);

-- 2. Add optional request message to mentor_assignments
ALTER TABLE mentor_assignments
  ADD COLUMN IF NOT EXISTS message TEXT;

-- 3. RLS for activities: mentors can insert their own activities
CREATE POLICY "mentors_insert_activities" ON activities
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role IN ('mentor','content_admin','super_admin')
    )
  );

-- Girls can read activities created by their active mentor
CREATE POLICY "mentees_read_mentor_activities" ON activities
  FOR SELECT
  USING (
    created_by IS NULL   -- existing global activities (no creator)
    OR
    EXISTS (
      SELECT 1 FROM mentor_assignments ma
      WHERE ma.mentee_id  = auth.uid()
        AND ma.mentor_id  = activities.created_by
        AND ma.status     = 'active'
    )
    OR
    -- Mentors can read their own activities
    created_by = auth.uid()
  );

-- 4. RLS for events: mentors can create events
CREATE POLICY "mentors_insert_events" ON events
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
        AND role IN ('mentor','content_admin','super_admin')
    )
  );

-- Mentors can update/delete their own events
CREATE POLICY "mentors_manage_own_events" ON events
  FOR UPDATE
  USING (created_by = auth.uid());

-- 5. RLS for mentor_assignments: girls can see their own assignments
CREATE POLICY "mentees_read_own_assignments" ON mentor_assignments
  FOR SELECT
  USING (mentee_id = auth.uid() OR mentor_id = auth.uid());

CREATE POLICY "mentees_insert_assignments" ON mentor_assignments
  FOR INSERT
  WITH CHECK (mentee_id = auth.uid());
