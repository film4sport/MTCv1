-- Migration: Add partner matching columns
-- These columns track who matched a partner request and when.

ALTER TABLE partners ADD COLUMN IF NOT EXISTS matched_by uuid REFERENCES profiles(id);
ALTER TABLE partners ADD COLUMN IF NOT EXISTS matched_at timestamptz;
