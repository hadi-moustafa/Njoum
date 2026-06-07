'use client';

import { useRouter } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';

export default function DeleteEventButton({ id }: { id: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm('حذف هذه الفعالية نهائياً؟')) return;
    await supabaseAdmin.from('events').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 rounded-lg px-3 py-1.5 transition"
    >
      حذف
    </button>
  );
}
