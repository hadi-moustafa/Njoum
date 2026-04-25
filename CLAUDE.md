# CLAUDE.md — Njoum (نجوم) Project Guide

> This file tells Claude Code everything it needs to know about this project.
> Keep it updated as the project evolves.

---

## What Is This Project?

**Njoum** (نجوم, Arabic for "stars") is a safety-first mobile app and web admin dashboard
designed for girls and young women. It provides emergency SOS tools, crisis hotlines, mental
health resources, community support, a scouts programme, menstrual cycle tracking, self-defence
education, and legal rights information.

**Tagline:** "When it's dark, look up — we're already there."

**This is a graduation project (2026).** Keep code clean, well-commented, and beginner-friendly.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  TARGET USERS → React Native (Expo) mobile app              │
│  ADMINS ONLY  → Next.js 14 web dashboard                    │
│  BACKEND      → Node.js + Express API (runs locally/server) │
│  DATABASE     → Supabase (hosted PostgreSQL, never local)   │
│  AUTH         → Supabase Auth + Google Sign-In only         │
└─────────────────────────────────────────────────────────────┘
```

**Key rules from this architecture:**
- The web app has NO public-facing screens — every route is admin-protected.
- Auth is 100% delegated to Supabase Auth. No custom passwords, no custom JWT signing. The API verifies Supabase-issued JWTs using the Supabase JWT secret.
- The database lives on Supabase cloud. There is no local Postgres container.
- Google Sign-In is the primary auth provider (configured in Supabase dashboard).
- `docker-compose.yml` provides only Redis locally (no Postgres, no Mongo).
- MongoDB is dropped — all data (including community posts) goes to Supabase/PostgreSQL.

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Mobile app | React Native (Expo) | iOS + Android — **primary product** |
| Admin web app | Next.js 14 (App Router) | Admin-only dashboard — no public routes |
| Backend API | Node.js + Express.js | Verifies Supabase JWTs; service-role for admin |
| Database | PostgreSQL via Supabase | **Hosted on Supabase — never local** |
| Cache | Redis | Rate limiting, queues — runs locally |
| File storage | Cloudinary | Videos, images, badge certificates |
| Push notifications | Firebase Cloud Messaging (FCM) | SOS alerts, reminders |
| SMS alerts | Twilio | Emergency SMS to contacts |
| Maps | Google Maps SDK | Live tracking (decided: Google Maps) |
| Auth | **Supabase Auth + Google Sign-In** | No custom JWT. Supabase issues all tokens. |
| CI/CD | GitHub Actions | Auto deploy |
| Monitoring | Sentry | Errors + performance |

---

## Project Structure

```
njoum/
├── apps/
│   ├── mobile/          # React Native (Expo) app
│   │   ├── app/         # Expo Router screens
│   │   ├── components/  # Reusable UI components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── store/       # Zustand / Redux state
│   │   ├── services/    # API calls, notifications
│   │   └── assets/      # Images, fonts, icons
│   └── web/             # Next.js admin dashboard
│       ├── app/         # App Router pages
│       ├── components/  # Dashboard components
│       └── lib/         # Utilities, API client
├── packages/
│   ├── api/             # Node.js + Express backend
│   │   ├── src/
│   │   │   ├── routes/      # Express route handlers
│   │   │   ├── controllers/ # Business logic
│   │   │   ├── middleware/  # Auth, rate limit, validation
│   │   │   ├── models/      # DB models / query helpers
│   │   │   └── services/    # External services (FCM, Twilio)
│   │   └── tests/
│   └── shared/          # Shared types, constants, utilities
├── supabase/
│   ├── migrations/      # SQL migration files (numbered)
│   ├── seed.sql         # Dev seed data
│   └── functions/       # Supabase Edge Functions (if used)
├── CLAUDE.md            # ← You are here
├── .env.example         # All required env vars (no real values)
└── docker-compose.yml   # Local dev services
```

---

## Database (Supabase / PostgreSQL)

### Connection

```
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>   # server-side only, never expose
DATABASE_URL=postgresql://...                  # direct Postgres URL for migrations
```

### Key Conventions

- All primary keys are `uuid` with `DEFAULT gen_random_uuid()`.
- All tables have `created_at TIMESTAMPTZ DEFAULT NOW()`.
- Tables that can be deleted use soft-delete: `deleted_at TIMESTAMPTZ NULL`. Never hard-delete user data.
- Foreign keys always have `ON DELETE CASCADE` unless there is a specific reason not to.
- Enums are stored as `TEXT` with a `CHECK` constraint so they can be extended without a migration (e.g. `CHECK (role IN ('girl','parent','mentor','content_admin','community_moderator','super_admin'))`).
- Sensitive columns (journal content, cycle data) are encrypted at the application layer before INSERT. The DB stores ciphertext only.
- All timestamps are `TIMESTAMPTZ` (timezone-aware), stored in UTC.
- Use `JSONB` for flexible arrays (e.g. `symptoms`, `quiz options`) rather than separate junction tables when the data is always read/written together.

### Row-Level Security (RLS)

Supabase RLS is **enabled on all tables**. Default policy: deny all. Explicit policies grant access.

Common policy patterns:

```sql
-- Users can only read/write their own rows
CREATE POLICY "users_own_data" ON mood_logs
  FOR ALL USING (auth.uid() = user_id);

