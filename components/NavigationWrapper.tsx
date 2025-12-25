'use client';

import Navigation from './Navigation';
import { useLanguage } from '@/lib/useLanguage';

interface NavigationWrapperProps {
  currentLanguage: 'en' | 'si' | 'ta';
}

export default function NavigationWrapper({ currentLanguage }: NavigationWrapperProps) {
  const { language, setLanguage } = useLanguage(currentLanguage);
  
  return <Navigation currentLanguage={language} onLanguageChange={setLanguage} />;
}

