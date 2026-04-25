// ============================================================
// Auth Admin helpers — wraps Supabase Auth admin SDK calls
//
// Use this whenever the API needs to update a user's JWT claims
// (role change, ban) without waiting for the DB trigger.
// ============================================================
import { supabaseAdmin } from '../models/supabase';
import { UserRole } from '@njoum/shared';

/**
 * Writes `role` into the user's app_metadata so the next JWT
 * issued by Supabase carries the updated role claim.
 */
export async function syncRoleToAuth(userId: string, role: UserRole): Promise<void> {
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    app_metadata: { role },
  });
  if (error) throw new Error(`Failed to sync role to auth: ${error.message}`);
}

/**
 * Bans a user in Supabase Auth (revokes all sessions immediately).
 * `banDuration` defaults to 'none' meaning permanent until lifted.
 */
export async function banUser(userId: string, banDuration = 'none'): Promise<void> {
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    ban_duration: banDuration,
  });
  if (error) throw new Error(`Failed to ban user: ${error.message}`);
}

/**
 * Lifts a ban by setting ban_duration to 'none' (un-ban).
 */
export async function unbanUser(userId: string): Promise<void> {
  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    ban_duration: 'none',
  });
  if (error) throw new Error(`Failed to unban user: ${error.message}`);
}