-- Admins can read everything
CREATE POLICY "admin_read_all" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin','content_admin')
    )
  );

-- Public read for published content
CREATE POLICY "public_read_articles" ON content_articles
  FOR SELECT USING (is_published = TRUE);
```

### Migration Workflow

```bash
# Create a new migration
supabase migration new <name>

# Run pending migrations locally
supabase db push

# Check migration status
supabase migration list
```

Migration files live in `supabase/migrations/` and are numbered: `20260401000001_create_users.sql`.

---

## Complete Table Reference

Below is every table with its columns and purpose. When writing migrations or queries, refer here first.

### `users`
Core account table. One row per registered user.
- `role`: `'girl' | 'parent' | 'mentor' | 'content_admin' | 'community_moderator' | 'super_admin'`
- `age_range`: e.g. `'10-12' | '13-17' | '18-24' | '25+'`
- `safe_word`: user-defined word to trigger discreet SOS
- `deleted_at`: soft-delete; filter with `WHERE deleted_at IS NULL`

### `emergency_contacts`
Up to 5 contacts per user. Used by SOS system.
- `notify_order`: integer 1–5 for priority ordering
- `notify_on_sos`: if false, contact is saved but not alerted

### `sos_events`
Each press of the SOS button or shake/volume trigger.
- `trigger_method`: `'button' | 'shake' | 'volume' | 'safe_word'`
- `cancelled`: true if user cancelled within the 10-second grace period
- `resolved_at`: when user marks situation safe

### `sos_notifications`
One row per contact notified per SOS event.
- `channel`: `'sms' | 'push' | 'both'`
- `tracking_link`: URL to live map, valid 60 minutes
- `status`: `'pending' | 'sent' | 'failed'`

### `journey_tracks`
User logs a trip; system alerts if not marked safe in time.
- `expected_arrival`: timestamp after which alerts fire
- `marked_safe`: boolean, set true when user taps "Journey Safe"

### `hotlines`
Emergency and crisis numbers, managed by admins.
- `category`: `'police' | 'fire' | 'mental_health' | 'domestic_violence' | 'legal_aid' | 'child_protection' | 'eating_disorder' | 'addiction'`
- `verified_by`: FK to `users.id` of admin who last verified
- `last_checked_at`: admins should check at least quarterly

### `hotline_reports`
User-submitted flags for incorrect hotline numbers.
- `status`: `'open' | 'reviewed' | 'resolved'`

### `mood_logs`
Daily mood check-in, one per user per day.
- `score`: 1–5 scale
- `emoji`: optional emoji label (e.g. `'😔' | '😐' | '🙂' | '😊' | '😄'`)

### `journal_entries`
Private encrypted journal. Content never stored in plaintext.
- `content_encrypted`: AES-256 ciphertext; encrypt/decrypt in the API layer
- `is_cloud_backed`: whether user opted into cloud backup

### `menstrual_cycles`
One row per cycle period. Predictions calculated in application code.
- `flow_intensity`: `'spotting' | 'light' | 'medium' | 'heavy'`
- `symptoms`: JSONB array e.g. `["cramps","bloating","mood_swings"]`

### `cycle_reminders`
Per-user configurable reminders.
- `reminder_type`: `'period_due' | 'pill' | 'hydration' | 'custom'`
- `days_before`: how many days before event to send reminder

### `community_groups`
Support groups, public or private.
- `category`: `'survivors' | 'students' | 'career' | 'general' | 'mental_health' | 'custom'`
- `is_private`: if true, requires admin approval to join

### `group_memberships`
Junction table: user ↔ group.
- `role`: `'member' | 'moderator' | 'admin'`

### `posts`
Feed posts within a group.
- `is_anonymous`: hides author identity in UI (author_id still stored for moderation)
- `is_flagged`: set true when reported; triggers human review
- `is_removed`: soft-delete by moderator

### `comments`
Replies to posts. Same anonymity/moderation fields as posts.

### `post_reactions`
Emoji reactions on posts. Unique constraint on `(post_id, user_id, reaction_type)`.
- `reaction_type`: `'heart' | 'hug' | 'support' | 'star'`

### `content_reports`
Polymorphic: flags for posts, comments, or users.
- `target_type`: `'post' | 'comment' | 'user'`
- `target_id`: the UUID of the flagged record
- `status`: `'open' | 'under_review' | 'resolved' | 'dismissed'`

### `mentor_assignments`
Connects a mentee (girl) with a verified mentor.
- `status`: `'pending' | 'active' | 'ended'`

### `badges`
Digital achievement badges.
- `module`: `'scouts' | 'self_defence' | 'wellness' | 'safety' | 'community'`
- `category`: subcategory within the module

### `user_badges`
Awarded badges. Many-to-many with evidence trail.
- `awarded_by`: FK to users.id of leader/admin who awarded it

### `scouts_troops`
Troops organised by age tier and region.
- `age_tier`: `'brownie_6_8' | 'guide_9_12' | 'senior_13_17'`

### `troop_members`
Junction: girl enrolled in a troop.
- `parent_id`: FK to users.id of parent/guardian (nullable for 18+)
- `status`: `'active' | 'inactive' | 'graduated'`

### `activities`
Offline-capable activity cards for scouts.
- `is_offline_capable`: if true, card content is cached on device
- `badge_id`: completing this activity counts toward earning this badge

### `activity_completions`
Record of a girl completing an activity, optionally with photo evidence.
- `evidence_url`: link to uploaded photo in S3/Cloudinary
- `verified_by`: FK to troop leader's user ID

### `content_articles`
Articles for Safety Hub, Mental Health, Legal sections.
- `module`: `'safety' | 'mental_health' | 'legal' | 'wellness' | 'self_defence'`
- `language`: ISO 639-1 code, e.g. `'ar' | 'en' | 'fr'`

### `safety_quizzes`
Quiz containers for safety and self-defence modules.
- `difficulty`: `'beginner' | 'intermediate' | 'advanced'`

### `quiz_questions`
Individual questions within a quiz.
- `options`: JSONB array of strings e.g. `["Run", "Shout", "Freeze", "Call"]`
- `correct_option_index`: 0-based index into options array

### `quiz_attempts`
One row per user per quiz attempt. Allows retries.

### `self_defence_videos`
Video library for self-defence education.
- `scenario_category`: `'grabbed' | 'followed' | 'attacked' | 'online_safety' | 'general'`
- `is_offline_capable`: if true, video is downloadable for offline use

### `legal_guides`
Localised legal information.
- `category`: `'police_report' | 'restraining_order' | 'online_harassment' | 'rights' | 'reporting'`
- `version`: integer, incremented on each update

### `legal_aid_orgs`
Directory of free legal aid organisations.

### `events`
Virtual and local events board.
- `event_type`: `'workshop' | 'webinar' | 'meetup' | 'troop_meeting' | 'community_service'`

### `push_notifications`
Queue and log of all push notifications sent.
- `type`: `'sos_alert' | 'period_reminder' | 'affirmation' | 'badge_earned' | 'journey_alert' | 'moderation' | 'general'`
- `status`: `'queued' | 'sent' | 'failed'`

### `notification_preferences`
Per-user notification opt-in settings.
- `channel`: `'push' | 'sms' | 'email'`

### `audit_logs`
Immutable log of admin actions.
- `action`: human-readable e.g. `'hotline.deactivated'`, `'user.banned'`, `'content.deleted'`

---

## API Design

### Base URL
```
/api/v1/
```

### Response Envelope
Every endpoint returns:
```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": { "page": 1, "total": 42 }
}
```

On error:
```json
{
  "success": false,
  "data": null,
  "error": { "code": "UNAUTHORIZED", "message": "Token expired" },
  "meta": null
}
```

### Authentication
- Short-lived JWT access token (15 min expiry) in `Authorization: Bearer <token>` header
- Refresh token (7 days) stored in `httpOnly` cookie
- Endpoints are either **public**, **user** (requires valid JWT), or **admin** (requires role check)

### Key Route Groups
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout

GET    /api/v1/users/me
PATCH  /api/v1/users/me
GET    /api/v1/users/me/emergency-contacts
POST   /api/v1/users/me/emergency-contacts

POST   /api/v1/sos                          # trigger SOS
PATCH  /api/v1/sos/:id/cancel
PATCH  /api/v1/sos/:id/resolve

GET    /api/v1/hotlines?country=LB&category=mental_health
GET    /api/v1/hotlines/local               # uses GPS country code

GET    /api/v1/mood-logs
POST   /api/v1/mood-logs

GET    /api/v1/journal
POST   /api/v1/journal
PATCH  /api/v1/journal/:id
DELETE /api/v1/journal/:id

GET    /api/v1/cycles
POST   /api/v1/cycles
PATCH  /api/v1/cycles/:id

GET    /api/v1/community/groups
POST   /api/v1/community/groups
GET    /api/v1/community/groups/:id/posts
POST   /api/v1/community/groups/:id/posts

GET    /api/v1/badges
GET    /api/v1/users/me/badges

GET    /api/v1/scouts/troops
GET    /api/v1/scouts/activities

GET    /api/v1/content/articles?module=safety&lang=ar
GET    /api/v1/content/videos?category=grabbed

GET    /api/v1/legal/guides?country=LB
GET    /api/v1/legal/aid-orgs?country=LB

# Admin routes
GET    /api/v1/admin/users
PATCH  /api/v1/admin/users/:id/ban
GET    /api/v1/admin/reports
PATCH  /api/v1/admin/reports/:id/resolve
POST   /api/v1/admin/hotlines
PATCH  /api/v1/admin/hotlines/:id
```

