-- ============================================================
-- MTC Supabase Schema  (single source of truth)
-- Run this in Supabase SQL Editor to create all tables
-- ============================================================
-- IMPORTANT: All schema changes MUST be made here first, then
-- applied to Supabase. Never do ad-hoc ALTER TABLEs without
-- updating this file — it must always reflect the live schema.
-- ============================================================

-- ─── Profiles ───────────────────────────────────────────
-- Extends Supabase auth.users with app-specific fields
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role text not null default 'member' check (role in ('member', 'coach', 'admin')),
  status text not null default 'active' check (status in ('active', 'paused')),
  ntrp numeric(2,1) check (ntrp >= 1.0 and ntrp <= 7.0),
  skill_level text default 'intermediate' check (skill_level in ('beginner', 'intermediate', 'advanced', 'competitive')),
  skill_level_set boolean default false,
  membership_type text default 'adult' check (membership_type in ('adult', 'family', 'junior')),
  family_id uuid references families(id),
  member_since text,
  avatar text,
  created_at timestamptz default now()
);

-- ─── Families ─────────────────────────────────────────────
-- Groups family membership members under one account
create table if not exists families (
  id uuid default gen_random_uuid() primary key,
  primary_user_id uuid not null,  -- references profiles(id), added as FK after profiles exists
  name text not null,             -- e.g. "The Smith Family"
  created_at timestamptz default now()
);

-- ─── Family Members ───────────────────────────────────────
-- Sub-profiles under a family (Netflix-style switching)
create table if not exists family_members (
  id uuid default gen_random_uuid() primary key,
  family_id uuid not null references families(id) on delete cascade,
  name text not null,
  type text not null default 'adult' check (type in ('adult', 'junior')),
  skill_level text default 'intermediate' check (skill_level in ('beginner', 'intermediate', 'advanced', 'competitive')),
  skill_level_set boolean default false,
  avatar text default 'tennis-male-1',
  birth_year int,
  created_at timestamptz default now()
);

-- FK from families.primary_user_id → profiles (deferred to avoid circular dependency)
-- Applied after profiles table exists:
-- alter table families add constraint families_primary_user_fk foreign key (primary_user_id) references profiles(id) on delete cascade;

-- ─── Courts ─────────────────────────────────────────────
create table if not exists courts (
  id integer primary key,
  name text not null,
  floodlight boolean not null default false,
  status text not null default 'available' check (status in ('available', 'maintenance'))
);

-- ─── Bookings ───────────────────────────────────────────
create table if not exists bookings (
  id text primary key,
  court_id integer not null references courts(id),
  court_name text not null,
  date date not null,
  time text not null,
  user_id uuid not null references profiles(id),
  user_name text not null,
  booked_for text,              -- family member name if booked by a family profile
  guest_name text,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  type text not null default 'court' check (type in ('court', 'partner', 'program', 'lesson')),
  program_id text,
  match_type text check (match_type in ('singles', 'doubles')),
  duration integer check (duration >= 1 and duration <= 4),
  created_at timestamptz default now()
);

-- ─── Booking Participants ───────────────────────────────
create table if not exists booking_participants (
  id serial primary key,
  booking_id text not null references bookings(id) on delete cascade,
  participant_id uuid not null references profiles(id),
  participant_name text not null
);

-- ─── Events ─────────────────────────────────────────────
create table if not exists events (
  id text primary key,
  title text not null,
  date date not null,
  time text not null,
  location text not null,
  badge text not null default 'members' check (badge in ('free', 'members', 'paid')),
  price text not null,
  spots_total integer,
  spots_taken integer default 0,
  description text not null,
  type text not null check (type in ('social', 'match', 'roundrobin', 'lesson', 'tournament')),
  created_at timestamptz default now()
);

-- ─── Event Attendees ────────────────────────────────────
create table if not exists event_attendees (
  id serial primary key,
  event_id text not null references events(id) on delete cascade,
  user_name text not null,
  unique(event_id, user_name)
);

-- RLS: authenticated users can read all, but only manage their own RSVPs
alter table event_attendees enable row level security;
create policy "event_attendees_select" on event_attendees for select using (true);
create policy "event_attendees_insert" on event_attendees for insert
  with check (user_name = (select name from public.profiles where id = auth.uid()));
create policy "event_attendees_delete" on event_attendees for delete
  using (user_name = (select name from public.profiles where id = auth.uid()) or is_admin());

-- ─── Partners ───────────────────────────────────────────
create table if not exists partners (
  id text primary key,
  user_id uuid not null references profiles(id),
  name text not null,
  ntrp numeric(2,1) not null,
  skill_level text default 'intermediate' check (skill_level in ('beginner', 'intermediate', 'advanced', 'competitive')),
  availability text not null,
  match_type text not null check (match_type in ('singles', 'doubles', 'mixed', 'any')),
  date text not null,
  time text not null,
  avatar text,
  message text,
  status text not null default 'available' check (status in ('available', 'matched')),
  created_at timestamptz default now()
);

