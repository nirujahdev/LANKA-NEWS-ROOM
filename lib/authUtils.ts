/**
 * Authentication and Profile Management Utilities
 * 
 * Provides utilities for managing user profiles, checking onboarding status,
 * and handling Google OAuth metadata.
 */

import { getSupabaseClient } from './supabaseClient';

export interface UserMetadata {
  full_name?: string;
  name?: string;
  email?: string;
  picture?: string;
  avatar_url?: string;
  language?: string;
  city?: string;
  district?: string;
}

export interface ProfileData {
  id: string;
  email: string | null;
  name: string;
  language: 'en' | 'si' | 'ta';
  city: string;
  district: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface OnboardingStatus {
  isComplete: boolean;
  missingFields: string[];
  profile?: ProfileData;
  preferences?: {
    favourite_topics: string[];
  };
}

/**
 * Ensures a user profile exists, creating it if necessary
 * @param userId - The user's UUID
 * @param userMetadata - Optional user metadata from OAuth provider
 * @returns The profile data
 */
export async function ensureProfileExists(
  userId: string,
  userMetadata?: UserMetadata
): Promise<ProfileData> {
  const supabase = getSupabaseClient();

  // Try to fetch existing profile
  const { data: existingProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (existingProfile && !fetchError) {
    // Profile exists, update with Google metadata if provided and missing
    if (userMetadata) {
      const updates: Partial<ProfileData> = {};

      // Update name if missing or default
      if (
        (!existingProfile.name || existingProfile.name === 'User') &&
        (userMetadata.full_name || userMetadata.name)
      ) {
        updates.name = userMetadata.full_name || userMetadata.name || existingProfile.name;
      }

      // Update avatar if missing
      if (!existingProfile.avatar_url && (userMetadata.picture || userMetadata.avatar_url)) {
        updates.avatar_url = userMetadata.picture || userMetadata.avatar_url || null;
      }

      // Update email if missing
      if (!existingProfile.email && userMetadata.email) {
        updates.email = userMetadata.email;
      }

      // Only update if there are changes
      if (Object.keys(updates).length > 0) {
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', userId)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating profile:', updateError);
        } else if (updatedProfile) {
          return updatedProfile as ProfileData;
        }
      }
    }

    return existingProfile as ProfileData;
  }

  // Profile doesn't exist, create it
  // The database trigger should handle this, but we'll create it manually if needed
  const profileData = {
    id: userId,
    email: userMetadata?.email || null,
    name: userMetadata?.full_name || userMetadata?.name || 'User',
    language: (userMetadata?.language as 'en' | 'si' | 'ta') || 'en',
    city: userMetadata?.city || 'Colombo',
    district: userMetadata?.district || null,
    avatar_url: userMetadata?.picture || userMetadata?.avatar_url || null,
  };

  const { data: newProfile, error: createError } = await supabase
    .from('profiles')
    .insert(profileData)
    .select()
    .single();

  if (createError) {
    console.error('Error creating profile:', createError);
    throw new Error(`Failed to create profile: ${createError.message}`);
  }

  if (!newProfile) {
    throw new Error('Failed to create profile: No data returned');
  }

  return newProfile as ProfileData;
}

/**
 * Updates profile with Google OAuth metadata
 * @param userId - The user's UUID
 * @param userMetadata - User metadata from Google OAuth
 * @returns The updated profile data
 */
export async function updateProfileFromGoogle(
  userId: string,
  userMetadata: UserMetadata
): Promise<ProfileData> {
  const supabase = getSupabaseClient();

  const updates: Partial<ProfileData> = {};

  if (userMetadata.full_name || userMetadata.name) {
    updates.name = userMetadata.full_name || userMetadata.name || undefined;
  }

  if (userMetadata.picture || userMetadata.avatar_url) {
    updates.avatar_url = userMetadata.picture || userMetadata.avatar_url || null;
  }

  if (userMetadata.email) {
    updates.email = userMetadata.email;
  }

  if (Object.keys(updates).length === 0) {
    // No updates needed, fetch and return existing profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!profile) {
      throw new Error('Profile not found');
    }

    return profile as ProfileData;
  }

  const { data: updatedProfile, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile from Google:', error);
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  if (!updatedProfile) {
    throw new Error('Failed to update profile: No data returned');
  }

  return updatedProfile as ProfileData;
}

/**
 * Checks if user onboarding is complete
 * @param userId - The user's UUID
 * @returns Onboarding status with missing fields
 */
export async function checkOnboardingStatus(userId: string): Promise<OnboardingStatus> {
  const supabase = getSupabaseClient();

  const missingFields: string[] = [];

  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    return {
      isComplete: false,
      missingFields: ['profile'],
    };
  }

  // Check profile fields
  if (!profile.name || profile.name === 'User') {
    missingFields.push('name');
  }
  if (!profile.language) {
    missingFields.push('language');
  }
  if (!profile.district) {
    missingFields.push('district');
  }

  // Fetch preferences
  const { data: preferences, error: prefsError } = await supabase
    .from('user_preferences')
    .select('favourite_topics')
    .eq('user_id', userId)
    .single();

  if (prefsError || !preferences) {
    missingFields.push('preferences');
  } else if (!preferences.favourite_topics || preferences.favourite_topics.length !== 3) {
    missingFields.push('favourite_topics');
  }

  return {
    isComplete: missingFields.length === 0,
    missingFields,
    profile: profile as ProfileData,
    preferences: preferences ? { favourite_topics: preferences.favourite_topics } : undefined,
  };
}

/**
 * Fetches user profile with error handling
 * @param userId - The user's UUID
 * @returns The profile data or null if not found
 */
export async function getUserProfile(userId: string): Promise<ProfileData | null> {
  const supabase = getSupabaseClient();

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Profile not found
      return null;
    }
    console.error('Error fetching user profile:', error);
    throw new Error(`Failed to fetch profile: ${error.message}`);
  }

  return profile as ProfileData | null;
}

/**
 * Extracts user metadata from Supabase user object
 * @param user - Supabase user object
 * @returns Extracted metadata
 */
export function extractUserMetadata(user: any): UserMetadata {
  return {
    full_name: user.user_metadata?.full_name || user.user_metadata?.name,
    name: user.user_metadata?.name || user.user_metadata?.full_name,
    email: user.email,
    picture: user.user_metadata?.picture || user.user_metadata?.avatar_url,
    avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture,
    language: user.user_metadata?.language,
    city: user.user_metadata?.city,
  };
}

