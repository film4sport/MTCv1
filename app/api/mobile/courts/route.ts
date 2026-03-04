import { NextResponse } from 'next/server';
import { authenticateMobileRequest, getAdminClient } from '../auth-helper';

/** Fetch all courts with current status (available/maintenance) */
export async function GET(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const supabase = getAdminClient();
    const { data: courts, error } = await supabase
      .from('courts')
      .select('*')
      .order('id');

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch courts' }, { status: 500 });
    }

    const result = (courts || []).map(c => ({
      id: c.id,
      name: c.name,
      floodlight: c.floodlight,
      status: c.status,
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** Toggle court maintenance status (admin only) */
export async function PATCH(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;
  if (authResult.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  try {
    const { courtId, status } = await request.json();
    if (!courtId || !['available', 'maintenance'].includes(status)) {
      return NextResponse.json({ error: 'Invalid courtId or status' }, { status: 400 });
    }

    const supabase = getAdminClient();
    const { error } = await supabase.from('courts').update({ status }).eq('id', courtId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
