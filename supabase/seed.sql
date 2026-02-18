-- ============================================================
-- MTC Seed Data
-- Run AFTER schema.sql and rls.sql
-- NOTE: Demo users must be created first via Supabase Auth
-- (Dashboard > Authentication > Users > Add user)
--
-- Create these 3 users with email+password:
--   1. member@mtc.ca / member123
--   2. coach@mtc.ca  / coach123
--   3. admin@mtc.ca  / admin123
--
-- After creating them, copy their UUIDs into the variables below.
-- ============================================================

-- Replace these with the actual UUIDs from Supabase Auth
-- After creating users, run: select id, email from auth.users;
do $$
declare
  v_alex uuid;
  v_mark uuid;
  v_admin uuid;
begin
  -- Look up the auth user IDs by email
  select id into v_alex from auth.users where email = 'member@mtc.ca';
  select id into v_mark from auth.users where email = 'coach@mtc.ca';
  select id into v_admin from auth.users where email = 'admin@mtc.ca';

  -- If the trigger already created profiles, update them
  update profiles set name = 'Alex Thompson', role = 'member', ntrp = 3.5, member_since = '2025-03' where id = v_alex;
  update profiles set name = 'Mark Taylor', role = 'coach', ntrp = 5.0, member_since = '2023-01' where id = v_mark;
  update profiles set name = 'Admin', role = 'admin', member_since = '2023-01' where id = v_admin;

  -- ─── Courts ───────────────────────────────────────────
  insert into courts (id, name, floodlight, status, current_user_name, ends_at)
  values
    (1, 'Court 1', true, 'available', null, null),
    (2, 'Court 2', true, 'available', null, null),
    (3, 'Court 3', false, 'available', null, null),
    (4, 'Court 4', false, 'available', null, null)
  on conflict (id) do nothing;

  -- ─── Events ───────────────────────────────────────────
  insert into events (id, title, date, time, location, badge, price, spots_total, spots_taken, description, type)
  values
    ('opening-day-bbq', 'Opening Day BBQ & Meet the Pros', '2026-05-09', '1:00 PM - 3:00 PM', 'All Courts & Clubhouse', 'free', 'Free', null, null, 'Kick off the 2026 season! BBQ, music, and meet our coaching staff.', 'social'),
    ('mens-round-robin', 'Men''s Round Robin', '2026-05-12', '9:00 AM - 11:00 AM', 'Courts 1-2', 'members', 'Members', null, null, 'Weekly men''s round robin every Tuesday morning. All skill levels welcome.', 'roundrobin'),
    ('freedom-55', 'Freedom 55 League', '2026-05-14', '9:00 AM - 11:00 AM', 'Courts 1-2', 'members', 'Members', null, null, 'Thursday morning league for the 55+ crowd. Fun and social tennis.', 'roundrobin'),
    ('interclub-league', 'Interclub Competitive League', '2026-05-14', '7:00 PM - 9:30 PM', 'Courts 1-2', 'members', 'Team Only', null, null, 'A & B teams interclub competitive league. RSVP required.', 'match'),
    ('ladies-round-robin', 'Ladies Round Robin', '2026-05-15', '9:00 AM - 11:00 AM', 'Courts 1-2', 'members', 'Members', null, null, 'Weekly ladies round robin every Friday morning. All skill levels welcome.', 'roundrobin'),
    ('friday-mixed', 'Friday Night Mixed Round Robin', '2026-05-15', '6:00 PM - 9:00 PM', 'All Courts', 'members', 'Members', null, null, 'Mixed doubles round robin every Friday evening. Rotating partners, fun format!', 'roundrobin'),
    ('mixed-doubles-tournament', '95+ Mixed Doubles Tournament', '2026-07-26', 'All Day', 'All Courts', 'members', 'Members', 32, 16, '95+ combined age mixed doubles tournament. Day 1 of 2 (continues July 27).', 'tournament'),
    ('summer-camp', 'Summer Tennis Camp', '2026-07-28', '8:30 AM - 3:30 PM', 'Courts 1-4', 'paid', 'See Details', 30, 12, '5-day summer tennis camp (Jul 28 - Aug 1). Instruction, drills, and match play for all ages.', 'lesson')
  on conflict (id) do nothing;

  -- ─── Announcements ────────────────────────────────────
  insert into announcements (id, text, type, date)
  values
    ('a1', 'Courts 3-4 resurfacing completed! Now open for booking.', 'info', '2026-02-01'),
    ('a2', 'Spring membership registration opens March 1st.', 'info', '2026-02-05')
  on conflict (id) do nothing;

  -- ─── Coaching Programs ────────────────────────────────
  insert into coaching_programs (id, title, type, coach_id, coach_name, description, court_id, court_name, fee, spots_total, status)
  values
    ('prog-clinic-1', 'Beginner Group Clinic', 'clinic', v_mark, 'Mark Taylor', 'A 4-week beginner clinic covering grips, strokes, footwork, and match play basics.', 3, 'Court 3', 120, 8, 'active'),
    ('prog-camp-1', 'Junior Summer Camp Week 1', 'camp', v_mark, 'Mark Taylor', '5-day intensive camp for juniors aged 8-14. Daily drills, match play, fitness, and fun activities.', 1, 'Court 1', 250, 12, 'active')
  on conflict (id) do nothing;

  -- Program sessions
  insert into program_sessions (program_id, date, time, duration)
  values
    ('prog-clinic-1', '2026-03-01', '10:00 AM', 90),
    ('prog-clinic-1', '2026-03-08', '10:00 AM', 90),
    ('prog-clinic-1', '2026-03-15', '10:00 AM', 90),
    ('prog-clinic-1', '2026-03-22', '10:00 AM', 90),
    ('prog-camp-1', '2026-07-06', '9:30 AM', 180),
    ('prog-camp-1', '2026-07-07', '9:30 AM', 180),
    ('prog-camp-1', '2026-07-08', '9:30 AM', 180),
    ('prog-camp-1', '2026-07-09', '9:30 AM', 180),
    ('prog-camp-1', '2026-07-10', '9:30 AM', 180);

end;
$$;
