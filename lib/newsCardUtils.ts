// Shared utilities for news card components

export type NewsCardData = {
  id: string;
  slug?: string | null;
  headline: string;
  summary?: string | null;
  sources: Array<{ name: string; feed_url: string }>;
  updatedAt?: string | null;
  sourceCount: number;
  language?: 'en' | 'si' | 'ta';
  imageUrl?: string | null;
  category?: string | null;
  topics?: string[];
};

export function formatTimeAgo(iso?: string | null): string {
  if (!iso) return 'Just now';
  const date = new Date(iso);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} min ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  }
  const days = Math.floor(diffInSeconds / 86400);
  return `${days} days ago`;
}

export function getTopicTags(data: NewsCardData): string[] {
  if (data.topics && data.topics.length > 0) {
    return data.topics.slice(0, 2);
  }
  if (data.category) {
    return [data.category];
  }
  return [];
}

export function getTopicLabel(topic: string, language: 'en' | 'si' | 'ta' = 'en'): string {
  const topicMap: Record<string, { en: string; si: string; ta: string }> = {
    'politics': { en: 'Politics', si: 'දේශපාලනය', ta: 'அரசியல்' },
    'economy': { en: 'Economy', si: 'ආර්ථිකය', ta: 'பொருளாதாரம்' },
    'sports': { en: 'Sports', si: 'ක්‍රීඩා', ta: 'விளையாட்டு' },
    'technology': { en: 'Technology', si: 'තාක්ෂණය', ta: 'தொழில்நுட்பம்' },
    'health': { en: 'Health', si: 'සෞඛ්‍ය', ta: 'சுகாதாரம்' },
    'education': { en: 'Education', si: 'අධ්‍යාපනය', ta: 'கல்வி' },
    'crime': { en: 'Crime', si: 'අපරාධ', ta: 'குற்றம்' },
    'environment': { en: 'Environment', si: 'පරිසරය', ta: 'சுற்றுச்சூழல்' },
    'culture': { en: 'Culture', si: 'සංස්කෘතිය', ta: 'கலாச்சாரம்' },
    'society': { en: 'Society', si: 'සමාජය', ta: 'சமூகம்' },
    'sri-lanka': { en: 'Sri Lanka', si: 'ශ්‍රී ලංකාව', ta: 'இலங்கை' },
    'world': { en: 'World', si: 'ලෝකය', ta: 'உலகம்' },
    'other': { en: 'Other', si: 'වෙනත්', ta: 'மற்ற' }
  };

  const topicLower = topic.toLowerCase();
  const mapped = topicMap[topicLower] || { en: topic, si: topic, ta: topic };
  
  if (language === 'si') return mapped.si;
  if (language === 'ta') return mapped.ta;
  return mapped.en;
}

export function getImageUrl(data: NewsCardData): string {
  if (data.imageUrl && data.imageUrl.startsWith('http')) {
    try {
      new URL(data.imageUrl);
      return data.imageUrl;
    } catch {
      // Invalid URL, use fallback
    }
  }
  const lowerHeadline = data.headline.toLowerCase();
  if (lowerHeadline.includes('power') || lowerHeadline.includes('electricity') || lowerHeadline.includes('outage')) {
    return 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800&q=80';
  } else if (lowerHeadline.includes('economic') || lowerHeadline.includes('policy') || lowerHeadline.includes('government')) {
    return 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80';
  } else if (lowerHeadline.includes('dengue') || lowerHeadline.includes('health') || lowerHeadline.includes('outbreak')) {
    return 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80';
  } else if (lowerHeadline.includes('sports') || lowerHeadline.includes('match')) {
    return 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80';
  } else if (lowerHeadline.includes('technology') || lowerHeadline.includes('tech')) {
    return 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80';
  }
  return 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80';
}

import { normalizeTopicSlug } from './topics';

export function getStoryUrl(lang: 'en' | 'si' | 'ta', slug: string | null | undefined, id: string, topic?: string | null): string {
  if (!slug) {
    // Fallback to old route if no slug (shouldn't happen in production)
    return `/incident/${id}`;
  }
  
  // New format: /{lang}/{topic}/{slug}
  const normalizedTopic = topic 
    ? (normalizeTopicSlug(topic) || 'other')
    : 'other';
  
  return `/${lang}/${normalizedTopic}/${slug}`;
}

