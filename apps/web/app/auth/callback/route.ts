import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { resolveOrigin, buildUserUpsertPayload } from '@njoum/shared';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code  = searchParams.get('code');
  const error = searchParams.get('error');

  const origin = resolveOrigin(
    request.headers.get('x-forwarded-proto'),
    request.headers.get('x-forwarded-host'),
    request.nextUrl.protocol,
    request.nextUrl.host,
  );

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=oauth_error`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const supabase = createClient();
  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=oauth_error`);
  }

  // Ensure the user row exists in public.users.
  // The DB trigger (20260612000001) handles new sign-ups, but we upsert here
  // as a safety net for users created before the trigger was installed.
  // ignoreDuplicates: true → never overwrite an existing admin user's role.
  await supabaseAdmin.from('users').upsert(
    buildUserUpsertPayload(data.user.id, data.user.email, data.user.user_metadata),
    { onConflict: 'id', ignoreDuplicates: true }
  );

  return NextResponse.redirect(`${origin}/dashboard`);
}