---

## Environment Variables

Copy `.env.example` and fill in real values. **Never commit `.env` to git.**

```env
# App
NODE_ENV=development
PORT=3001
APP_URL=http://localhost:3000        # web admin dev URL

# ── Supabase (hosted — never local) ──────────────────────────
SUPABASE_URL=                        # https://<project>.supabase.co
SUPABASE_ANON_KEY=                   # safe to use in mobile/web clients
SUPABASE_SERVICE_ROLE_KEY=           # API server only — never expose to clients
SUPABASE_JWT_SECRET=                 # from Supabase dashboard → Settings → API
                                     # used by the API to verify user JWTs

# ── Twilio (SMS alerts) ───────────────────────────────────────
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=

# ── Firebase (push notifications) ────────────────────────────
FCM_SERVER_KEY=
GOOGLE_APPLICATION_CREDENTIALS=     # path to service account JSON

# ── Cloudinary (file storage) ─────────────────────────────────
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# ── Google Maps ───────────────────────────────────────────────
GOOGLE_MAPS_API_KEY=

# ── Encryption (journal + cycle notes — AES-256-GCM) ─────────
ENCRYPTION_KEY=                      # 32-byte hex: openssl rand -hex 32

# ── Redis (local) ─────────────────────────────────────────────
REDIS_URL=redis://localhost:6379
```

