// @ts-nocheck
import { supabaseAdmin } from './supabaseAdmin';
import { env } from './env';
import { fetchRssFeed } from './rss';
import { detectLanguage } from './language';
import { makeArticleHash } from './hash';
import { extractEntities, normalizeTitle, similarityScore, generateSlug } from './text';
import { summarizeEnglish, translateSummary, generateSEOMetadata } from './openaiClient';
import { categorizeCluster } from './categorize';
import { updateLastSuccessfulRun } from './pipelineEarlyExit';

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
        hash
      };
    });

    // Use hash as the conflict target since it's unique per article
    // Hash is computed from url, guid, and title combination
    const { data, error } = await supabaseAdmin
      .from('articles')
      .upsert(rows, { onConflict: 'hash', ignoreDuplicates: true })
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
 * Only categorizes published clusters (source_count >= 2).
 */
async function categorizeClusters(
  clusters: Map<string, ClusterCache>,
  errors: Array<{ sourceId?: string; stage: string; message: string }>
) {
  let categorized = 0;
  for (const cluster of clusters.values()) {
    // Skip if already categorized or not eligible for publishing
    if ((cluster.source_count || 0) < 2) continue;

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
    if ((cluster.source_count || 0) < 2) continue;

    const { data: summary } = await supabaseAdmin
      .from('summaries')
      .select('*')
      .eq('cluster_id', cluster.id)
      .maybeSingle();

    const prevSourceCount = summary ? cluster.source_count : 0;
    if (summary && prevSourceCount === cluster.source_count) continue;

    const { data: articles, error } = await supabaseAdmin
      .from('articles')
      .select('title, content_excerpt, content_text, published_at')
      .eq('cluster_id', cluster.id)
      .order('published_at', { ascending: false })
      .limit(env.MAX_SUMMARY_ARTICLES);

    if (error) {
      errors.push({ stage: 'summaries', message: error.message });
      continue;
    }

    const sourcePayload =
      articles?.map((a) => ({
        title: a.title,
        content: (a.content_excerpt || a.content_text || a.title || '').slice(0, 800)
      })) || [];

    const summaryEn = await summarizeEnglish(sourcePayload, summary?.summary_en);
    const summarySi = await translateSummary(summaryEn, 'si');
    const summaryTa = await translateSummary(summaryEn, 'ta');

    // Generate SEO metadata for all languages (with error handling)
    let seoEn, seoSi, seoTa;
    try {
      [seoEn, seoSi, seoTa] = await Promise.all([
        generateSEOMetadata(summaryEn, cluster.headline, 'en').catch(() => ({
          title: cluster.headline.slice(0, 60),
          description: summaryEn.slice(0, 160)
        })),
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

    // Save summaries
    await supabaseAdmin.from('summaries').upsert(
      {
        cluster_id: cluster.id,
        summary_en: summaryEn,
        summary_si: summarySi,
        summary_ta: summaryTa,
        model: env.SUMMARY_MODEL,
        prompt_version: 'v1-title-excerpt',
        version: summary?.version ? summary.version + 1 : 1,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'cluster_id' }
    );

    // Update cluster with SEO metadata and publish
    const updateResult = await supabaseAdmin.from('clusters').update({
      status: 'published',
      meta_title_en: seoEn.title,
      meta_description_en: seoEn.description,
      meta_title_si: seoSi.title,
      meta_description_si: seoSi.description,
      meta_title_ta: seoTa.title,
      meta_description_ta: seoTa.description,
      slug: slug,
      published_at: publishedAt
    }).eq('id', cluster.id);

    if (updateResult.error) {
      errors.push({ stage: 'seo', message: `Failed to update cluster SEO metadata: ${updateResult.error.message}` });
    }

    summarized += 1;
  }
  return summarized;
}

