import { NextResponse } from 'next/server';
import { authenticateMobileRequest, getAdminClient } from '../auth-helper';

/** Enroll or withdraw from a coaching program */
export async function POST(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { programId, action } = await request.json();
    if (!programId || !['enroll', 'withdraw'].includes(action)) {
      return NextResponse.json({ error: 'Missing programId or invalid action' }, { status: 400 });
    }

    const supabase = getAdminClient();
    const memberId = authResult.id;

    if (action === 'enroll') {
      // Check if already enrolled
      const { data: existing } = await supabase
        .from('program_enrollments')
        .select('id')
        .eq('program_id', programId)
        .eq('member_id', memberId)
        .single();

      if (existing) {
        return NextResponse.json({ error: 'Already enrolled' }, { status: 409 });
      }

      // Check spot availability
      const { data: program } = await supabase
        .from('coaching_programs')
        .select('spots_total')
        .eq('id', programId)
        .single();

      if (program) {
        const { count } = await supabase
          .from('program_enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('program_id', programId);

        if (count !== null && program.spots_total && count >= program.spots_total) {
          return NextResponse.json({ error: 'Program is full' }, { status: 409 });
        }
      }

      const { error } = await supabase.from('program_enrollments').insert({
        program_id: programId,
        member_id: memberId,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      return NextResponse.json({ success: true, action: 'enrolled' });
    } else {
      // Withdraw
      const { error } = await supabase.from('program_enrollments')
        .delete()
        .eq('program_id', programId)
        .eq('member_id', memberId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      return NextResponse.json({ success: true, action: 'withdrawn' });
    }
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
