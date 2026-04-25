import { createClient } from '@supabase/supabase-js';

// Service-role client — bypasses RLS. SERVER SIDE ONLY.
// Never import this file in any 'use client' component.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
