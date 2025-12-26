import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ensureProfileExists, checkOnboardingStatus, extractUserMetadata } from '@/lib/authUtils';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const errorParam = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // Handle OAuth errors
  if (errorParam) {
    console.error('OAuth error:', errorParam, errorDescription);
    return NextResponse.redirect(
      new URL(`/auth/error?error=${encodeURIComponent(errorParam)}&message=${encodeURIComponent(errorDescription || 'Authentication failed')}`, requestUrl.origin)
    );
  }

  if (!code) {
    console.error('No OAuth code provided');
    return NextResponse.redirect(
      new URL('/auth/error?error=no_code&message=No authentication code provided', requestUrl.origin)
    );
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Exchange code for session
    const { data: sessionData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError);
      return NextResponse.redirect(
        new URL(`/auth/error?error=exchange_failed&message=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin)
      );
    }

    if (!sessionData?.user) {
      console.error('No user in session data');
      return NextResponse.redirect(
        new URL('/auth/error?error=no_user&message=No user data received', requestUrl.origin)
      );
    }

    const user = sessionData.user;
    const userMetadata = extractUserMetadata(user);

    // Ensure profile exists with retry logic
    let profile;
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelays = [500, 1000, 2000]; // Exponential backoff

    while (retryCount < maxRetries) {
      try {
        // Wait for database trigger to create profile (if new user)
        if (retryCount > 0) {
          await new Promise(resolve => setTimeout(resolve, retryDelays[retryCount - 1]));
        } else {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        profile = await ensureProfileExists(user.id, userMetadata);
        break; // Success, exit retry loop
      } catch (error) {
        retryCount++;
        console.warn(`Profile creation attempt ${retryCount} failed:`, error);
        
        if (retryCount >= maxRetries) {
          console.error('Failed to create/ensure profile after retries:', error);
          // Try to continue anyway - profile might exist
          try {
            const { data: existingProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();
            
            if (existingProfile) {
              profile = existingProfile;
              break;
            }
          } catch (fetchError) {
            console.error('Failed to fetch existing profile:', fetchError);
          }
          
          // If we still don't have a profile, redirect to error page
          if (!profile) {
            return NextResponse.redirect(
              new URL('/auth/error?error=profile_creation_failed&message=Failed to create user profile', requestUrl.origin)
            );
          }
        }
      }
    }

    // Update profile with Google metadata if missing
    if (profile && (userMetadata.picture || userMetadata.full_name)) {
      try {
        const updates: any = {};
        
        if (userMetadata.picture && !profile.avatar_url) {
          updates.avatar_url = userMetadata.picture;
        }
        
        if (userMetadata.full_name && (!profile.name || profile.name === 'User')) {
          updates.name = userMetadata.full_name;
        }

        if (Object.keys(updates).length > 0) {
          await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id);
        }
      } catch (updateError) {
        console.warn('Failed to update profile with Google metadata:', updateError);
        // Non-critical, continue
      }
    }

    // Check onboarding status
    const onboardingStatus = await checkOnboardingStatus(user.id);

    if (!onboardingStatus.isComplete) {
      return NextResponse.redirect(new URL('/onboarding', requestUrl.origin));
    }

    // Onboarding complete, redirect to home
    return NextResponse.redirect(new URL('/', requestUrl.origin));
  } catch (error) {
    console.error('Unexpected error in auth callback:', error);
    return NextResponse.redirect(
      new URL(`/auth/error?error=unexpected&message=${encodeURIComponent(error instanceof Error ? error.message : 'An unexpected error occurred')}`, requestUrl.origin)
    );
  }
}

