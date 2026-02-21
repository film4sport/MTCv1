-- Migration: Clean up stale payment references and sync notification constraint
-- Date: 2026-02-21
-- Context: Payments tab removed from admin, payment notification type replaced with program

-- 1. Fix notifications type constraint: replace 'payment' with 'program'
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('booking', 'event', 'partner', 'message', 'program', 'announcement'));

-- 2. Drop stale payments column from notification_preferences
ALTER TABLE notification_preferences DROP COLUMN IF EXISTS payments;

-- 3. Migrate any existing 'payment' notifications to 'program' (if any exist)
UPDATE notifications SET type = 'program' WHERE type = 'payment';
