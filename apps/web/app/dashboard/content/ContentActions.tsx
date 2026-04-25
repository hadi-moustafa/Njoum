'use client';
import { useTransition } from 'react';
import { togglePublish, deleteArticle } from '@/app/actions/content';
import { toast } from 'sonner';

export default function ContentActions({ id, isPublished }: { id: string; isPublished: boolean }) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      try {
        await togglePublish(id, !isPublished);
        toast.success(isPublished ? 'تم إلغاء النشر' : 'تم النشر ✓');
      } catch { toast.error('فشلت العملية'); }
    });
  }

  function handleDelete() {
    if (!confirm('هل أنتِ متأكدة من حذف هذه المقالة؟')) return;
    startTransition(async () => {
      try {
        await deleteArticle(id);
        toast.success('تم الحذف');
      } catch { toast.error('فشل الحذف'); }
    });
  }

  return (
    <div className="flex items-center gap-1">
      <button onClick={handleToggle} disabled={isPending}
        className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition disabled:opacity-50 ${
          isPublished
            ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
            : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
        }`}>
        {isPending ? '…' : isPublished ? 'إلغاء النشر' : 'نشر'}
      </button>
      <button onClick={handleDelete} disabled={isPending}
        className="text-xs px-2 py-1.5 rounded-lg text-red-500 hover:bg-red-50 transition disabled:opacity-50">
        🗑
      </button>
    </div>
  );
}
