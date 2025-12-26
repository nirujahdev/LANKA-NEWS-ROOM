// Shared topic constants and utilities

export const VALID_TOPICS = [
  'politics',
  'economy',
  'education',
  'health',
  'sports',
  'technology',
  'society',
  'sri-lanka',
  'world',
  'other'
] as const;

export type ValidTopic = typeof VALID_TOPICS[number];

export const TOPIC_LABELS = {
  en: {
    politics: 'Politics',
    economy: 'Economy',
    education: 'Education',
    health: 'Health',
    sports: 'Sports',
    technology: 'Technology',
    society: 'Society',
    'sri-lanka': 'Sri Lanka',
    world: 'Global',
    other: 'Other'
  },
  si: {
    politics: 'දේශපාලනය',
    economy: 'ආර්ථිකය',
    education: 'අධ්‍යාපනය',
    health: 'සෞඛ්‍යය',
    sports: 'ක්‍රීඩා',
    technology: 'තාක්ෂණය',
    society: 'සමාජය',
    'sri-lanka': 'ශ්‍රී ලංකාව',
    world: 'ලෝකය',
    other: 'වෙනත්'
  },
  ta: {
    politics: 'அரசியல்',
    economy: 'பொருளாதாரம்',
    education: 'கல்வி',
    health: 'சுகாதாரம்',
    sports: 'விளையாட்டு',
    technology: 'தொழில்நுட்பம்',
    society: 'சமூகம்',
    'sri-lanka': 'இலங்கை',
    world: 'உலகம்',
    other: 'மற்றவை'
  }
} as const;

/**
 * Normalize a topic string to a valid topic slug
 * - Converts to lowercase
 * - Replaces spaces with hyphens
 * - Handles special cases
 * - Validates against VALID_TOPICS
 */
export function normalizeTopicSlug(topic: string | null | undefined): string | null {
  if (!topic) return null;
  
  // Convert to lowercase and trim
  let normalized = topic.toLowerCase().trim();
  
  // Handle special cases
  const specialCases: Record<string, string> = {
    'sri lanka': 'sri-lanka',
    'srilanka': 'sri-lanka',
    'sri_lanka': 'sri-lanka',
    'global': 'world',
    'tech': 'technology',
    'edu': 'education',
    'pol': 'politics',
    'econ': 'economy'
  };
  
  if (specialCases[normalized]) {
    normalized = specialCases[normalized];
  }
  
  // Replace spaces and underscores with hyphens
  normalized = normalized.replace(/[\s_]+/g, '-');
  
  // Remove any invalid characters (keep only alphanumeric and hyphens)
  normalized = normalized.replace(/[^a-z0-9-]/g, '');
  
  // Remove multiple consecutive hyphens
  normalized = normalized.replace(/-+/g, '-');
  
  // Remove leading/trailing hyphens
  normalized = normalized.replace(/^-+|-+$/g, '');
  
  // Validate against VALID_TOPICS
  if (VALID_TOPICS.includes(normalized as ValidTopic)) {
    return normalized;
  }
  
  // Return null if not valid
  return null;
}

/**
 * Validate if a topic is valid
 */
export function isValidTopic(topic: string | null | undefined): topic is ValidTopic {
  if (!topic) return false;
  const normalized = normalizeTopicSlug(topic);
  return normalized !== null && VALID_TOPICS.includes(normalized as ValidTopic);
}

/**
 * Get topic label for a given language
 */
export function getTopicLabel(topic: string, language: 'en' | 'si' | 'ta' = 'en'): string {
  const normalized = normalizeTopicSlug(topic);
  if (!normalized) return topic;
  
  const labels = TOPIC_LABELS[language];
  return labels[normalized as keyof typeof labels] || topic;
}

/**
 * Get all valid topics
 */
export function getAllValidTopics(): readonly ValidTopic[] {
  return VALID_TOPICS;
}

