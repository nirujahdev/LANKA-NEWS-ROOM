/**
 * URL generation utilities
 * Ensures consistent URL structure across the application
 */

import { normalizeTopicSlug } from './topics';

/**
 * Get the first non-"other" topic from a topics array or single topic
 * Falls back to "other" only if no valid topic is found
 */
function getPrimaryTopic(topic?: string | null, topics?: string[] | null): string {
  // First try to get a non-"other" topic from topics array
  if (topics && Array.isArray(topics) && topics.length > 0) {
    const nonOtherTopic = topics.find(t => {
      const normalized = normalizeTopicSlug(t);
      return normalized && normalized !== 'other';
    });
    if (nonOtherTopic) {
      const normalized = normalizeTopicSlug(nonOtherTopic);
      if (normalized && normalized !== 'other') {
        return normalized;
      }
    }
  }
  
  // Fallback to single topic if it's not "other"
  if (topic) {
    const normalized = normalizeTopicSlug(topic);
    if (normalized && normalized !== 'other') {
      return normalized;
    }
  }
  
  // Last resort: use "other"
  return 'other';
}

export function getStoryUrl(lang: 'en' | 'si' | 'ta', slug: string | null | undefined, topic?: string | null, topics?: string[] | null): string {
  if (!slug) return `/${lang}`;
  
  // New format: /{lang}/{topic}/{slug}
  // Prefer first non-"other" topic from topics array
  const normalizedTopic = getPrimaryTopic(topic, topics);
  
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

