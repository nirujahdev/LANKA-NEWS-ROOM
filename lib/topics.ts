// Shared topic constants and utilities

export const VALID_TOPICS = [
  'politics',
  'economy',
  'business',
  'sports',
  'crime',
  'education',
  'health',
  'environment',
  'technology',
  'culture',
  'entertainment',
  'science',
  'sri-lanka',
  'world',
  'local'
] as const;

export type ValidTopic = typeof VALID_TOPICS[number];

export const TOPIC_LABELS = {
  en: {
    politics: 'Politics',
    economy: 'Economy',
    business: 'Business',
    sports: 'Sports',
    crime: 'Crime',
    education: 'Education',
    health: 'Health',
    environment: 'Environment',
    technology: 'Technology',
    culture: 'Culture',
    entertainment: 'Entertainment',
    science: 'Science',
    'sri-lanka': 'Sri Lanka',
    world: 'World',
    local: 'Local'
  },
  si: {
    politics: 'දේශපාලනය',
    economy: 'ආර්ථිකය',
    business: 'ව්‍යාපාර',
    sports: 'ක්‍රීඩා',
    crime: 'අපරාධ',
    education: 'අධ්‍යාපනය',
    health: 'සෞඛ්‍යය',
    environment: 'පරිසරය',
    technology: 'තාක්ෂණය',
    culture: 'සංස්කෘතිය',
    entertainment: 'විනෝදාස්වාදය',
    science: 'විද්‍යාව',
    'sri-lanka': 'ශ්‍රී ලංකාව',
    world: 'ලෝකය',
    local: 'ප්‍රාදේශීය'
  },
  ta: {
    politics: 'அரசியல்',
    economy: 'பொருளாதாரம்',
    business: 'வணிகம்',
    sports: 'விளையாட்டு',
    crime: 'குற்றம்',
    education: 'கல்வி',
    health: 'சுகாதாரம்',
    environment: 'சுற்றுச்சூழல்',
    technology: 'தொழில்நுட்பம்',
    culture: 'கலாச்சாரம்',
    entertainment: 'பொழுதுபோக்கு',
    science: 'அறிவியல்',
    'sri-lanka': 'இலங்கை',
    world: 'உலகம்',
    local: 'உள்ளூர்'
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
    'tech': 'technology',
    'env': 'environment',
    'edu': 'education',
    'pol': 'politics',
    'econ': 'economy',
    'biz': 'business',
    'ent': 'entertainment',
    'sci': 'science'
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

