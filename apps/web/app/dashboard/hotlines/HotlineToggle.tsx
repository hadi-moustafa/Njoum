'use client';
import { useTransition } from 'react';
import { toggleHotline } from '@/app/actions/hotlines';
import { toast } from 'sonner';

export default function HotlineToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const [isPending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      try {
        await toggleHotline(id, !isActive);
        toast.success(isActive ? 'تم تعطيل الخط' : 'تم تفعيل الخط');
      } catch {
        toast.error('فشلت العملية');
      }
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
        isActive ? 'bg-primary' : 'bg-njoum-border'
      }`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
        isActive ? 'translate-x-4' : 'translate-x-1'
      }`} />
    </button>
  );
}
