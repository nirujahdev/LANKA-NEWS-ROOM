/**
 * TypeScript types for AI Agents system
 */

export type LanguageCode = 'en' | 'si' | 'ta';

export interface ArticleSource {
  title: string;
  content: string;
  content_excerpt?: string;
  content_text?: string;
  weight?: number;
  publishedAt?: string;
}

export interface SummaryResult {
  summary: string;
  qualityScore: number;
  length: number;
  sourceLang: LanguageCode;
}

export interface TranslationResult {
  headlineSi: string;
  headlineTa: string;
  summarySi: string;
  summaryTa: string;
  qualityScores: {
    headlineSi: number;
    headlineTa: number;
    summarySi: number;
    summaryTa: number;
  };
}

export interface SEOResult {
  seoEn: {
    title: string;
    description: string;
  };
  seoSi: {
    title: string;
    description: string;
  };
  seoTa: {
    title: string;
    description: string;
  };
  topics: string[];
  district: string | null;
  entities: {
    primary_entity: string | null;
    event_type: string | null;
  };
  keywords: string[];
  keyFacts: {
    en: string[];
    si: string[];
    ta: string[];
  };
  confirmedVsDiffers: {
    en: string;
    si: string;
    ta: string;
  };
}

export interface ImageResult {
  imageUrl: string | null;
  relevanceScore: number;
  qualityScore: number;
  source: string;
}

export interface CategoryResult {
  category: string;
  topics?: string[];
}

export interface AgentContext {
  clusterId: string;
  headlineEn: string;
  articles: ArticleSource[];
  summaryEn?: string;
  errors: Array<{ sourceId?: string; stage: string; message: string }>;
}

export interface AgentConfig {
  enabled: boolean;
  rolloutPercentage: number;
  useAgentsForComplexCases: boolean;
  qualityThreshold: number;
  maxRetries: number;
  timeout: number;
}

export interface AgentMetrics {
  agentName: string;
  success: boolean;
  qualityScore?: number;
  cost?: number;
  duration?: number;
  error?: string;
  timestamp: Date;
}

