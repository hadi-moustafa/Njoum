// ============================================================
// Admin login — Google OAuth via Supabase
// Only admin roles can proceed past this screen.
// ============================================================
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const [loading, setLoading] = useState(false);

  async function signInWithGoogle() {
    setLoading(true);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback`;
    console.log('[Login] redirectTo:', redirectTo);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options:  { redirectTo },
    });
    console.log('[Login] OAuth URL:', data?.url ?? 'none');
    console.log('[Login] error:', error?.message ?? 'none');
    if (error) setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-njoum-bg">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-sm text-center">
        {/* Logo */}
        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
          <span className="text-white text-2xl font-bold">★</span>
        </div>
        <h1 className="text-2xl font-bold text-njoum-text mb-1">نجوم</h1>
        <p className="text-sm text-njoum-muted mb-8">لوحة التحكم — للمشرفين فقط</p>

        {(searchParams.error === 'unauthorized' || searchParams.error === 'not_admin') && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">
            ليس لديكِ صلاحية الوصول إلى لوحة التحكم. تواصلي مع المسؤولة لمنحكِ دور المشرف.
          </div>
        )}

        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 border border-njoum-border rounded-xl px-4 py-3 text-sm font-semibold text-njoum-text hover:bg-njoum-bg transition disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          {loading ? 'جارٍ تسجيل الدخول…' : 'الدخول بحساب Google'}
        </button>

        <p className="text-xs text-njoum-muted mt-6">
          هذه اللوحة مخصصة للمشرفين فقط.<br />
          إذا لم يكن لديكِ حساب مشرف، تواصلي مع المسؤولة.
        </p>
      </div>
    </div>
  );
}
