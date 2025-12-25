#!/usr/bin/env node
/**
 * GitHub Actions Pipeline Worker
 * 
 * Fetches RSS feeds → Inserts raw articles → Processes with OpenAI → Saves to clusters
 * 
 * Usage:
 *   npm run pipeline
 *   DRY_RUN=true npm run pipeline
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import Parser, { Item } from 'rss-parser';
import { createHash } from 'crypto';

// ============================================================================
// Configuration
// ============================================================================

const DRY_RUN = process.env.DRY_RUN === 'true';
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '10', 10);
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

// Environment variables (required)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !OPENAI_API_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗');
  console.error('   OPENAI_API_KEY:', OPENAI_API_KEY ? '✓' : '✗');
  process.exit(1);
}

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const rssParser = new Parser({
  timeout: 15000, // Increased timeout
  maxRedirects: 5,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Referer': 'https://www.google.com/',
    'Cache-Control': 'no-cache'
  },
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: true }],
      ['media:thumbnail', 'mediaThumbnail', { keepArray: true }]
    ]
  }
});

// ============================================================================
// Types
// ============================================================================

type RSSItem = {
  title: string;
  url: string;
  guid: string | null;
  publishedAt: string | null;
  content: string | null;
  contentSnippet: string | null;
  imageUrl: string | null;
};

type Source = {
  id: string;
  name: string;
  feed_url: string;
  active: boolean;
  enabled: boolean;
};

type Article = {
  id: string;
  source_id: string;
  title: string;
  url: string;
  content_text: string | null;
  content_excerpt: string | null;
  published_at: string | null;
  lang: 'en' | 'si' | 'ta' | 'unk';
};

type OpenAIResponse = {
  summary: string;
  topics: string[];
  seo_title: string;
  seo_description: string;
  slug: string;
  language: 'en' | 'si' | 'ta';
  city: string | null;
};

type Stats = {
  fetched: number;
  inserted: number;
  deduped: number;
  pickedForProcessing: number;
  processed: number;
  failed: number;
};

// ============================================================================
// Utility Functions
// ============================================================================

function makeArticleHash(url: string, guid: string | null, title: string): string {
  const basis = `${url}|${guid || ''}|${title}`;
  return createHash('md5').update(basis).digest('hex');
}

function detectLanguage(text?: string | null): 'en' | 'si' | 'ta' | 'unk' {
  if (!text) return 'unk';
  const sinhalaRange = /[\u0D80-\u0DFF]/;
  const tamilRange = /[\u0B80-\u0BFF]/;
  if (sinhalaRange.test(text)) return 'si';
  if (tamilRange.test(text)) return 'ta';
  return 'en';
}

function generateSlug(title: string): string {
  const stopwords = ['a', 'an', 'the', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .split('-')
    .filter(word => !stopwords.includes(word))
    .slice(0, 9)
    .join('-')
    .slice(0, 100);
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  delayMs: number = RETRY_DELAY_MS
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.warn(`  ⚠️  Retry ${i + 1}/${maxRetries} after ${delayMs}ms...`);
      await sleep(delayMs * (i + 1)); // Exponential backoff
    }
  }
  throw new Error('Max retries exceeded');
}

// ============================================================================
// RSS Fetching
// ============================================================================

async function fetchRssFeed(feedUrl: string): Promise<RSSItem[]> {
  try {
    // Fetch raw response first to check status and content
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.google.com/',
        'Cache-Control': 'no-cache'
      },
      signal: AbortSignal.timeout(15000)
    });

    // Check HTTP status
    if (!response.ok) {
      throw new Error(`Status code ${response.status}`);
    }

    // Get raw text
    let rawText = await response.text();
    
    // Strip BOM (Byte Order Mark) - common issue with XML feeds
    if (rawText.charCodeAt(0) === 0xFEFF) {
      rawText = rawText.slice(1);
    }
    
    // Remove any leading whitespace or garbage before XML declaration
    rawText = rawText.trim();
    
    // Check if we got HTML instead of XML (common with blocked/wrong URLs)
    if (rawText.toLowerCase().startsWith('<!doctype html') || 
        rawText.toLowerCase().startsWith('<html')) {
      throw new Error('html_instead_of_xml - Received HTML page instead of RSS feed');
    }
    
    // Check if it looks like XML/RSS
    if (!rawText.startsWith('<?xml') && !rawText.startsWith('<rss') && !rawText.startsWith('<feed')) {
      // Try to find where the XML actually starts
      const xmlStart = rawText.search(/<\?xml|<rss|<feed/i);
      if (xmlStart > 0) {
        console.warn(`  ⚠️  Stripped ${xmlStart} bytes of garbage before XML`);
        rawText = rawText.substring(xmlStart);
      } else {
        throw new Error('invalid_format - Content does not appear to be XML/RSS');
      }
    }
    
    // Parse the cleaned XML
    const feed = await rssParser.parseString(rawText);
    
    if (!feed || !feed.items || feed.items.length === 0) {
      console.warn(`  ⚠️  Feed ${feedUrl} returned no items`);
      return [];
    }
    
    return (feed.items || [])
      .map((item: Item) => {
        let imageUrl: string | null = null;
        
        // Extract image from various RSS formats
        if ((item as any).media?.content?.[0]?.$?.url) {
          imageUrl = (item as any).media.content[0].$.url;
        } else if ((item as any).media?.thumbnail?.[0]?.$?.url) {
          imageUrl = (item as any).media.thumbnail[0].$.url;
        } else if ((item as any)['media:content']?.[0]?.['$']?.url) {
          imageUrl = (item as any)['media:content'][0]['$'].url;
        } else if ((item as any)['media:thumbnail']?.[0]?.['$']?.url) {
          imageUrl = (item as any)['media:thumbnail'][0]['$'].url;
        } else if ((item as any).enclosure?.type?.startsWith('image/')) {
          imageUrl = (item as any).enclosure.url;
        } else if (item.content) {
          const imgMatch = item.content.match(/<img[^>]+src=["']([^"']+)["']/i);
          if (imgMatch && imgMatch[1]) {
            imageUrl = imgMatch[1];
          }
        }
        
        return {
          title: item.title?.trim() || 'Untitled',
          url: (item.link || '').trim(),
          guid: item.guid || (item as any).id || null,
          publishedAt: item.isoDate || item.pubDate || null,
          content: item.content || null,
          contentSnippet: item.contentSnippet || null,
          imageUrl: imageUrl?.trim() || null
        };
      })
      .filter((item) => item.url && item.url.startsWith('http'));
  } catch (error: any) {
    // Provide more detailed error information
    const errorMsg = error?.message || 'Unknown error';
    const statusCode = error?.statusCode || error?.status || 'N/A';
    
    // Check for specific error types
    if (errorMsg.includes('403') || statusCode === 403) {
      throw new Error(`Status code 403`);
    } else if (errorMsg.includes('404') || statusCode === 404) {
      throw new Error(`Status code 404`);
    } else if (errorMsg.includes('html_instead_of_xml')) {
      throw new Error(`HTML instead of XML`);
    } else if (errorMsg.includes('invalid_format')) {
      throw new Error(`Invalid format`);
    } else if (errorMsg.includes('timeout') || errorMsg.includes('ETIMEDOUT') || errorMsg.includes('aborted')) {
      throw new Error(`Timeout`);
    } else if (errorMsg.includes('Status code')) {
      throw new Error(errorMsg);
    } else {
      throw new Error(`Parse error: ${errorMsg.slice(0, 100)}`);
    }
  }
}

// ============================================================================
// Database Operations
// ============================================================================

async function loadSources(): Promise<Source[]> {
  const { data, error } = await supabase
    .from('sources')
    .select('id, name, feed_url, active, enabled')
    .eq('active', true)
    .eq('enabled', true);
  
  if (error) throw new Error(`Failed to load sources: ${error.message}`);
  return data || [];
}

async function insertArticles(
  sourceId: string,
  items: RSSItem[]
): Promise<{ inserted: number; deduped: number }> {
  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would insert ${items.length} articles for source ${sourceId}`);
    return { inserted: items.length, deduped: 0 };
  }

  const rows = items.map((item: RSSItem) => {
    const hash = makeArticleHash(item.url, item.guid, item.title);
    return {
      source_id: sourceId,
      title: item.title,
      url: item.url,
      guid: item.guid,
      published_at: item.publishedAt,
      content_text: item.content,
      content_excerpt: item.contentSnippet || item.content?.slice(0, 400) || null,
      lang: detectLanguage(item.title ?? item.content),
      hash,
      image_url: item.imageUrl || null,
      status: 'new' as const
    };
  });

  const validRows = rows.filter(r => r.hash && r.hash.trim().length > 0);
  if (validRows.length === 0) return { inserted: 0, deduped: 0 };

  // Insert articles one by one to handle conflicts properly
  // This is more reliable than bulk upsert with partial unique indexes
  let inserted = 0;
  let deduped = 0;

  for (const row of validRows) {
    // First check if article already exists by hash
    const { data: existing } = await supabase
      .from('articles')
      .select('id')
      .eq('hash', row.hash)
      .maybeSingle();

    if (existing) {
      // Article already exists - count as deduped
      deduped++;
      continue;
    }

    // Article doesn't exist - insert it
    const { data, error } = await supabase
      .from('articles')
      .insert(row)
      .select('id')
      .maybeSingle();

    if (error) {
      // If it's a duplicate error, count as deduped
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        deduped++;
      } else {
        console.error(`  ⚠️  Insert error for article "${row.title.slice(0, 50)}...": ${error.message}`);
        // Don't count errors as deduped - they're failures
      }
    } else if (data) {
      inserted++;
    }
  }
  
  return { inserted, deduped };
}

async function pickArticlesForProcessing(limit: number): Promise<Article[]> {
  if (DRY_RUN) {
    const { data } = await supabase
      .from('articles')
      .select('id, source_id, title, url, content_text, content_excerpt, published_at, lang')
      .eq('status', 'new')
      .limit(limit);
    return (data as Article[]) || [];
  }

  // Atomically mark articles as 'processing'
  const { data, error } = await supabase
    .rpc('pick_articles_for_processing', { batch_limit: limit })
    .select('id, source_id, title, url, content_text, content_excerpt, published_at, lang');

  // Fallback if RPC doesn't exist: manual update
  if (error && error.message.includes('does not exist')) {
    const { data: articles } = await supabase
      .from('articles')
      .select('id, source_id, title, url, content_text, content_excerpt, published_at, lang')
      .eq('status', 'new')
      .limit(limit);

    if (articles && articles.length > 0) {
      const ids = articles.map((a: Article) => a.id);
      await supabase
        .from('articles')
        .update({ status: 'processing' })
        .in('id', ids);
    }

    return (articles as Article[]) || [];
  }

  if (error) throw new Error(`Failed to pick articles: ${error.message}`);
  
  // Ensure we always return an array
  if (!data) return [];
  return Array.isArray(data) ? (data as Article[]) : [data as Article];
}

async function markArticleProcessed(articleId: string, clusterId: string): Promise<void> {
  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would mark article ${articleId} as processed with cluster ${clusterId}`);
    return;
  }

  await supabase
    .from('articles')
    .update({
      status: 'processed',
      cluster_id: clusterId,
      processed_at: new Date().toISOString()
    })
    .eq('id', articleId);
}

async function markArticleFailed(articleId: string, errorMessage: string): Promise<void> {
  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would mark article ${articleId} as failed: ${errorMessage}`);
    return;
  }

  await supabase
    .from('articles')
    .update({
      status: 'failed',
      error_message: errorMessage,
      processed_at: new Date().toISOString()
    })
    .eq('id', articleId);
}

// ============================================================================
// OpenAI Processing
// ============================================================================

async function processArticleWithOpenAI(article: Article): Promise<OpenAIResponse> {
  const content = (article.content_excerpt || article.content_text || article.title || '').slice(0, 2000);
  
  const prompt = `You are a news processing engine for a Sri Lankan news aggregation website.

Analyze the following news article and extract structured information.

Article Title: ${article.title}
Article Content: ${content}

Generate a JSON response with the following structure:
{
  "summary": "A concise 2-4 sentence summary of the article in neutral, factual language. Past tense, third person.",
  "topics": ["topic1", "topic2"], // Array of 1-3 topics from: politics, economy, sports, crime, education, health, environment, technology, culture, other
  "seo_title": "50-65 character SEO title including 'Sri Lanka' when relevant. Format: '[Event] – Sri Lanka | Lanka News Room'",
  "seo_description": "150-160 character meta description. Neutral, factual tone.",
  "slug": "lowercase-hyphenated-slug-4-9-words-no-stopwords",
  "language": "en|si|ta", // Detect from content
  "city": "colombo|kandy|galle|jaffna|trincomalee|batticaloa|matara|negombo|anuradhapura|other" or null
}

RULES:
- Summary must be factual, neutral, no opinions
- Topics must be from the allowed list
- SEO title must be 50-65 chars
- SEO description must be 150-160 chars
- Slug must be lowercase, hyphenated, 4-9 words
- Language: 'en' for English, 'si' for Sinhala, 'ta' for Tamil
- City: only if article mentions a specific city, otherwise null
- Return ONLY valid JSON, no other text`;

  // Add timeout and better error handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.SUMMARY_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a news processing engine. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 500,
      response_format: { type: 'json_object' }
    }, {
      signal: controller.signal,
      timeout: 30000 // 30 second timeout in options
    });
    
    clearTimeout(timeoutId);

    const responseText = completion.choices[0]?.message?.content?.trim();
    if (!responseText) {
      throw new Error('Empty response from OpenAI');
    }

    try {
      const parsed = JSON.parse(responseText);
      
      // Validate and clean response
      return {
        summary: parsed.summary || article.title,
        topics: Array.isArray(parsed.topics) ? parsed.topics.slice(0, 3) : ['other'],
        seo_title: (parsed.seo_title || article.title).slice(0, 65),
        seo_description: (parsed.seo_description || parsed.summary || '').slice(0, 160),
        slug: parsed.slug || generateSlug(article.title),
        language: ['en', 'si', 'ta'].includes(parsed.language) ? parsed.language : article.lang === 'si' ? 'si' : article.lang === 'ta' ? 'ta' : 'en',
        city: parsed.city || null
      };
    } catch (error) {
      throw new Error(`Failed to parse OpenAI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    // Provide better error messages
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      throw new Error('OpenAI API timeout - request took too long');
    } else if (error.status === 401) {
      throw new Error('OpenAI API authentication failed - check API key');
    } else if (error.status === 429) {
      throw new Error('OpenAI API rate limit exceeded - too many requests');
    } else if (error.message?.includes('Connection')) {
      throw new Error('OpenAI API connection error - check network or API status');
    } else {
      throw new Error(`OpenAI API error: ${error.message || 'Unknown error'}`);
    }
  }
}

async function createOrUpdateCluster(
  article: Article,
  openaiResult: OpenAIResponse
): Promise<string> {
  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would create/update cluster for article ${article.id}`);
    return 'dry-run-cluster-id';
  }

  // Check if cluster with same slug exists
  const { data: existing } = await supabase
    .from('clusters')
    .select('id')
    .eq('slug', openaiResult.slug)
    .maybeSingle();

  let clusterId: string;

  if (existing) {
    clusterId = existing.id;
    // Update existing cluster
    await supabase
      .from('clusters')
      .update({
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', clusterId);
  } else {
    // Create new cluster
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    const { data: newCluster, error } = await supabase
      .from('clusters')
      .insert({
        headline: article.title,
        status: 'published',
        slug: openaiResult.slug,
        meta_title_en: openaiResult.seo_title,
        meta_description_en: openaiResult.seo_description,
        topic: openaiResult.topics[0] || 'other',
        city: openaiResult.city,
        language: openaiResult.language,
        first_seen_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
        published_at: article.published_at || new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        source_count: 1,
        article_count: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) throw new Error(`Failed to create cluster: ${error.message}`);
    clusterId = newCluster.id;
  }

  // Link article to cluster
  await supabase
    .from('articles')
    .update({ cluster_id: clusterId })
    .eq('id', article.id);

  // Create/update summary
  await supabase
    .from('summaries')
    .upsert({
      cluster_id: clusterId,
      summary_en: openaiResult.language === 'en' ? openaiResult.summary : null,
      summary_si: openaiResult.language === 'si' ? openaiResult.summary : null,
      summary_ta: openaiResult.language === 'ta' ? openaiResult.summary : null,
      model: process.env.SUMMARY_MODEL || 'gpt-4o-mini',
      prompt_version: 'v2-individual-processing',
      version: 1,
      updated_at: new Date().toISOString()
    }, { onConflict: 'cluster_id' });

  return clusterId;
}

// ============================================================================
// Main Pipeline
// ============================================================================

async function runPipeline(): Promise<Stats> {
  const stats: Stats = {
    fetched: 0,
    inserted: 0,
    deduped: 0,
    pickedForProcessing: 0,
    processed: 0,
    failed: 0
  };

  const startTime = Date.now(); // Track total pipeline runtime

  console.log('🚀 Starting pipeline...');
  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No database writes will be performed');
  }

  try {
    // Step 1: Load sources
    console.log('\n📋 Loading sources...');
    const sources = await loadSources();
    console.log(`   Found ${sources.length} active sources`);

    if (sources.length === 0) {
      console.log('⚠️  No active sources found. Exiting.');
      return stats;
    }

    // Step 2: Fetch RSS feeds
    console.log('\n📡 Fetching RSS feeds...');
    const fetchPromises = sources.map(async (source) => {
      try {
        const items = await withRetry(() => fetchRssFeed(source.feed_url));
        stats.fetched += items.length;
        console.log(`   ✓ ${source.name}: ${items.length} items`);
        return { sourceId: source.id, items };
      } catch (error) {
        console.error(`   ❌ ${source.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return { sourceId: source.id, items: [] };
      }
    });

    const fetchResults = await Promise.all(fetchPromises);

    // Step 3: Insert articles
    console.log('\n💾 Inserting articles...');
    for (const result of fetchResults) {
      if (result.items.length === 0) continue;
      const { inserted, deduped } = await insertArticles(result.sourceId, result.items);
      stats.inserted += inserted;
      stats.deduped += deduped;
      if (inserted > 0 || deduped > 0) {
        console.log(`   Source ${result.sourceId}: ${inserted} inserted, ${deduped} deduped`);
      }
    }

    // Step 4: Process articles
    console.log('\n🤖 Processing articles with OpenAI...');
    let hasMore = true;
    let consecutiveFailures = 0;
    const MAX_CONSECUTIVE_FAILURES = 5; // Stop if 5 in a row fail
    const MAX_PROCESSING_TIME_MS = 50 * 60 * 1000; // 50 minutes (leave 10min buffer for timeout)
    const processingStartTime = Date.now();
    let totalProcessed = 0;
    const MAX_ARTICLES_PER_RUN = 100; // Limit articles per run to prevent timeout
    
    while (hasMore) {
      // Time-based exit: stop if we're approaching timeout
      const elapsed = Date.now() - processingStartTime;
      if (elapsed > MAX_PROCESSING_TIME_MS) {
        console.log(`\n⏰ Time limit reached (${Math.round(elapsed / 1000 / 60)} minutes). Stopping processing.`);
        console.log(`   Processed ${totalProcessed} articles in this run. Remaining articles will be processed in next run.`);
        hasMore = false;
        break;
      }

      // Article count limit: stop if we've processed enough
      if (totalProcessed >= MAX_ARTICLES_PER_RUN) {
        console.log(`\n📊 Article limit reached (${MAX_ARTICLES_PER_RUN} articles). Stopping processing.`);
        console.log(`   Remaining articles will be processed in next run.`);
        hasMore = false;
        break;
      }

      const articles = await pickArticlesForProcessing(BATCH_SIZE);
      stats.pickedForProcessing += articles.length;
      
      if (articles.length === 0) {
        hasMore = false;
        break;
      }

      console.log(`   Processing batch of ${articles.length} articles... (${totalProcessed}/${MAX_ARTICLES_PER_RUN} processed, ${Math.round((Date.now() - processingStartTime) / 1000 / 60)}min elapsed)`);

      // Process articles sequentially to avoid overwhelming API and better error tracking
      let batchSuccess = 0;
      let batchFailed = 0;
      
      for (const article of articles) {
        // Check time limit before each article
        if (Date.now() - processingStartTime > MAX_PROCESSING_TIME_MS) {
          console.log(`\n⏰ Time limit reached. Stopping batch processing.`);
          hasMore = false;
          break;
        }

        try {
          const openaiResult = await withRetry(() => processArticleWithOpenAI(article), 2, 3000); // 2 retries, 3s delay
          const clusterId = await createOrUpdateCluster(article, openaiResult);
          await markArticleProcessed(article.id, clusterId);
          stats.processed++;
          totalProcessed++;
          batchSuccess++;
          consecutiveFailures = 0; // Reset on success
          console.log(`   ✓ Processed: ${article.title.slice(0, 50)}...`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          await markArticleFailed(article.id, errorMessage);
          stats.failed++;
          batchFailed++;
          consecutiveFailures++;
          console.error(`   ❌ Failed: ${article.title.slice(0, 50)}... - ${errorMessage}`);
          
          // Circuit breaker: if too many consecutive failures, stop processing
          if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
            console.error(`\n⚠️  Circuit breaker triggered: ${consecutiveFailures} consecutive failures. Stopping OpenAI processing.`);
            console.error(`   This usually means OpenAI API is unavailable or API key is invalid.`);
            console.error(`   Check OPENAI_API_KEY secret in GitHub Actions settings.`);
            hasMore = false;
            break;
          }
        }
        
        // Small delay between articles to avoid rate limits
        await sleep(500);
      }

      // Rate limiting: wait between batches
      if (articles.length === BATCH_SIZE && hasMore && totalProcessed < MAX_ARTICLES_PER_RUN) {
        await sleep(1000); // 1 second between batches
      } else {
        hasMore = false;
      }
    }

    // Summary
    const elapsedMinutes = Math.round((Date.now() - startTime) / 1000 / 60);
    console.log('\n📊 Pipeline Summary:');
    console.log(`   Fetched: ${stats.fetched}`);
    console.log(`   Inserted: ${stats.inserted}`);
    console.log(`   Deduped: ${stats.deduped}`);
    console.log(`   Picked for processing: ${stats.pickedForProcessing}`);
    console.log(`   Processed: ${stats.processed}`);
    console.log(`   Failed: ${stats.failed}`);
    console.log(`   Runtime: ${elapsedMinutes} minutes`);

    if (DRY_RUN) {
      console.log('\n⚠️  DRY RUN - No changes were made to the database');
    }

    return stats;
  } catch (error) {
    console.error('\n❌ Pipeline failed:', error);
    throw error;
  }
}

// ============================================================================
// Entry Point
// ============================================================================

// Run pipeline if executed directly
runPipeline()
  .then(() => {
    console.log('\n✅ Pipeline completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Pipeline failed:', error);
    process.exit(1);
  });

