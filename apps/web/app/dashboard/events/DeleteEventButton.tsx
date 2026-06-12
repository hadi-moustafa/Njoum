'use client';

import { useTransition } from 'react';
import { deleteEvent } from '@/app/actions/events';

export default function DeleteEventButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm('حذف هذه الفعالية نهائياً؟')) return;
    startTransition(() => deleteEvent(id));
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 rounded-lg px-3 py-1.5 transition disabled:opacity-50"
    >
      {isPending ? '…' : 'حذف'}
    </button>
  );
}
