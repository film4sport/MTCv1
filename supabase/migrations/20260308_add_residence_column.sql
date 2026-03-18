-- Add residence column to profiles (Mono vs Out of Town)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS residence TEXT DEFAULT 'mono' CHECK (residence IN ('mono', 'other'));

-- Update handle_new_user trigger to include residence from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, skill_level, skill_level_set, membership_type, residence, avatar, member_since)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'member'),
    coalesce(new.raw_user_meta_data->>'skill_level', 'intermediate'),
    coalesce((new.raw_user_meta_data->>'skill_level_set')::boolean, (new.raw_user_meta_data->>'skill_level' IS NOT NULL)),
    coalesce(new.raw_user_meta_data->>'membership_type', 'adult'),
    coalesce(new.raw_user_meta_data->>'residence', 'mono'),
    'tennis-male-1',
    to_char(now(), 'YYYY-MM')
  );

  -- Create default notification preferences
  INSERT INTO public.notification_preferences (user_id)
  VALUES (new.id);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
