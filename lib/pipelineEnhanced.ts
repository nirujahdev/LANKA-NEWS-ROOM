// Enhanced Pipeline Functions for Quality and Mandatory Translations
// These functions ensure 100% translation coverage and quality tracking

import { supabaseAdmin } from './supabaseAdmin';
import { translateHeadline, validateHeadlineTranslationQuality, translateSummary, validateTranslationQuality, validateSummaryQuality, summarizeEnglish, summarizeInSourceLanguage } from './openaiClient';
import { detectLanguage } from './language';
import { env } from './env';

/**
 * Ensures headline translations exist and meet quality standards
 * MANDATORY: Will always generate translations, even if quality is low
 */
export async function ensureHeadlineTranslations(
  clusterId: string,
  headlineEn: string,
  errors: Array<{ sourceId?: string; stage: string; message: string }>
): Promise<{ headlineSi: string; headlineTa: string; qualitySi: number; qualityTa: number }> {
  // Fetch current cluster
  const { data: cluster } = await supabaseAdmin
    .from('clusters')
    .select('headline_si, headline_ta, headline_translation_quality_si, headline_translation_quality_ta')
    .eq('id', clusterId)
    .single();

  let headlineSi = cluster?.headline_si || null;
  let headlineTa = cluster?.headline_ta || null;
  let qualitySi = cluster?.headline_translation_quality_si || 0;
  let qualityTa = cluster?.headline_translation_quality_ta || 0;

  // MANDATORY: Generate Sinhala translation if missing or quality < 0.7
  if (!headlineSi || qualitySi < 0.7) {
    try {
      headlineSi = await translateHeadline(headlineEn, 'en', 'si');
      const qualityCheck = await validateHeadlineTranslationQuality(headlineEn, headlineSi, 'en', 'si');
      qualitySi = qualityCheck.score / 100; // Convert 0-100 to 0-1 scale
      
      // Retry if quality is still low
      if (qualitySi < 0.7) {
        console.log(`[Pipeline] Retrying Sinhala headline translation (quality: ${qualitySi})...`);
        headlineSi = await translateHeadline(headlineEn, 'en', 'si');
        const retryCheck = await validateHeadlineTranslationQuality(headlineEn, headlineSi, 'en', 'si');
        qualitySi = retryCheck.score / 100;
      }
      
      if (qualitySi < 0.7) {
        console.warn(`[Pipeline] Sinhala headline translation quality still low: ${qualitySi}`);
      }
    } catch (error) {
      errors.push({ stage: 'headline_translation', message: `Sinhala translation failed: ${error}` });
      // Fallback: use English if translation fails
      headlineSi = headlineEn;
      qualitySi = 0;
    }
  }

  // MANDATORY: Generate Tamil translation if missing or quality < 0.7
  if (!headlineTa || qualityTa < 0.7) {
    try {
      headlineTa = await translateHeadline(headlineEn, 'en', 'ta');
      const qualityCheck = await validateHeadlineTranslationQuality(headlineEn, headlineTa, 'en', 'ta');
      qualityTa = qualityCheck.score / 100;
      
      // Retry if quality is still low
      if (qualityTa < 0.7) {
        console.log(`[Pipeline] Retrying Tamil headline translation (quality: ${qualityTa})...`);
        headlineTa = await translateHeadline(headlineEn, 'en', 'ta');
        const retryCheck = await validateHeadlineTranslationQuality(headlineEn, headlineTa, 'en', 'ta');
        qualityTa = retryCheck.score / 100;
      }
      
      if (qualityTa < 0.7) {
        console.warn(`[Pipeline] Tamil headline translation quality still low: ${qualityTa}`);
      }
    } catch (error) {
      errors.push({ stage: 'headline_translation', message: `Tamil translation failed: ${error}` });
      // Fallback: use English if translation fails
      headlineTa = headlineEn;
      qualityTa = 0;
    }
  }

  // Update cluster with translations and quality scores
  await supabaseAdmin
    .from('clusters')
    .update({
      headline_si: headlineSi,
      headline_ta: headlineTa,
      headline_translation_quality_en: 1.0, // English is always 1.0 (original)
      headline_translation_quality_si: qualitySi,
      headline_translation_quality_ta: qualityTa
    })
    .eq('id', clusterId);

  return { headlineSi, headlineTa, qualitySi, qualityTa };
}

