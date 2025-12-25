// @ts-nocheck
import { supabaseAdmin } from './supabaseAdmin';
import { env } from './env';
import { fetchRssFeed } from './rss';
import { detectLanguage } from './language';
import { makeArticleHash } from './hash';
import { extractEntities, normalizeTitle, similarityScore, generateSlug } from './text';
import { summarizeEnglish, translateSummary, generateSEOMetadata, generateComprehensiveSEO, summarizeInSourceLanguage, translateToMultipleLanguages, generateKeyFacts, generateConfirmedVsDiffers, generateKeywords, translateFromTo } from './openaiClient';
import { categorizeCluster } from './categorize';
import { updateLastSuccessfulRun } from './pipelineEarlyExit';
import { selectBestImage } from './imageSelection';
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
  return results;
}

async function insertArticles(
  fetched: Array<{ source_id: string; items: Awaited<ReturnType<typeof fetchRssFeed>> }>
) {
  const inserted: Array<{ id?: string; source_id: string; title: string; hash: string; inserted: boolean }> = [];

  for (const batch of fetched) {
    const rows = batch.items.map((item) => {
      const hash = makeArticleHash({ url: item.url, guid: item.guid, title: item.title });
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
        image_url: item.imageUrl || null
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

    const { data: summary } = await supabaseAdmin
      .from('summaries')
      .select('*')
      .eq('cluster_id', cluster.id)
      .maybeSingle();

    const prevSourceCount = summary ? cluster.source_count : 0;
    if (summary && prevSourceCount === cluster.source_count) continue;

    const { data: articles, error } = await supabaseAdmin
      .from('articles')
      .select('title, content_excerpt, content_text, published_at, image_url')
      .eq('cluster_id', cluster.id)
      .order('published_at', { ascending: false })
      .limit(env.MAX_SUMMARY_ARTICLES);

    if (error) {
      errors.push({ stage: 'summaries', message: error.message });
      continue;
    }

    // Enhanced source payload with weighting and more context
    const sourcePayload =
      articles?.map((a, idx) => {
        // Increase context from 800 to 1500 chars
        const content = (a.content_excerpt || a.content_text || a.title || '').slice(0, 1500);
        
        // Weight recent articles higher
        const weight = idx === 0 ? 1.5 : 1.0;
        const recency = a.published_at 
          ? Math.max(0, 1 - (Date.now() - new Date(a.published_at).getTime()) / (7 * 24 * 60 * 60 * 1000))
          : 0.5;
        
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

    // Generate summary in source language
    let summaryInSource: string;
    try {
      summaryInSource = await summarizeInSourceLanguage(sourcePayload, sourceLang, summary?.summary_en || summary?.summary_si || summary?.summary_ta);
    } catch (error) {
      console.error('[Pipeline] Source language summarization failed, falling back to English:', error);
      // Fallback to English summarization
      summaryInSource = await summarizeEnglish(sourcePayload, summary?.summary_en);
      sourceLang = 'en';
    }

    // Translate to all 3 languages - ensure all are always generated
    let summaryEn: string, summarySi: string, summaryTa: string;
    try {
      const translations = await translateToMultipleLanguages(summaryInSource, sourceLang);
      summaryEn = translations.en;
      summarySi = translations.si;
      summaryTa = translations.ta;
      
      // Validate all 3 languages are present and non-empty
      if (!summaryEn || !summarySi || !summaryTa) {
        console.warn('[Pipeline] Some translations are missing, using fallbacks');
        // Use English as ultimate fallback for missing translations
        summaryEn = summaryEn || summaryInSource;
        summarySi = summarySi || summaryEn;
        summaryTa = summaryTa || summaryEn;
      }
      
      console.log(`[Pipeline] Translated summary from ${sourceLang} to all languages`);
    } catch (error) {
      console.error('[Pipeline] Multi-language translation failed, using fallback:', error);
      // Fallback: Always ensure all 3 languages are set
      // If source was English, translate to Si/Ta; otherwise translate to English first
      if (sourceLang === 'en') {
        summaryEn = summaryInSource;
        // Try to translate to Si and Ta, fallback to English if fails
        try {
          summarySi = await translateSummary(summaryEn, 'si');
        } catch {
          summarySi = summaryEn;
        }
        try {
          summaryTa = await translateSummary(summaryEn, 'ta');
        } catch {
          summaryTa = summaryEn;
        }
      } else {
        // Source is Si or Ta - translate to English first, then to other languages
        try {
          // First translate to English
          summaryEn = await translateFromTo(summaryInSource, sourceLang, 'en');
          
          // Set source language summary
          if (sourceLang === 'si') {
            summarySi = summaryInSource;
            // Translate English to Tamil
            summaryTa = await translateFromTo(summaryEn, 'en', 'ta').catch(() => summaryEn);
          } else {
            // Tamil source
            summaryTa = summaryInSource;
            // Translate English to Sinhala
            summarySi = await translateFromTo(summaryEn, 'en', 'si').catch(() => summaryEn);
          }
        } catch {
          // Ultimate fallback - use source for all
          summaryEn = summaryInSource;
          summarySi = summaryInSource;
          summaryTa = summaryInSource;
        }
      }
    }
    
    // Final validation - ensure all 3 are non-empty
    if (!summaryEn || !summarySi || !summaryTa) {
      console.error('[Pipeline] CRITICAL: Some summaries are still empty after all fallbacks');
      summaryEn = summaryEn || summaryInSource || 'Summary unavailable';
      summarySi = summarySi || summaryEn;
      summaryTa = summaryTa || summaryEn;
    }

    // Generate comprehensive SEO metadata with topic/city/entity extraction
    let seoEn, seoSi, seoTa, topic, city, primaryEntity, eventType, imageUrl;
    try {
      // Generate comprehensive SEO for English (includes topic, city, entities)
      const comprehensiveSEO = await generateComprehensiveSEO(
        summaryEn,
        cluster.headline,
        articles || [],
        'en'
      );

      seoEn = {
        title: comprehensiveSEO.seo_title,
        description: comprehensiveSEO.meta_description
      };

      topic = comprehensiveSEO.topic;
      city = comprehensiveSEO.city;
      primaryEntity = comprehensiveSEO.primary_entity;
      eventType = comprehensiveSEO.event_type;

      // Use AI to select best image from all available images
      const availableImages = articles
        ?.filter(a => a.image_url)
        .map(a => ({
          url: a.image_url!,
          source: (a as any).sources?.name || 'Unknown'
        })) || [];
      
      if (availableImages.length > 0) {
        try {
          imageUrl = await selectBestImage(availableImages, cluster.headline, summaryEn);
          console.log(`[Pipeline] Selected best image from ${availableImages.length} options`);
        } catch (error) {
          console.error('[Pipeline] Image selection failed, using first image:', error);
          imageUrl = availableImages[0].url;
        }
      } else {
        imageUrl = null;
      }

      // Generate SEO for other languages (simpler, just title/description)
      [seoSi, seoTa] = await Promise.all([
        generateSEOMetadata(summarySi, cluster.headline, 'si').catch(() => ({
          title: cluster.headline.slice(0, 60),
          description: summarySi.slice(0, 160)
        })),
        generateSEOMetadata(summaryTa, cluster.headline, 'ta').catch(() => ({
          title: cluster.headline.slice(0, 60),
          description: summaryTa.slice(0, 160)
        }))
      ]);
    } catch (err) {
      errors.push({ stage: 'seo', message: `SEO generation failed: ${err instanceof Error ? err.message : 'unknown'}` });
      // Fallback to simple metadata
      seoEn = { title: cluster.headline.slice(0, 60), description: summaryEn.slice(0, 160) };
      seoSi = { title: cluster.headline.slice(0, 60), description: summarySi.slice(0, 160) };
      seoTa = { title: cluster.headline.slice(0, 60), description: summaryTa.slice(0, 160) };
      topic = 'other';
      city = null;
      primaryEntity = null;
      eventType = null;
      imageUrl = articles?.find(a => a.image_url)?.image_url || null;
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
        city,
        primaryEntity,
        eventType
      ).catch(() => {
        // Fallback keywords
        const fallback: string[] = ['Sri Lanka'];
        if (topic) fallback.push(topic);
        if (city) fallback.push(city);
        return fallback;
      });

      console.log(`[Pipeline] Generated ${keyFactsEn.length} key facts, keywords: ${keywords.join(', ')}`);
    } catch (error) {
      console.error('[Pipeline] Error generating key facts/confirmed vs differs/keywords:', error);
      // Continue with empty values - these are optional enhancements
    }

    // Save summaries with new SEO content fields
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
        model: env.SUMMARY_MODEL,
        prompt_version: 'v1-title-excerpt',
        version: summary?.version ? summary.version + 1 : 1,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'cluster_id' }
    );

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
      city: city,
      primary_entity: primaryEntity,
      event_type: eventType,
      image_url: imageUrl,
      language: 'en', // Primary language (can be enhanced later)
      keywords: keywords.length > 0 ? keywords : null,
      last_checked_at: new Date().toISOString()
    }).eq('id', cluster.id);

    if (updateResult.error) {
      errors.push({ stage: 'seo', message: `Failed to update cluster SEO metadata: ${updateResult.error.message}` });
    }

    summarized += 1;
  }
  return summarized;
}

