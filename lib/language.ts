'use client';

/**
 * Language persistence utility
 * Stores language preference in localStorage and reads from URL params
 */

export function getLanguageFromURL(): 'en' | 'si' | 'ta' {
  if (typeof window === 'undefined') return 'en';
  
  const params = new URLSearchParams(window.location.search);
  const lang = params.get('lang') as 'en' | 'si' | 'ta' | null;
  
  if (lang && ['en', 'si', 'ta'].includes(lang)) {
    // Save to localStorage
    localStorage.setItem('preferredLanguage', lang);
    return lang;
  }
  
  // Check localStorage
  const stored = localStorage.getItem('preferredLanguage') as 'en' | 'si' | 'ta' | null;
  if (stored && ['en', 'si', 'ta'].includes(stored)) {
    return stored;
  }
  
  return 'en';
}

export function setLanguage(lang: 'en' | 'si' | 'ta') {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem('preferredLanguage', lang);
  
  // Update URL without reload
  const currentPath = window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  
  if (lang === 'en') {
    params.delete('lang');
  } else {
    params.set('lang', lang);
  }
  
  const newUrl = params.toString() 
    ? `${currentPath}?${params.toString()}`
    : currentPath;
  
  window.history.replaceState({}, '', newUrl);
}