---

## Security Rules

These are non-negotiable. Always follow them.

1. **Never expose `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_JWT_SECRET` to any client (mobile or web).**
2. **No custom passwords.** Auth is fully delegated to Supabase Auth. Never store or hash passwords manually.
3. **Token verification:** The API verifies every request by checking the Supabase JWT with `SUPABASE_JWT_SECRET`. Never trust a token without verification.
4. **Admin check:** Admin routes confirm `req.user.role` is an admin role after JWT verification. Roles are stored in the `users` table and embedded in the JWT custom claims.
5. **Rate limit all API routes.** Auth-adjacent endpoints (profile update, SOS trigger) get the strict limiter (10 req/min/IP).
6. **Journal and cycle data** must be encrypted with AES-256-GCM before storing. Decrypt only in API response.
7. **RLS is enabled** on all Supabase tables. Never bypass it except from server-side API code using the service role key.
8. **Validate all inputs** with Zod before they touch the database.
9. **SOS tracking links** expire after 60 minutes. Auto-expire is handled by the `expires_at` column.
10. **Never log** JWT secrets, encryption keys, or phone numbers in plaintext logs.
11. **Content moderation**: all community posts must pass through the moderation pipeline before becoming visible.
12. **Web admin app**: every Next.js route/page must verify the user is authenticated AND has an admin role. No unauthenticated pages exist.

---

## Feature Modules Reference

| Module | Tables Used | Key Notes |
|---|---|---|
| Auth & Profiles | `users`, `emergency_contacts`, `notification_preferences` | OAuth via Supabase Auth |
| SOS & Emergency | `sos_events`, `sos_notifications`, `journey_tracks` | Must fire within 3 seconds on 3G |
| Hotlines | `hotlines`, `hotline_reports` | Offline-cached on first load |
| Mental Health | `mood_logs`, `journal_entries` | Journal is encrypted |
| Cycle Tracker | `menstrual_cycles`, `cycle_reminders` | End-to-end encrypted |
| Community | `community_groups`, `group_memberships`, `posts`, `comments`, `post_reactions`, `content_reports`, `mentor_assignments` | All in Supabase/PostgreSQL |
| Scouts | `scouts_troops`, `troop_members`, `activities`, `activity_completions`, `badges`, `user_badges` | Badge PDF certificates generated server-side |
| Content/Education | `content_articles`, `self_defence_videos`, `safety_quizzes`, `quiz_questions`, `quiz_attempts` | Supports i18n via `language` column |
| Legal | `legal_guides`, `legal_aid_orgs` | Version history on guides |
| Events | `events` | Displayed in scouts and community modules |
| Notifications | `push_notifications`, `notification_preferences` | FCM for push, Twilio for SMS |
| Admin | All tables + `audit_logs` | Full CRUD via web dashboard |

---

## Brand & UI Guidelines

**Primary palette (Rose Gold Beirut):**

| Role | Hex | Use |
|---|---|---|
| Primary | `#B5586A` | Buttons, active states, logo |
| Accent | `#C8956A` | Icons, badges, progress bars |
| Depth | `#7A4E7A` | Mental health section, journal |
| Background | `#FDF6F0` | Page background (light mode) |
| Text | `#2A1520` | Body text |
| Emergency | `#E53E3E` | SOS button only — never decorative |
| Success | `#38A169` | Safe state confirmations, completed badges |

**Font:** Nunito or Inter (rounded humanist sans-serif)

**Layout rules:**
- SOS button must be reachable with one thumb from any screen — always fixed/sticky
- Bottom nav tabs: Home, Community, Safety, Wellness, Profile
- RTL support required for Arabic (`direction: rtl`, `textAlign: right`)
- Dark mode: surfaces shift to `#1A0D10`, accent colors preserved
- WCAG 2.1 AA minimum for all text and interactive elements

---

## Non-Functional Targets

| Requirement | Target |
|---|---|
| SOS dispatch time | ≤ 3 seconds on 3G |
| App cold start | ≤ 3 seconds on 2GB RAM Android |
| API p95 response time | < 500ms under normal load |
| Concurrent users (MVP) | 10,000 |
| Uptime | 99.9% |
| DB backup interval | Every 6 hours |
| Recovery time objective | < 2 hours |
| Unit test coverage | ≥ 70% on business logic |
| TLS version | 1.3+ |
| Supabase Auth token TTL | Managed by Supabase (default 1h access / 7d refresh) |

---

## Common Patterns & Gotchas

### Soft Deletes
```sql
-- Always filter deleted records in queries
WHERE deleted_at IS NULL
```

### Offline Support
The mobile app caches the following on first authenticated load:
- All `hotlines` for the user's country
- All `activities` where `is_offline_capable = TRUE`
- All `self_defence_videos` where `is_offline_capable = TRUE`

