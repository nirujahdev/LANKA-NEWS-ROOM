'use client';

import OpenAI from 'openai';
import { env } from './env';

/**
 * Language persistence utility
 * Stores language preference in localStorage and reads from URL params
 */

/**
 * Detect language from text content (simple heuristic)
 * Used by pipeline for server-side processing
 */
export function detectLanguageSimple(text: string | null | undefined): 'en' | 'si' | 'ta' | 'unk' {
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

/**
 * Detect language using AI with source metadata hint
 * More accurate than simple Unicode detection
 * @param text - Text content to analyze
 * @param sourceHint - Optional language hint from source metadata
 * @returns Detected language code
 */
export async function detectLanguage(
  text: string,
  sourceHint?: 'en' | 'si' | 'ta' | null
): Promise<'en' | 'si' | 'ta'> {
  // First try simple detection
  const simpleDetection = detectLanguageSimple(text);
  
  // If source hint matches simple detection, trust it
  if (sourceHint && simpleDetection !== 'unk' && sourceHint === simpleDetection) {
    return sourceHint;
  }
  
  // If simple detection is confident (not 'unk'), use it
  if (simpleDetection !== 'unk') {
    return simpleDetection;
  }
  
  // If source hint exists and simple detection is uncertain, trust the hint
  if (sourceHint && sourceHint !== 'unk') {
    return sourceHint;
  }
  
  // Fall back to AI detection for uncertain cases
  try {
    const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a language detection system. Identify if the text is in English (en), Sinhala (si), or Tamil (ta).
Return ONLY the language code: en, si, or ta.`
        },
        {
          role: 'user',
          content: `Detect language of this text:\n\n${text.slice(0, 500)}`
        }
      ],
      temperature: 0.1,
      max_tokens: 10
    });
    
    const detected = completion.choices[0]?.message?.content?.trim().toLowerCase();
    if (detected === 'en' || detected === 'si' || detected === 'ta') {
      return detected;
    }
  } catch (error) {
    console.error('AI language detection failed:', error);
  }
  
  // Final fallback: use source hint or default to English
  return sourceHint || 'en';
}

/**
 * Backward compatibility: export simple detection for client-side
 */
export { detectLanguageSimple as detectLanguageClient };

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
