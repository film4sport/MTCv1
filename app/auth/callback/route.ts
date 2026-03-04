import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { logEmail } from '../../api/lib/email-logger';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const type = searchParams.get('type'); // 'recovery', 'signup', etc.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.monotennisclub.com';

  if (!code) {
    // No code — redirect to login
    return NextResponse.redirect(`${siteUrl}/login`);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(`${siteUrl}/login?error=config`);
  }

  const redirectUrl = type === 'recovery'
    ? `${siteUrl}/login?reset=true`
    : `${siteUrl}/dashboard`;

  const response = NextResponse.redirect(redirectUrl);

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    // Code was invalid or expired — redirect to login with error
    return NextResponse.redirect(`${siteUrl}/login?error=expired_link`);
  }

  // ── Post-confirmation: welcome message + notification ──
  // Only for signup confirmations (not password recovery)
  if (type !== 'recovery' && data?.session?.user) {
    const user = data.session.user;
    const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'Member';

    // Use service role to bypass RLS for server-side operations
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const adminSupabase = serviceKey
      ? createClient(supabaseUrl, serviceKey)
      : createClient(supabaseUrl, supabaseAnonKey);

    // Run all post-confirmation tasks in parallel — one failure shouldn't block others
    const results = await Promise.allSettled([
      // Send welcome message (gate code + greeting via admin conversation)
      adminSupabase.rpc('send_welcome_message', {
        new_user_id: user.id,
        new_user_name: userName,
      }),
      // Create a welcome notification (shows in the bell icon)
      adminSupabase.from('notifications').insert({
        id: `welcome-notif-${user.id}`,
        user_id: user.id,
        type: 'message',
        title: 'Welcome to Mono Tennis Club!',
        body: 'Your email has been confirmed. Check your messages for your court gate code.',
        timestamp: new Date().toISOString(),
        read: false,
      }),
      // Log the confirmed email to email_logs
      logEmail({
        type: 'signup_confirmation',
        recipientEmail: user.email,
        recipientUserId: user.id,
        status: 'sent',
        subject: 'Email Confirmed — Mono Tennis Club',
        metadata: { source: 'auth_callback', userName },
      }),
    ]);

    // Log any failures (non-critical — don't block redirect)
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        const labels = ['welcome_message', 'notification', 'email_log'];
        console.error(`[MTC] Post-confirmation ${labels[i]} failed:`, r.reason);
      }
    });
  }

  return response;
}