Use React Query with persistence (MMKV or AsyncStorage) for this.

### Anonymous Posts
`is_anonymous = TRUE` hides `author_id` in API responses but the value is always stored in the DB for moderation. Never return `author_id` to non-admin users when `is_anonymous` is true.

### Cycle Prediction
Prediction logic lives in the API layer (`packages/api/src/services/cyclePredictor.ts`), not the DB. The DB only stores raw logged cycles.

### i18n
- All user-facing content columns include a `language` TEXT field.
- The mobile app passes `Accept-Language` header; the API filters accordingly.
- RTL layout is toggled via `I18nManager.forceRTL(true)` in React Native for Arabic locale.

### Supabase Realtime
Used for:
- Live location updates during SOS (channel: `sos:${event_id}`)
- New post notifications in community groups
- Admin dashboard flagged-content feed

---

## Running Locally

The database is **not** run locally. It lives on Supabase cloud. Only Redis runs in Docker.

```bash
# 1. Install dependencies
pnpm install

# 2. Start local Redis only (no Postgres — DB is on Supabase)
docker compose up -d

# 3. Set up environment
cp .env.example .env
# Fill in: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
#          SUPABASE_JWT_SECRET, ENCRYPTION_KEY (minimum to run)

# 4. Apply DB migrations to your Supabase project
supabase db push --linked
# OR run migration SQL directly in Supabase dashboard SQL editor

# 5. Seed dev data (run in Supabase SQL editor or via psql with DATABASE_URL)
psql $DATABASE_URL -f supabase/seed.sql

# 6. Start API
cd packages/api && pnpm dev

# 7. Start web admin dashboard
cd apps/web && pnpm dev

# 8. Start mobile app
cd apps/mobile && pnpm start
```

---

## Testing

```bash
# Run all tests
pnpm test

# API unit tests
cd packages/api && pnpm test

# Watch mode
pnpm test --watch
```

Test files live next to the code they test: `controller.ts` → `controller.test.ts`.

Use `supertest` for API integration tests. Use `jest` for unit tests.
Minimum **70% coverage** on `packages/api/src/controllers/` and `packages/api/src/services/`.

---

## Deployment

CI/CD runs on GitHub Actions. On push to `main`:
1. Lint (`eslint + prettier`)
2. Type check (`tsc --noEmit`)
3. Tests (`jest`)
4. Build
5. Deploy API to Railway / AWS
6. Deploy web to Vercel
7. Apply DB migrations (`supabase db push --linked`)

OpenAPI 3.0 spec is auto-generated and published at `/api/docs` (Swagger UI).

---

## Implementation Log

> This section is updated every time a new feature or file is created.
> Claude Code uses this as its authoritative record of what has been built.

### Completed

| Date | What was built | Key files |
|---|---|---|
| 2026-04-15 | Project scaffold — directory structure created | All directories under `apps/`, `packages/`, `supabase/` |
| 2026-04-15 | Root config files — `.env.example`, `docker-compose.yml`, `pnpm-workspace.yaml`, `.gitignore`, root `package.json` | See root of repo |
| 2026-04-15 | DB migrations — all 25 core tables | `supabase/migrations/20260415000001_create_core_tables.sql` |
| 2026-04-15 | Seed data | `supabase/seed.sql` |
| 2026-04-15 | API bootstrap — Express server, middleware stack, response helpers | `packages/api/src/index.ts`, `packages/api/src/middleware/` |
| 2026-04-15 | Shared types & constants | `packages/shared/src/types.ts`, `packages/shared/src/constants.ts` |
| 2026-04-15 | Architecture clarification — Supabase Auth + Google Sign-In only, no local DB, no MongoDB, web app is admin-only | `CLAUDE.md`, `docker-compose.yml`, `.env.example`, `packages/api/src/middleware/auth.ts`, `packages/api/package.json` |
| 2026-04-15 | Phase 1 complete — all API routes & controllers | See table below |
| 2026-04-22 | Phase 2 complete — full React Native / Expo mobile app | See table below |

#### Phase 1 file inventory

| Step | Files |
|---|---|
| 1.1 Role sync | `supabase/migrations/20260415000002_role_sync_trigger.sql`, `packages/api/src/services/authAdmin.ts` |
| 1.2 Users | `packages/api/src/controllers/users.ts`, `packages/api/src/routes/users.ts` |
| 1.3 SOS | `packages/api/src/controllers/sos.ts`, `packages/api/src/routes/sos.ts`, `packages/api/src/services/twilio.ts`, `packages/api/src/services/fcm.ts` |
| 1.4 Hotlines | `packages/api/src/controllers/hotlines.ts`, `packages/api/src/routes/hotlines.ts` |
| 1.5 Mood + Journal | `packages/api/src/controllers/mood.ts`, `packages/api/src/controllers/journal.ts`, `packages/api/src/routes/mood.ts`, `packages/api/src/routes/journal.ts` |
| 1.6 Cycles | `packages/api/src/controllers/cycles.ts`, `packages/api/src/routes/cycles.ts` |
| 1.7 Community | `packages/api/src/controllers/community.ts`, `packages/api/src/routes/community.ts` |
| 1.8 Content | `packages/api/src/controllers/content.ts`, `packages/api/src/routes/content.ts` |
| 1.9 Scouts | `packages/api/src/controllers/scouts.ts`, `packages/api/src/routes/scouts.ts` |
| 1.10 Legal | `packages/api/src/controllers/legal.ts`, `packages/api/src/routes/legal.ts` |
| 1.11 Admin | `packages/api/src/controllers/admin.ts`, `packages/api/src/routes/admin.ts` |
| Wiring | `packages/api/src/index.ts` (all routes mounted) |

