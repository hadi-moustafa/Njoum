-- Allow authenticated users to insert and update their own row in users.
-- Required so the mobile app can upsert the profile after email verification.

-- Drop first to avoid "already exists" errors on re-run
DROP POLICY IF EXISTS "users_insert_own"  ON public.users;
DROP POLICY IF EXISTS "users_select_own"  ON public.users;
DROP POLICY IF EXISTS "users_update_own"  ON public.users;

-- Self insert (sign-up profile creation)
CREATE POLICY "users_insert_own"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Self read
CREATE POLICY "users_select_own"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Self update (profile edits)
CREATE POLICY "users_update_own"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
