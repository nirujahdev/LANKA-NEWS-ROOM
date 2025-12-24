'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabaseClient';
import SignInPrompt from './SignInPrompt';

interface SignInPromptManagerProps {
  children: React.ReactNode;
}

const SignInPromptManager: React.FC<SignInPromptManagerProps> = ({ children }) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();

  // Public pages where prompt can show
  const publicPages = ['/', '/recent', '/sri-lanka', '/politics', '/economy', '/sports', '/technology', '/health'];

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Only show on public pages
    if (!publicPages.includes(pathname)) {
      return;
    }

    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (error) {
      // Silently fail during build or if Supabase is not configured
      return;
    }

    // Check if user is already signed in
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
        return;
      }
    }).catch(() => {
      // Silently fail during build or if Supabase is not configured
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setShowPrompt(false);
      }
    });

    // Check if prompt was dismissed
    const dismissedUntil = localStorage.getItem('signin_prompt_dismissed_until');
    if (dismissedUntil) {
      const dismissedDate = new Date(dismissedUntil);
      if (dismissedDate > new Date()) {
        return () => subscription.unsubscribe();
      } else {
        localStorage.removeItem('signin_prompt_dismissed_until');
      }
    }

    // Show prompt after 60 seconds if user is not signed in
    const timer = setTimeout(() => {
      if (!user) {
        setShowPrompt(true);
      }
    }, 60000);

    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [user, pathname]);

  const handleClose = () => {
    setShowPrompt(false);
    // Store dismissal for 24 hours
    const dismissedUntil = new Date();
    dismissedUntil.setHours(dismissedUntil.getHours() + 24);
    localStorage.setItem('signin_prompt_dismissed_until', dismissedUntil.toISOString());
  };

  return (
    <>
      {children}
      {showPrompt && !user && publicPages.includes(pathname) && <SignInPrompt onClose={handleClose} />}
    </>
  );
};

export default SignInPromptManager;

