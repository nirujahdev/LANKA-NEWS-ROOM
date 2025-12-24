import { z } from 'zod';

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_ANON_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().min(1),
  CRON_SECRET: z.string().min(1),
  SUMMARY_MODEL: z.string().default('gpt-4o-mini'),
  SUMMARY_TRANSLATE_MODEL: z.string().default('gpt-4o-mini'),
  SIMILARITY_THRESHOLD: z.coerce.number().default(0.65),
  WINDOW_HOURS: z.coerce.number().default(24),
  MAX_SUMMARY_ARTICLES: z.coerce.number().default(5),
  RSS_CONCURRENCY: z.coerce.number().default(4)
});

const parsed = envSchema.parse({
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  CRON_SECRET: process.env.CRON_SECRET,
  SUMMARY_MODEL: process.env.SUMMARY_MODEL,
  SUMMARY_TRANSLATE_MODEL: process.env.SUMMARY_TRANSLATE_MODEL,
  SIMILARITY_THRESHOLD: process.env.SIMILARITY_THRESHOLD,
  WINDOW_HOURS: process.env.WINDOW_HOURS,
  MAX_SUMMARY_ARTICLES: process.env.MAX_SUMMARY_ARTICLES,
  RSS_CONCURRENCY: process.env.RSS_CONCURRENCY
});

export const env = parsed;

