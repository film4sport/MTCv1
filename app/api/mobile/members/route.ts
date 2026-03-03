import { NextResponse } from 'next/server';
import { authenticateMobileRequest, getAdminClient } from '../auth-helper';

export async function GET(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const supabase = getAdminClient();
    const isAdmin = authResult.role === 'admin';

    // Always select all fields — filter email in response based on role
    const { data: members, error } = await supabase
      .from('profiles')
      .select('id, name, email, role, ntrp, skill_level, avatar, member_since, status')
      .eq('status', 'active')
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
    }

    // Build response in camelCase — only admins see emails
    const result = (members || []).map(m => ({
      id: m.id,
      name: m.name,
      ...(isAdmin ? { email: m.email } : {}),
      role: m.role,
      ntrp: m.ntrp,
      skillLevel: m.skill_level,
      avatar: m.avatar,
      memberSince: m.member_since,
      status: m.status,
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