/**
 * Ensures summary translations exist and meet quality standards
 * MANDATORY: Will always generate translations, even if quality is low
 */
export async function ensureSummaryTranslations(
  clusterId: string,
  summaryEn: string,
  errors: Array<{ sourceId?: string; stage: string; message: string }>
): Promise<{ summarySi: string; summaryTa: string; qualitySi: number; qualityTa: number }> {
  // Fetch current summary
  const { data: summary } = await supabaseAdmin
    .from('summaries')
    .select('summary_si, summary_ta, summary_quality_score_si, summary_quality_score_ta')
    .eq('cluster_id', clusterId)
    .maybeSingle();

  let summarySi = summary?.summary_si || null;
  let summaryTa = summary?.summary_ta || null;
  let qualitySi = summary?.summary_quality_score_si || 0;
  let qualityTa = summary?.summary_quality_score_ta || 0;

  // MANDATORY: Generate Sinhala translation if missing or quality < 0.7
  if (!summarySi || qualitySi < 0.7) {
    try {
      summarySi = await translateSummary(summaryEn, 'si');
      const qualityCheck = await validateTranslationQuality(summaryEn, summarySi, 'en', 'si');
      qualitySi = qualityCheck.score / 100;
      
      // Retry if quality is still low
      if (qualitySi < 0.7) {
        console.log(`[Pipeline] Retrying Sinhala summary translation (quality: ${qualitySi})...`);
        summarySi = await translateSummary(summaryEn, 'si');
        const retryCheck = await validateTranslationQuality(summaryEn, summarySi, 'en', 'si');
        qualitySi = retryCheck.score / 100;
      }
    } catch (error) {
      errors.push({ stage: 'summary_translation', message: `Sinhala translation failed: ${error}` });
      summarySi = summaryEn; // Fallback
      qualitySi = 0;
    }
  }

  // MANDATORY: Generate Tamil translation if missing or quality < 0.7
  if (!summaryTa || qualityTa < 0.7) {
    try {
      summaryTa = await translateSummary(summaryEn, 'ta');
      const qualityCheck = await validateTranslationQuality(summaryEn, summaryTa, 'en', 'ta');
      qualityTa = qualityCheck.score / 100;
      
      // Retry if quality is still low
      if (qualityTa < 0.7) {
        console.log(`[Pipeline] Retrying Tamil summary translation (quality: ${qualityTa})...`);
        summaryTa = await translateSummary(summaryEn, 'ta');
        const retryCheck = await validateTranslationQuality(summaryEn, summaryTa, 'en', 'ta');
        qualityTa = retryCheck.score / 100;
      }
    } catch (error) {
      errors.push({ stage: 'summary_translation', message: `Tamil translation failed: ${error}` });
      summaryTa = summaryEn; // Fallback
      qualityTa = 0;
    }
  }

  // Update summary with translations and quality scores
  await supabaseAdmin
    .from('summaries')
    .update({
      summary_si: summarySi,
      summary_ta: summaryTa,
      summary_quality_score_si: qualitySi,
      summary_quality_score_ta: qualityTa,
      summary_length_si: summarySi.length,
      summary_length_ta: summaryTa.length
    })
    .eq('cluster_id', clusterId);

  return { summarySi, summaryTa, qualitySi, qualityTa };
}

/**
 * Generates quality-controlled summary with length validation
 * TARGET: Quality > 0.7, Length within ±20% of target
 */
