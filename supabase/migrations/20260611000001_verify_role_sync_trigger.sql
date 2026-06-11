-- ============================================================
-- Njoum — Role Sync Trigger Verification & Hardening
-- Created: 2026-06-11
--
-- Purpose:
--   1. Verifies pg_net is enabled (required by the trigger).
--   2. Adds a helper function verify_role_sync_config() that
--      can be called from the SQL Editor to confirm the two
--      required database settings are present.
--   3. Documents the fallback path (Admin SDK) used by the
--      controllers/admin.ts when the trigger cannot fire
--      (e.g. pg_net not set up, settings missing).
--
-- HOW TO TEST THE TRIGGER:
--   Run the following in the Supabase SQL Editor:
--
--     SELECT verify_role_sync_config();
--
--   Expected output when configured correctly:
--     { "pg_net": "enabled", "supabase_url": "set", "service_role_key": "set" }
--
--   Then trigger a role update:
--     UPDATE public.users SET role = 'content_admin' WHERE id = '<your-test-uuid>';
--
--   Then verify the JWT claim was updated:
--     SELECT raw_app_meta_data FROM auth.users WHERE id = '<your-test-uuid>';
--   Expected: { ..., "role": "content_admin" }
-- ============================================================

-- pg_net must be enabled for the trigger to make HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ── Verification helper ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.verify_role_sync_config()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url      TEXT;
  v_key      TEXT;
  v_pg_net   TEXT;
  v_result   jsonb;
BEGIN
  -- Check if pg_net extension is installed
  SELECT extname INTO v_pg_net
    FROM pg_extension WHERE extname = 'pg_net';

  -- Read the two required database settings (returns NULL if not set)
  v_url := current_setting('app.supabase_url', TRUE);
  v_key := current_setting('app.supabase_service_role_key', TRUE);

  v_result := jsonb_build_object(
    'pg_net',            CASE WHEN v_pg_net IS NOT NULL THEN 'enabled' ELSE 'MISSING — run: CREATE EXTENSION pg_net' END,
    'supabase_url',      CASE WHEN v_url IS NOT NULL AND v_url <> '' THEN 'set' ELSE 'MISSING — run: ALTER DATABASE postgres SET app.supabase_url = ''https://<project>.supabase.co''' END,
    'service_role_key',  CASE WHEN v_key IS NOT NULL AND v_key <> '' THEN 'set' ELSE 'MISSING — run: ALTER DATABASE postgres SET app.supabase_service_role_key = ''<key>''' END
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.verify_role_sync_config IS
  'Returns JSON describing whether the role-sync trigger prerequisites are in place. Call from SQL Editor: SELECT verify_role_sync_config();';

-- ── Trigger presence assertion ────────────────────────────────
-- If the trigger was accidentally dropped, re-create it.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_sync_user_role'
      AND tgrelid = 'public.users'::regclass
  ) THEN
    RAISE WARNING
      'trg_sync_user_role trigger is MISSING from public.users. '
      'Re-run migration 20260415000002_role_sync_trigger.sql to restore it.';
  END IF;
END;
$$;

-- ── Fallback documentation ────────────────────────────────────
-- If pg_net or the database settings are unavailable, the API
-- server uses the Supabase Admin SDK as a fallback.
-- This is already wired in packages/api/src/controllers/admin.ts:
--
--   await supabaseAdmin.auth.admin.updateUserById(userId, {
--     app_metadata: { role: newRole }
--   });
--
-- That call is authoritative and fires on every role change
-- via the web dashboard, regardless of trigger status.
