/**
 * URL generation utilities
 * Ensures consistent URL structure across the application
 */

export function getStoryUrl(lang: 'en' | 'si' | 'ta', slug: string | null | undefined): string {
  if (!slug) return `/${lang}`;
  return `/${lang}/story/${slug}`;
}

import { normalizeTopicSlug } from './topics';

export function getTopicUrl(lang: 'en' | 'si' | 'ta', topic: string): string {
  const normalizedTopic = normalizeTopicSlug(topic) || topic.toLowerCase().replace(/\s+/g, '-');
  return `/${lang}/topic/${normalizedTopic}`;
}

export function getHomeUrl(lang: 'en' | 'si' | 'ta'): string {
  return `/${lang}`;
}

export function getSearchUrl(lang: 'en' | 'si' | 'ta', query: string): string {
  return `/search?q=${encodeURIComponent(query)}&lang=${lang}`;
}

