'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

// ── Troops ────────────────────────────────────────────────────

export async function createTroop(data: {
  name: string; region: string; country: string; age_tier: string;
}): Promise<{ success: true } | { error: string }> {
  const { error } = await supabaseAdmin.from('scouts_troops').insert(data);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/scouts');
  return { success: true };
}

export async function deleteTroop(id: string): Promise<void> {
  await supabaseAdmin.from('scouts_troops').delete().eq('id', id);
  revalidatePath('/dashboard/scouts');
}

// ── Activities ────────────────────────────────────────────────

export async function createActivity(data: {
  title: string; description: string; age_tier: string;
  category: string; is_offline_capable: boolean; badge_id: string | null;
}): Promise<{ success: true } | { error: string }> {
  const { error } = await supabaseAdmin.from('activities').insert({
    title:              data.title,
    description:        data.description || null,
    age_tier:           data.age_tier,
    category:           data.category,
    is_offline_capable: data.is_offline_capable,
    badge_id:           data.badge_id || null,
  });
  if (error) return { error: error.message };
  revalidatePath('/dashboard/scouts');
  return { success: true };
}

export async function deleteActivity(id: string): Promise<void> {
  await supabaseAdmin.from('activities').delete().eq('id', id);
  revalidatePath('/dashboard/scouts');
}

// ── Badges ────────────────────────────────────────────────────

export async function createBadge(data: {
  name: string; description: string; module: string; category: string;
}): Promise<{ success: true } | { error: string }> {
  const { error } = await supabaseAdmin.from('badges').insert(data);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/scouts');
  return { success: true };
}

export async function deleteBadge(id: string): Promise<void> {
  await supabaseAdmin.from('badges').delete().eq('id', id);
  revalidatePath('/dashboard/scouts');
}
