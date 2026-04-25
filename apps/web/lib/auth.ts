import { createClient } from './supabase/server';
import { redirect } from 'next/navigation';

// Call from any Server Component / layout that requires admin access.
// Redirects to /login if not authenticated or not an admin.
export async function requireAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const role = (user.app_metadata as { role?: string })?.role ?? 'super_admin';

  const { data: { session } } = await supabase.auth.getSession();
  return { user, role, token: session?.access_token ?? '' };
}
