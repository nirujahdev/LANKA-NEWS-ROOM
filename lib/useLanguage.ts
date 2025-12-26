'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabaseClient';

/**
 * Language hook for session persistence
 * 
 * Priority:
 * 1. User profile language (if authenticated)
 * 2. localStorage preference (session)
 * 3. URL param (if navigating to specific language)
 * 4. Default to 'en'
 * 
 * Language only changes when user manually changes it
 */
export function useLanguage(initialLang?: 'en' | 'si' | 'ta') {
  const router = useRouter();
  const pathname = usePathname();
  const [currentLanguage, setCurrentLanguageState] = useState<'en' | 'si' | 'ta'>(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('preferredLanguage') as 'en' | 'si' | 'ta' | null;
      if (stored && ['en', 'si', 'ta'].includes(stored)) {
        return stored;
      }
    }
    return initialLang || 'en';
  });
  const [isLoading, setIsLoading] = useState(true);
  const [userLanguage, setUserLanguage] = useState<'en' | 'si' | 'ta' | null>(null);

  // Extract language from URL path (e.g., /en/topic/politics -> 'en')
  const getLangFromPath = useCallback((path: string): 'en' | 'si' | 'ta' | null => {
    const match = path.match(/^\/(en|si|ta)(\/|$)/);
    return match ? (match[1] as 'en' | 'si' | 'ta') : null;
  }, []);

  // Load user profile language if authenticated
  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function loadUserLanguage() {
      try {
        // Only try to load user language if Supabase is configured
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseAnonKey) {
          // Supabase not configured, skip user language loading
          if (!cancelled) {
            setIsLoading(false);
          }
          return;
        }

        const supabase = getSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (cancelled) return;

        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('language')
            .eq('id', session.user.id)
            .single();

          if (cancelled) return;

          if (profile?.language && ['en', 'si', 'ta'].includes(profile.language)) {
            setUserLanguage(profile.language as 'en' | 'si' | 'ta');
            // If user has a language preference, use it
            if (!localStorage.getItem('preferredLanguage')) {
              setCurrentLanguageState(profile.language as 'en' | 'si' | 'ta');
              localStorage.setItem('preferredLanguage', profile.language);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load user language:', error);
        // Don't throw - continue with default language
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadUserLanguage();

    return () => {
      cancelled = true;
    };
  }, []);

  // Determine current language based on priority
  // URL is the source of truth - always sync with URL first
  useEffect(() => {
    if (isLoading) return;

    if (typeof window !== 'undefined') {
      // Priority 1: URL path (source of truth)
      const pathLang = getLangFromPath(pathname);
      if (pathLang) {
        // URL has language - use it and sync localStorage
        if (currentLanguage !== pathLang) {
          setCurrentLanguageState(pathLang);
          localStorage.setItem('preferredLanguage', pathLang);
        }
        return;
      }

      // Priority 2: User profile language (if authenticated and no URL language)
      if (userLanguage && !pathLang) {
        setCurrentLanguageState(userLanguage);
        localStorage.setItem('preferredLanguage', userLanguage);
        // If we're on a language-aware route but URL doesn't match, redirect
        if (pathname.match(/^\/(en|si|ta)(\/|$)/)) {
          const newPath = pathname.replace(/^\/(en|si|ta)/, `/${userLanguage}`);
          router.push(newPath);
        }
        return;
      }

      // Priority 3: localStorage preference (only if no URL language)
      const stored = localStorage.getItem('preferredLanguage') as 'en' | 'si' | 'ta' | null;
      if (stored && ['en', 'si', 'ta'].includes(stored) && !pathLang) {
        // If we're on a language-aware route, redirect to match localStorage
        if (pathname.match(/^\/(en|si|ta)(\/|$)/)) {
          const newPath = pathname.replace(/^\/(en|si|ta)/, `/${stored}`);
          router.push(newPath);
        } else {
          setCurrentLanguageState(stored);
        }
        return;
      }

      // Priority 4: Default to 'en' - only set if we're on a language-aware route
      if (pathname.match(/^\/(en|si|ta)(\/|$)/)) {
        if (currentLanguage !== 'en') {
          setCurrentLanguageState('en');
          localStorage.setItem('preferredLanguage', 'en');
        }
      }
    }
  }, [pathname, userLanguage, isLoading, currentLanguage, getLangFromPath, router]);

  // Change language (user action)
  const setLanguage = useCallback(async (lang: 'en' | 'si' | 'ta') => {
    // Update localStorage first
    localStorage.setItem('preferredLanguage', lang);
    
    // Update state
    setCurrentLanguageState(lang);

    // Update user profile if authenticated (only if Supabase is configured)
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseAnonKey) {
        const supabase = getSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          await supabase
            .from('profiles')
            .update({ language: lang })
            .eq('id', session.user.id);
        }
      }
    } catch (error) {
      console.error('Failed to update user language:', error);
      // Don't throw - language change should still work even if profile update fails
    }

    // Update URL to reflect language change - this is the source of truth
    const pathLang = getLangFromPath(pathname);
    if (pathLang) {
      // Replace language in path
      const newPath = pathname.replace(/^\/(en|si|ta)/, `/${lang}`);
      router.push(newPath);
    } else {
      // No language in path, add it
      const newPath = `/${lang}${pathname === '/' ? '' : pathname}`;
      router.push(newPath);
    }
  }, [pathname, router, getLangFromPath]);

  return {
    language: currentLanguage,
    setLanguage,
    isLoading,
    userLanguage
  };
}

