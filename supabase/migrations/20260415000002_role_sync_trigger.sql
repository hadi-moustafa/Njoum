-- ============================================================
-- Njoum — Role Sync Trigger
-- Created: 2026-04-15
--
-- Purpose:
--   Whenever a row in public.users is inserted or the `role`
--   column is updated, this trigger calls the Supabase Auth
--   admin API (via the http extension or pg_net) to write the
--   role into auth.users.raw_app_meta_data.
--
--   The API middleware reads role from the JWT claim:
--     payload.app_metadata.role
--
--   Because Supabase re-signs the JWT on every refresh,
--   the next token the client receives will carry the updated
--   role automatically — no manual token invalidation needed.
-- ============================================================

-- We use pg_net (available on Supabase) to make an HTTP call
-- to the Supabase Auth admin endpoint from within Postgres.
-- Enable it if not already enabled:
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ── Helper function ───────────────────────────────────────────
-- Called by the trigger. Updates raw_app_meta_data on the
-- corresponding auth.users row to include { "role": "<role>" }.
CREATE OR REPLACE FUNCTION public.sync_user_role_to_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER          -- runs with owner privileges so it can read service vars
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Determine the role from the affected row
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;  -- nothing to sync on delete
  END IF;

  v_role := NEW.role;

  -- Only call the API if role actually changed (or it's a new row)
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role) THEN
    -- Use pg_net to POST to Supabase Auth admin endpoint
    -- The service role key is stored as a Supabase secret (vault)
    -- and accessed via current_setting.
    PERFORM net.http_patch(
      url    := current_setting('app.supabase_url', TRUE)
                  || '/auth/v1/admin/users/'
                  || NEW.id::TEXT,
      body   := jsonb_build_object(
                  'app_metadata', jsonb_build_object('role', v_role)
                )::TEXT,
      headers := jsonb_build_object(
                  'Content-Type',  'application/json',
                  'apikey',        current_setting('app.supabase_service_role_key', TRUE),
                  'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', TRUE)
                )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- ── Trigger ───────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_sync_user_role ON public.users;

CREATE TRIGGER trg_sync_user_role
  AFTER INSERT OR UPDATE OF role ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_role_to_auth();

-- ── Supabase database secrets ──────────────────────────────────
-- Set these in Supabase dashboard → Database → Extensions → pg_net
-- OR run these in the SQL editor (replace with real values):
--
--   ALTER DATABASE postgres
--     SET app.supabase_url = 'https://<project>.supabase.co';
--
--   ALTER DATABASE postgres
--     SET app.supabase_service_role_key = '<service-role-key>';
--
-- These settings are per-database and never visible in migrations.
-- They are NOT committed to git.
--
-- ALTERNATIVE (simpler — no pg_net required):
--   Instead of the trigger above, call the Supabase Admin SDK
--   from the API server whenever a user's role is changed:
--
--     await supabaseAdmin.auth.admin.updateUserById(userId, {
--       app_metadata: { role: newRole }
--     });
--
--   This is the fallback used by controllers/admin.ts when
--   banning a user or changing their role.
-- ============================================================