#### Phase 2 file inventory

| Step | Files |
|---|---|
| 2.1 Expo shell | `apps/mobile/package.json`, `apps/mobile/app.json`, `apps/mobile/tsconfig.json`, `apps/mobile/babel.config.js` |
| 2.1 Services | `apps/mobile/services/supabase.ts`, `apps/mobile/services/api.ts` |
| 2.1 Constants | `apps/mobile/constants/theme.ts` |
| 2.1 State | `apps/mobile/store/authStore.ts` |
| 2.1 Hooks | `apps/mobile/hooks/useColorScheme.ts`, `apps/mobile/hooks/useRTL.ts` |
| 2.1 Root layout | `apps/mobile/app/_layout.tsx` (AuthGuard, RTL, QueryClient) |
| 2.1 Shared UI | `apps/mobile/components/ui/Card.tsx`, `Button.tsx`, `ScreenHeader.tsx` |
| 2.1 SOS component | `apps/mobile/components/SOSButton.tsx` (pulse anim, 10s grace, cancel) |
| 2.2 Auth | `apps/mobile/app/(auth)/_layout.tsx`, `apps/mobile/app/(auth)/sign-in.tsx` |
| 2.2 404 | `apps/mobile/app/+not-found.tsx` |
| 2.3 Tabs shell | `apps/mobile/app/(tabs)/_layout.tsx` (5 tabs + SOS overlay) |
| 2.3 Home | `apps/mobile/app/(tabs)/index.tsx` (affirmation, mood picker, quick-access grid) |
| 2.4 Safety | `apps/mobile/app/(tabs)/safety/_layout.tsx`, `safety/index.tsx` |
| 2.4 Hotlines | `apps/mobile/app/(tabs)/safety/hotlines.tsx` |
| 2.4 Contacts | `apps/mobile/app/(tabs)/safety/contacts.tsx` |
| 2.4 Journey | `apps/mobile/app/(tabs)/safety/journey.tsx` |
| 2.4 Self-Defence | `apps/mobile/app/(tabs)/safety/selfdefence.tsx` |
| 2.4 Legal | `apps/mobile/app/(tabs)/safety/legal.tsx` |
| 2.4 Scouts | `apps/mobile/app/(tabs)/safety/scouts.tsx` |
| 2.4 Learn | `apps/mobile/app/(tabs)/safety/learn.tsx` |
| 2.7 Wellness | `apps/mobile/app/(tabs)/wellness/_layout.tsx`, `wellness/index.tsx` |
| 2.7 Mood | `apps/mobile/app/(tabs)/wellness/mood.tsx` (daily check-in, 14-day history, streak) |
| 2.7 Journal | `apps/mobile/app/(tabs)/wellness/journal.tsx` (list / compose / read; encrypted server-side) |
| 2.7 Cycle | `apps/mobile/app/(tabs)/wellness/cycle.tsx` (log + prediction card + symptom chips) |
| 2.8 Community | `apps/mobile/app/(tabs)/community/_layout.tsx`, `community/index.tsx` (groups list) |
| 2.8 Feed | `apps/mobile/app/(tabs)/community/feed.tsx` (posts, reactions, anonymous post toggle) |
| 2.10 Profile | `apps/mobile/app/(tabs)/profile.tsx` (avatar, role badge, notif prefs, sign-out) |

### In Progress / Next

- Phase 3 complete — Web admin dashboard (Next.js 14, admin-only)

#### Phase 3 file inventory

