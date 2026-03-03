import { NextResponse } from 'next/server';
import { authenticateMobileRequest, getAdminClient } from '../auth-helper';

export async function GET(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const supabase = getAdminClient();

    const { data: partners, error } = await supabase
      .from('partners')
      .select('*')
      .eq('status', 'available')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch partners' }, { status: 500 });
    }

    // Build response in camelCase matching mobile PWA shape
    const result = (partners || []).map(p => ({
      id: p.id,
      userId: p.user_id,
      name: p.name,
      ntrp: p.ntrp,
      skillLevel: p.skill_level,
      availability: p.availability,
      matchType: p.match_type,
      date: p.date,
      time: p.time,
      avatar: p.avatar,
      message: p.message,
      status: p.status,
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
