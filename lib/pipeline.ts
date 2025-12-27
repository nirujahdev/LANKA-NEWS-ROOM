// @ts-nocheck
import { supabaseAdmin } from './supabaseAdmin';
import { env } from './env';
import { fetchRssFeed } from './rss';
import { detectLanguage } from './language';
import { makeArticleHash } from './hash';
import { extractEntities, normalizeTitle, similarityScore, generateSlug } from './text';
import { summarizeEnglish, translateSummary, generateSEOMetadata, generateComprehensiveSEO, summarizeInSourceLanguage, translateToMultipleLanguages, generateKeyFacts, generateConfirmedVsDiffers, generateKeywords, translateFromTo, translateHeadline, validateSummaryQuality, validateTranslationQuality, validateHeadlineTranslationQuality } from './openaiClient';
import { categorizeCluster } from './categorize';
import { normalizeTopicSlug } from './topics';
import { updateLastSuccessfulRun } from './pipelineEarlyExit';
import { selectBestImage } from './imageSelection';
import { extractAllImagesFromHtml, fetchArticleImages } from './imageExtraction';
import { cache } from './cache';

type ClusterCache = {
  id: string;
  headline: string;
  first_seen_at: string | null;
  last_seen_at: string | null;
  source_count: number | null;
  article_count: number | null;
};

export type PipelineStats = {
  runId?: string;
  fetched: number;
  inserted: number;
  clustersTouched: number;
  categorized: number;
  summaries: number;
  errors: Array<{ sourceId?: string; stage: string; message: string }>;
};

/**
 * Runs the full pipeline: fetch → insert → cluster → categorize → summarize.
 * 
 * This is the shared pipeline function that can be called by multiple endpoints.
 * 
 * @returns Pipeline execution statistics
 */
export async function runFullPipeline(): Promise<PipelineStats> {
  const runId = await startRun();
  const errors: Array<{ sourceId?: string; stage: string; message: string }> = [];

  try {
    const sources = await loadSources();
    const fetched = await fetchAllSources(sources, errors);
    const inserted = await insertArticles(fetched);
    const newArticles = inserted.filter((a) => a.inserted);
    const clusterResults = await clusterArticles(newArticles, errors);
    const categorized = await categorizeClusters(clusterResults.updatedClusters, errors);
    const summarized = await summarizeEligible(clusterResults.updatedClusters, errors);

    await finishRun(runId, 'success', `inserted=${newArticles.length}, summarized=${summarized}`);
    
    // Update last successful run timestamp
    await updateLastSuccessfulRun();
    
    // Invalidate cache after successful pipeline run
    cache.clear();
    console.log('[Pipeline] Cache cleared after successful run');

    return {
      runId,
      fetched: fetched.length,
      inserted: newArticles.length,
      clustersTouched: clusterResults.updatedClusters.size,
      categorized,
      summaries: summarized,
      errors
    };
  } catch (err: any) {
    await finishRun(runId, 'error', err?.message || 'unknown');
    throw err; // Re-throw for caller to handle
  }
}

async function startRun(): Promise<string | undefined> {
  const { data } = await supabaseAdmin
    .from('pipeline_runs')
    .insert({ status: 'started' })
    .select('id')
    .single();
  return data?.id;
}

async function finishRun(runId: string | undefined, status: 'success' | 'error', notes?: string) {
  if (!runId) return;
  await supabaseAdmin
    .from('pipeline_runs')
    .update({ status, finished_at: new Date().toISOString(), notes })
    .eq('id', runId);
}

async function logError(runId: string | undefined, sourceId: string | undefined, stage: string, message: string) {
  await supabaseAdmin
    .from('pipeline_errors')
    .insert({ run_id: runId, source_id: sourceId, stage, error_message: message });
}

async function getClusterSlug(clusterId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('clusters')
    .select('slug')
    .eq('id', clusterId)
    .single();
  return data?.slug || null;
}

async function loadSources() {
  const { data, error } = await supabaseAdmin
    .from('sources')
    .select('*')
    .eq('active', true)
    .eq('enabled', true); // Check both for backward compatibility
  if (error) throw new Error(error.message);
  return data || [];
}

async function fetchAllSources(
  sources: Awaited<ReturnType<typeof loadSources>>,
  errors: Array<{ sourceId?: string; stage: string; message: string }>
) {
  const results: Array<{
    source_id: string;
    items: Awaited<ReturnType<typeof fetchRssFeed>>;
  }> = [];
  const queue = [...sources];
  const workers: Promise<void>[] = [];

  // Fetch from RSS feeds (existing sources)
  for (let i = 0; i < env.RSS_CONCURRENCY; i += 1) {
    const worker = (async () => {
      while (queue.length) {
        const source = queue.shift();
        if (!source) break;
        try {
          const items = await fetchRssFeed(source.feed_url);
          results.push({ source_id: source.id, items });
        } catch (err: any) {
          errors.push({ sourceId: source.id, stage: 'fetch', message: err?.message || 'fetch failed' });
          await logError(undefined, source.id, 'fetch', err?.message || 'fetch failed');
        }
      }
    })();
    workers.push(worker);
  }

  await Promise.all(workers);

  // Fetch from API sources (NewsAPI, NewsData, Bing)
  // Load API aggregator sources from database
  const { data: apiSources } = await supabaseAdmin
    .from('sources')
    .select('*')
    .eq('type', 'api')
    .eq('active', true)
    .eq('enabled', true);

  if (apiSources && apiSources.length > 0) {
    console.log(`[Pipeline] Found ${apiSources.length} API source(s)`);
    
    for (const apiSource of apiSources) {
      try {
        const apiConfig = apiSource.api_config as { provider?: string } | null;
        const provider = apiConfig?.provider;

        let apiItems: Awaited<ReturnType<typeof fetchFromAllApis>> = [];
        
        if (provider === 'newsapi' && env.NEWSAPI_KEY) {
          console.log(`[Pipeline] Fetching from NewsAPI.org (source: ${apiSource.name})...`);
          const { fetchFromNewsAPI } = await import('./apiSources');
          apiItems = await fetchFromNewsAPI({ country: 'lk' });
        } else if (provider === 'newsdata' && env.NEWSDATA_API_KEY) {
          console.log(`[Pipeline] Fetching from NewsData.io (source: ${apiSource.name})...`);
          const { fetchFromNewsData } = await import('./apiSources');
          apiItems = await fetchFromNewsData({ country: 'lk' });
        } else {
          console.warn(`[Pipeline] API source ${apiSource.name} (${provider}) skipped - API key not configured`);
          continue;
        }

        if (apiItems.length > 0) {
          // Convert to RSS format for insertion
          const rssFormatItems = apiItems.map(item => ({
            title: item.title,
            url: item.url,
            guid: item.guid,
            publishedAt: item.publishedAt,
            content: item.content,
            contentSnippet: item.contentSnippet,
            imageUrl: item.imageUrl,
            imageUrls: item.imageUrls
          }));
          
          results.push({ source_id: apiSource.id, items: rssFormatItems });
          console.log(`[Pipeline] ✅ ${apiSource.name}: ${apiItems.length} articles`);
        } else {
          console.log(`[Pipeline] ⚠️ ${apiSource.name}: No articles found`);
        }
      } catch (err: any) {
        errors.push({ 
          sourceId: apiSource.id, 
          stage: 'api_fetch', 
          message: err?.message || 'API fetch failed' 
        });
        await logError(undefined, apiSource.id, 'api_fetch', err?.message || 'API fetch failed');
        console.error(`[Pipeline] ❌ ${apiSource.name} failed:`, err);
      }
    }
  } else {
    // Fallback: Try fetching from all APIs if no API sources configured
    try {
      console.log('[Pipeline] No API sources in database, trying direct API fetch...');
      const apiItems = await fetchFromAllApis();
      if (apiItems.length > 0) {
        console.log(`[Pipeline] ⚠️ Fetched ${apiItems.length} API articles but no API source configured in database`);
        console.log(`[Pipeline] ⚠️ These articles will not be inserted. Please add API sources to the database.`);
      }
    } catch (err: any) {
      errors.push({ stage: 'api_fetch', message: err?.message || 'API fetch failed' });
      console.error('[Pipeline] Direct API fetch failed:', err);
    }
  }

  return results;
}

