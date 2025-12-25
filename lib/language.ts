'use client';

/**
 * Language persistence utility
 * Stores language preference in localStorage and reads from URL params
 */

/**
 * Detect language from text content (simple heuristic)
 * Used by pipeline for server-side processing
 */
export function detectLanguage(text: string | null | undefined): 'en' | 'si' | 'ta' | 'unk' {
  if (!text) return 'unk';
  
  const lowerText = text.toLowerCase();
  
  // Sinhala Unicode range: U+0D80–U+0DFF
  const sinhalaRegex = /[\u0D80-\u0DFF]/;
  // Tamil Unicode range: U+0B80–U+0BFF
  const tamilRegex = /[\u0B80-\u0BFF]/;
  
  if (sinhalaRegex.test(lowerText)) return 'si';
  if (tamilRegex.test(lowerText)) return 'ta';
  
  // Default to English if no Sinhala/Tamil detected
  return 'en';
}

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