-- ─── Conversations ──────────────────────────────────────
create table if not exists conversations (
  id serial primary key,
  member_a uuid not null references profiles(id),
  member_b uuid not null references profiles(id),
  last_message text,
  last_timestamp timestamptz,
  unique(member_a, member_b)
);

-- ─── Messages ───────────────────────────────────────────
create table if not exists messages (
  id text primary key,
  conversation_id integer not null references conversations(id) on delete cascade,
  from_id uuid not null references profiles(id),
  from_name text not null,
  to_id uuid not null references profiles(id),
  to_name text not null,
  text text not null,
  timestamp timestamptz not null default now(),
  read boolean not null default false
);

-- ─── Announcements ──────────────────────────────────────
create table if not exists announcements (
  id text primary key,
  text text not null,
  type text not null default 'info' check (type in ('info', 'warning', 'urgent')),
  date date not null,
  created_at timestamptz default now()
);

-- ─── Announcement Dismissals ────────────────────────────
create table if not exists announcement_dismissals (
  id serial primary key,
  announcement_id text not null references announcements(id) on delete cascade,
  user_id uuid not null references profiles(id),
  unique(announcement_id, user_id)
);

-- ─── Notifications ──────────────────────────────────────
create table if not exists notifications (
  id text primary key,
  user_id uuid not null references profiles(id),
  type text not null check (type in ('booking', 'event', 'partner', 'message', 'program', 'announcement')),
  title text not null,
  body text not null,
  timestamp timestamptz not null default now(),
  read boolean not null default false
);

-- RLS: users can read/manage their own notifications, system can create
alter table notifications enable row level security;
create policy "notifications_select_own" on notifications for select
  using (user_id = auth.uid());
create policy "notifications_insert" on notifications for insert
  with check (user_id = auth.uid());
create policy "notifications_update_own" on notifications for update
  using (user_id = auth.uid());
create policy "notifications_delete_own" on notifications for delete
  using (user_id = auth.uid());

-- ─── Coaching Programs ──────────────────────────────────
create table if not exists coaching_programs (
  id text primary key,
  title text not null,
  type text not null check (type in ('clinic', 'camp')),
  coach_id uuid not null references profiles(id),
  coach_name text not null,
  description text not null,
  court_id integer not null references courts(id),
  court_name text not null,
  fee numeric(10,2) not null default 0,
  spots_total integer not null,
  status text not null default 'active' check (status in ('active', 'cancelled', 'completed')),
  created_at timestamptz default now()
);

-- ─── Program Sessions ───────────────────────────────────
create table if not exists program_sessions (
  id serial primary key,
  program_id text not null references coaching_programs(id) on delete cascade,
  date date not null,
  time text not null,
  duration integer not null -- minutes
);

-- ─── Program Enrollments ────────────────────────────────
create table if not exists program_enrollments (
  id serial primary key,
  program_id text not null references coaching_programs(id) on delete cascade,
  member_id uuid not null references profiles(id),
  enrolled_at timestamptz default now(),
  unique(program_id, member_id)
);

-- ─── Notification Preferences ───────────────────────────
create table if not exists notification_preferences (
  user_id uuid primary key references profiles(id) on delete cascade,
  bookings boolean not null default true,
  events boolean not null default true,
  partners boolean not null default true,
  messages boolean not null default true,
  programs boolean not null default true
);

-- ─── RLS Helper Functions ──────────────────────────────
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer set search_path = '';

create or replace function is_coach()
returns boolean as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'coach'
  );
$$ language sql security definer set search_path = '';

-- ─── Indexes ────────────────────────────────────────────
create index if not exists idx_bookings_user on bookings(user_id);
create index if not exists idx_bookings_date on bookings(date);
create index if not exists idx_bookings_court_date on bookings(court_id, date);
create index if not exists idx_messages_conversation on messages(conversation_id);
create index if not exists idx_notifications_user on notifications(user_id);
create index if not exists idx_notifications_user_read on notifications(user_id, read);
create index if not exists idx_partners_status on partners(status);
create index if not exists idx_program_enrollments_member on program_enrollments(member_id);

-- Prevent double-booking: only one confirmed booking per court/date/time
create unique index if not exists idx_bookings_no_double_booking
  on bookings(court_id, date, time) where status = 'confirmed';

-- Additional indexes for common queries
create index if not exists idx_events_date on events(date);
create index if not exists idx_conversations_members on conversations(member_a, member_b);
create index if not exists idx_messages_to_read on messages(to_id, read);
create index if not exists idx_booking_participants_user on booking_participants(participant_id);
create index if not exists idx_bookings_status on bookings(status);
create index if not exists idx_profiles_role on profiles(role);
create index if not exists idx_profiles_family on profiles(family_id);
create index if not exists idx_family_members_family on family_members(family_id);

