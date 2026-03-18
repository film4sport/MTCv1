import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardLayoutClient from './DashboardLayoutClient';
import { SESSION_COOKIE_NAME, createAdminClient, isSessionExpired } from '@/app/lib/session';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    redirect('/login');
  }

  const supabase = createAdminClient();
  const { data: session } = await supabase
    .from('sessions')
    .select('token, created_at')
    .eq('token', token)
    .single();

  if (!session || isSessionExpired(session.created_at)) {
    if (session) {
      await supabase.from('sessions').delete().eq('token', token);
    }
    redirect('/login');
  }

  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
