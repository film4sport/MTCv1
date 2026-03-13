-- ============================================================
-- Migration: PIN-Based Auth Refactor
-- Date: 2026-03-13
-- Description: Replace Supabase Auth with email + 6-digit PIN
--   - Add PIN columns to profiles
--   - Create sessions table
--   - Drop all RLS policies (API routes handle access control)
--   - Remove auth.users FK from profiles
--   - Remove handle_new_user trigger
--   - Update delete_member RPC
-- ============================================================

-- ─── 1. Add PIN columns to profiles ─────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pin_hash text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pin_reset_code text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pin_reset_expires timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pin_attempts integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pin_locked_until timestamptz;

-- ─── 2. Remove auth.users FK from profiles ──────────────
-- profiles.id will keep existing UUIDs but no longer reference auth.users
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_pkey CASCADE;
ALTER TABLE profiles ADD PRIMARY KEY (id);
-- The CASCADE above may have dropped child FKs — re-add them
-- (All child tables reference profiles(id) — they need the FK back)

-- Re-add FKs that reference profiles(id)
-- bookings.user_id
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookings_user_id_fkey') THEN
    ALTER TABLE bookings ADD CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- booking_participants.participant_id
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'booking_participants_participant_id_fkey') THEN
    ALTER TABLE booking_participants ADD CONSTRAINT booking_participants_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- partners.user_id
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'partners_user_id_fkey') THEN
    ALTER TABLE partners ADD CONSTRAINT partners_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- partners.matched_by
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'partners_matched_by_fkey') THEN
    ALTER TABLE partners ADD CONSTRAINT partners_matched_by_fkey FOREIGN KEY (matched_by) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- conversations.member_a, conversations.member_b
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'conversations_member_a_fkey') THEN
    ALTER TABLE conversations ADD CONSTRAINT conversations_member_a_fkey FOREIGN KEY (member_a) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'conversations_member_b_fkey') THEN
    ALTER TABLE conversations ADD CONSTRAINT conversations_member_b_fkey FOREIGN KEY (member_b) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- messages.from_id, messages.to_id
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_from_id_fkey') THEN
    ALTER TABLE messages ADD CONSTRAINT messages_from_id_fkey FOREIGN KEY (from_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_to_id_fkey') THEN
    ALTER TABLE messages ADD CONSTRAINT messages_to_id_fkey FOREIGN KEY (to_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- notifications.user_id
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_user_id_fkey') THEN
    ALTER TABLE notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- coaching_programs.coach_id
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'coaching_programs_coach_id_fkey') THEN
    ALTER TABLE coaching_programs ADD CONSTRAINT coaching_programs_coach_id_fkey FOREIGN KEY (coach_id) REFERENCES profiles(id);
  END IF;
END $$;

-- program_enrollments.member_id
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'program_enrollments_member_id_fkey') THEN
    ALTER TABLE program_enrollments ADD CONSTRAINT program_enrollments_member_id_fkey FOREIGN KEY (member_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- notification_preferences.user_id
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notification_preferences_user_id_fkey') THEN
    ALTER TABLE notification_preferences ADD CONSTRAINT notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- families.primary_user_id (re-add the deferred FK)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'families_primary_user_fk') THEN
    ALTER TABLE families ADD CONSTRAINT families_primary_user_fk FOREIGN KEY (primary_user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- club_settings.updated_by
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'club_settings_updated_by_fkey') THEN
    ALTER TABLE club_settings ADD CONSTRAINT club_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- court_blocks.created_by
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'court_blocks_created_by_fkey') THEN
    ALTER TABLE court_blocks ADD CONSTRAINT court_blocks_created_by_fkey FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- email_logs.recipient_user_id
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'email_logs_recipient_user_id_fkey') THEN
    ALTER TABLE email_logs ADD CONSTRAINT email_logs_recipient_user_id_fkey FOREIGN KEY (recipient_user_id) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- push_subscriptions.user_id
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'push_subscriptions_user_id_fkey') THEN
    ALTER TABLE push_subscriptions ADD CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- match_lineups.created_by
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'match_lineups_created_by_fkey') THEN
    ALTER TABLE match_lineups ADD CONSTRAINT match_lineups_created_by_fkey FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- lineup_entries.member_id
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lineup_entries_member_id_fkey') THEN
    ALTER TABLE lineup_entries ADD CONSTRAINT lineup_entries_member_id_fkey FOREIGN KEY (member_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ─── 3. Create sessions table ───────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  token text PRIMARY KEY DEFAULT 'sess-' || gen_random_uuid()::text,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  last_used timestamptz DEFAULT now(),
  user_agent text,
  ip_address text
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_last_used ON sessions(last_used);

-- Add sessions to realtime publication
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE sessions; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── 4. Drop ALL RLS policies ───────────────────────────
-- API routes handle all access control now

-- bookings
DROP POLICY IF EXISTS "bookings_select" ON bookings;
DROP POLICY IF EXISTS "bookings_insert_own" ON bookings;
DROP POLICY IF EXISTS "bookings_update_own" ON bookings;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;

-- event_attendees
DROP POLICY IF EXISTS "event_attendees_select" ON event_attendees;
DROP POLICY IF EXISTS "event_attendees_insert" ON event_attendees;
DROP POLICY IF EXISTS "event_attendees_delete" ON event_attendees;
ALTER TABLE event_attendees DISABLE ROW LEVEL SECURITY;

-- conversations
DROP POLICY IF EXISTS "conversations_select_own" ON conversations;
DROP POLICY IF EXISTS "conversations_insert_own" ON conversations;
DROP POLICY IF EXISTS "conversations_update_own" ON conversations;
DROP POLICY IF EXISTS "conversations_delete_own" ON conversations;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;

-- messages
DROP POLICY IF EXISTS "messages_select_own" ON messages;
DROP POLICY IF EXISTS "messages_insert_own" ON messages;
DROP POLICY IF EXISTS "messages_update_own" ON messages;
DROP POLICY IF EXISTS "messages_delete_own" ON messages;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- notifications
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- families
DROP POLICY IF EXISTS "families_select_own" ON families;
DROP POLICY IF EXISTS "families_insert_own" ON families;
DROP POLICY IF EXISTS "families_update_own" ON families;
DROP POLICY IF EXISTS "families_delete_own" ON families;
ALTER TABLE families DISABLE ROW LEVEL SECURITY;

-- family_members
DROP POLICY IF EXISTS "family_members_select_own" ON family_members;
DROP POLICY IF EXISTS "family_members_insert_own" ON family_members;
DROP POLICY IF EXISTS "family_members_update_own" ON family_members;
DROP POLICY IF EXISTS "family_members_delete_own" ON family_members;
ALTER TABLE family_members DISABLE ROW LEVEL SECURITY;

-- club_settings
DROP POLICY IF EXISTS "club_settings_select" ON club_settings;
DROP POLICY IF EXISTS "club_settings_admin_modify" ON club_settings;
DROP POLICY IF EXISTS "club_settings_admin_update" ON club_settings;
DROP POLICY IF EXISTS "club_settings_admin_delete" ON club_settings;
ALTER TABLE club_settings DISABLE ROW LEVEL SECURITY;

-- court_blocks
DROP POLICY IF EXISTS "court_blocks_select" ON court_blocks;
DROP POLICY IF EXISTS "court_blocks_admin_insert" ON court_blocks;
DROP POLICY IF EXISTS "court_blocks_admin_update" ON court_blocks;
DROP POLICY IF EXISTS "court_blocks_admin_delete" ON court_blocks;
ALTER TABLE court_blocks DISABLE ROW LEVEL SECURITY;

-- email_logs
DROP POLICY IF EXISTS "email_logs_admin_read" ON email_logs;
DROP POLICY IF EXISTS "email_logs_own_read" ON email_logs;
DROP POLICY IF EXISTS "email_logs_insert" ON email_logs;
ALTER TABLE email_logs DISABLE ROW LEVEL SECURITY;

-- error_logs
DROP POLICY IF EXISTS "error_logs_admin_read" ON error_logs;
DROP POLICY IF EXISTS "error_logs_insert" ON error_logs;
ALTER TABLE error_logs DISABLE ROW LEVEL SECURITY;

-- match_lineups
DROP POLICY IF EXISTS "lineups_admin_all" ON match_lineups;
DROP POLICY IF EXISTS "lineups_captain_select" ON match_lineups;
DROP POLICY IF EXISTS "lineups_captain_insert" ON match_lineups;
DROP POLICY IF EXISTS "lineups_captain_update" ON match_lineups;
DROP POLICY IF EXISTS "lineups_captain_delete" ON match_lineups;
ALTER TABLE match_lineups DISABLE ROW LEVEL SECURITY;

-- lineup_entries
DROP POLICY IF EXISTS "entries_admin_all" ON lineup_entries;
DROP POLICY IF EXISTS "entries_team_select" ON lineup_entries;
DROP POLICY IF EXISTS "entries_captain_insert" ON lineup_entries;
DROP POLICY IF EXISTS "entries_member_update" ON lineup_entries;
DROP POLICY IF EXISTS "entries_captain_delete" ON lineup_entries;
ALTER TABLE lineup_entries DISABLE ROW LEVEL SECURITY;

-- ─── 5. Remove handle_new_user trigger ──────────────────
-- Signup now handled by API routes, not auth.users trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- Keep the function for reference but it won't fire

-- ─── 6. Update delete_member RPC ────────────────────────
-- No longer deletes from auth.users — just deletes the profile (cascades to child tables)
CREATE OR REPLACE FUNCTION delete_member(target_user_id uuid)
RETURNS void AS $$
DECLARE
  uname text;
  fid uuid;
BEGIN
  -- Look up user name (for event_attendees) and family
  SELECT name INTO uname FROM public.profiles WHERE id = target_user_id;
  SELECT id INTO fid FROM public.families WHERE primary_user_id = target_user_id;

  -- Check for coaching programs
  IF EXISTS (SELECT 1 FROM public.coaching_programs WHERE coach_id = target_user_id) THEN
    RAISE EXCEPTION 'Cannot delete: user is a coach. Reassign their programs first.';
  END IF;

  -- event_attendees uses user_name, not user_id FK
  IF uname IS NOT NULL THEN
    DELETE FROM public.event_attendees WHERE user_name = uname;
  END IF;

  -- Family cleanup
  IF fid IS NOT NULL THEN
    DELETE FROM public.family_members WHERE family_id = fid;
  END IF;

  -- Delete sessions
  DELETE FROM public.sessions WHERE user_id = target_user_id;

  -- Delete the profile (cascades to bookings, messages, notifications, etc.)
  DELETE FROM public.profiles WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ─── 7. Update is_admin / is_coach (no auth.uid) ───────
-- These are now unused since RLS is disabled, but update them
-- to not reference auth.uid() in case anything calls them
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT false; -- RLS disabled; access control handled by API routes
$$ LANGUAGE sql SECURITY DEFINER SET search_path = '';

CREATE OR REPLACE FUNCTION is_coach()
RETURNS boolean AS $$
  SELECT false; -- RLS disabled; access control handled by API routes
$$ LANGUAGE sql SECURITY DEFINER SET search_path = '';

-- ─── 8. Allow profiles.id to use gen_random_uuid() ──────
-- New users won't come from auth.users, so we need a default
ALTER TABLE profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- ─── DONE ────────────────────────────────────────────────