async function insertArticles(
  fetched: Array<{ source_id: string; items: Awaited<ReturnType<typeof fetchRssFeed>> }>
) {
  const inserted: Array<{ id?: string; source_id: string; title: string; hash: string; inserted: boolean }> = [];

  for (const batch of fetched) {
    const rows = batch.items.map((item) => {
      const hash = makeArticleHash({ url: item.url, guid: item.guid, title: item.title });
      // Store all images in image_urls array, primary image in image_url for backward compatibility
      const imageUrls = item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls : (item.imageUrl ? [item.imageUrl] : null);
      return {
        source_id: batch.source_id,
        title: item.title,
        url: item.url,
        guid: item.guid,
        published_at: item.publishedAt,
        content_text: item.content,
        content_excerpt: item.contentSnippet || item.content?.slice(0, 400) || null,
        lang: detectLanguage(item.title ?? item.content),
        hash,
        image_url: item.imageUrl || null,
        image_urls: imageUrls
      };
    });

    // Use hash as the conflict target since it's unique per article
    // Hash is computed from url, guid, and title combination
    // Note: The unique index is partial (WHERE hash IS NOT NULL), so we need to ensure hash is never null
    // Filter out rows with null hash before upsert
    const validRows = rows.filter(r => r.hash && r.hash.trim().length > 0);
    
    if (validRows.length === 0) {
      continue; // Skip if no valid rows
    }
    
    const { data, error } = await supabaseAdmin
      .from('articles')
      .upsert(validRows, { onConflict: 'hash', ignoreDuplicates: true })
      .select('id, source_id, title, hash');

    if (error) {
      await logError(undefined, batch.source_id, 'insert', error.message);
      continue;
    }

    for (const row of data || []) {
      inserted.push({ ...row, inserted: true });
    }
  }

  return inserted;
}

async function clusterArticles(
  articles: Array<{ id?: string; source_id: string; title: string; hash: string }>,
  errors: Array<{ sourceId?: string; stage: string; message: string }>
) {
  if (!articles.length) return { updatedClusters: new Map<string, ClusterCache>() };

  const windowStart = new Date(Date.now() - env.WINDOW_HOURS * 60 * 60 * 1000).toISOString();
  const { data: clusters } = await supabaseAdmin
    .from('clusters')
    .select('*')
    .gte('last_seen_at', windowStart);

  const cache = new Map<string, ClusterCache>();
  for (const c of clusters || []) {
    cache.set(c.id, c as ClusterCache);
  }

  for (const article of articles) {
    if (!article.id) continue;
    const aTokens = normalizeTitle(article.title);
    const aEntities = extractEntities(article.title);
    let best: { id: string; score: number } | null = null;

    for (const c of cache.values()) {
      const cTokens = normalizeTitle(c.headline);
      const cEntities = extractEntities(c.headline);
      const score = similarityScore(aTokens, cTokens, aEntities, cEntities);
      if (score >= env.SIMILARITY_THRESHOLD && (!best || score > best.score)) {
        best = { id: c.id, score };
      }
    }

    let clusterId = best?.id;
    if (!clusterId) {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      const { data: created, error } = await supabaseAdmin
        .from('clusters')
        .insert({
          headline: article.title,
          status: 'draft',
          first_seen_at: now.toISOString(),
          last_seen_at: now.toISOString(),
          created_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          source_count: 0,
          article_count: 0
        })
        .select('*')
        .single();
      if (error || !created) {
        errors.push({ sourceId: article.source_id, stage: 'cluster', message: error?.message || 'create cluster' });
        continue;
      }
      cache.set(created.id, created as ClusterCache);
      clusterId = created.id;
    }

    await supabaseAdmin
      .from('articles')
      .update({ cluster_id: clusterId })
      .eq('id', article.id);

    await supabaseAdmin
      .from('cluster_articles')
      .upsert({ cluster_id: clusterId, article_id: article.id }, { onConflict: 'cluster_id,article_id' });

    const { data: counts } = await supabaseAdmin
      .from('articles')
      .select('source_id', { count: 'exact', head: false })
      .eq('cluster_id', clusterId);

    const sourceSet = new Set((counts || []).map((r) => r.source_id));
    const articleCount = counts?.length || 0;

    await supabaseAdmin
      .from('clusters')
      .update({
        headline: cache.get(clusterId)?.headline || article.title,
        source_count: sourceSet.size,
        article_count: articleCount,
        last_seen_at: new Date().toISOString()
      })
      .eq('id', clusterId);

    const existing = cache.get(clusterId);
    cache.set(clusterId, {
      id: clusterId,
      headline: existing?.headline || article.title,
      first_seen_at: existing?.first_seen_at || new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
      source_count: sourceSet.size,
      article_count: articleCount
    });
  }

  return { updatedClusters: cache };
}

/**
 * Categorizes clusters that don't have a category yet.
 * Only categorizes published clusters (article_count >= 1).
 */
async function categorizeClusters(
  clusters: Map<string, ClusterCache>,
  errors: Array<{ sourceId?: string; stage: string; message: string }>
) {
  let categorized = 0;
  for (const cluster of clusters.values()) {
    // Skip if already categorized or not eligible for publishing
    if ((cluster.article_count || 0) < 1) continue;

    // Check if cluster already has a category
    const { data: existing } = await supabaseAdmin
      .from('clusters')
      .select('category')
      .eq('id', cluster.id)
      .single();

    if (existing?.category) continue; // Already categorized

    // Get articles for this cluster
    const { data: articles, error } = await supabaseAdmin
      .from('articles')
      .select('title, content_excerpt')
      .eq('cluster_id', cluster.id)
      .limit(6);

    if (error || !articles || articles.length === 0) {
      errors.push({ stage: 'categorize', message: error?.message || 'no articles' });
      continue;
    }

    try {
      const category = await categorizeCluster(articles);
      await supabaseAdmin
        .from('clusters')
        .update({ category })
        .eq('id', cluster.id);
      categorized += 1;
    } catch (err: any) {
      errors.push({ stage: 'categorize', message: err?.message || 'categorization failed' });
    }
  }
  return categorized;
}

