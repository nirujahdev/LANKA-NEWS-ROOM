'use client';

import Navigation from './Navigation';

interface NavigationWrapperProps {
  currentLanguage: 'en' | 'si' | 'ta';
}

export default function NavigationWrapper({ currentLanguage }: NavigationWrapperProps) {
  return <Navigation currentLanguage={currentLanguage} onLanguageChange={() => {}} />;
}

