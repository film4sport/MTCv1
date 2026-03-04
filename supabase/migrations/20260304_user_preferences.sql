-- Migration: Add preferences JSONB column to profiles
-- Stores misc user preferences: onboarding, court prefs, privacy, active profile, etc.
-- This avoids adding many individual columns for UI preferences.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{}';