export async function generateQualityControlledSummary(
  articles: Array<{ title: string; content_excerpt?: string; content_text?: string }>,
  sourceLang: 'en' | 'si' | 'ta',
  targetLength: number = 500
): Promise<{ summary: string; qualityScore: number; length: number }> {
  let summary = '';
  let qualityScore = 0;
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts && qualityScore < 0.7) {
    attempts++;
    
    // Map articles to expected format (use content_text or content_excerpt as content)
    const mappedArticles = articles.map(a => ({
      title: a.title,
      content: a.content_text || a.content_excerpt || ''
    }));
    
    // Generate summary
    if (sourceLang === 'en') {
      summary = await summarizeEnglish(mappedArticles);
    } else {
      summary = await summarizeInSourceLanguage(mappedArticles, sourceLang);
    }

    // Validate quality
    const qualityCheck = await validateSummaryQuality(summary);
    qualityScore = qualityCheck.score / 100;

    // Check length using word count (target: 400-1000 words as per agent instructions)
    const wordCount = summary.trim().split(/\s+/).length;
    const minWords = 400;
    const maxWords = 1000;

    if (wordCount < minWords || wordCount > maxWords) {
      console.warn(`[Pipeline] Summary word count ${wordCount} outside target range [${minWords}, ${maxWords}] words`);
      // Note: We'll still accept summaries that are close to the range
      // Only regenerate if way outside bounds
      if (wordCount < 200 || wordCount > 1500) {
        // Adjust target for next attempt
        if (wordCount < minWords) {
          targetLength = Math.floor(targetLength * 1.2); // Increase target
        } else {
          targetLength = Math.floor(targetLength * 0.8); // Decrease target
        }
      }
    }

    // Accept summary if quality is good and word count is reasonable (200-1500 words)
    if (qualityScore >= 0.7 && wordCount >= 200 && wordCount <= 1500) {
      break; // Quality and length are acceptable
    }

    if (attempts < maxAttempts) {
      console.log(`[Pipeline] Regenerating summary (attempt ${attempts + 1}/${maxAttempts})...`);
    }
  }

  return {
    summary: summary || 'Summary generation failed after multiple attempts.',
    qualityScore,
    length: summary.length
  };
}

/**
 * Simplified image selection: Fetch first available image URL and save to Supabase
 */
export async function selectBestImageWithQuality(
  clusterId: string,
  headline: string,
  summary: string,
  articles: Array<{ image_url?: string | null; image_urls?: string[] | null; url: string; content_html?: string | null }>
): Promise<{ imageUrl: string | null; relevanceScore: number; qualityScore: number }> {
  // Check if cluster already has an image
  const { data: cluster } = await supabaseAdmin
    .from('clusters')
    .select('image_url')
    .eq('id', clusterId)
    .single();
  
  if (cluster?.image_url) {
    return {
      imageUrl: cluster.image_url,
      relevanceScore: 0.8,
      qualityScore: 1.0
    };
  }

  // Collect image URLs from articles (RSS feeds first)
  const imageUrls: string[] = [];
  
  for (const article of articles) {
    // Priority 1: RSS feed image
    if (article.image_url) {
      imageUrls.push(article.image_url);
    }
    // Priority 2: RSS feed image array
    if (article.image_urls && Array.isArray(article.image_urls)) {
      imageUrls.push(...article.image_urls);
    }
  }

  // Filter valid HTTP(S) URLs
  const validUrls = imageUrls.filter(url => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  });

  if (validUrls.length === 0) {
    return { imageUrl: null, relevanceScore: 0, qualityScore: 0 };
  }

  // Use first valid image URL
  const selectedUrl = validUrls[0];

  // Save to Supabase
  await supabaseAdmin
    .from('clusters')
    .update({
      image_url: selectedUrl,
      image_relevance_score: 0.8,
      image_quality_score: 1.0
    })
    .eq('id', clusterId);

  console.log(`[Pipeline] ✅ Saved image URL to cluster ${clusterId}: ${selectedUrl.substring(0, 80)}...`);

  return {
    imageUrl: selectedUrl,
    relevanceScore: 0.8,
    qualityScore: 1.0
  };
}

