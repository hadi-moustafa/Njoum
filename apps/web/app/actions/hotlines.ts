'use server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function createHotline(data: {
  name: string; phone: string; category: string; country: string;
}) {
  const { error } = await supabaseAdmin.from('hotlines').insert({
    ...data,
    is_active: true,
    is_verified: false,
    last_checked_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/hotlines');
}

export async function toggleHotline(id: string, isActive: boolean) {
  const { error } = await supabaseAdmin
    .from('hotlines')
    .update({ is_active: isActive })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/hotlines');
}

export async function updateHotline(id: string, data: {
  name: string; phone: string; category: string; country: string; is_verified: boolean;
}): Promise<{ success: true } | { error: string }> {
  const { error } = await supabaseAdmin.from('hotlines').update(data).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/hotlines');
  return { success: true };
}

export async function deleteHotline(id: string) {
  const { error } = await supabaseAdmin.from('hotlines').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/hotlines');
}