-- Deferred FK for families.primary_user_id
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'families_primary_user_fk') then
    alter table families add constraint families_primary_user_fk foreign key (primary_user_id) references profiles(id) on delete cascade;
  end if;
end $$;

-- RLS for families
alter table families enable row level security;
create policy "families_select_own" on families for select using (primary_user_id = auth.uid());
create policy "families_insert_own" on families for insert with check (primary_user_id = auth.uid());
create policy "families_update_own" on families for update using (primary_user_id = auth.uid());
create policy "families_delete_own" on families for delete using (primary_user_id = auth.uid());

-- RLS for family_members
alter table family_members enable row level security;
create policy "family_members_select_own" on family_members for select
  using (family_id in (select id from families where primary_user_id = auth.uid()));
create policy "family_members_insert_own" on family_members for insert
  with check (family_id in (select id from families where primary_user_id = auth.uid()));
create policy "family_members_update_own" on family_members for update
  using (family_id in (select id from families where primary_user_id = auth.uid()));
create policy "family_members_delete_own" on family_members for delete
  using (family_id in (select id from families where primary_user_id = auth.uid()));

-- ─── Auto-create profile on signup ──────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role, skill_level, skill_level_set, membership_type, avatar, member_since)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'member'),
    coalesce(new.raw_user_meta_data->>'skill_level', 'intermediate'),
    coalesce((new.raw_user_meta_data->>'skill_level_set')::boolean, (new.raw_user_meta_data->>'skill_level' is not null)),
    coalesce(new.raw_user_meta_data->>'membership_type', 'adult'),
    'tennis-male-1',
    to_char(now(), 'YYYY-MM')
  );

  -- Create default notification preferences
  insert into public.notification_preferences (user_id)
  values (new.id);

  return new;
end;
$$ language plpgsql security definer set search_path = '';

-- Trigger: create profile when a new auth user signs up
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Club Settings (key-value) ────────────────────────────
create table if not exists club_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz default now(),
  updated_by uuid references profiles(id)
);

-- RLS: everyone can read, only admins can modify
alter table club_settings enable row level security;
create policy "club_settings_select" on club_settings for select using (true);
create policy "club_settings_admin_modify" on club_settings for insert with check (is_admin());
create policy "club_settings_admin_update" on club_settings for update using (is_admin());
create policy "club_settings_admin_delete" on club_settings for delete using (is_admin());

-- Seed default gate code
insert into club_settings (key, value) values ('gate_code', '1234') on conflict do nothing;

-- ─── Delete Member (Admin RPC) ────────────────────────────
create or replace function delete_member(target_user_id uuid)
returns void as $$
begin
  -- Verify caller is admin (SECURITY DEFINER bypasses RLS, so we must check explicitly)
  if not is_admin() then
    raise exception 'Unauthorized: admin only';
  end if;
  delete from auth.users where id = target_user_id;
end;
$$ language plpgsql security definer set search_path = '';

-- ─── Send Welcome Message (Signup RPC) ────────────────────
create or replace function send_welcome_message(new_user_id uuid, new_user_name text)
returns void as $$
declare
  v_admin_id uuid;
  v_gate_code text;
  v_conv_id integer;
  v_msg text;
begin
  -- Find first admin
  select id into v_admin_id from public.profiles where role = 'admin' limit 1;
  if v_admin_id is null then return; end if;

  -- Get gate code
  select value into v_gate_code from public.club_settings where key = 'gate_code';

  -- Build message
  v_msg := 'Welcome to Mono Tennis Club, ' || split_part(new_user_name, ' ', 1) || '!';
  if v_gate_code is not null then
    v_msg := v_msg || E'\n\nYour court gate code is: ' || v_gate_code || E'\n\nPlease keep this code confidential.';
  end if;
  v_msg := v_msg || ' See you on the court!';

  -- Create conversation
  insert into public.conversations (member_a, member_b, last_message, last_timestamp)
  values (v_admin_id, new_user_id, v_msg, now())
  returning id into v_conv_id;

  -- Insert message
  insert into public.messages (id, conversation_id, from_id, from_name, to_id, to_name, text, timestamp, read)
  values (
    'welcome-' || new_user_id::text,
    v_conv_id,
    v_admin_id,
    'Mono Tennis Club',
    new_user_id,
    new_user_name,
    v_msg,
    now(),
    false
  );
end;
$$ language plpgsql security definer set search_path = '';

-- ─── Avatar Storage Bucket ──────────────────────────────
-- Create via Supabase dashboard or migration:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
-- RLS policies for avatar bucket:
-- CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
-- CREATE POLICY "Avatars are public" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
-- CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
-- CREATE POLICY "Users can delete own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ─── Realtime (enable on key tables) ────────────────────
alter table bookings replica identity full;
alter table messages replica identity full;
alter table notifications replica identity full;
alter table announcements replica identity full;
alter table partners replica identity full;

-- Push notification subscriptions (for mobile PWA)
create table if not exists push_subscriptions (
  id serial primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now(),
  unique(user_id, endpoint)
);