async function summarizeEligible(
  clusters: Map<string, ClusterCache>,
  errors: Array<{ sourceId?: string; stage: string; message: string }>
) {
  let summarized = 0;
  for (const cluster of clusters.values()) {
    // Generate summaries for clusters with 1+ articles
    if ((cluster.article_count || 0) < 1) continue;

    // Fetch latest cluster data from database to get headline_si, headline_ta, topics, and SEO fields
    const { data: latestCluster } = await supabaseAdmin
      .from('clusters')
      .select('headline_si, headline_ta, topics, meta_title_en, meta_title_si, meta_title_ta, meta_description_en, meta_description_si, meta_description_ta, source_count')
      .eq('id', cluster.id)
      .single();

    const { data: summary } = await supabaseAdmin
      .from('summaries')
      .select('*')
      .eq('cluster_id', cluster.id)
      .maybeSingle();

    const prevSourceCount = summary ? (latestCluster?.source_count || cluster.source_count || 0) : 0;
    const needsSummary = !summary || prevSourceCount !== (latestCluster?.source_count || cluster.source_count || 0);
    // Always check if headlines need to be generated (even if summary exists)
    const needsHeadlines = !latestCluster?.headline_si || !latestCluster?.headline_ta || !latestCluster?.topics || !Array.isArray(latestCluster?.topics);
    // Always check if SEO metadata needs to be generated (meta titles/descriptions)
    const needsSEO = !latestCluster?.meta_title_en || !latestCluster?.meta_title_si || !latestCluster?.meta_title_ta || 
                     !latestCluster?.meta_description_en || !latestCluster?.meta_description_si || !latestCluster?.meta_description_ta;
    
    // Skip only if summary exists, source count unchanged, headlines/topics are present, AND SEO is complete
    if (!needsSummary && !needsHeadlines && !needsSEO) {
      console.log(`[Pipeline] Skipping cluster ${cluster.id} - summary, headlines, and SEO already exist`);
      continue;
    }

    const { data: articles, error } = await supabaseAdmin
      .from('articles')
      .select('title, content_excerpt, content_text, content_html, published_at, image_url, image_urls, url')
      .eq('cluster_id', cluster.id)
      .order('published_at', { ascending: false })
      .limit(env.MAX_SUMMARY_ARTICLES);

    if (error) {
      errors.push({ stage: 'summaries', message: error.message });
      continue;
    }

    // Enhanced source payload with weighting and more context
    // Detect government/official sources for higher weighting
    const isGovernmentSource = (articleUrl: string): boolean => {
      const govPatterns = [
        /\.gov\.lk/i, /\.gov\./i, /ministry/i, /department/i, /parliament/i,
        /president/i, /prime.?minister/i, /cabinet/i, /official/i,
        /press.?release/i, /announcement/i, /\.go\.jp/i
      ];
      return govPatterns.some(pattern => pattern.test(articleUrl));
    };
    
    const sourcePayload =
      articles?.map((a, idx) => {
        // Increase context from 1500 to 2500 chars for longer summaries
        const content = (a.content_excerpt || a.content_text || a.title || '').slice(0, 2500);
        
        // Weight recent articles higher
        let weight = idx === 0 ? 1.5 : 1.0;
        const recency = a.published_at 
          ? Math.max(0, 1 - (Date.now() - new Date(a.published_at).getTime()) / (7 * 24 * 60 * 60 * 1000))
          : 0.5;
        
        // Boost government/official sources significantly (2x weight)
        const isGov = isGovernmentSource(a.url || '');
        if (isGov) {
          weight *= 2.0;
          console.log(`[Pipeline] 🏛️ Government source detected: ${a.title.substring(0, 60)}...`);
        }
        
        return {
          title: a.title,
          content,
          weight: weight * (1 + recency * 0.3), // Boost recent articles
          publishedAt: a.published_at
        };
      })
      .sort((a, b) => (b.weight || 0) - (a.weight || 0)) // Sort by weight
      .slice(0, env.MAX_SUMMARY_ARTICLES) || [];

    // Detect source language from articles
    let sourceLang: 'en' | 'si' | 'ta' = 'en';
    try {
      // Get language hint from first article's source
      const firstArticle = articles?.[0];
      let sourceHint: 'en' | 'si' | 'ta' | null = null;
      
      if (firstArticle) {
        // Try to get language from source metadata
        const { data: sourceData } = await supabaseAdmin
          .from('sources')
          .select('language')
          .eq('id', (firstArticle as any).source_id)
          .single();
        
        if (sourceData?.language && ['en', 'si', 'ta'].includes(sourceData.language)) {
          sourceHint = sourceData.language as 'en' | 'si' | 'ta';
        }
      }
      
      // Detect language with AI verification
      const combinedText = sourcePayload.map(s => s.title + ' ' + s.content.slice(0, 200)).join(' ');
      sourceLang = await detectLanguage(combinedText, sourceHint);
      
      console.log(`[Pipeline] Detected source language: ${sourceLang} (hint: ${sourceHint})`);
    } catch (error) {
      console.error('[Pipeline] Language detection failed, defaulting to English:', error);
      sourceLang = 'en';
    }

    // Generate summary in source language (only if needed)
    let summaryInSource: string;
    let summaryQualityScore = 0;
    
    if (needsSummary) {
      try {
        summaryInSource = await summarizeInSourceLanguage(sourcePayload, sourceLang, summary?.summary_en || summary?.summary_si || summary?.summary_ta);
      
        // Validate summary quality
        const qualityCheck = validateSummaryQuality(summaryInSource);
        summaryQualityScore = qualityCheck.score;
        
        if (!qualityCheck.isValid) {
          console.warn(`[Pipeline] Summary quality check failed (score: ${qualityCheck.score}):`, qualityCheck.issues);
          // If quality is very poor, try regenerating once
          if (qualityCheck.score < 50) {
            console.log('[Pipeline] Regenerating summary due to poor quality...');
            try {
              summaryInSource = await summarizeInSourceLanguage(sourcePayload, sourceLang);
              const retryCheck = validateSummaryQuality(summaryInSource);
              summaryQualityScore = retryCheck.score;
              if (!retryCheck.isValid) {
                console.warn(`[Pipeline] Retry summary also failed quality check (score: ${retryCheck.score})`);
              }
            } catch (retryError) {
              console.error('[Pipeline] Summary regeneration failed:', retryError);
            }
          }
        } else {
          console.log(`[Pipeline] Summary quality check passed (score: ${qualityCheck.score})`);
        }
      } catch (error) {
        console.error('[Pipeline] Source language summarization failed, falling back to English:', error);
        // Fallback to English summarization
        summaryInSource = await summarizeEnglish(sourcePayload, summary?.summary_en);
        sourceLang = 'en';
        
        // Validate fallback summary
        const qualityCheck = validateSummaryQuality(summaryInSource);
        summaryQualityScore = qualityCheck.score;
        if (!qualityCheck.isValid) {
          console.warn(`[Pipeline] Fallback summary quality check failed (score: ${qualityCheck.score})`);
        }
      }
    } else {
      // Use existing summary
      summaryInSource = summary?.summary_en || summary?.summary_si || summary?.summary_ta || '';
      console.log(`[Pipeline] Using existing summary for cluster ${cluster.id}`);
    }

    // Translate to all 3 languages - ensure all are always generated (only if summary was regenerated)
    let summaryEn: string, summarySi: string, summaryTa: string;
    const translationStatus: { en: boolean; si: boolean; ta: boolean } = { en: false, si: false, ta: false };
    
    if (needsSummary) {
      try {
        console.log(`[Pipeline] Starting translation from ${sourceLang} to all languages...`);
        const translations = await translateToMultipleLanguages(summaryInSource, sourceLang);
        summaryEn = translations.en;
        summarySi = translations.si;
        summaryTa = translations.ta;
        
        // Track which translations succeeded
      translationStatus.en = !!summaryEn && summaryEn.trim().length > 0;
      translationStatus.si = !!summarySi && summarySi.trim().length > 0;
      translationStatus.ta = !!summaryTa && summaryTa.trim().length > 0;
      
      // Validate translation quality for each language
      if (translationStatus.en && sourceLang !== 'en') {
        const enQuality = validateTranslationQuality(summaryInSource, summaryEn, sourceLang, 'en');
        if (!enQuality.isValid || enQuality.score < 75) {
          console.warn(`[Pipeline] English translation quality check failed (score: ${enQuality.score}):`, enQuality.issues);
          // Retry translation if quality is poor
          if (enQuality.score < 65) {
            try {
              console.log('[Pipeline] Retrying English translation due to poor quality...');
              summaryEn = await translateFromTo(summaryInSource, sourceLang, 'en');
              const retryQuality = validateTranslationQuality(summaryInSource, summaryEn, sourceLang, 'en');
              if (!retryQuality.isValid || retryQuality.score < 75) {
                console.warn(`[Pipeline] Retry English translation also failed quality check (score: ${retryQuality.score})`);
              } else {
                console.log(`[Pipeline] Retry English translation passed quality check (score: ${retryQuality.score})`);
              }
            } catch (err) {
              console.error('[Pipeline] English translation retry failed:', err);
            }
          }
        } else {
          console.log(`[Pipeline] English translation quality check passed (score: ${enQuality.score})`);
        }
      }
      
      if (translationStatus.si && sourceLang !== 'si') {
        const siQuality = validateTranslationQuality(summaryInSource, summarySi, sourceLang, 'si');
        if (!siQuality.isValid || siQuality.score < 75) {
          console.warn(`[Pipeline] Sinhala translation quality check failed (score: ${siQuality.score}):`, siQuality.issues);
          // Retry translation if quality is poor
          if (siQuality.score < 65) {
            try {
              console.log('[Pipeline] Retrying Sinhala translation due to poor quality...');
              const sourceForSi = sourceLang === 'en' ? summaryEn : summaryInSource;
              const sourceLangForSi = sourceLang === 'en' ? 'en' : sourceLang;
              summarySi = await translateFromTo(sourceForSi, sourceLangForSi, 'si');
              const retryQuality = validateTranslationQuality(sourceForSi, summarySi, sourceLangForSi, 'si');
              if (!retryQuality.isValid || retryQuality.score < 75) {
                console.warn(`[Pipeline] Retry Sinhala translation also failed quality check (score: ${retryQuality.score})`);
              } else {
                console.log(`[Pipeline] Retry Sinhala translation passed quality check (score: ${retryQuality.score})`);
              }
            } catch (err) {
              console.error('[Pipeline] Sinhala translation retry failed:', err);
            }
          }
        } else {
          console.log(`[Pipeline] Sinhala translation quality check passed (score: ${siQuality.score})`);
        }
      }
      
      if (translationStatus.ta && sourceLang !== 'ta') {
        const taQuality = validateTranslationQuality(summaryInSource, summaryTa, sourceLang, 'ta');
        if (!taQuality.isValid || taQuality.score < 75) {
          console.warn(`[Pipeline] Tamil translation quality check failed (score: ${taQuality.score}):`, taQuality.issues);
          // Retry translation if quality is poor
          if (taQuality.score < 65) {
            try {
              console.log('[Pipeline] Retrying Tamil translation due to poor quality...');
              const sourceForTa = sourceLang === 'en' ? summaryEn : summaryInSource;
              const sourceLangForTa = sourceLang === 'en' ? 'en' : sourceLang;
              summaryTa = await translateFromTo(sourceForTa, sourceLangForTa, 'ta');
              const retryQuality = validateTranslationQuality(sourceForTa, summaryTa, sourceLangForTa, 'ta');
              if (!retryQuality.isValid || retryQuality.score < 75) {
                console.warn(`[Pipeline] Retry Tamil translation also failed quality check (score: ${retryQuality.score})`);
              } else {
                console.log(`[Pipeline] Retry Tamil translation passed quality check (score: ${retryQuality.score})`);
              }
            } catch (err) {
              console.error('[Pipeline] Tamil translation retry failed:', err);
            }
          }
        } else {
          console.log(`[Pipeline] Tamil translation quality check passed (score: ${taQuality.score})`);
        }
      }
      
      // Validate all 3 languages are present and non-empty
      if (!translationStatus.en || !translationStatus.si || !translationStatus.ta) {
        console.warn(`[Pipeline] Some translations failed: en=${translationStatus.en}, si=${translationStatus.si}, ta=${translationStatus.ta}`);
        
        // Retry failed translations individually with simpler approach
        if (!translationStatus.en) {
          try {
            summaryEn = await translateFromTo(summaryInSource, sourceLang, 'en');
            translationStatus.en = !!summaryEn && summaryEn.trim().length > 0;
          } catch (err) {
            console.error('[Pipeline] English translation retry failed:', err);
            summaryEn = summaryInSource;
          }
        }
        
        if (!translationStatus.si) {
          try {
            summarySi = await translateFromTo(summaryEn || summaryInSource, 'en', 'si');
            translationStatus.si = !!summarySi && summarySi.trim().length > 0;
          } catch (err) {
            console.error('[Pipeline] Sinhala translation retry failed:', err);
            summarySi = summaryEn || summaryInSource;
          }
        }
        
        if (!translationStatus.ta) {
          try {
            summaryTa = await translateFromTo(summaryEn || summaryInSource, 'en', 'ta');
            translationStatus.ta = !!summaryTa && summaryTa.trim().length > 0;
          } catch (err) {
            console.error('[Pipeline] Tamil translation retry failed:', err);
            summaryTa = summaryEn || summaryInSource;
          }
        }
      }
      
      console.log(`[Pipeline] Translation complete: en=${translationStatus.en}, si=${translationStatus.si}, ta=${translationStatus.ta}`);
      } catch (error) {
        console.error('[Pipeline] Multi-language translation failed, using fallback:', error);
        // Fallback: Always ensure all 3 languages are set
        // If source was English, translate to Si/Ta; otherwise translate to English first
        if (sourceLang === 'en') {
          summaryEn = summaryInSource;
          translationStatus.en = true;
          // Try to translate to Si and Ta, fallback to English if fails
          try {
            summarySi = await translateSummary(summaryEn, 'si');
            translationStatus.si = !!summarySi && summarySi.trim().length > 0;
          } catch {
            console.warn('[Pipeline] Sinhala translation failed, using English fallback');
            summarySi = summaryEn;
          }
          try {
            summaryTa = await translateSummary(summaryEn, 'ta');
            translationStatus.ta = !!summaryTa && summaryTa.trim().length > 0;
          } catch {
            console.warn('[Pipeline] Tamil translation failed, using English fallback');
            summaryTa = summaryEn;
          }
        } else {
          // Source is Si or Ta - translate to English first, then to other languages
          try {
            // First translate to English
            summaryEn = await translateFromTo(summaryInSource, sourceLang, 'en');
            translationStatus.en = !!summaryEn && summaryEn.trim().length > 0;
            
            // Set source language summary
            if (sourceLang === 'si') {
              summarySi = summaryInSource;
              translationStatus.si = true;
              // Translate English to Tamil
              try {
                summaryTa = await translateFromTo(summaryEn, 'en', 'ta');
                translationStatus.ta = !!summaryTa && summaryTa.trim().length > 0;
              } catch {
                console.warn('[Pipeline] Tamil translation failed, using English fallback');
                summaryTa = summaryEn;
              }
            } else {
              // Tamil source
              summaryTa = summaryInSource;
              translationStatus.ta = true;
              // Translate English to Sinhala
              try {
                summarySi = await translateFromTo(summaryEn, 'en', 'si');
                translationStatus.si = !!summarySi && summarySi.trim().length > 0;
              } catch {
                console.warn('[Pipeline] Sinhala translation failed, using English fallback');
                summarySi = summaryEn;
              }
            }
          } catch {
            // Ultimate fallback - use source for all
            console.error('[Pipeline] All translation attempts failed, using source language for all');
            summaryEn = summaryInSource;
            summarySi = summaryInSource;
            summaryTa = summaryInSource;
          }
        }
      }
    } else {
      // Use existing summaries
      summaryEn = summary?.summary_en || summaryInSource;
      summarySi = summary?.summary_si || summaryInSource;
      summaryTa = summary?.summary_ta || summaryInSource;
      console.log(`[Pipeline] Using existing summaries for cluster ${cluster.id}`);
    }
    
    // Final validation - ensure all 3 are non-empty and meet minimum length
    const minLength = 20; // Minimum characters for a valid summary
    if (!summaryEn || summaryEn.trim().length < minLength) {
      console.error('[Pipeline] CRITICAL: English summary is invalid');
      summaryEn = summaryEn || summaryInSource || 'Summary unavailable';
    }
    if (!summarySi || summarySi.trim().length < minLength) {
      console.warn('[Pipeline] Sinhala summary is invalid, using English fallback');
      summarySi = summaryEn;
    }
    if (!summaryTa || summaryTa.trim().length < minLength) {
      console.warn('[Pipeline] Tamil summary is invalid, using English fallback');
      summaryTa = summaryEn;
    }

    // Generate comprehensive SEO metadata with topic/district/entity extraction
    let seoEn, seoSi, seoTa, topic, topics, district, primaryEntity, eventType, imageUrl;
    let headlineSi: string | null = latestCluster?.headline_si || null;
    let headlineTa: string | null = latestCluster?.headline_ta || null;
    
    // Generate headlines if needed (even if summary already exists)
    // Note: sourceLang is already detected above (line 508-535)
    if (needsHeadlines) {
      console.log(`[Pipeline] Generating headlines for cluster ${cluster.id} (SI: ${headlineSi ? 'exists' : 'missing'}, TA: ${headlineTa ? 'exists' : 'missing'})`);
      
      // Get source headline - try to get from first article if source is Tamil/Sinhala
      let sourceHeadline = cluster.headline;
      if ((sourceLang === 'si' || sourceLang === 'ta') && articles && articles.length > 0) {
        const firstArticleTitle = articles[0]?.title;
        if (firstArticleTitle && firstArticleTitle.trim().length > 0) {
          sourceHeadline = firstArticleTitle;
          console.log(`[Pipeline] Using source language article title as headline: ${sourceHeadline.substring(0, 60)}...`);
        }
      }
      
      let headlineEn = cluster.headline; // Default to cluster headline
      
      // If source is Sinhala or Tamil, translate to English first
      if (sourceLang === 'si' || sourceLang === 'ta') {
        try {
          console.log(`[Pipeline] Translating headline from ${sourceLang} to English first...`);
          headlineEn = await translateHeadline(sourceHeadline, sourceLang, 'en');
          if (!headlineEn || headlineEn.trim().length === 0) {
            headlineEn = cluster.headline; // Fallback to original
          }
        } catch (err) {
          console.warn(`[Pipeline] Failed to translate headline to English from ${sourceLang}, using original:`, err);
          headlineEn = cluster.headline;
        }
      }
      
      // Generate Sinhala headline if missing
      if (!headlineSi) {
        let headlineSiQuality = { score: 0, isValid: false, issues: [] as string[] };
        if (sourceLang === 'si') {
          headlineSi = sourceHeadline;
          console.log(`[Pipeline] Using source Sinhala headline directly: ${headlineSi}`);
          headlineSiQuality = { score: 100, isValid: true, issues: [] };
        } else {
          try {
            const fromLang = 'en';
            const sourceForSi = headlineEn || cluster.headline;
            if (sourceForSi && sourceForSi.trim().length > 0) {
              headlineSi = await translateHeadline(sourceForSi, fromLang, 'si');
              if (headlineSi && headlineSi.trim().length > 0) {
                headlineSiQuality = validateHeadlineTranslationQuality(sourceForSi, headlineSi, fromLang, 'si');
                if (!headlineSiQuality.isValid || headlineSiQuality.score < 70) {
                  console.warn(`[Pipeline] Sinhala headline quality check failed (score: ${headlineSiQuality.score})`);
                  if (headlineSiQuality.score < 60) {
                    try {
                      console.log('[Pipeline] Retrying Sinhala headline translation...');
                      headlineSi = await translateHeadline(sourceForSi, fromLang, 'si');
                      if (headlineSi && headlineSi.trim().length > 0) {
                        headlineSiQuality = validateHeadlineTranslationQuality(sourceForSi, headlineSi, fromLang, 'si');
                      }
                    } catch (retryErr) {
                      console.error('[Pipeline] Sinhala headline translation retry failed:', retryErr);
                    }
                  }
                } else {
                  console.log(`[Pipeline] Sinhala headline quality check passed (score: ${headlineSiQuality.score})`);
                }
                console.log(`[Pipeline] Generated Sinhala headline: ${headlineSi}`);
              } else {
                headlineSi = sourceForSi; // Fallback to English
              }
            }
          } catch (err) {
            console.error(`[Pipeline] Failed to translate headline to Sinhala: ${err instanceof Error ? err.message : 'Unknown error'}`);
            headlineSi = headlineEn || cluster.headline || null;
          }
        }
        if (headlineSiQuality.score < 70 && headlineSi) {
          console.warn(`[Pipeline] ⚠️ Low Sinhala headline quality score (${headlineSiQuality.score}) for cluster ${cluster.id}`);
        }
      }
      
      // Generate Tamil headline if missing
      if (!headlineTa) {
        let headlineTaQuality = { score: 0, isValid: false, issues: [] as string[] };
        if (sourceLang === 'ta') {
          headlineTa = sourceHeadline;
          console.log(`[Pipeline] Using source Tamil headline directly: ${headlineTa}`);
          headlineTaQuality = { score: 100, isValid: true, issues: [] };
        } else {
          try {
            const fromLang = 'en';
            const sourceForTa = headlineEn || cluster.headline;
            if (sourceForTa && sourceForTa.trim().length > 0) {
              headlineTa = await translateHeadline(sourceForTa, fromLang, 'ta');
              if (headlineTa && headlineTa.trim().length > 0) {
                headlineTaQuality = validateHeadlineTranslationQuality(sourceForTa, headlineTa, fromLang, 'ta');
                if (!headlineTaQuality.isValid || headlineTaQuality.score < 70) {
                  console.warn(`[Pipeline] Tamil headline quality check failed (score: ${headlineTaQuality.score})`);
                  if (headlineTaQuality.score < 60) {
                    try {
                      console.log('[Pipeline] Retrying Tamil headline translation...');
                      headlineTa = await translateHeadline(sourceForTa, fromLang, 'ta');
                      if (headlineTa && headlineTa.trim().length > 0) {
                        headlineTaQuality = validateHeadlineTranslationQuality(sourceForTa, headlineTa, fromLang, 'ta');
                      }
                    } catch (retryErr) {
                      console.error('[Pipeline] Tamil headline translation retry failed:', retryErr);
                    }
                  }
                } else {
                  console.log(`[Pipeline] Tamil headline quality check passed (score: ${headlineTaQuality.score})`);
                }
                console.log(`[Pipeline] Generated Tamil headline: ${headlineTa}`);
              } else {
                headlineTa = sourceForTa; // Fallback to English
              }
            }
          } catch (err) {
            console.error(`[Pipeline] Failed to translate headline to Tamil: ${err instanceof Error ? err.message : 'Unknown error'}`);
            headlineTa = headlineEn || cluster.headline || null;
          }
        }
        if (headlineTaQuality.score < 70 && headlineTa) {
          console.warn(`[Pipeline] ⚠️ Low Tamil headline quality score (${headlineTaQuality.score}) for cluster ${cluster.id}`);
        }
      }
    }
    
    // Always generate SEO metadata (even if summary already exists)
    // This ensures meta titles and descriptions are always up-to-date
    try {
      // Check if cluster already has "other" topic - preserve it and don't reassign
      const existingTopic = cluster.topic ? normalizeTopicSlug(cluster.topic) : null;
      const isOtherTopic = existingTopic === 'other';
      
      // Generate comprehensive SEO for English (includes topic, district, entities)
      const comprehensiveSEO = await generateComprehensiveSEO(
        summaryEn,
        cluster.headline,
        articles || [],
        'en',
        isOtherTopic ? 'other' : undefined // Pass existing "other" topic to preserve it
      );

      seoEn = {
        title: comprehensiveSEO.seo_title,
        description: comprehensiveSEO.meta_description
      };

      // Preserve "other" topic if it was already assigned
      topic = isOtherTopic ? 'other' : comprehensiveSEO.topic;
      
      // Ensure topics array always has at least 2 topics (geographic + content)
      let topicsArray = isOtherTopic 
        ? ['sri-lanka', 'other'] 
        : (comprehensiveSEO.topics || []);
      
      // Validate and ensure 2-topic system
      if (!Array.isArray(topicsArray) || topicsArray.length === 0) {
        topicsArray = [comprehensiveSEO.topic || 'politics'];
      }
      
      // Check if we have geographic and content topics
      const hasGeographic = topicsArray.some(t => t === 'sri-lanka' || t === 'world');
      const hasContent = topicsArray.some(t => 
        ['politics', 'economy', 'sports', 'crime', 'education', 'health', 'environment', 'technology', 'culture', 'society', 'other'].includes(t)
      );
      
      // Add geographic topic if missing
      if (!hasGeographic) {
        topicsArray.unshift('sri-lanka'); // Default to sri-lanka for local news
      }
      
      // Add content topic if missing
      if (!hasContent) {
        const primaryTopic = comprehensiveSEO.topic || 'politics';
        if (!topicsArray.includes(primaryTopic)) {
          topicsArray.push(primaryTopic);
        }
      }
      
      // Ensure minimum 2 topics
      if (topicsArray.length < 2) {
        const primaryTopic = comprehensiveSEO.topic || 'politics';
        if (!topicsArray.includes(primaryTopic)) {
          topicsArray.push(primaryTopic);
        }
        if (!topicsArray.includes('sri-lanka') && !topicsArray.includes('world')) {
          topicsArray.unshift('sri-lanka');
        }
      }
      
      topics = topicsArray;
      district = comprehensiveSEO.district;
      primaryEntity = comprehensiveSEO.primary_entity;
      eventType = comprehensiveSEO.event_type;
      
      // Headlines are already generated above if needed (see needsHeadlines block)
      // Use existing headlines or fallback to English headline for SEO

      // Collect images from all sources with priority scoring
      const availableImages: Array<{ url: string; source: string; priority: number }> = [];
      
      // 0. Check if cluster already has a good image_url (Priority 1.5 - highest, reuse existing)
      if (cluster.image_url && typeof cluster.image_url === 'string' && cluster.image_url.startsWith('http')) {
        // Validate existing image is still valid
        try {
          new URL(cluster.image_url);
          availableImages.push({
            url: cluster.image_url,
            source: 'Existing Cluster',
            priority: 1.5
          });
          console.log(`[Pipeline] Found existing image for cluster ${cluster.id}: ${cluster.image_url.substring(0, 60)}...`);
        } catch {
          // Invalid URL, ignore
        }
      }
      
      // 1. Collect images from article image_url fields (Priority 1.0 - high)
      articles?.forEach(article => {
        if (article.image_url && typeof article.image_url === 'string' && article.image_url.startsWith('http')) {
          try {
            new URL(article.image_url); // Validate URL
            availableImages.push({
              url: article.image_url,
              source: 'RSS Feed',
              priority: 1.0
            });
          } catch {
            // Invalid URL, skip
          }
        }
      });
      
      // 1b. Collect images from image_urls array (Priority 1.0 - high)
      articles?.forEach(article => {
        if ((article as any).image_urls && Array.isArray((article as any).image_urls)) {
          (article as any).image_urls.forEach((imgUrl: string) => {
            if (imgUrl && typeof imgUrl === 'string' && imgUrl.startsWith('http')) {
              try {
                new URL(imgUrl); // Validate URL
                availableImages.push({
                  url: imgUrl,
                  source: 'RSS Feed',
                  priority: 1.0
                });
              } catch {
                // Invalid URL, skip
              }
            }
          });
        }
      });
      
      // 2. Extract images from article HTML content (Priority 0.8)
      articles?.forEach(article => {
        // Use content_html if available, fallback to content_text/content_excerpt
        const html = (article as any).content_html || article.content_text || article.content_excerpt || '';
        const articleUrl = (article as any).url || '';
        if (html && articleUrl && typeof html === 'string' && html.includes('<img')) {
          try {
            const extractedImages = extractAllImagesFromHtml(html, articleUrl);
            extractedImages.forEach(imgUrl => {
              if (imgUrl && typeof imgUrl === 'string' && imgUrl.startsWith('http')) {
                try {
                  new URL(imgUrl); // Validate URL
                  availableImages.push({
                    url: imgUrl,
                    source: 'Article Content',
                    priority: 0.8
                  });
                } catch {
                  // Invalid URL, skip
                }
              }
            });
          } catch (error) {
            console.warn('[Pipeline] Error extracting images from HTML:', error);
          }
        }
      });
      
      // 3. Optionally fetch article pages if we have few images (rate-limited, Priority 0.6)
      const rssImageCount = availableImages.filter(img => img.source === 'RSS Feed' || img.source === 'Existing Cluster').length;
      const contentImageCount = availableImages.filter(img => img.source === 'Article Content').length;
      
      // Only fetch if we have less than 3 images total (need more options for better selection)
      if ((rssImageCount + contentImageCount) < 3 && articles && articles.length > 0) {
        // Only fetch from first article to avoid rate limiting
        const firstArticle = articles[0];
        const articleUrl = (firstArticle as any).url;
        if (articleUrl && typeof articleUrl === 'string' && articleUrl.startsWith('http')) {
          try {
            console.log(`[Pipeline] Fetching article page (only ${rssImageCount + contentImageCount} images found): ${articleUrl}`);
            const pageImages = await fetchArticleImages(articleUrl);
            pageImages.forEach(imgUrl => {
              if (imgUrl && typeof imgUrl === 'string' && imgUrl.startsWith('http')) {
                try {
                  new URL(imgUrl); // Validate URL
                  availableImages.push({
                    url: imgUrl,
                    source: 'Article Page',
                    priority: 0.6
                  });
                } catch {
                  // Invalid URL, skip
                }
              }
            });
            console.log(`[Pipeline] Found ${pageImages.length} additional images from article page`);
          } catch (error) {
            console.warn('[Pipeline] Error fetching article page images:', error);
          }
        }
      }
      
      // Deduplicate images by URL and sort by priority
      const uniqueImages = Array.from(
        new Map(availableImages.map(img => [img.url, img])).values()
      ).sort((a, b) => b.priority - a.priority); // Sort by priority (highest first)
      
      const imageStats = {
        rss: availableImages.filter(img => img.source === 'RSS Feed').length,
        content: availableImages.filter(img => img.source === 'Article Content').length,
        page: availableImages.filter(img => img.source === 'Article Page').length,
        total: uniqueImages.length
      };
      
      console.log(`[Pipeline] Image collection stats for cluster ${cluster.id}:`, imageStats);
      
      if (uniqueImages.length > 0) {
        try {
          // Use English summary for image selection, or fallback to headline
          const summaryForImage = summaryEn || cluster.headline || '';
          const headlineForImage = cluster.headline || '';
          
          // Only use AI selection if we have multiple images and a meaningful summary/headline
          if (uniqueImages.length > 1 && (summaryForImage.length > 50 || headlineForImage.length > 20)) {
            // Convert to format expected by selectBestImage (remove priority field)
            const imagesForSelection = uniqueImages.map(img => ({ url: img.url, source: img.source }));
            imageUrl = await selectBestImage(imagesForSelection, headlineForImage, summaryForImage);
            if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim().length > 0) {
              console.log(`[Pipeline] ✅ AI selected best image from ${uniqueImages.length} options for cluster ${cluster.id}: ${imageUrl.substring(0, 80)}...`);
            } else {
              console.warn(`[Pipeline] ⚠️ AI image selection returned invalid result, using highest priority image`);
              imageUrl = uniqueImages[0].url; // Already sorted by priority
            }
          } else {
            // Use highest priority image if only one image or insufficient context
            imageUrl = uniqueImages[0].url;
            console.log(`[Pipeline] Using highest priority image (${uniqueImages.length} available, priority: ${uniqueImages[0].priority}): ${imageUrl.substring(0, 80)}...`);
          }
          
          // Final validation of selected image URL
          if (imageUrl && typeof imageUrl === 'string') {
            try {
              new URL(imageUrl);
              // Ensure it's a valid HTTP(S) URL
              if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
                console.warn(`[Pipeline] ⚠️ Selected image URL is not HTTP(S), using fallback`);
                imageUrl = uniqueImages.find(img => img.url.startsWith('http'))?.url || null;
              }
            } catch {
              console.warn(`[Pipeline] ⚠️ Selected image URL is invalid, using fallback`);
              imageUrl = uniqueImages.find(img => {
                try {
                  new URL(img.url);
                  return img.url.startsWith('http');
                } catch {
                  return false;
                }
              })?.url || null;
            }
          }
        } catch (error) {
          console.error('[Pipeline] ❌ Image selection failed, using highest priority image:', error);
          // Find first valid HTTP(S) URL as fallback
          imageUrl = uniqueImages.find(img => {
            try {
              new URL(img.url);
              return img.url.startsWith('http');
            } catch {
              return false;
            }
          })?.url || null;
        }
      } else {
        imageUrl = null;
        console.warn(`[Pipeline] ⚠️ No images found for cluster ${cluster.id} - checked ${imageStats.rss} RSS, ${imageStats.content} content, ${imageStats.page} page images`);
      }

      // Generate SEO for other languages using translated headlines
      // Use translated headlines if available, otherwise use English headline
      const headlineForSi = headlineSi || cluster.headline;
      const headlineForTa = headlineTa || cluster.headline;
      
      [seoSi, seoTa] = await Promise.all([
        generateSEOMetadata(summarySi, headlineForSi, 'si').catch(() => ({
          title: headlineForSi.slice(0, 60),
          description: summarySi.slice(0, 160)
        })),
        generateSEOMetadata(summaryTa, headlineForTa, 'ta').catch(() => ({
          title: headlineForTa.slice(0, 60),
          description: summaryTa.slice(0, 160)
        }))
      ]);
    } catch (err) {
      errors.push({ stage: 'seo', message: `SEO generation failed: ${err instanceof Error ? err.message : 'unknown'}` });
      // Fallback to simple metadata
      seoEn = { title: cluster.headline.slice(0, 60), description: summaryEn.slice(0, 160) };
      seoSi = { title: cluster.headline.slice(0, 60), description: summarySi.slice(0, 160) };
      seoTa = { title: cluster.headline.slice(0, 60), description: summaryTa.slice(0, 160) };
      topic = 'politics';
      topics = ['sri-lanka', 'politics']; // Always ensure 2 topics (geographic + content)
      district = null;
      primaryEntity = null;
      eventType = null;
      imageUrl = articles?.find(a => a.image_url)?.image_url || null;
      
      // Try to generate headlines even in error case
      try {
        const fallbackHeadline = cluster.headline || '';
        if (fallbackHeadline.trim().length > 0) {
          headlineSi = await translateHeadline(fallbackHeadline, 'en', 'si').catch(() => fallbackHeadline);
          headlineTa = await translateHeadline(fallbackHeadline, 'en', 'ta').catch(() => fallbackHeadline);
        } else {
          headlineSi = null;
          headlineTa = null;
        }
      } catch {
        headlineSi = null;
        headlineTa = null;
      }
    }

    // Generate slug from English meta title (stable, don't regenerate if exists)
    const existingSlug = cluster.id ? await getClusterSlug(cluster.id) : null;
    let slug = existingSlug || generateSlug(seoEn.title);
    
    // Ensure slug uniqueness (append cluster ID if needed)
    if (!existingSlug) {
      const { data: existing } = await supabaseAdmin
        .from('clusters')
        .select('id')
        .eq('slug', slug)
        .neq('id', cluster.id)
        .single();
      
      if (existing) {
        // Slug exists, append short cluster ID
        slug = `${slug}-${cluster.id.slice(0, 8)}`;
      }
    }

    // Validate meta titles are not duplicates (check English title)
    const { data: duplicateTitle } = await supabaseAdmin
      .from('clusters')
      .select('id')
      .eq('meta_title_en', seoEn.title)
      .neq('id', cluster.id)
      .single();
    
    if (duplicateTitle) {
      // Append cluster ID to title to ensure uniqueness
      seoEn.title = `${seoEn.title.slice(0, 50)} | ${cluster.id.slice(0, 8)}`;
    }

    // Get published_at from earliest article or use current time
    const earliestArticle = articles?.[articles.length - 1];
    const publishedAt = earliestArticle?.published_at || new Date().toISOString();

    // Generate key facts, confirmed vs differs, and keywords
    let keyFactsEn: string[] = [], keyFactsSi: string[] = [], keyFactsTa: string[] = [];
    let confirmedDiffersEn = '', confirmedDiffersSi = '', confirmedDiffersTa = '';
    let keywords: string[] = [];

    try {
      console.log('[Pipeline] Generating key facts, confirmed vs differs, and keywords...');
      
      // Generate key facts for all languages
      [keyFactsEn, keyFactsSi, keyFactsTa] = await Promise.all([
        generateKeyFacts(sourcePayload, summaryEn, 'en').catch(() => []),
        generateKeyFacts(sourcePayload, summarySi, 'si').catch(() => []),
        generateKeyFacts(sourcePayload, summaryTa, 'ta').catch(() => [])
      ]);

      // Generate confirmed vs differs for all languages
      [confirmedDiffersEn, confirmedDiffersSi, confirmedDiffersTa] = await Promise.all([
        generateConfirmedVsDiffers(sourcePayload, summaryEn, 'en').catch(() => ''),
        generateConfirmedVsDiffers(sourcePayload, summarySi, 'si').catch(() => ''),
        generateConfirmedVsDiffers(sourcePayload, summaryTa, 'ta').catch(() => '')
      ]);

      // Generate keywords (once, language-agnostic)
      keywords = await generateKeywords(
        cluster.headline,
        summaryEn,
        topic,
        district,
        primaryEntity,
        eventType
      ).catch(() => {
        // Fallback keywords
        const fallback: string[] = ['Sri Lanka'];
        if (topic) fallback.push(topic);
        if (district) fallback.push(district);
        return fallback;
      });

      console.log(`[Pipeline] Generated ${keyFactsEn.length} key facts, keywords: ${keywords.join(', ')}`);
    } catch (error) {
      console.error('[Pipeline] Error generating key facts/confirmed vs differs/keywords:', error);
      // Continue with empty values - these are optional enhancements
    }

    // Save summaries with new SEO content fields, translation status, and quality score
    await supabaseAdmin.from('summaries').upsert(
      {
        cluster_id: cluster.id,
        summary_en: summaryEn,
        summary_si: summarySi,
        summary_ta: summaryTa,
        key_facts_en: keyFactsEn.length > 0 ? keyFactsEn : null,
        key_facts_si: keyFactsSi.length > 0 ? keyFactsSi : null,
        key_facts_ta: keyFactsTa.length > 0 ? keyFactsTa : null,
        confirmed_vs_differs_en: confirmedDiffersEn || null,
        confirmed_vs_differs_si: confirmedDiffersSi || null,
        confirmed_vs_differs_ta: confirmedDiffersTa || null,
        translation_status: translationStatus,
        summary_quality_score: summaryQualityScore,
        model: env.SUMMARY_MODEL,
        prompt_version: 'v1-title-excerpt',
        version: summary?.version ? summary.version + 1 : 1,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'cluster_id' }
    );
    
    // Log translation status and quality for monitoring
    console.log(`[Pipeline] Cluster ${cluster.id} - Translation: en=${translationStatus.en}, si=${translationStatus.si}, ta=${translationStatus.ta}, Quality: ${summaryQualityScore}`);
    if (!translationStatus.en || !translationStatus.si || !translationStatus.ta) {
      console.warn(`[Pipeline] ⚠️ Translation incomplete for cluster ${cluster.id}:`, translationStatus);
    }
    if (summaryQualityScore < 70) {
      console.warn(`[Pipeline] ⚠️ Low quality score (${summaryQualityScore}) for cluster ${cluster.id}`);
    }

    // Ensure topics array always has at least 2 topics before saving
    if (!Array.isArray(topics) || topics.length < 2) {
      console.warn(`[Pipeline] ⚠️ Topics array has less than 2 topics for cluster ${cluster.id}, fixing...`);
      const hasGeographic = topics?.some((t: string) => t === 'sri-lanka' || t === 'world') || false;
      const hasContent = topics?.some((t: string) => 
        ['politics', 'economy', 'sports', 'crime', 'education', 'health', 'environment', 'technology', 'culture', 'society', 'other'].includes(t)
      ) || false;
      
      if (!hasGeographic) {
        topics = ['sri-lanka', ...(topics || [])];
      }
      if (!hasContent) {
        topics = [...(topics || []), topic || 'politics'];
      }
      // Final check - ensure at least 2
      if (topics.length < 2) {
        topics = ['sri-lanka', topic || 'politics'];
      }
      console.log(`[Pipeline] Fixed topics array: ${JSON.stringify(topics)}`);
    }
    
    // Log headline status before saving
    console.log(`[Pipeline] Saving headlines for cluster ${cluster.id}:`);
    console.log(`  - English: ${cluster.headline?.substring(0, 60)}...`);
    console.log(`  - Sinhala: ${headlineSi ? headlineSi.substring(0, 60) + '...' : 'NULL (not generated)'}`);
    console.log(`  - Tamil: ${headlineTa ? headlineTa.substring(0, 60) + '...' : 'NULL (not generated)'}`);
    console.log(`  - Topics: ${JSON.stringify(topics)} (should have at least 2: geographic + content)`);
    
    // Update cluster with comprehensive SEO metadata and publish
    const updateResult = await supabaseAdmin.from('clusters').update({
      status: 'published',
      meta_title_en: seoEn.title,
      meta_description_en: seoEn.description,
      meta_title_si: seoSi.title,
      meta_description_si: seoSi.description,
      meta_title_ta: seoTa.title,
      meta_description_ta: seoTa.description,
      slug: slug,
      published_at: publishedAt,
      topic: topic,
      topics: topics, // Multi-topic array (always has at least 2: geographic + content)
      headline_si: headlineSi && headlineSi.trim().length > 0 ? headlineSi.trim() : null, // Save if valid
      headline_ta: headlineTa && headlineTa.trim().length > 0 ? headlineTa.trim() : null, // Save if valid
      city: district, // Keep city field for backward compatibility, but use district value
      primary_entity: primaryEntity,
      event_type: eventType,
      image_url: imageUrl,
      language: 'en', // Primary language (can be enhanced later)
      keywords: keywords.length > 0 ? keywords : null,
      last_checked_at: new Date().toISOString()
    }).eq('id', cluster.id);

    if (updateResult.error) {
      errors.push({ stage: 'seo', message: `Failed to update cluster SEO metadata: ${updateResult.error.message}` });
      console.error(`[Pipeline] ❌ Failed to save headlines for cluster ${cluster.id}:`, updateResult.error);
    } else {
      console.log(`[Pipeline] ✅ Successfully saved headlines for cluster ${cluster.id} (SI: ${headlineSi ? 'yes' : 'no'}, TA: ${headlineTa ? 'yes' : 'no'})`);
    }

    // Update all articles in this cluster with district information
    if (district && articles && articles.length > 0) {
      const articleIds = articles.map(a => a.id).filter(Boolean);
      if (articleIds.length > 0) {
        await supabaseAdmin
          .from('articles')
          .update({ district })
          .in('id', articleIds);
      }
    }

    summarized += 1;
  }
  return summarized;
}

