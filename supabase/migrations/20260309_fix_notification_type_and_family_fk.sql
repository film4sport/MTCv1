-- Fix 1: Add 'announcement' to notification type constraint (was missing, 'info' was being used but not valid)
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('booking', 'event', 'partner', 'message', 'program', 'announcement'));

-- Fix 2: Make families FK on profiles SET NULL on delete (was RESTRICT, blocking profile deletion)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_family_id_fkey;
ALTER TABLE profiles ADD CONSTRAINT profiles_family_id_fkey
  FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE SET NULL;
