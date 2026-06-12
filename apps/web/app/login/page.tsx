'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import StarField from '@/components/StarField';

/* ──────────────────────────────────────────────────────────
   Sparkle ring decorations (sequins effect)
   ────────────────────────────────────────────────────────── */
const SPARKLES = [
  { size: 120, delay: '0s',    dur: '4s',   top: '20%', left: '15%'  },
  { size:  80, delay: '1.5s',  dur: '5s',   top: '65%', left: '8%'   },
  { size: 160, delay: '0.8s',  dur: '6s',   top: '30%', right: '10%' },
  { size:  60, delay: '2.2s',  dur: '3.5s', top: '75%', right: '18%' },
  { size: 200, delay: '0.3s',  dur: '7s',   top: '10%', right: '25%' },
  { size:  90, delay: '1.8s',  dur: '4.5s', top: '50%', left: '3%'   },
];

function SparkleRings() {
  return (
    <>
      {SPARKLES.map((s, i) => (
        <div
          key={i}
          className="sparkle-ring pointer-events-none"
          style={{
            width:  s.size,
            height: s.size,
            top:    s.top,
            left:   (s as any).left  ?? undefined,
            right:  (s as any).right ?? undefined,
            '--dur':   s.dur,
            '--delay': s.delay,
          } as React.CSSProperties}
        />
      ))}
    </>
  );
}

/* ──────────────────────────────────────────────────────────
   Google icon
   ────────────────────────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────
   Login form
   ────────────────────────────────────────────────────────── */
function LoginForm() {
  const [loading, setLoading]   = useState(false);
  const [isDark, setIsDark]     = useState(false);
  const searchParams            = useSearchParams();
  const errorParam              = searchParams.get('error');

  useEffect(() => {
    /* Apply stored theme on login page too */
    const t = localStorage.getItem('njoum-theme');
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  }, []);

  function toggleTheme() {
    const html = document.documentElement;
    const next = !isDark;
    if (next) { html.classList.add('dark');    localStorage.setItem('njoum-theme', 'dark');  }
    else      { html.classList.remove('dark'); localStorage.setItem('njoum-theme', 'light'); }
    setIsDark(next);
  }

  async function signInWithGoogle() {
    setLoading(true);
    const supabase   = createClient();
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error }  = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
    if (error) setLoading(false);
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-njoum-bg">
      {/* ── Background layer ─────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 30% 40%, rgba(181,88,106,0.12) 0%, transparent 55%), radial-gradient(ellipse at 70% 70%, rgba(122,78,122,0.10) 0%, transparent 50%)',
        }}
      />
      <StarField />
      <SparkleRings />

      {/* ── Theme toggle ─────────────────────────── */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 end-4 w-9 h-9 rounded-xl bg-njoum-card/70 backdrop-blur border border-njoum-border flex items-center justify-center text-njoum-muted hover:text-primary transition-all z-20"
        title={isDark ? 'الوضع النهاري' : 'الوضع الليلي'}
      >
        {isDark ? (
          /* Sun */
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
            <line x1="4.22" y1="4.22" x2="7.05" y2="7.05"/><line x1="16.95" y1="16.95" x2="19.78" y2="19.78"/>
            <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
          </svg>
        ) : (
          /* Moon */
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        )}
      </button>

      {/* ── Glass card ───────────────────────────── */}
      <div className="relative z-10 w-full max-w-sm mx-auto px-4 animate-fade-up">
        <div
          className="rounded-3xl border border-njoum-border bg-njoum-card/80 backdrop-blur-xl shadow-dark-card overflow-hidden"
          style={{
            boxShadow: isDark
              ? '0 24px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)'
              : '0 20px 60px rgba(181,88,106,0.12), 0 4px 16px rgba(0,0,0,0.06)',
          }}
        >
          {/* Top gradient stripe */}
          <div className="h-1 w-full gradient-bg" />

          <div className="px-8 py-10 text-center">
            {/* ── Logo ─────────────────────────────── */}
            <div className="flex justify-center mb-6">
              <div
                className="w-20 h-20 rounded-2xl gradient-bg logo-star flex items-center justify-center shadow-glow"
                style={{ transform: 'rotate(-5deg)' }}
              >
                <span className="text-white text-4xl" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                  ★
                </span>
              </div>
            </div>

            {/* ── Headline ─────────────────────────── */}
            <h1 className="text-3xl font-bold gradient-text mb-1">نجوم</h1>
            <p className="text-njoum-muted text-sm mb-1">لوحة التحكم</p>
            <div className="flex items-center justify-center gap-1.5 mb-8">
              {['✦', '★', '✦'].map((s, i) => (
                <span key={i} className="text-xs text-primary/40">{s}</span>
              ))}
            </div>

            {/* ── Error banners ────────────────────── */}
            {(errorParam === 'unauthorized' || errorParam === 'not_admin') && (
              <div className="bg-red-500/10 border border-red-500/25 text-red-400 rounded-xl px-4 py-3 mb-5 text-sm">
                ليس لديكِ صلاحية الوصول إلى لوحة التحكم. تواصلي مع المسؤولة.
              </div>
            )}
            {errorParam === 'oauth_error' && (
              <div className="bg-red-500/10 border border-red-500/25 text-red-400 rounded-xl px-4 py-3 mb-5 text-sm">
                حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.
              </div>
            )}

            {/* ── Sign in button ───────────────────── */}
            <button
              onClick={signInWithGoogle}
              disabled={loading}
              className="w-full group relative overflow-hidden flex items-center justify-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-semibold border border-njoum-border bg-njoum-surface hover:border-primary/40 transition-all duration-300 disabled:opacity-60"
              style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
            >
              {/* Subtle shimmer on hover */}
              <div className="absolute inset-0 gradient-bg opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
              <GoogleIcon />
              <span className="text-njoum-text">
                {loading ? 'جارٍ تسجيل الدخول…' : 'الدخول بحساب Google'}
              </span>
            </button>

            {/* ── Footer note ──────────────────────── */}
            <p className="text-xs text-njoum-muted mt-6 leading-relaxed">
              هذه اللوحة مخصصة للمشرفين فقط.
              <br />
              إذا لم يكن لديكِ حساب مشرف، تواصلي مع المسؤولة.
            </p>
          </div>
        </div>

        {/* Bottom tagline */}
        <p className="text-center text-xs text-njoum-muted/50 mt-6">
          عندما يحلّ الظلام، انظري للأعلى — نحن هناك
        </p>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Page (Suspense boundary for useSearchParams)
   ────────────────────────────────────────────────────────── */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-njoum-bg">
          <div className="w-8 h-8 rounded-full gradient-bg animate-pulse" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
