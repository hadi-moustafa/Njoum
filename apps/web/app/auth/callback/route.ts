import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code  = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDesc = searchParams.get('error_description');

  console.log('[auth/callback] origin:', origin);
  console.log('[auth/callback] code present:', !!code);

  if (error) {
    console.error('[auth/callback] OAuth error:', error, errorDesc);
    return NextResponse.redirect(`${origin}/login?error=oauth_error`);
  }

  if (code) {
    const supabase = createClient();
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    console.log('[auth/callback] exchange error:', exchangeError?.message ?? 'none');
    console.log('[auth/callback] user:', data?.user?.email ?? 'none');

    if (!exchangeError && data.user) {
      console.log('[auth/callback] → redirecting to /dashboard');
      return NextResponse.redirect(`${origin}/dashboard`);
    }

    console.error('[auth/callback] exchange failed, back to /login');
  }

  return NextResponse.redirect(`${origin}/login`);
}
