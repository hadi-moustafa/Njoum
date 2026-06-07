import { createClient } from './supabase/server';
import { supabaseAdmin } from './supabase/admin';
import { redirect } from 'next/navigation';

const ADMIN_ROLES = ['super_admin', 'content_admin', 'community_moderator'] as const;
type AdminRole = typeof ADMIN_ROLES[number];

// Call from any Server Component / layout that requires admin access.
// Redirects to /login if not authenticated or not an admin.
export async function requireAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // First try app_metadata (set by role sync trigger)
  let role = (user.app_metadata as { role?: string })?.role as string | undefined;

  // Fallback: check the users table directly
  if (!role || !ADMIN_ROLES.includes(role as AdminRole)) {
    const { data: dbUser } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('email', user.email ?? '')
      .is('deleted_at', null)
      .maybeSingle();

    role = dbUser?.role;
  }

  // If still no admin role, redirect to login
  if (!role || !ADMIN_ROLES.includes(role as AdminRole)) {
    redirect('/login?error=not_admin');
  }

  const { data: { session } } = await supabase.auth.getSession();
  return { user, role: role as AdminRole, token: session?.access_token ?? '' };
}

export { ADMIN_ROLES };
