'use client';

import { useTransition } from 'react';
import { deleteTroop, deleteActivity, deleteBadge } from '@/app/actions/scouts';
import { toast } from 'sonner';

type ScoutType = 'troop' | 'activity' | 'badge';

const LABELS: Record<ScoutType, string> = {
  troop:    'الفوج',
  activity: 'النشاط',
  badge:    'الشارة',
};

const ACTIONS: Record<ScoutType, (id: string) => Promise<void>> = {
  troop:    deleteTroop,
  activity: deleteActivity,
  badge:    deleteBadge,
};

export default function DeleteScoutItem({ id, type }: { id: string; type: ScoutType }) {
  const [isPending, startTransition] = useTransition();

  function handle() {
    if (!confirm(`هل أنتِ متأكدة من حذف ${LABELS[type]}؟`)) return;
    startTransition(async () => {
      try {
        await ACTIONS[type](id);
        toast.success('تم الحذف');
      } catch { toast.error('فشل الحذف'); }
    });
  }

  return (
    <button onClick={handle} disabled={isPending}
      className="text-xs px-2 py-1 rounded-lg text-red-500 hover:bg-red-50 transition disabled:opacity-50">
      {isPending ? '…' : '🗑'}
    </button>
  );
}