| Step | Files |
|---|---|
| 3.1 Project config | `apps/web/package.json`, `apps/web/tsconfig.json`, `apps/web/next.config.ts`, `apps/web/tailwind.config.ts`, `apps/web/postcss.config.js` |
| 3.1 Supabase SSR clients | `apps/web/lib/supabase/server.ts`, `apps/web/lib/supabase/client.ts` |
| 3.1 API helper | `apps/web/lib/api.ts` (server-side fetch with Bearer token) |
| 3.1 Admin auth guard | `apps/web/lib/auth.ts` (`requireAdmin()` — redirects if not admin), `apps/web/middleware.ts` (edge-level JWT + role check) |
| 3.1 Root layout + CSS | `apps/web/app/layout.tsx`, `apps/web/app/globals.css` (RTL, Tailwind, brand colors) |
| 3.1 Login page | `apps/web/app/login/page.tsx` (Google OAuth via Supabase) |
| 3.1 OAuth callback | `apps/web/app/auth/callback/route.ts` (code exchange, role gate) |
| 3.1 Root redirect | `apps/web/app/page.tsx` (→ /dashboard) |
| 3.1 Sidebar | `apps/web/components/Sidebar.tsx` (nav links, sign-out) |
| 3.1 Dashboard layout | `apps/web/app/dashboard/layout.tsx` (wraps all admin pages) |
| 3.2 Dashboard home | `apps/web/app/dashboard/page.tsx` (4 stat cards + recent SOS table) |
| 3.2 Users page | `apps/web/app/dashboard/users/page.tsx` (list + role filter) |
| 3.2 User actions | `apps/web/app/dashboard/users/UserActions.tsx` (client: ban/unban, role change) |
| 3.3 Content page | `apps/web/app/dashboard/content/page.tsx` (tabs: articles, quizzes, videos) |
| 3.3 Hotlines page | `apps/web/app/dashboard/hotlines/page.tsx` (list table) |
| 3.3 Hotline form | `apps/web/app/dashboard/hotlines/HotlineForm.tsx` (client add-form) |
| 3.4 Moderation page | `apps/web/app/dashboard/moderation/page.tsx` (reports queue by status) |
| 3.4 Resolve button | `apps/web/app/dashboard/moderation/ResolveButton.tsx` (client: resolve / dismiss) |
| 3.5 Scouts admin | `apps/web/app/dashboard/scouts/page.tsx` (tabs: troops, activities, badges) |
| 3.6 Analytics | `apps/web/app/dashboard/analytics/page.tsx` (mood trend, module engagement, SOS monthly) |
| 3.6 Mood chart | `apps/web/app/dashboard/analytics/MoodChart.tsx` (Recharts line chart, client component) |
| API additions | `packages/api/src/controllers/admin.ts` (getStats, getRecentSos, getMoodAnalytics, getSosAnalytics, getModuleAnalytics) |
| API route additions | `packages/api/src/routes/admin.ts` (GET /admin/stats, /admin/sos/recent, /admin/analytics/*) |

#### Phase 4 file inventory

| Step | Files |
|---|---|
| 4.1 Test infrastructure | `packages/api/jest.config.ts`, `packages/api/src/tests/setup.ts` |
| 4.1 Encryption tests | `packages/api/src/services/encryption.test.ts` (8 cases) |
| 4.1 Cycle predictor tests | `packages/api/src/services/cyclePredictor.test.ts` (8 cases) |
| 4.1 Auth middleware tests | `packages/api/src/middleware/auth.test.ts` (9 cases) |
| 4.1 Error handler tests | `packages/api/src/middleware/errorHandler.test.ts` (5 cases) |
| 4.1 Response helper tests | `packages/api/src/services/response.test.ts` (7 cases) |
| 4.1 Hotlines controller tests | `packages/api/src/controllers/hotlines.test.ts` (supertest, mocked Supabase) |
| 4.2 CI pipeline | `.github/workflows/ci.yml` (lint → typecheck → test for API, web, mobile) |
| 4.2 Deploy pipeline | `.github/workflows/deploy.yml` (Railway API, Vercel web, Supabase migrations) |
| 4.3 OpenAPI 3.0 spec | `packages/api/src/openapi.ts` (paths, schemas, security) |
| 4.3 Swagger UI endpoint | `packages/api/src/index.ts` → `GET /api/docs`, `GET /api/docs/openapi.json` |
| 4.4 Sentry API integration | `packages/api/src/index.ts` (Sentry.init + setupExpressErrorHandler), `packages/api/package.json` (@sentry/node dep) |
| 4.4 Env docs | `.env.example` (NEXT_PUBLIC_ web vars, GitHub Actions secrets doc) |

#### Phase 5 file inventory

| Step | Files |
|---|---|
| 5.1 Push notifications | `apps/mobile/services/notifications.ts` (register, sync token, deep-link router, listener setup) |
| 5.1 Root layout update | `apps/mobile/app/_layout.tsx` (notification listeners wired on auth, token synced on login) |
| 5.2 Sentry mobile | `apps/mobile/services/sentry.ts` (init, identifyUser, clearUser, captureError) |
| 5.2 Mobile package | `apps/mobile/package.json` (@sentry/react-native, expo-device added) |
| 5.3 Article editor | `apps/web/app/dashboard/content/ArticleEditor.tsx` (TipTap rich-text, draft/publish, module+language pickers) |
| 5.3 New content page | `apps/web/app/dashboard/content/new/page.tsx` |
| 5.3 Admin articles API | `packages/api/src/controllers/articles.ts` (create, update, soft-delete) |
| 5.3 Admin routes update | `packages/api/src/routes/admin.ts` (POST/PATCH/DELETE /admin/articles) |
| 5.3 Web package | `apps/web/package.json` (@tiptap/react, @tiptap/starter-kit, @tailwindcss/typography) |
| 5.4 Badge certificates | `packages/api/src/services/badgeCertificate.ts` (pdfkit, A4 landscape, branded certificate) |
| 5.4 Certificate route | `packages/api/src/routes/certificates.ts` (GET /badges/:id/certificate → PDF stream) |
| 5.4 API wiring | `packages/api/src/index.ts` (certificateRoutes mounted) |
| 5.4 API package | `packages/api/package.json` (pdfkit + @types/pdfkit added) |
| 5.5 AI moderation | `packages/api/src/services/moderation.ts` (OpenAI Moderation API, timeout 5s, fails open) |
| 5.5 Community controller | `packages/api/src/controllers/community.ts` (moderateContent called on createPost; auto-hide high-severity) |
| 5.5 Env update | `.env.example` (OPENAI_API_KEY documented) |

#### Web runnable fixes (2026-04-24)

| Fix | Files |
|---|---|
| Convert `next.config.ts` → `next.config.mjs` (Next.js 14 doesn't support `.ts` config) | `apps/web/next.config.mjs` (old `.ts` deleted) |
| Add `CookieOptions` types to Supabase SSR cookie helpers (TS strict mode) | `apps/web/lib/supabase/server.ts`, `apps/web/middleware.ts` |
| Move `createClient()` inside handler to avoid crash when env vars are empty | `apps/web/app/login/page.tsx` |
| Add `apps/web/.env.local` template with required env var stubs | `apps/web/.env.local` |

#### Phase 6 — Dashboard direct-Supabase wiring + seed data (2026-04-24)

All dashboard pages now bypass the Express API and query Supabase directly (service role client). Server Actions handle all mutations with `revalidatePath` for cache invalidation.

| Step | Files |
|---|---|
| 6.1 Admin Supabase client | `apps/web/lib/supabase/admin.ts` (service role, bypasses RLS, server-only) |
| 6.1 User server actions | `apps/web/app/actions/users.ts` (changeRole, banUser, unbanUser) |
| 6.1 Hotline server actions | `apps/web/app/actions/hotlines.ts` (createHotline, toggleHotline, deleteHotline) |
| 6.1 Content server actions | `apps/web/app/actions/content.ts` (createArticle, togglePublish, deleteArticle) |
| 6.1 Moderation server actions | `apps/web/app/actions/moderation.ts` (resolveReport, dismissReport, removePost) |
| 6.2 Seed data | `supabase/seed.sql` (comprehensive rewrite: 15 users, 20 hotlines, 12 articles, 12 SOS events, 30-day mood logs, 8 badges, 2 troops, 8 activities, 7 content reports, audit logs) |
| 6.3 Dashboard home | `apps/web/app/dashboard/page.tsx` (direct Supabase stats, recent SOS with pulse animation) |
| 6.3 Users page | `apps/web/app/dashboard/users/page.tsx` (search + role filter, avatar initials, ban state from deleted_at) |
| 6.3 UserActions | `apps/web/app/dashboard/users/UserActions.tsx` (role dropdown + ban/unban via server actions) |
| 6.3 Hotlines page | `apps/web/app/dashboard/hotlines/page.tsx` (country tabs, category badges, is_24h chip) |
| 6.3 HotlineForm | `apps/web/app/dashboard/hotlines/HotlineForm.tsx` (add hotline form calling server action) |
| 6.3 HotlineToggle | `apps/web/app/dashboard/hotlines/HotlineToggle.tsx` (activate/deactivate toggle) |
| 6.3 Content page | `apps/web/app/dashboard/content/page.tsx` (tabs: articles/quizzes/videos, publish chips) |
| 6.3 ContentActions | `apps/web/app/dashboard/content/ContentActions.tsx` (publish toggle + soft delete) |
| 6.3 Moderation page | `apps/web/app/dashboard/moderation/page.tsx` (status tabs with counts, report cards) |
| 6.3 ResolveButton | `apps/web/app/dashboard/moderation/ResolveButton.tsx` (resolve / remove post / dismiss) |
| 6.3 Scouts page | `apps/web/app/dashboard/scouts/page.tsx` (troops/activities/badges tabs, member counts) |
| 6.3 Analytics page | `apps/web/app/dashboard/analytics/page.tsx` (mood trend, module engagement bars, SOS monthly table — all direct Supabase, JS aggregation) |
| 6.4 Root layout | `apps/web/app/layout.tsx` (added `<Toaster />` from sonner for toast notifications) |
| 6.4 Env | `apps/web/.env.local` (SUPABASE_SERVICE_ROLE_KEY placeholder added with instructions) |

### Open / Future Work

- Parental consent UX for users under 13 (COPPA / GDPR-K)
- Quiz editor in web admin (multi-step form: questions + options + correct index)
- Offline sync: MMKV persistence layer for React Query cache (hotlines, activities)
- Live location WebSocket during SOS (Supabase Realtime channel `sos:{event_id}`)
- Localisation: dynamic RTL toggle based on user profile language

---

## Resolved Architecture Decisions

| Decision | Choice | Reason |
|---|---|---|
| Auth provider | Supabase Auth + Google Sign-In | No custom passwords; Supabase handles tokens |
| Database hosting | Supabase cloud (not local) | Supabase is the DB — no local Postgres |
| NoSQL / MongoDB | Dropped — all data in Supabase | Simpler stack; Supabase JSONB handles flexible data |
| Map provider | Google Maps | Decided; remove Mapbox references |
| File storage | Cloudinary | Decided; remove AWS S3 references |
| Web app audience | Admin only | No public routes in web app |
| Mobile app audience | End users (girls/young women) | Primary product |

## Open Questions (as of April 2026)

- Legal review needed for publishing hotline numbers per country
- Parental consent flow UX for users under 13 (COPPA / GDPR-K)
- AI moderation vendor for community content (e.g. OpenAI Moderation API, Perspective API)
- Push notification strategy for iOS (APNs via FCM or direct)

---

*Last updated: April 2026 — v1.0 SRS baseline*
