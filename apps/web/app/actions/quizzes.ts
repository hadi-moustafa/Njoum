'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

interface QuizMeta {
  title:      string;
  module:     string;
  difficulty: string;
  language:   string; // used in UI only — not a DB column on safety_quizzes
}

interface QuizQuestion {
  question_text:        string;
  options:              string[];
  correct_option_index: number;
  explanation:          string;
  sort_order:           number;
}

export async function createQuiz(
  meta: QuizMeta,
): Promise<{ quizId: string } | { error: string }> {
  // Only insert columns that exist: title, module, difficulty (no language, no is_active)
  const { data, error } = await supabaseAdmin
    .from('safety_quizzes')
    .insert({ title: meta.title, module: meta.module, difficulty: meta.difficulty })
    .select('id')
    .single();

  if (error || !data) return { error: error?.message ?? 'فشل إنشاء الاختبار' };
  return { quizId: data.id };
}

export async function saveQuizQuestions(
  quizId:    string,
  questions: QuizQuestion[],
): Promise<{ success: true } | { error: string }> {
  // DB column is 'order_index' not 'sort_order'
  const rows = questions.map((q, i) => ({
    quiz_id:              quizId,
    question_text:        q.question_text,
    options:              q.options,
    correct_option_index: q.correct_option_index,
    explanation:          q.explanation || null,
    order_index:          i,
  }));

  const { error } = await supabaseAdmin.from('quiz_questions').insert(rows);
  if (error) return { error: error.message };

  revalidatePath('/dashboard/content');
  return { success: true };
}

export async function deleteQuiz(id: string): Promise<void> {
  // quiz_questions cascade-deletes on quiz removal
  await supabaseAdmin.from('safety_quizzes').delete().eq('id', id);
  revalidatePath('/dashboard/content');
}
