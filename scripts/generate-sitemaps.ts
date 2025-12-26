#!/usr/bin/env tsx
/**
 * Sitemap Generator
 * 
 * Generates static XML sitemap files from Supabase for Google indexing.
 * Creates:
 * - public/sitemap.xml (main sitemap index)
 * - public/sitemaps/static.xml (static pages)
 * - public/sitemaps/{topic}.xml (topic-based sitemaps with pagination if needed)
 * - public/robots.txt (updated to reference main sitemap)
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from '../lib/supabaseTypes';
import { normalizeTopicSlug, VALID_TOPICS } from '../lib/topics';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

// Constants
const MAX_URLS_PER_SITEMAP = 50000;
const SITEMAP_DIR = join(process.cwd(), 'public', 'sitemaps');
const PUBLIC_DIR = join(process.cwd(), 'public');

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://lankanewsroom.xyz';

// Languages
const LANGUAGES: ('en' | 'si' | 'ta')[] = ['en', 'si', 'ta'];

interface Cluster {
  id: string;
  slug: string;
  topic: string | null;
  published_at: string | null;
  updated_at: string | null;
  created_at: string | null;
}

/**
 * Escape XML special characters
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Format date for XML (ISO 8601)
 */
function formatDate(date: string | null | undefined): string {
  if (!date) return new Date().toISOString();
  try {
    return new Date(date).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

/**
 * Get last modified date for a cluster
 */
function getLastModified(cluster: Cluster): string {
  return formatDate(cluster.updated_at || cluster.published_at || cluster.created_at);
}

/**
 * Sanitize topic name for filename
 */
function sanitizeTopicForFilename(topic: string): string {
  return topic.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Generate URL for an article
 */
function getArticleUrl(lang: 'en' | 'si' | 'ta', topic: string, slug: string): string {
  const normalizedTopic = normalizeTopicSlug(topic) || 'other';
  return `${SITE_URL}/${lang}/${normalizedTopic}/${slug}`;
}

/**
 * Generate static sitemap XML
 */
function generateStaticSitemap(): string {
  const urls: string[] = [];
  const now = new Date().toISOString();

  // Homepage (redirects to /en)
  urls.push(`  <url>
    <loc>${escapeXml(SITE_URL)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>`);

  // Language home pages
  for (const lang of LANGUAGES) {
    urls.push(`  <url>
    <loc>${escapeXml(`${SITE_URL}/${lang}`)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>`);
  }

  // Topic pages for all valid topics and languages
  for (const topic of VALID_TOPICS) {
    for (const lang of LANGUAGES) {
      urls.push(`  <url>
    <loc>${escapeXml(`${SITE_URL}/${lang}/${topic}`)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>`);
    }
  }

  // Static pages
  const staticPages = [
    { path: '/privacy-policy', priority: '0.5' },
    { path: '/terms-of-use', priority: '0.5' },
    { path: '/for-you', priority: '0.8' },
    { path: '/search', priority: '0.7' },
    { path: '/recent', priority: '0.8' }
  ];

  for (const page of staticPages) {
    urls.push(`  <url>
    <loc>${escapeXml(`${SITE_URL}${page.path}`)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${page.priority}</priority>
  </url>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
}

/**
 * Generate topic sitemap XML
 */
function generateTopicSitemap(clusters: Cluster[], topic: string): string {
  const urls: string[] = [];

  for (const cluster of clusters) {
    if (!cluster.slug) continue;

    const lastMod = getLastModified(cluster);
    
    // Generate URLs for all three languages
    for (const lang of LANGUAGES) {
      const url = getArticleUrl(lang, topic, cluster.slug);
      urls.push(`  <url>
    <loc>${escapeXml(url)}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`);
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
}

/**
 * Generate main sitemap index
 */
function generateSitemapIndex(sitemapFiles: Array<{ filename: string; lastmod: string }>): string {
  const sitemaps: string[] = [];

  for (const file of sitemapFiles) {
    sitemaps.push(`  <sitemap>
    <loc>${escapeXml(`${SITE_URL}/sitemaps/${file.filename}`)}</loc>
    <lastmod>${file.lastmod}</lastmod>
  </sitemap>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.join('\n')}
</sitemapindex>`;
}

/**
 * Generate robots.txt
 */
function generateRobotsTxt(): string {
  return `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/

User-agent: Googlebot
Allow: /
Disallow: /api/
Disallow: /admin/

User-agent: Googlebot-News
Allow: /
Disallow: /api/
Disallow: /admin/

Sitemap: ${SITE_URL}/sitemap.xml
`;
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting sitemap generation...');
  console.log(`   Site URL: ${SITE_URL}`);

  // Validate environment
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables:');
    console.error('   SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗');
    process.exit(1);
  }

  // Create Supabase client
  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Ensure sitemaps directory exists
  if (!existsSync(SITEMAP_DIR)) {
    await mkdir(SITEMAP_DIR, { recursive: true });
    console.log('📁 Created sitemaps directory');
  }

  try {
    // Query all published clusters
    console.log('📊 Fetching published clusters from Supabase...');
    const now = new Date().toISOString();
    const { data: clusters, error } = await supabase
      .from('clusters')
      .select('id, slug, topic, published_at, updated_at, created_at')
      .eq('status', 'published')
      .not('slug', 'is', null)
      .or(`expires_at.is.null,expires_at.gte.${now}`) // Include clusters that haven't expired or have no expiry
      .returns<Cluster[]>();

    if (error) {
      console.error('❌ Error fetching clusters:', error);
      process.exit(1);
    }

    if (!clusters || clusters.length === 0) {
      console.warn('⚠️  No published clusters found');
      return;
    }

    console.log(`✅ Found ${clusters.length} published clusters`);

    // Group clusters by topic
    const clustersByTopic = new Map<string, Cluster[]>();
    
    for (const cluster of clusters) {
      const normalizedTopic = normalizeTopicSlug(cluster.topic) || 'other';
      if (!clustersByTopic.has(normalizedTopic)) {
        clustersByTopic.set(normalizedTopic, []);
      }
      clustersByTopic.get(normalizedTopic)!.push(cluster);
    }

    console.log(`📂 Grouped into ${clustersByTopic.size} topics`);

    // Generate topic sitemaps
    const sitemapFiles: Array<{ filename: string; lastmod: string }> = [];
    const now = new Date().toISOString();

    // Generate static sitemap
    console.log('📝 Generating static sitemap...');
    const staticSitemap = generateStaticSitemap();
    const staticPath = join(SITEMAP_DIR, 'static.xml');
    await writeFile(staticPath, staticSitemap, 'utf-8');
    sitemapFiles.push({ filename: 'static.xml', lastmod: now });
    console.log('   ✓ static.xml');

    // Generate topic sitemaps
    for (const [topic, topicClusters] of clustersByTopic.entries()) {
      const sanitizedTopic = sanitizeTopicForFilename(topic);
      const totalUrls = topicClusters.length * LANGUAGES.length; // 3 languages per cluster

      if (totalUrls <= MAX_URLS_PER_SITEMAP) {
        // Single file
        console.log(`📝 Generating sitemap for topic: ${topic} (${topicClusters.length} clusters, ${totalUrls} URLs)...`);
        const sitemap = generateTopicSitemap(topicClusters, topic);
        const filename = `${sanitizedTopic}.xml`;
        const filepath = join(SITEMAP_DIR, filename);
        await writeFile(filepath, sitemap, 'utf-8');
        sitemapFiles.push({ filename, lastmod: now });
        console.log(`   ✓ ${filename}`);
      } else {
        // Paginate
        console.log(`📝 Generating paginated sitemaps for topic: ${topic} (${topicClusters.length} clusters, ${totalUrls} URLs)...`);
        const pages = Math.ceil(totalUrls / MAX_URLS_PER_SITEMAP);
        let page = 1;
        let offset = 0;

        while (offset < topicClusters.length) {
          const pageClusters = topicClusters.slice(offset, offset + Math.floor(MAX_URLS_PER_SITEMAP / LANGUAGES.length));
          const sitemap = generateTopicSitemap(pageClusters, topic);
          const filename = pages > 1 ? `${sanitizedTopic}-${page}.xml` : `${sanitizedTopic}.xml`;
          const filepath = join(SITEMAP_DIR, filename);
          await writeFile(filepath, sitemap, 'utf-8');
          sitemapFiles.push({ filename, lastmod: now });
          console.log(`   ✓ ${filename} (page ${page}/${pages})`);
          offset += pageClusters.length;
          page++;
        }
      }
    }

    // Generate main sitemap index
    console.log('📝 Generating main sitemap index...');
    const sitemapIndex = generateSitemapIndex(sitemapFiles);
    const indexPath = join(PUBLIC_DIR, 'sitemap.xml');
    await writeFile(indexPath, sitemapIndex, 'utf-8');
    console.log('   ✓ sitemap.xml');

    // Generate robots.txt
    console.log('📝 Generating robots.txt...');
    const robotsTxt = generateRobotsTxt();
    const robotsPath = join(PUBLIC_DIR, 'robots.txt');
    await writeFile(robotsPath, robotsTxt, 'utf-8');
    console.log('   ✓ robots.txt');

    // Summary
    console.log('\n✅ Sitemap generation complete!');
    console.log(`   Total clusters: ${clusters.length}`);
    console.log(`   Topics: ${clustersByTopic.size}`);
    console.log(`   Sitemap files: ${sitemapFiles.length + 1} (including index)`);
    console.log(`   Main sitemap: ${SITE_URL}/sitemap.xml`);

  } catch (error) {
    console.error('❌ Error generating sitemaps:', error);
    process.exit(1);
  }
}

// Run if executed directly
main()
  .then(() => {
    console.log('\n✅ Sitemap generation completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Sitemap generation failed:', error);
    process.exit(1);
  });

