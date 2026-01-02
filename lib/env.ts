import { z } from 'zod';

// Check if we're on the client side
const isClient = typeof window !== 'undefined';

// Server-only environment variables (not available on client)
const serverEnvSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  SUMMARY_MODEL: z.string().default('gpt-4o-mini'),
  SUMMARY_TRANSLATE_MODEL: z.string().default('gpt-4o-mini'),
  SIMILARITY_THRESHOLD: z.coerce.number().default(0.65),
  WINDOW_HOURS: z.coerce.number().default(24),
  MAX_SUMMARY_ARTICLES: z.coerce.number().default(8),
  RSS_CONCURRENCY: z.coerce.number().default(4),
  LOCK_TTL_MINUTES: z.coerce.number().default(10),
  CACHE_TTL_SECONDS: z.coerce.number().default(300),
  RETRY_MAX_ATTEMPTS: z.coerce.number().default(3),
  // News API keys (optional)
  NEWSAPI_KEY: z.string().optional(),
  NEWSDATA_API_KEY: z.string().optional(),
  // Agent configuration (optional)
  AGENT_ENABLED: z.string().optional(),
  AGENT_ROLLOUT_PERCENTAGE: z.coerce.number().optional(),
  AGENT_USE_FOR_COMPLEX: z.string().optional(),
  AGENT_QUALITY_THRESHOLD: z.coerce.number().optional(),
  AGENT_MAX_RETRIES: z.coerce.number().optional(),
  AGENT_TIMEOUT: z.coerce.number().optional(),
  AGENT_SUMMARY_MODEL: z.string().optional(),
  AGENT_TRANSLATION_MODEL: z.string().optional(),
  AGENT_SEO_MODEL: z.string().optional(),
  AGENT_IMAGE_MODEL: z.string().optional(),
  AGENT_CATEGORY_MODEL: z.string().optional()
});

// Client-safe environment variables (only validate these on client)
const clientEnvSchema = z.object({
  SUMMARY_MODEL: z.string().default('gpt-4o-mini'),
  SUMMARY_TRANSLATE_MODEL: z.string().default('gpt-4o-mini'),
  SIMILARITY_THRESHOLD: z.coerce.number().default(0.65),
  WINDOW_HOURS: z.coerce.number().default(24),
  MAX_SUMMARY_ARTICLES: z.coerce.number().default(8),
  RSS_CONCURRENCY: z.coerce.number().default(4),
  LOCK_TTL_MINUTES: z.coerce.number().default(10),
  CACHE_TTL_SECONDS: z.coerce.number().default(300),
  RETRY_MAX_ATTEMPTS: z.coerce.number().default(3)
});

// Parse based on environment - use safeParse to avoid throwing errors
let parsed: z.infer<typeof serverEnvSchema>;

if (isClient) {
  // On client, only validate safe variables with defaults
  const clientResult = clientEnvSchema.safeParse({
    SUMMARY_MODEL: process.env.SUMMARY_MODEL,
    SUMMARY_TRANSLATE_MODEL: process.env.SUMMARY_TRANSLATE_MODEL,
    SIMILARITY_THRESHOLD: process.env.SIMILARITY_THRESHOLD,
    WINDOW_HOURS: process.env.WINDOW_HOURS,
    MAX_SUMMARY_ARTICLES: process.env.MAX_SUMMARY_ARTICLES,
    RSS_CONCURRENCY: process.env.RSS_CONCURRENCY,
    LOCK_TTL_MINUTES: process.env.LOCK_TTL_MINUTES,
    CACHE_TTL_SECONDS: process.env.CACHE_TTL_SECONDS,
    RETRY_MAX_ATTEMPTS: process.env.RETRY_MAX_ATTEMPTS
  });
  
  // Use defaults if parsing fails (client doesn't have these env vars)
  parsed = clientResult.success 
    ? (clientResult.data as any)
    : {
        SUMMARY_MODEL: 'gpt-4o-mini',
        SUMMARY_TRANSLATE_MODEL: 'gpt-4o-mini',
        SIMILARITY_THRESHOLD: 0.65,
        WINDOW_HOURS: 24,
        MAX_SUMMARY_ARTICLES: 8,
        RSS_CONCURRENCY: 4,
        LOCK_TTL_MINUTES: 10,
        CACHE_TTL_SECONDS: 300,
        RETRY_MAX_ATTEMPTS: 3
      } as any;
} else {
  // On server, validate all variables
  parsed = serverEnvSchema.parse({
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    SUMMARY_MODEL: process.env.SUMMARY_MODEL,
    SUMMARY_TRANSLATE_MODEL: process.env.SUMMARY_TRANSLATE_MODEL,
    SIMILARITY_THRESHOLD: process.env.SIMILARITY_THRESHOLD,
    WINDOW_HOURS: process.env.WINDOW_HOURS,
    MAX_SUMMARY_ARTICLES: process.env.MAX_SUMMARY_ARTICLES,
    RSS_CONCURRENCY: process.env.RSS_CONCURRENCY,
    LOCK_TTL_MINUTES: process.env.LOCK_TTL_MINUTES,
    CACHE_TTL_SECONDS: process.env.CACHE_TTL_SECONDS,
    RETRY_MAX_ATTEMPTS: process.env.RETRY_MAX_ATTEMPTS,
    NEWSAPI_KEY: process.env.NEWSAPI_KEY,
    NEWSDATA_API_KEY: process.env.NEWSDATA_API_KEY
  });
}

export const env = parsed;

