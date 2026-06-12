'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { translations, type Lang } from '@/lib/i18n';

/* ──────────────────────────────────────────────────────────
   Icons
   ────────────────────────────────────────────────────────── */
function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
      <line x1="4.22" y1="4.22" x2="7.05" y2="7.05"/><line x1="16.95" y1="16.95" x2="19.78" y2="19.78"/>
      <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
      <line x1="4.22" y1="19.78" x2="7.05" y2="16.95"/><line x1="16.95" y1="7.05" x2="19.78" y2="4.22"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────
   Topbar Component
   ────────────────────────────────────────────────────────── */
interface TopbarProps {
  adminEmail: string;
  sidebarOpen: boolean;
  onToggle: () => void;
}

export default function Topbar({ adminEmail, sidebarOpen, onToggle }: TopbarProps) {
  const router  = useRouter();
  const supabase = createClient();

  /* ── Theme ───────────────────────────────────────── */
  const [dark, setDark] = useState(false);
  const [lang, setLang] = useState<Lang>('ar');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains('dark'));
    setLang((localStorage.getItem('njoum-lang') as Lang | null) ?? 'ar');
  }, []);

  const toggleTheme = useCallback(() => {
    const html = document.documentElement;
    const next = !dark;
    if (next) {
      html.classList.add('dark');
      localStorage.setItem('njoum-theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('njoum-theme', 'light');
    }
    setDark(next);
  }, [dark]);

  const toggleLang = useCallback(() => {
    const html = document.documentElement;
    const next: Lang = lang === 'ar' ? 'en' : 'ar';
    html.lang = next;
    html.dir  = next === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('njoum-lang', next);
    setLang(next);
  }, [lang]);

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  const t = translations[lang];

  /* Avatar initials */
  const initials = (adminEmail ?? '?')
    .split('@')[0]
    .split(/[._-]/)
    .map(w => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');

  return (
    <header
      className="topbar-glass fixed top-0 inset-inline-start-0 inset-inline-end-0 z-50 h-16 flex items-center gap-3 px-4"
      style={{ insetInlineStart: 0, insetInlineEnd: 0 }}
    >
      {/* ── Sidebar toggle ─────────────────────────── */}
      <button
        onClick={onToggle}
        className="w-9 h-9 rounded-xl flex items-center justify-center text-njoum-muted hover:text-njoum-text hover:bg-njoum-border/40 transition-all"
        aria-label="Toggle sidebar"
      >
        <MenuIcon />
      </button>

      {/* ── Logo ───────────────────────────────────── */}
      <div className="flex items-center gap-2.5 select-none">
        <div className="w-8 h-8 rounded-xl gradient-bg logo-star flex items-center justify-center shadow-glow-sm flex-shrink-0">
          <span className="text-white font-bold text-base leading-none">★</span>
        </div>
        <div className="hidden sm:block">
          <p className="font-bold text-njoum-text text-sm leading-tight gradient-text">
            {t.app.name}
          </p>
          <p className="text-[10px] text-njoum-muted leading-tight">{t.app.tagline}</p>
        </div>
      </div>

      {/* ── Spacer ─────────────────────────────────── */}
      <div className="flex-1" />

      {/* ── Controls ───────────────────────────────── */}
      <div className="flex items-center gap-1.5">

        {/* Language toggle */}
        {mounted && (
          <button
            onClick={toggleLang}
            className="h-8 px-3 rounded-lg text-xs font-semibold text-njoum-muted hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all"
            title={lang === 'ar' ? t.topbar.switchToEn : t.topbar.switchToAr}
          >
            {lang === 'ar' ? 'EN' : 'AR'}
          </button>
        )}

        {/* Theme toggle */}
        {mounted && (
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-njoum-muted hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all"
            title={dark ? t.topbar.switchToLight : t.topbar.switchToDark}
          >
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>
        )}

        {/* Divider */}
        <div className="w-px h-6 bg-njoum-border mx-1" />

        {/* User avatar + sign out dropdown */}
        <UserMenu initials={initials} email={adminEmail} onSignOut={signOut} t={t} />
      </div>
    </header>
  );
}

/* ──────────────────────────────────────────────────────────
   User avatar + dropdown
   ────────────────────────────────────────────────────────── */
function UserMenu({
  initials, email, onSignOut, t,
}: {
  initials: string;
  email: string;
  onSignOut: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener('click', close, { once: true });
    return () => document.removeEventListener('click', close);
  }, [open]);

  return (
    <div className="relative">
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-primary/10 transition-all"
      >
        {/* Avatar circle */}
        <div className="w-7 h-7 rounded-full gradient-bg flex items-center justify-center text-white text-xs font-bold shadow-glow-sm">
          {initials}
        </div>
        <span className="hidden md:block text-xs text-njoum-muted max-w-[120px] truncate">
          {email}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`text-njoum-muted transition-transform ${open ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute top-full mt-2 end-0 w-52 bg-njoum-card border border-njoum-border rounded-2xl shadow-dark-card overflow-hidden animate-fade-up z-50"
          onClick={e => e.stopPropagation()}
        >
          <div className="px-4 py-3 border-b border-njoum-border">
            <p className="text-xs font-semibold text-njoum-text truncate">{email}</p>
            <p className="text-[10px] text-njoum-muted mt-0.5">{t.app.subtitle}</p>
          </div>
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <SignOutIcon />
            {t.topbar.signOut}
          </button>
        </div>
      )}
    </div>
  );
}
