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

export async function togglePublish(id: string, isPublished: boolean) {
  const { error } = await supabaseAdmin
    .from('content_articles')
    .update({ is_published: isPublished, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/content');
}

export async function deleteArticle(id: string) {
  // content_articles has no deleted_at — hard delete
  const { error } = await supabaseAdmin
    .from('content_articles')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard/content');
}
