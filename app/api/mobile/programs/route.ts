import { NextResponse } from 'next/server';
import { authenticateMobileRequest, getAdminClient } from '../auth-helper';

/** List all coaching programs with enrollment counts and user enrollment status */
export async function GET(request: Request) {
  const authResult = await authenticateMobileRequest(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const supabase = getAdminClient();
    const userId = authResult.id;

    // Fetch all programs
    const { data: programs, error } = await supabase
      .from('coaching_programs')
      .select('*')
      .order('title', { ascending: true });

    if (error) return NextResponse.json({ error: 'Failed to fetch programs' }, { status: 500 });

    // Fetch enrollment counts per program
    const { data: enrollments } = await supabase
      .from('program_enrollments')
      .select('program_id, member_id');

    const enrollmentsByProgram: Record<string, string[]> = {};
    (enrollments || []).forEach(e => {
      if (!enrollmentsByProgram[e.program_id]) enrollmentsByProgram[e.program_id] = [];
      enrollmentsByProgram[e.program_id].push(e.member_id);
    });

    const result = (programs || []).map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      coach: p.coach,
      schedule: p.schedule,
      spotsTotal: p.spots_total,
      spotsFilled: (enrollmentsByProgram[p.id] || []).length,
      price: p.price,
      level: p.level,
      enrolled: (enrollmentsByProgram[p.id] || []).includes(userId),
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

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
