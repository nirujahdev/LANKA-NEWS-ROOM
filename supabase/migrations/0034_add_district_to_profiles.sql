-- Migration: Add district field to profiles table
-- District allows better location-based news personalization

-- Add district column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS district TEXT;

-- Create index for district filtering
CREATE INDEX IF NOT EXISTS profiles_district_idx 
ON public.profiles(district) WHERE district IS NOT NULL;

-- Update handle_new_user function to include district
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, language, city, district, avatar_url)
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
    COALESCE(NEW.raw_user_meta_data->>'district', NULL),
    COALESCE(
      NEW.raw_user_meta_data->>'picture',
      NEW.raw_user_meta_data->>'avatar_url',
      NULL
    )
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = COALESCE(EXCLUDED.email, profiles.email),
    name = COALESCE(EXCLUDED.name, profiles.name),
    district = COALESCE(EXCLUDED.district, profiles.district),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment on district column
COMMENT ON COLUMN public.profiles.district IS 'District where user is located (one of 25 Sri Lankan districts)';


