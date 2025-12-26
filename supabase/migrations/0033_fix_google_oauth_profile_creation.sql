-- Migration: Fix Google OAuth profile creation and add avatar_url support
-- This migration fixes the handle_new_user function to properly extract Google OAuth metadata
-- and adds avatar_url column to store Google profile pictures

-- Add avatar_url column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create index for avatar_url
CREATE INDEX IF NOT EXISTS profiles_avatar_url_idx 
ON public.profiles(avatar_url) WHERE avatar_url IS NOT NULL;

-- Update handle_new_user function to properly extract Google OAuth metadata
-- Google OAuth provides: full_name, email, picture (not name)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, language, city, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      SPLIT_PART(COALESCE(NEW.email, 'user@example.com'), '@', 1),
      'User'
    ),
    COALESCE(NEW.raw_user_meta_data->>'language', 'en'),
    COALESCE(NEW.raw_user_meta_data->>'city', 'Colombo'),
    COALESCE(
      NEW.raw_user_meta_data->>'picture',
      NEW.raw_user_meta_data->>'avatar_url',
      NULL
    )
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = COALESCE(EXCLUDED.email, profiles.email),
    name = COALESCE(
      EXCLUDED.name,
      profiles.name
    ),
    avatar_url = COALESCE(
      EXCLUDED.avatar_url,
      profiles.avatar_url
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment on the function
COMMENT ON FUNCTION public.handle_new_user() IS 
'Automatically creates or updates user profile when a new user signs up via OAuth. 
Extracts full_name, email, picture from Google OAuth metadata. 
Handles returning users gracefully with ON CONFLICT.';

