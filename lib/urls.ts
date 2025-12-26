/**
 * URL generation utilities
 * Ensures consistent URL structure across the application
 */

import { normalizeTopicSlug } from './topics';

export function getStoryUrl(lang: 'en' | 'si' | 'ta', slug: string | null | undefined, topic?: string | null): string {
  if (!slug) return `/${lang}`;
  
  // New format: /{lang}/{topic}/{slug}
  const normalizedTopic = topic 
    ? (normalizeTopicSlug(topic) || 'other')
    : 'other';
  
  return `/${lang}/${normalizedTopic}/${slug}`;
}

export function getTopicUrl(lang: 'en' | 'si' | 'ta', topic: string): string {
  const normalizedTopic = normalizeTopicSlug(topic) || topic.toLowerCase().replace(/\s+/g, '-');
  // New format: /{lang}/{topic} (removed /topic/ segment)
  return `/${lang}/${normalizedTopic}`;
}

export function getHomeUrl(lang: 'en' | 'si' | 'ta'): string {
  return `/${lang}`;
}

export function getSearchUrl(lang: 'en' | 'si' | 'ta', query: string): string {
  return `/search?q=${encodeURIComponent(query)}&lang=${lang}`;
}

