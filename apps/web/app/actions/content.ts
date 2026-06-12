'use server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function createArticle(data: {
  title: string; body: string; module: string;
  language: string; is_published: boolean;
}) {
  const { error } = await supabaseAdmin.from('content_articles').insert(data);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/content');
}

export async function updateArticle(id: string, data: {
  title: string; body: string; module: string;
  language: string; is_published: boolean;
}) {
  const { error } = await supabaseAdmin
    .from('content_articles')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/content');
}

export async function togglePublish(id: string, isPublished: boolean) {
  const { error } = await supabaseAdmin
    .from('content_articles')
    .update({ is_published: isPublished, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/content');
}

export async function deleteArticle(id: string) {
  const { error } = await supabaseAdmin.from('content_articles').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/content');
}

// ── Video CRUD ────────────────────────────────────────────────

interface VideoData {
  title: string;
  description: string;
  scenario_category: string;
  video_url: string;
  thumbnail_url: string;
  duration_seconds: number | null;
  is_offline_capable: boolean;
  is_published: boolean;
}

export async function createVideo(data: VideoData): Promise<{ success: true } | { error: string }> {
  const { error } = await supabaseAdmin.from('self_defence_videos').insert({
    title:               data.title,
    description:         data.description || null,
    scenario_category:   data.scenario_category,
    video_url:           data.video_url,
    thumbnail_url:       data.thumbnail_url  || null,
    duration_seconds:    data.duration_seconds,
    is_offline_capable:  data.is_offline_capable,
    is_published:        data.is_published,
  });
  if (error) return { error: error.message };
  revalidatePath('/dashboard/content');
  return { success: true };
}

export async function updateVideo(id: string, data: VideoData): Promise<{ success: true } | { error: string }> {
  const { error } = await supabaseAdmin
    .from('self_defence_videos')
    .update({
      title:              data.title,
      description:        data.description || null,
      scenario_category:  data.scenario_category,
      video_url:          data.video_url,
      thumbnail_url:      data.thumbnail_url || null,
      duration_seconds:   data.duration_seconds,
      is_offline_capable: data.is_offline_capable,
      is_published:       data.is_published,
    })
    .eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/content');
  return { success: true };
}

export async function toggleVideoPublish(id: string, isPublished: boolean): Promise<void> {
  await supabaseAdmin.from('self_defence_videos').update({ is_published: isPublished }).eq('id', id);
  revalidatePath('/dashboard/content');
}

export async function deleteVideo(id: string): Promise<void> {
  await supabaseAdmin.from('self_defence_videos').delete().eq('id', id);
  revalidatePath('/dashboard/content');
}
