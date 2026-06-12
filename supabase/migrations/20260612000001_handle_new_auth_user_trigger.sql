-- Auto-create a public.users row whenever Supabase Auth registers a new user.
-- Covers Google OAuth, email/password sign-up, and any future providers.
-- Without this, first-time Google sign-ins have no public.users row, which
-- breaks requireAdmin() on the web and profile loads on mobile.

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name TEXT;
  v_avatar    TEXT;
BEGIN
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(COALESCE(NEW.email, ''), '@', 1)
  );
  v_avatar := NEW.raw_user_meta_data->>'avatar_url';

  INSERT INTO public.users (id, email, full_name, avatar_url, role)
  VALUES (NEW.id, NEW.email, v_full_name, v_avatar, 'girl')
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_handle_new_auth_user ON auth.users;

CREATE TRIGGER trg_handle_new_auth_user
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
