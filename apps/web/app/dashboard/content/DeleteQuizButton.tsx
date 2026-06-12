'use client';

import { useTransition } from 'react';
import { deleteQuiz } from '@/app/actions/quizzes';
import { toast } from 'sonner';

export default function DeleteQuizButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  function handle() {
    if (!confirm('سيُحذف الاختبار وجميع أسئلته. هل أنتِ متأكدة؟')) return;
    startTransition(async () => {
      try {
        await deleteQuiz(id);
        toast.success('تم حذف الاختبار');
      } catch { toast.error('فشل الحذف'); }
    });
  }

  return (
    <button onClick={handle} disabled={isPending}
      className="text-xs px-2 py-1.5 rounded-lg text-red-500 hover:bg-red-50 transition disabled:opacity-50">
      {isPending ? '…' : '🗑'}
    </button>
  );
}
