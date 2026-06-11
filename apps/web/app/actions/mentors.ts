'use server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function endAssignment(assignmentId: string) {
  const { error } = await supabaseAdmin
    .from('mentor_assignments')
    .update({ status: 'ended', ended_at: new Date().toISOString() })
    .eq('id', assignmentId);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/mentors');
}
