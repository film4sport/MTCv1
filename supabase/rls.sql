-- ============================================================
-- MTC Row Level Security Policies
-- Run this AFTER schema.sql in Supabase SQL Editor
-- ============================================================

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table courts enable row level security;
alter table bookings enable row level security;
alter table booking_participants enable row level security;
alter table events enable row level security;
alter table event_attendees enable row level security;
alter table partners enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table announcements enable row level security;
alter table announcement_dismissals enable row level security;
alter table notifications enable row level security;
-- payments and payment_entries tables removed from UI (e-transfer only)
alter table coaching_programs enable row level security;
alter table program_sessions enable row level security;
alter table program_enrollments enable row level security;
alter table notification_preferences enable row level security;

-- ─── Helper: check if user is admin ─────────────────────
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer;

-- ─── Helper: check if user is coach ─────────────────────
create or replace function is_coach()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'coach'
  );
$$ language sql security definer;

-- ─── Profiles ───────────────────────────────────────────
create policy "Profiles: read by authenticated" on profiles
  for select to authenticated using (true);
create policy "Profiles: update own" on profiles
  for update to authenticated using (id = auth.uid());
create policy "Profiles: admin full access" on profiles
  for all to authenticated using (is_admin());

-- ─── Courts ─────────────────────────────────────────────
create policy "Courts: read by authenticated" on courts
  for select to authenticated using (true);
create policy "Courts: admin manage" on courts
  for all to authenticated using (is_admin());

-- ─── Bookings ───────────────────────────────────────────
create policy "Bookings: read by authenticated" on bookings
  for select to authenticated using (true);
create policy "Bookings: create own" on bookings
  for insert to authenticated with check (user_id = auth.uid());
create policy "Bookings: update own" on bookings
  for update to authenticated using (user_id = auth.uid());
create policy "Bookings: admin full access" on bookings
  for all to authenticated using (is_admin());
-- Coaches can create program and lesson bookings
create policy "Bookings: coach create program/lesson" on bookings
  for insert to authenticated with check (is_coach() and type in ('program', 'lesson'));
-- Coaches can update own bookings (for cancellation)
create policy "Bookings: coach update own" on bookings
  for update to authenticated using (is_coach() and user_id = auth.uid());

-- ─── Booking Participants ───────────────────────────────
create policy "Booking participants: read by authenticated" on booking_participants
  for select to authenticated using (true);
create policy "Booking participants: manage by booking owner" on booking_participants
  for all to authenticated using (
    exists (select 1 from bookings where bookings.id = booking_id and bookings.user_id = auth.uid())
  );

-- ─── Events ─────────────────────────────────────────────
create policy "Events: read by authenticated" on events
  for select to authenticated using (true);
create policy "Events: admin manage" on events
  for all to authenticated using (is_admin());

-- ─── Event Attendees ────────────────────────────────────
create policy "Event attendees: read by authenticated" on event_attendees
  for select to authenticated using (true);
create policy "Event attendees: insert own" on event_attendees
  for insert to authenticated with check (
    user_name = (select name from profiles where id = auth.uid())
  );
create policy "Event attendees: delete own" on event_attendees
  for delete to authenticated using (
    user_name = (select name from profiles where id = auth.uid())
  );
create policy "Event attendees: admin manage" on event_attendees
  for all to authenticated using (is_admin());

-- ─── Partners ───────────────────────────────────────────
create policy "Partners: read by authenticated" on partners
  for select to authenticated using (true);
create policy "Partners: create own" on partners
  for insert to authenticated with check (user_id = auth.uid());
create policy "Partners: update own" on partners
  for update to authenticated using (user_id = auth.uid());
create policy "Partners: delete own" on partners
  for delete to authenticated using (user_id = auth.uid());

-- ─── Conversations ──────────────────────────────────────
create policy "Conversations: read own" on conversations
  for select to authenticated using (member_a = auth.uid() or member_b = auth.uid());
create policy "Conversations: create own" on conversations
  for insert to authenticated with check (member_a = auth.uid() or member_b = auth.uid());
create policy "Conversations: update own" on conversations
  for update to authenticated using (member_a = auth.uid() or member_b = auth.uid());

-- ─── Messages ───────────────────────────────────────────
create policy "Messages: read own" on messages
  for select to authenticated using (from_id = auth.uid() or to_id = auth.uid());
create policy "Messages: create own" on messages
  for insert to authenticated with check (from_id = auth.uid());
create policy "Messages: update read status" on messages
  for update to authenticated using (to_id = auth.uid());

-- ─── Announcements ──────────────────────────────────────
create policy "Announcements: read by authenticated" on announcements
  for select to authenticated using (true);
create policy "Announcements: admin manage" on announcements
  for all to authenticated using (is_admin());

-- ─── Announcement Dismissals ────────────────────────────
create policy "Announcement dismissals: read own" on announcement_dismissals
  for select to authenticated using (user_id = auth.uid());
create policy "Announcement dismissals: create own" on announcement_dismissals
  for insert to authenticated with check (user_id = auth.uid());

-- ─── Notifications ──────────────────────────────────────
create policy "Notifications: read own" on notifications
  for select to authenticated using (user_id = auth.uid());
create policy "Notifications: create" on notifications
  for insert to authenticated with check (true);
create policy "Notifications: update own" on notifications
  for update to authenticated using (user_id = auth.uid());
create policy "Notifications: delete own" on notifications
  for delete to authenticated using (user_id = auth.uid());

-- ─── Payments / Payment Entries ────────────────────────────
-- Removed: payments are e-transfers managed outside the app.
-- Tables kept in DB for data preservation but no RLS policies needed.

-- ─── Coaching Programs ──────────────────────────────────
create policy "Programs: read by authenticated" on coaching_programs
  for select to authenticated using (true);
create policy "Programs: coach manage own" on coaching_programs
  for all to authenticated using (coach_id = auth.uid());
create policy "Programs: admin full access" on coaching_programs
  for all to authenticated using (is_admin());

-- ─── Program Sessions ───────────────────────────────────
create policy "Program sessions: read by authenticated" on program_sessions
  for select to authenticated using (true);
create policy "Program sessions: coach manage" on program_sessions
  for all to authenticated using (
    exists (select 1 from coaching_programs where coaching_programs.id = program_id and coaching_programs.coach_id = auth.uid())
  );

-- ─── Program Enrollments ────────────────────────────────
create policy "Program enrollments: read by authenticated" on program_enrollments
  for select to authenticated using (true);
create policy "Program enrollments: enroll self" on program_enrollments
  for insert to authenticated with check (member_id = auth.uid());
create policy "Program enrollments: withdraw self" on program_enrollments
  for delete to authenticated using (member_id = auth.uid());

-- ─── Notification Preferences ───────────────────────────
create policy "Notification prefs: read own" on notification_preferences
  for select to authenticated using (user_id = auth.uid());
create policy "Notification prefs: update own" on notification_preferences
  for update to authenticated using (user_id = auth.uid());
create policy "Notification prefs: insert own" on notification_preferences
  for insert to authenticated with check (user_id = auth.uid());

-- ─── Club Settings ────────────────────────────────────────
alter table club_settings enable row level security;
create policy "Club settings: read by authenticated" on club_settings
  for select to authenticated using (true);
create policy "Club settings: admin manage" on club_settings
  for all to authenticated using (is_admin());
