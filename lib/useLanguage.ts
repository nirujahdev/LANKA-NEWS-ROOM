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
  // DO NOT auto-update URLs - only update when user explicitly calls setLanguage()
  useEffect(() => {
    if (isLoading) return;

    // Priority 1: User profile language (if authenticated and no manual override)
    // Only check localStorage on client side to avoid hydration issues
    if (typeof window !== 'undefined' && userLanguage && !localStorage.getItem('preferredLanguage')) {
      setCurrentLanguageState(userLanguage);
      localStorage.setItem('preferredLanguage', userLanguage);
      // DO NOT auto-update URL - let user navigate manually
      return;
    }

    // Priority 2: localStorage preference (session) - only on client
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('preferredLanguage') as 'en' | 'si' | 'ta' | null;
      if (stored && ['en', 'si', 'ta'].includes(stored)) {
        // DO NOT auto-update URL - only update state to match localStorage
        // URL will be updated when user explicitly calls setLanguage()
        setCurrentLanguageState(stored);
        return;
      }

      // Priority 3: URL param (only if no preference exists)
      const pathLang = getLangFromPath(pathname);
      if (pathLang) {
        setCurrentLanguageState(pathLang);
        localStorage.setItem('preferredLanguage', pathLang);
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
  }, [pathname, userLanguage, isLoading, currentLanguage]);

  // Change language (user action)
  const setLanguage = useCallback(async (lang: 'en' | 'si' | 'ta') => {
    // Update state
    setCurrentLanguageState(lang);
    
    // Update localStorage
    localStorage.setItem('preferredLanguage', lang);

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

    // Update URL to reflect language change
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

