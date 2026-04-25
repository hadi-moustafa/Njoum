'use client';
import { useTransition } from 'react';
import { resolveReport, dismissReport, removePost } from '@/app/actions/moderation';
import { toast } from 'sonner';

export default function ResolveButton({
  reportId, targetType, targetId,
}: { reportId: string; targetType: string; targetId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleResolve() {
    startTransition(async () => {
      try {
        await resolveReport(reportId);
        toast.success('تم حل البلاغ ✓');
      } catch { toast.error('فشلت العملية'); }
    });
  }

  function handleDismiss() {
    startTransition(async () => {
      try {
        await dismissReport(reportId);
        toast.success('تم رفض البلاغ');
      } catch { toast.error('فشلت العملية'); }
    });
  }

  function handleRemovePost() {
    if (!confirm('هل تريدين إزالة هذا المنشور نهائياً؟')) return;
    startTransition(async () => {
      try {
        await removePost(targetId);
        await resolveReport(reportId);
        toast.success('تم إزالة المنشور وحل البلاغ ✓');
      } catch { toast.error('فشلت العملية'); }
    });
  }

  return (
    <div className="flex flex-col gap-1.5 flex-shrink-0">
      <button
        onClick={handleResolve} disabled={isPending}
        className="text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 font-medium transition disabled:opacity-50"
      >
        {isPending ? '…' : 'حل البلاغ ✓'}
      </button>
      {targetType === 'post' && (
        <button
          onClick={handleRemovePost} disabled={isPending}
          className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 font-medium transition disabled:opacity-50"
        >
          {isPending ? '…' : 'إزالة المنشور'}
        </button>
      )}
      <button
        onClick={handleDismiss} disabled={isPending}
        className="text-xs px-3 py-1.5 rounded-lg bg-njoum-bg text-njoum-muted hover:text-njoum-text border border-njoum-border font-medium transition disabled:opacity-50"
      >
        {isPending ? '…' : 'رفض البلاغ'}
      </button>
    </div>
  );
}
