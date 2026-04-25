'use client';
import { useState, useTransition } from 'react';
import { changeRole, banUser, unbanUser } from '@/app/actions/users';
import { toast } from 'sonner';

const ROLES = [
  { value: 'girl',                label: 'فتاة'           },
  { value: 'parent',              label: 'والدة'          },
  { value: 'mentor',              label: 'مرشدة'          },
  { value: 'content_admin',       label: 'مدير محتوى'    },
  { value: 'community_moderator', label: 'مشرف مجتمع'    },
  { value: 'super_admin',         label: 'مدير عام'       },
];

export default function UserActions({
  userId, isBanned, currentRole,
}: {
  userId: string; isBanned: boolean; currentRole: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [role, setRole] = useState(currentRole);

  function handleRoleChange(newRole: string) {
    setRole(newRole);
    startTransition(async () => {
      try {
        await changeRole(userId, newRole);
        toast.success('تم تغيير الدور');
      } catch {
        setRole(currentRole);
        toast.error('فشل تغيير الدور');
      }
    });
  }

  function handleBanToggle() {
    startTransition(async () => {
      try {
        if (isBanned) {
          await unbanUser(userId);
          toast.success('تم رفع الحظر');
        } else {
          await banUser(userId);
          toast.success('تم حظر المستخدمة');
        }
      } catch {
        toast.error('فشلت العملية');
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={role}
        onChange={e => handleRoleChange(e.target.value)}
        disabled={isPending}
        className="text-xs border border-njoum-border rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-primary text-njoum-text disabled:opacity-50"
      >
        {ROLES.map(r => (
          <option key={r.value} value={r.value}>{r.label}</option>
        ))}
      </select>
      <button
        onClick={handleBanToggle}
        disabled={isPending}
        className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition disabled:opacity-50 ${
          isBanned
            ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
            : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
        }`}
      >
        {isPending ? '…' : isBanned ? 'رفع الحظر' : 'حظر'}
      </button>
    </div>
  );
}
