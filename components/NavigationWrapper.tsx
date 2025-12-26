'use client';

import Navigation from './Navigation';
import { useLanguage } from '@/lib/useLanguage';

interface NavigationWrapperProps {
  currentLanguage: 'en' | 'si' | 'ta';
}

export default function NavigationWrapper({ currentLanguage }: NavigationWrapperProps) {
  // Use the language from URL (passed as prop) as initial value
  // The hook will sync with URL, but we pass the prop to ensure consistency
  const { language, setLanguage } = useLanguage(currentLanguage);
  
  // Always use the language from the hook, which should match the URL
  // But if there's a mismatch, prefer the prop (which comes from URL)
  const displayLanguage = currentLanguage || language;
  
  return <Navigation currentLanguage={displayLanguage} onLanguageChange={setLanguage} />;
}

