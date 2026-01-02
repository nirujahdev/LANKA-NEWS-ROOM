/**
 * Translation tools for agents
 */

import { tool } from '@openai/agents';
import { z } from 'zod';
import { translateSummary, translateHeadline, validateTranslationQuality, validateHeadlineTranslationQuality } from '../../openaiClient';
import { LanguageCode } from '../types';

/**
 * Tool: Translate text between languages
 */
export const translateTextTool = tool({
  name: 'translate_text',
  description: 'Translate text between English, Sinhala, and Tamil. Maintains formal news analysis style.',
  parameters: z.object({
    text: z.string(),
    sourceLang: z.enum(['en', 'si', 'ta']),
    targetLang: z.enum(['en', 'si', 'ta']),
  }),
  execute: async ({ text, sourceLang, targetLang }) => {
    try {
      if (sourceLang === targetLang) {
        return { translatedText: text };
      }
      
      // Use appropriate translation function
      let translated: string;
      if (targetLang === 'si' || targetLang === 'ta') {
        translated = await translateSummary(text, targetLang);
      } else {
        // For English, use headline translation if short, otherwise summary translation
        translated = text.length < 100 
          ? await translateHeadline(text, sourceLang, 'en')
          : await translateSummary(text, sourceLang === 'si' ? 'si' : 'ta');
      }
      
      return {
        translatedText: translated,
        sourceLang,
        targetLang,
        length: translated.length,
      };
    } catch (error) {
      throw new Error(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

/**
 * Tool: Translate headline specifically
 */
export const translateHeadlineTool = tool({
  name: 'translate_headline',
  description: 'Translate a news headline between languages. Optimized for short, impactful headlines.',
  parameters: z.object({
    headline: z.string(),
    sourceLang: z.enum(['en', 'si', 'ta']),
    targetLang: z.enum(['en', 'si', 'ta']),
  }),
  execute: async ({ headline, sourceLang, targetLang }) => {
    try {
      if (sourceLang === targetLang) {
        return { translatedHeadline: headline };
      }
      
      const translated = await translateHeadline(headline, sourceLang, targetLang);
      
      return {
        translatedHeadline: translated,
        sourceLang,
        targetLang,
        length: translated.length,
      };
    } catch (error) {
      throw new Error(`Headline translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

/**
 * Tool: Translate summary specifically
 */
export const translateSummaryTool = tool({
  name: 'translate_summary',
  description: 'Translate a news summary between languages. Preserves structure, facts, and formal style.',
  parameters: z.object({
    summary: z.string(),
    targetLang: z.enum(['si', 'ta']),
  }),
  execute: async ({ summary, targetLang }) => {
    try {
      const translated = await translateSummary(summary, targetLang);
      
      return {
        translatedSummary: translated,
        targetLang,
        length: translated.length,
        wordCount: translated.trim().split(/\s+/).length,
      };
    } catch (error) {
      throw new Error(`Summary translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

/**
 * Tool: Validate translation quality
 */
export const validateTranslationQualityTool = tool({
  name: 'validate_translation_quality',
  description: 'Validate the quality of a translation. Returns quality score (0-100) and issues.',
  parameters: z.object({
    sourceText: z.string(),
    translatedText: z.string(),
    sourceLang: z.enum(['en', 'si', 'ta']),
    targetLang: z.enum(['en', 'si', 'ta']),
  }),
  execute: async ({ sourceText, translatedText, sourceLang, targetLang }) => {
    try {
      const result = validateTranslationQuality(sourceText, translatedText, sourceLang, targetLang);
      return {
        isValid: result.isValid,
        score: result.score,
        issues: result.issues,
        sourceLength: sourceText.length,
        translatedLength: translatedText.length,
      };
    } catch (error) {
      throw new Error(`Translation quality validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

/**
 * Tool: Validate headline translation quality
 */
export const validateHeadlineTranslationQualityTool = tool({
  name: 'validate_headline_translation_quality',
  description: 'Validate the quality of a headline translation. Optimized for shorter text.',
  parameters: z.object({
    sourceHeadline: z.string(),
    translatedHeadline: z.string(),
    sourceLang: z.enum(['en', 'si', 'ta']),
    targetLang: z.enum(['en', 'si', 'ta']),
  }),
  execute: async ({ sourceHeadline, translatedHeadline, sourceLang, targetLang }) => {
    try {
      const result = validateHeadlineTranslationQuality(sourceHeadline, translatedHeadline, sourceLang, targetLang);
      return {
        isValid: result.isValid,
        score: result.score,
        issues: result.issues,
        sourceLength: sourceHeadline.length,
        translatedLength: translatedHeadline.length,
      };
    } catch (error) {
      throw new Error(`Headline translation quality validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

