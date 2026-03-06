-- Migration: Add ON DELETE CASCADE/SET NULL to profile FK references
-- This ensures deleting a user via auth.users cleanly cascades to all child tables.
-- Previously, many tables blocked deletion due to missing cascade rules.

-- bookings.user_id → CASCADE
alter table bookings drop constraint if exists bookings_user_id_fkey;
alter table bookings add constraint bookings_user_id_fkey
  foreign key (user_id) references profiles(id) on delete cascade;

-- booking_participants.participant_id → CASCADE
alter table booking_participants drop constraint if exists booking_participants_participant_id_fkey;
alter table booking_participants add constraint booking_participants_participant_id_fkey
  foreign key (participant_id) references profiles(id) on delete cascade;

-- partners.user_id → CASCADE
alter table partners drop constraint if exists partners_user_id_fkey;
alter table partners add constraint partners_user_id_fkey
  foreign key (user_id) references profiles(id) on delete cascade;

-- partners.matched_by → SET NULL (nullable)
alter table partners drop constraint if exists partners_matched_by_fkey;
alter table partners add constraint partners_matched_by_fkey
  foreign key (matched_by) references profiles(id) on delete set null;

-- conversations.member_a → CASCADE
alter table conversations drop constraint if exists conversations_member_a_fkey;
alter table conversations add constraint conversations_member_a_fkey
  foreign key (member_a) references profiles(id) on delete cascade;

-- conversations.member_b → CASCADE
alter table conversations drop constraint if exists conversations_member_b_fkey;
alter table conversations add constraint conversations_member_b_fkey
  foreign key (member_b) references profiles(id) on delete cascade;

-- messages.from_id → CASCADE
alter table messages drop constraint if exists messages_from_id_fkey;
alter table messages add constraint messages_from_id_fkey
  foreign key (from_id) references profiles(id) on delete cascade;

-- messages.to_id → CASCADE
alter table messages drop constraint if exists messages_to_id_fkey;
alter table messages add constraint messages_to_id_fkey
  foreign key (to_id) references profiles(id) on delete cascade;

-- announcement_dismissals.user_id → CASCADE
alter table announcement_dismissals drop constraint if exists announcement_dismissals_user_id_fkey;
alter table announcement_dismissals add constraint announcement_dismissals_user_id_fkey
  foreign key (user_id) references profiles(id) on delete cascade;

-- notifications.user_id → CASCADE
alter table notifications drop constraint if exists notifications_user_id_fkey;
alter table notifications add constraint notifications_user_id_fkey
  foreign key (user_id) references profiles(id) on delete cascade;

-- program_enrollments.member_id → CASCADE
alter table program_enrollments drop constraint if exists program_enrollments_member_id_fkey;
alter table program_enrollments add constraint program_enrollments_member_id_fkey
  foreign key (member_id) references profiles(id) on delete cascade;

-- club_settings.updated_by → SET NULL (nullable)
alter table club_settings drop constraint if exists club_settings_updated_by_fkey;
alter table club_settings add constraint club_settings_updated_by_fkey
  foreign key (updated_by) references profiles(id) on delete set null;

-- match_lineups.created_by → CASCADE
alter table match_lineups drop constraint if exists match_lineups_created_by_fkey;
alter table match_lineups add constraint match_lineups_created_by_fkey
  foreign key (created_by) references profiles(id) on delete cascade;

-- lineup_entries.member_id → CASCADE
alter table lineup_entries drop constraint if exists lineup_entries_member_id_fkey;
alter table lineup_entries add constraint lineup_entries_member_id_fkey
  foreign key (member_id) references profiles(id) on delete cascade;

-- Update delete_member function to handle edge cases
create or replace function delete_member(target_user_id uuid)
returns void as $$
declare
  uname text;
  fid uuid;
begin
  if not is_admin() then
    raise exception 'Unauthorized: admin only';
  end if;

  select name into uname from public.profiles where id = target_user_id;
  select id into fid from public.families where primary_user_id = target_user_id;

  -- coaching_programs.coach_id has no cascade — admin must reassign first
  if exists (select 1 from public.coaching_programs where coach_id = target_user_id) then
    raise exception 'Cannot delete: user is a coach. Reassign their programs first.';
  end if;

  -- event_attendees uses user_name, not a FK to profiles
  if uname is not null then
    delete from public.event_attendees where user_name = uname;
  end if;

  -- Family cleanup
  if fid is not null then
    delete from public.family_members where family_id = fid;
  end if;

  -- Everything else cascades from auth.users → profiles → child tables
  delete from auth.users where id = target_user_id;
end;
$$ language plpgsql security definer set search_path = '';
