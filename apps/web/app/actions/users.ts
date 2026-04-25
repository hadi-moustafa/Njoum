'use server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function changeRole(userId: string, role: string) {
  const { error } = await supabaseAdmin.from('users').update({ role }).eq('id', userId);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/users');
}

export async function banUser(userId: string) {
  const { error } = await supabaseAdmin
    .from('users')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/users');
}

export async function unbanUser(userId: string) {
  const { error } = await supabaseAdmin
    .from('users')
    .update({ deleted_at: null })
    .eq('id', userId);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/users');
}
