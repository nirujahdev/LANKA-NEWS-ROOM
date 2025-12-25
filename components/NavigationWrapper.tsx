'use client';

import Navigation from './Navigation';
import { useRouter, useSearchParams } from 'next/navigation';

interface NavigationWrapperProps {
  currentLanguage: 'en' | 'si' | 'ta';
}

export default function NavigationWrapper({ currentLanguage }: NavigationWrapperProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Handle language change by updating URL query parameter
  const handleLanguageChange = (lang: 'en' | 'si' | 'ta') => {
    const currentPath = window.location.pathname;
    const params = new URLSearchParams(searchParams.toString());
    
    if (lang === 'en') {
      params.delete('lang');
    } else {
      params.set('lang', lang);
    }
    
    const newUrl = params.toString() 
      ? `${currentPath}?${params.toString()}`
      : currentPath;
    
    router.push(newUrl);
  };
  
  return <Navigation currentLanguage={currentLanguage} onLanguageChange={handleLanguageChange} />;
}

