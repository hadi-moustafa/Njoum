'use client';

import { useTransition } from 'react';
import { deleteHotline } from '@/app/actions/hotlines';
import { toast } from 'sonner';

export default function DeleteHotlineButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  function handle() {
    if (!confirm('هل أنتِ متأكدة من حذف خط الطوارئ هذا؟')) return;
    startTransition(async () => {
      try {
        await deleteHotline(id);
        toast.success('تم الحذف');
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
