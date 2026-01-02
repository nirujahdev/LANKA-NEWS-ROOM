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
import { ensureHeadlineTranslations, ensureSummaryTranslations, generateQualityControlledSummary, selectBestImageWithQuality } from './pipelineEnhanced';
import {
  orchestrateSummaryGeneration,
  orchestrateTranslation,
  orchestrateSEOGeneration,
  orchestrateImageSelection,
} from './agents/orchestrator';
import { orchestrateCategorization } from './agents/orchestrator';

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
      // Use agent orchestrator for categorization
      const categoryResult = await orchestrateCategorization(articles);
      await supabaseAdmin
        .from('clusters')
        .update({ category: categoryResult.category })
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
      .select('headline_si, headline_ta, topics, meta_title_en, meta_title_si, meta_title_ta, meta_description_en, meta_description_si, meta_description_ta, source_count, image_url, headline_translation_quality_si, headline_translation_quality_ta')
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
    // IMPORTANT: Check if headlines are missing OR quality is low
    const needsHeadlines = !latestCluster?.headline_si || !latestCluster?.headline_ta || 
                          (latestCluster?.headline_translation_quality_si || 0) < 0.7 || 
                          (latestCluster?.headline_translation_quality_ta || 0) < 0.7;
    // Always check if SEO metadata needs to be generated (meta titles/descriptions)
    const needsSEO = !latestCluster?.meta_title_en || !latestCluster?.meta_title_si || !latestCluster?.meta_title_ta || 
                     !latestCluster?.meta_description_en || !latestCluster?.meta_description_si || !latestCluster?.meta_description_ta;
    // Check if image is missing
    const needsImage = !latestCluster?.image_url;
    
    // Skip only if summary exists, source count unchanged, headlines/topics are present, SEO is complete, AND image exists
    if (!needsSummary && !needsHeadlines && !needsSEO && !needsImage) {
      console.log(`[Pipeline] Skipping cluster ${cluster.id} - summary, headlines, SEO, and image already exist`);
      continue;
    }
    
    // Log what needs to be done
    if (needsHeadlines) console.log(`[Pipeline] Cluster ${cluster.id} needs headlines (SI: ${!!latestCluster?.headline_si}, TA: ${!!latestCluster?.headline_ta}, SI quality: ${latestCluster?.headline_translation_quality_si}, TA quality: ${latestCluster?.headline_translation_quality_ta})`);
    if (needsImage) console.log(`[Pipeline] Cluster ${cluster.id} needs image`);
    if (needsSummary) console.log(`[Pipeline] Cluster ${cluster.id} needs summary`);
    if (needsSEO) console.log(`[Pipeline] Cluster ${cluster.id} needs SEO`);

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

    // STEP 2: Generate quality-controlled summary (only if needed)
    let summaryEn: string;
    let summaryQualityScore = 0;
    
    if (needsSummary || (summary?.summary_quality_score_en || 0) < 0.7) {
      try {
        // Use agent orchestrator for summary generation
        const summaryResult = await orchestrateSummaryGeneration(
          sourcePayload.map(s => ({
            title: s.title,
            content: s.content,
            weight: s.weight,
            publishedAt: s.publishedAt,
          })),
          summary?.summary_en || null,
          sourceLang
        );
        
        summaryEn = summaryResult.summary;
        summaryQualityScore = summaryResult.qualityScore;
        
        console.log(`[Pipeline] ✅ Generated summary via orchestrator (quality: ${summaryQualityScore}, length: ${summaryResult.length}, sourceLang: ${summaryResult.sourceLang})`);
      } catch (error) {
        console.error('[Pipeline] ❌ Summary generation failed, falling back to standard:', {
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack?.split('\n').slice(0, 5).join('\n') : undefined,
          clusterId: cluster.id,
          articlesCount: sourcePayload.length,
          sourceLang,
          timestamp: new Date().toISOString(),
        });
        // Fallback to standard summarization
        if (sourceLang === 'en') {
          summaryEn = await summarizeEnglish(sourcePayload, summary?.summary_en);
        } else {
          summaryEn = await summarizeInSourceLanguage(sourcePayload, sourceLang, summary?.summary_en);
        }
        const qualityCheck = await validateSummaryQuality(summaryEn);
        summaryQualityScore = qualityCheck.score / 100;
      }
    } else {
      // Use existing summary
      summaryEn = summary?.summary_en || '';
      summaryQualityScore = summary?.summary_quality_score_en || 0.7;
      console.log(`[Pipeline] Using existing summary for cluster ${cluster.id} (quality: ${summaryQualityScore})`);
    }
    
    // STEP 3: Ensure summary translations (MANDATORY - uses agent orchestrator)
    let summarySi: string;
    let summaryTa: string;
    let summarySiQuality = 0;
    let summaryTaQuality = 0;
    let headlineSi: string | null = null;
    let headlineTa: string | null = null;
    let headlineQualitySi: number | null = null;
    let headlineQualityTa: number | null = null;
    
    // Get English headline (may need translation if source is Sinhala/Tamil)
    let headlineEn = cluster.headline;
    if ((sourceLang === 'si' || sourceLang === 'ta') && articles && articles.length > 0) {
      const firstArticleTitle = articles[0]?.title;
      if (firstArticleTitle && firstArticleTitle.trim().length > 0) {
        try {
          headlineEn = await translateHeadline(firstArticleTitle, sourceLang, 'en');
          if (!headlineEn || headlineEn.trim().length === 0) {
            headlineEn = cluster.headline; // Fallback
          }
        } catch (err) {
          console.warn(`[Pipeline] Failed to translate headline to English from ${sourceLang}, using original:`, err);
          headlineEn = cluster.headline;
        }
      }
    }
    
    // Use agent orchestrator for translations (headlines + summaries)
    if (needsHeadlines || needsSummary) {
      try {
        const translationResult = await orchestrateTranslation(
          cluster.id,
          headlineEn,
          summaryEn,
          errors
        );
        
        headlineSi = translationResult.headlineSi;
        headlineTa = translationResult.headlineTa;
        summarySi = translationResult.summarySi;
        summaryTa = translationResult.summaryTa;
        headlineQualitySi = translationResult.qualityScores.headlineSi;
        headlineQualityTa = translationResult.qualityScores.headlineTa;
        summarySiQuality = translationResult.qualityScores.summarySi;
        summaryTaQuality = translationResult.qualityScores.summaryTa;
        
        console.log(`[Pipeline] ✅ Translations ensured via orchestrator (SI quality: ${summarySiQuality}, TA quality: ${summaryTaQuality})`);
      } catch (err) {
        console.error(`[Pipeline] ❌ Failed to ensure translations via orchestrator:`, {
          errorType: err instanceof Error ? err.constructor.name : typeof err,
          errorMessage: err instanceof Error ? err.message : String(err),
          errorStack: err instanceof Error ? err.stack?.split('\n').slice(0, 5).join('\n') : undefined,
          clusterId: cluster.id,
          headlineLength: headlineEn.length,
          summaryLength: summaryEn.length,
          timestamp: new Date().toISOString(),
        });
        errors.push({ stage: 'translation', message: `Failed to ensure translations: ${err}` });
        // Fallback to enhanced functions
        try {
          const headlineResult = await ensureHeadlineTranslations(cluster.id, headlineEn, errors);
          const summaryResult = await ensureSummaryTranslations(cluster.id, summaryEn, errors);
          headlineSi = headlineResult.headlineSi;
          headlineTa = headlineResult.headlineTa;
          summarySi = summaryResult.summarySi;
          summaryTa = summaryResult.summaryTa;
          headlineQualitySi = headlineResult.qualitySi;
          headlineQualityTa = headlineResult.qualityTa;
          summarySiQuality = summaryResult.qualitySi;
          summaryTaQuality = summaryResult.qualityTa;
        } catch (fallbackErr) {
          // Final fallback
          headlineSi = latestCluster?.headline_si || null;
          headlineTa = latestCluster?.headline_ta || null;
          summarySi = summary?.summary_si || summaryEn;
          summaryTa = summary?.summary_ta || summaryEn;
          headlineQualitySi = latestCluster?.headline_translation_quality_si || null;
          headlineQualityTa = latestCluster?.headline_translation_quality_ta || null;
          summarySiQuality = summary?.summary_quality_score_si || 0;
          summaryTaQuality = summary?.summary_quality_score_ta || 0;
        }
      }
    } else {
      // Use existing translations
      headlineSi = latestCluster?.headline_si || null;
      headlineTa = latestCluster?.headline_ta || null;
      summarySi = summary?.summary_si || summaryEn;
      summaryTa = summary?.summary_ta || summaryEn;
      headlineQualitySi = latestCluster?.headline_translation_quality_si || null;
      headlineQualityTa = latestCluster?.headline_translation_quality_ta || null;
      summarySiQuality = summary?.summary_quality_score_si || 0;
      summaryTaQuality = summary?.summary_quality_score_ta || 0;
    }
    
    // Legacy translation status tracking (for compatibility)
    const translationStatus: { en: boolean; si: boolean; ta: boolean } = {
      en: !!summaryEn && summaryEn.trim().length > 0,
      si: !!summarySi && summarySi.trim().length > 0,
      ta: !!summaryTa && summaryTa.trim().length > 0
    };
    
    // Final validation - ensure all 3 are non-empty and meet minimum length
    const minLength = 20; // Minimum characters for a valid summary
    if (!summaryEn || summaryEn.trim().length < minLength) {
      console.error('[Pipeline] CRITICAL: English summary is invalid');
      summaryEn = summaryEn || 'Summary unavailable';
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
    let keyFactsEn: string[] = [];
    let keyFactsSi: string[] = [];
    let keyFactsTa: string[] = [];
    let confirmedDiffersEn = '';
    let confirmedDiffersSi = '';
    let confirmedDiffersTa = '';
    let keywords: string[] = [];
    
    // Always generate SEO metadata (even if summary already exists)
    // This ensures meta titles and descriptions are always up-to-date
    try {
      // Use agent orchestrator for SEO generation
      const seoResult = await orchestrateSEOGeneration(
        summaryEn,
        headlineEn,
        articles || []
      );
      
      seoEn = seoResult.seoEn;
      seoSi = seoResult.seoSi;
      seoTa = seoResult.seoTa;
      topic = seoResult.topics.find(t => t !== 'sri-lanka' && t !== 'world') || 'politics';
      topics = seoResult.topics;
      district = seoResult.district;
      primaryEntity = seoResult.entities.primary_entity;
      eventType = seoResult.entities.event_type;
      keywords = seoResult.keywords;
      keyFactsEn = seoResult.keyFacts.en;
      keyFactsSi = seoResult.keyFacts.si;
      keyFactsTa = seoResult.keyFacts.ta;
      confirmedDiffersEn = seoResult.confirmedVsDiffers.en;
      confirmedDiffersSi = seoResult.confirmedVsDiffers.si;
      confirmedDiffersTa = seoResult.confirmedVsDiffers.ta;
      
      console.log(`[Pipeline] ✅ SEO generated via orchestrator (topics: ${topics.join(', ')}, district: ${district || 'none'})`);
    } catch (err) {
      console.error('[Pipeline] SEO generation via orchestrator failed, using fallback:', err);
      errors.push({ stage: 'seo', message: `SEO generation failed: ${err instanceof Error ? err.message : 'unknown'}` });
      // Fallback to simple metadata
      seoEn = { title: headlineEn.slice(0, 60), description: summaryEn.slice(0, 160) };
      seoSi = { title: (headlineSi || headlineEn).slice(0, 60), description: summarySi.slice(0, 160) };
      seoTa = { title: (headlineTa || headlineEn).slice(0, 60), description: summaryTa.slice(0, 160) };
      topic = 'politics';
      topics = ['sri-lanka', 'politics'];
      district = null;
      primaryEntity = null;
      eventType = null;
      keywords = ['Sri Lanka'];
      keyFactsEn = [];
      keyFactsSi = [];
      keyFactsTa = [];
      confirmedDiffersEn = '';
      confirmedDiffersSi = '';
      confirmedDiffersTa = '';
    }
    
    // STEP 4: Select best image using agent orchestrator
    let imageRelevanceScore = null;
    let imageQualityScore = null;
    
    if (needsImage) {
      try {
        const imageResult = await orchestrateImageSelection(
          headlineEn,
          summaryEn,
          articles.map(a => ({
            image_url: a.image_url,
            image_urls: a.image_urls,
            url: a.url,
            content_html: a.content_html || null
          })),
          latestCluster?.image_url || null
        );
        
        imageUrl = imageResult.imageUrl;
        imageRelevanceScore = imageResult.relevanceScore;
        imageQualityScore = imageResult.qualityScore;
        
        if (imageUrl) {
          console.log(`[Pipeline] ✅ Image selected via orchestrator (relevance: ${imageRelevanceScore}, quality: ${imageQualityScore}, source: ${imageResult.source})`);
        } else {
          console.warn(`[Pipeline] ⚠️ No images found for cluster ${cluster.id}`);
        }
      } catch (error) {
        console.error('[Pipeline] ❌ Image selection via orchestrator failed, using fallback:', {
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack?.split('\n').slice(0, 5).join('\n') : undefined,
          clusterId: cluster.id,
          articlesCount: articles?.length || 0,
          hasExistingImage: !!latestCluster?.image_url,
          timestamp: new Date().toISOString(),
        });
        // Fallback to enhanced function
        try {
          const imageResult = await selectBestImageWithQuality(
            cluster.id,
            headlineEn,
            summaryEn,
            articles.map(a => ({
              image_url: a.image_url,
              image_urls: a.image_urls,
              url: a.url,
              content_html: a.content_html || null
            }))
          );
          imageUrl = imageResult.imageUrl;
          imageRelevanceScore = imageResult.relevanceScore;
          imageQualityScore = imageResult.qualityScore;
        } catch (fallbackError) {
          console.error('[Pipeline] Image selection fallback also failed:', fallbackError);
          imageUrl = null;
        }
      }
    } else {
      // Use existing image
      imageUrl = latestCluster?.image_url || null;
      imageRelevanceScore = 0.8;
      imageQualityScore = 1.0;
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

    // Key facts, confirmed vs differs, and keywords are already generated by SEO agent orchestrator
    // If they're empty, they'll be handled in the fallback above

    // Save summaries with new SEO content fields, translation status, and quality score
    // Save summaries with quality scores and lengths (enhanced)
    // Ensure quality scores are numbers, not null (default to 0.7 if missing)
    const summaryEnQuality = summaryQualityScore > 0 ? summaryQualityScore : 0.7;
    const summarySiQualityFinal = summarySiQuality > 0 ? summarySiQuality : 0.7;
    const summaryTaQualityFinal = summaryTaQuality > 0 ? summaryTaQuality : 0.7;
    
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
        summary_quality_score_en: summaryEnQuality,
        summary_quality_score_si: summarySiQualityFinal,
        summary_quality_score_ta: summaryTaQualityFinal,
        summary_length_en: summaryEn.length,
        summary_length_si: summarySi.length,
        summary_length_ta: summaryTa.length,
        model: env.SUMMARY_MODEL,
        prompt_version: 'v1-title-excerpt',
        version: summary?.version ? summary.version + 1 : 1,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'cluster_id' }
    );
    
    // Log translation status and quality for monitoring
    console.log(`[Pipeline] Cluster ${cluster.id} - Translation: en=${translationStatus.en}, si=${translationStatus.si}, ta=${translationStatus.ta}`);
    console.log(`[Pipeline] Quality scores - EN: ${summaryQualityScore}, SI: ${summarySiQuality}, TA: ${summaryTaQuality}`);
    if (!translationStatus.en || !translationStatus.si || !translationStatus.ta) {
      console.warn(`[Pipeline] ⚠️ Translation incomplete for cluster ${cluster.id}:`, translationStatus);
    }
    if (summaryQualityScore < 0.7 || summarySiQuality < 0.7 || summaryTaQuality < 0.7) {
      console.warn(`[Pipeline] ⚠️ Low quality score for cluster ${cluster.id} (EN: ${summaryQualityScore}, SI: ${summarySiQuality}, TA: ${summaryTaQuality})`);
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
    
    // Image quality scores are already set by orchestrator above
    
    // Update cluster with comprehensive SEO metadata and publish
    const updateData: any = {
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
      // Use quality scores from enhanced function (already set in ensureHeadlineTranslations)
      headline_translation_quality_en: 1.0, // English is always 1.0 (original)
      headline_translation_quality_si: headlineQualitySi !== null ? headlineQualitySi : null,
      headline_translation_quality_ta: headlineQualityTa !== null ? headlineQualityTa : null,
      city: district, // Keep city field for backward compatibility, but use district value
      primary_entity: primaryEntity,
      event_type: eventType,
      language: 'en', // Primary language (can be enhanced later)
      keywords: keywords.length > 0 ? keywords : null,
      last_checked_at: new Date().toISOString()
    };
    
    // Only include image_url and quality scores if we have a valid URL
    if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim().length > 0 && imageUrl.startsWith('http')) {
      updateData.image_url = imageUrl;
      // Use quality scores from enhanced function (already set in selectBestImageWithQuality)
      updateData.image_relevance_score = imageRelevanceScore;
      updateData.image_quality_score = imageQualityScore;
      console.log(`[Pipeline] ✅ Including image_url in update for cluster ${cluster.id}: ${imageUrl.substring(0, 80)}... (relevance: ${imageRelevanceScore}, quality: ${imageQualityScore})`);
    } else {
      console.warn(`[Pipeline] ⚠️ Not including image_url in update for cluster ${cluster.id} (invalid or missing)`);
    }
    
    const updateResult = await supabaseAdmin.from('clusters').update(updateData).eq('id', cluster.id);

    if (updateResult.error) {
      errors.push({ stage: 'seo', message: `Failed to update cluster SEO metadata: ${updateResult.error.message}` });
      console.error(`[Pipeline] ❌ Failed to save cluster data for cluster ${cluster.id}:`, updateResult.error);
    } else {
      console.log(`[Pipeline] ✅ Successfully saved cluster data for cluster ${cluster.id} (SI: ${headlineSi ? 'yes' : 'no'}, TA: ${headlineTa ? 'yes' : 'no'}, Image: ${imageUrl ? 'yes' : 'no'})`);
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

