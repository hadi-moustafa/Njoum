'use server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function resolveReport(id: string) {
  const { error } = await supabaseAdmin
    .from('content_reports')
    .update({ status: 'resolved', reviewed_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/moderation');
}

export async function dismissReport(id: string) {
  const { error } = await supabaseAdmin
    .from('content_reports')
    .update({ status: 'dismissed', reviewed_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/moderation');
}

export async function removePost(postId: string) {
  const { error } = await supabaseAdmin
    .from('posts')
    .update({ is_removed: true })
    .eq('id', postId);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/moderation');
}
