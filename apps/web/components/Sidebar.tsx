'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';

const NAV = [
  { href: '/dashboard',            label: 'الرئيسية',       icon: '🏠' },
  { href: '/dashboard/users',      label: 'المستخدمات',     icon: '👥' },
  { href: '/dashboard/content',    label: 'المحتوى',        icon: '📖' },
  { href: '/dashboard/hotlines',   label: 'خطوط الطوارئ',   icon: '📞' },
  { href: '/dashboard/moderation', label: 'الإشراف',        icon: '🛡️' },
  { href: '/dashboard/scouts',     label: 'الكشافة',        icon: '⭐' },
  { href: '/dashboard/events',     label: 'الفعاليات',      icon: '📅' },
  { href: '/dashboard/sos',         label: 'نداءات SOS',      icon: '🆘' },
  { href: '/dashboard/analytics',  label: 'الإحصائيات',     icon: '📊' },
];

export default function Sidebar({ adminEmail }: { adminEmail: string }) {
  const pathname = usePathname();
  const router   = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <aside className="w-60 min-h-screen bg-white border-l border-njoum-border flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-njoum-border">
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-base">★</span>
        </div>
        <div>
          <p className="font-bold text-njoum-text text-sm leading-none">نجوم</p>
          <p className="text-xs text-njoum-muted mt-0.5">لوحة التحكم</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {NAV.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors',
              pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                ? 'bg-primary/10 text-primary border-r-2 border-primary'
                : 'text-njoum-muted hover:bg-njoum-bg hover:text-njoum-text',
            )}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* User + sign out */}
      <div className="px-5 py-4 border-t border-njoum-border">
        <p className="text-xs text-njoum-muted truncate mb-2">{adminEmail}</p>
        <button
          onClick={signOut}
          className="text-xs text-red-500 hover:text-red-700 transition font-medium"
        >
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}
