-- ============================================================
-- Njoum — Dev Seed Data
-- Run: psql $DATABASE_URL -f supabase/seed.sql
-- WARNING: Do NOT run against production.
-- ============================================================

-- ── Admin user ──────────────────────────────────────────────
INSERT INTO users (id, email, full_name, display_name, role, country_code, language, is_verified)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@njoum.app', 'Admin User', 'Admin', 'super_admin', 'LB', 'ar', TRUE),
  ('00000000-0000-0000-0000-000000000002', 'girl1@test.com', 'Layla Hassan', 'Layla', 'girl', 'LB', 'ar', TRUE),
  ('00000000-0000-0000-0000-000000000003', 'mentor1@test.com', 'Sara Khalil', 'Sara', 'mentor', 'LB', 'ar', TRUE)
ON CONFLICT (email) DO NOTHING;

-- ── Hotlines ────────────────────────────────────────────────
INSERT INTO hotlines (country_code, name, number, category, description, is_active, is_24h, verified_by)
VALUES
  ('LB', 'الشرطة اللبنانية', '112', 'police', 'الرقم الوطني للطوارئ', TRUE, TRUE, '00000000-0000-0000-0000-000000000001'),
  ('LB', 'خط دعم ضحايا العنف', '1745', 'domestic_violence', 'خط دعم مجاني لضحايا العنف الأسري', TRUE, TRUE, '00000000-0000-0000-0000-000000000001'),
  ('LB', 'الدعم النفسي - إيمباكت', '+961 76 920 920', 'mental_health', 'خط دعم للصحة النفسية', TRUE, FALSE, '00000000-0000-0000-0000-000000000001'),
  ('LB', 'حماية الطفل', '1554', 'child_protection', 'خط طوارئ لحماية الأطفال', TRUE, TRUE, '00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- ── Community groups ─────────────────────────────────────────
INSERT INTO community_groups (id, name, description, category, is_private, created_by)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'طالبات الجامعة', 'مساحة للطالبات الجامعيات', 'students', FALSE, '00000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000002', 'الدعم النفسي', 'مجموعة دعم للصحة النفسية — خاصة', 'mental_health', TRUE, '00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- ── Badges ──────────────────────────────────────────────────
INSERT INTO badges (name, description, module, category)
VALUES
  ('مستكشفة أمان', 'أكملت وحدة السلامة الشخصية', 'safety', 'personal_safety'),
  ('فتاة كشافة', 'انضمت إلى فوج الكشافة وأكملت النشاط الأول', 'scouts', 'recruitment'),
  ('محاربة الدفاع عن النفس', 'أتقنت تقنيات الدفاع عن النفس المستوى الأول', 'self_defence', 'level_1'),
  ('ناشطة في المجتمع', 'شاركت في 10 مشاركات مجتمعية', 'community', 'participation')
ON CONFLICT DO NOTHING;

-- ── Sample scout troop ───────────────────────────────────────
INSERT INTO scouts_troops (name, region, country_code, age_tier, leader_id)
VALUES
  ('فوج نجوم بيروت', 'بيروت', 'LB', 'guide_9_12', '00000000-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;

-- ── Sample content article ───────────────────────────────────
INSERT INTO content_articles (title, body, module, language, is_published, author_id)
VALUES
  (
    'كيف تتصرفين في حالة الطوارئ',
    'في حالة الطوارئ، ابقي هادئة. اتصلي بخط الطوارئ 112. أخبري شخصاً موثوقاً بمكانك.',
    'safety',
    'ar',
    TRUE,
    '00000000-0000-0000-0000-000000000001'
  )
ON CONFLICT DO NOTHING;
