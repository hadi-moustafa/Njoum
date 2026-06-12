'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { translations, type Lang } from '@/lib/i18n';

/* ──────────────────────────────────────────────────────────
   Nav icons (inline SVG, consistent 18×18)
   ────────────────────────────────────────────────────────── */
const NAV_ICONS: Record<string, React.ReactNode> = {
  home: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  users: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  content: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  hotlines: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.72 9.5 19.79 19.79 0 0 1 1.65 1.93A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.29 6.29l1.28-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
  moderation: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  scouts: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  events: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  mentors: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 11l-4 4-2-2"/>
    </svg>
  ),
  sos: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  analytics: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
};

const NAV_ITEMS = [
  { href: '/dashboard',             key: 'home',       exact: true  },
  { href: '/dashboard/users',       key: 'users'                    },
  { href: '/dashboard/content',     key: 'content'                  },
  { href: '/dashboard/hotlines',    key: 'hotlines'                 },
  { href: '/dashboard/moderation',  key: 'moderation'               },
  { href: '/dashboard/scouts',      key: 'scouts'                   },
  { href: '/dashboard/events',      key: 'events'                   },
  { href: '/dashboard/mentors',     key: 'mentors'                  },
  { href: '/dashboard/sos',         key: 'sos'                      },
  { href: '/dashboard/analytics',   key: 'analytics'                },
] as const;

/* ──────────────────────────────────────────────────────────
   Sidebar
   ────────────────────────────────────────────────────────── */
interface SidebarProps {
  open: boolean;
}

export default function Sidebar({ open }: SidebarProps) {
  const pathname = usePathname();
  const [lang, setLang] = useState<Lang>('ar');

  useEffect(() => {
    const stored = localStorage.getItem('njoum-lang') as Lang | null;
    setLang(stored ?? 'ar');

    /* Listen for lang changes from Topbar */
    const handler = () => {
      const updated = localStorage.getItem('njoum-lang') as Lang | null;
      setLang(updated ?? 'ar');
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const t = translations[lang];

  return (
    <aside
      className="fixed top-16 bottom-0 z-40 flex flex-col sidebar-transition overflow-hidden"
      style={{
        insetInlineStart: 0,
        width: open ? '240px' : '72px',
      }}
    >
      {/* ── Background ─────────────────────────────── */}
      <div className="absolute inset-0 bg-njoum-surface border-e border-njoum-border" />

      {/* Dark mode gradient overlay */}
      <div className="absolute inset-0 pointer-events-none dark:opacity-100 opacity-0 transition-opacity"
        style={{
          background: 'linear-gradient(180deg, rgba(181,88,106,0.04) 0%, rgba(122,78,122,0.06) 50%, rgba(13,7,25,0.3) 100%)',
        }}
      />

      {/* ── Star decorations (dark mode) ───────────── */}
      <div className="absolute top-4 end-4 text-primary/20 dark:text-primary/30 text-xs pointer-events-none select-none transition-opacity">
        ✦
      </div>
      <div className="absolute top-16 start-3 text-depth/20 dark:text-depth/25 text-[8px] pointer-events-none select-none">
        ✦
      </div>

      {/* ── Nav content ────────────────────────────── */}
      <nav className="relative z-10 flex-1 py-3 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS.map(item => {
          const isActive = ('exact' in item && item.exact)
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const label = t.nav[item.key];
          const icon  = NAV_ICONS[item.key];

          return (
            <Link
              key={item.href}
              href={item.href}
              title={!open ? label : undefined}
              className={[
                'group relative flex items-center gap-3 mx-2 my-0.5 px-3 py-2.5 rounded-xl transition-all duration-200',
                isActive
                  ? 'nav-item-active text-primary'
                  : 'text-njoum-muted hover:text-njoum-text hover:bg-njoum-border/30',
              ].join(' ')}
            >
              {/* Icon */}
              <span
                className={[
                  'flex-shrink-0 transition-all duration-200',
                  isActive
                    ? 'text-primary drop-shadow-[0_0_6px_rgba(181,88,106,0.6)]'
                    : 'group-hover:text-njoum-text',
                ].join(' ')}
              >
                {icon}
              </span>

              {/* Label — hidden when collapsed */}
              <span
                className="text-sm font-medium whitespace-nowrap transition-all duration-200 overflow-hidden"
                style={{
                  maxWidth: open ? '160px' : '0px',
                  opacity:  open ? 1 : 0,
                }}
              >
                {label}
              </span>

              {/* Active dot when collapsed */}
              {!open && isActive && (
                <span className="absolute end-1.5 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Footer ─────────────────────────────────── */}
      <div
        className="relative z-10 py-4 border-t border-njoum-border"
        style={{
          opacity:    open ? 1 : 0,
          transition: 'opacity 0.2s ease',
          padding:    open ? '1rem' : '0.5rem',
        }}
      >
        {open && (
          <div className="px-2">
            <p className="text-[10px] text-njoum-muted/60 text-center">
              نجوم • لوحة التحكم
            </p>
            <div className="flex justify-center gap-1 mt-1.5">
              {['✦', '★', '✦'].map((s, i) => (
                <span key={i} className="text-[8px] text-primary/30">{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
