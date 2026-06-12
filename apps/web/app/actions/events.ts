'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

interface EventFormData {
  title:       string;
  description: string;
  event_type:  string;
  starts_at:   string;
  ends_at:     string;
  country:     string;
  region:      string;
  is_online:   boolean;
  url:         string;
}

export async function createEvent(
  form: EventFormData,
): Promise<{ success: true } | { error: string }> {
  const { error } = await supabaseAdmin.from('events').insert({
    title:       form.title,
    description: form.description || null,
    event_type:  form.event_type,
    starts_at:   form.starts_at,
    ends_at:     form.ends_at  || null,
    country:     form.country  || null,
    region:      form.region   || null,
    is_online:   form.is_online,
    url:         form.url      || null,
  });

  if (error) return { error: error.message };
  revalidatePath('/dashboard/events');
  return { success: true };
}

export async function updateEvent(
  id:   string,
  form: EventFormData,
): Promise<{ success: true } | { error: string }> {
  const { error } = await supabaseAdmin.from('events').update({
    title:       form.title,
    description: form.description || null,
    event_type:  form.event_type,
    starts_at:   form.starts_at,
    ends_at:     form.ends_at  || null,
    country:     form.country  || null,
    region:      form.region   || null,
    is_online:   form.is_online,
    url:         form.url      || null,
  }).eq('id', id);

  if (error) return { error: error.message };
  revalidatePath('/dashboard/events');
  return { success: true };
}

export async function deleteEvent(id: string): Promise<void> {
  await supabaseAdmin
    .from('events')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  revalidatePath('/dashboard/events');
}
