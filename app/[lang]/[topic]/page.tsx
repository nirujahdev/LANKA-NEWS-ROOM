/**
 * Programmatic SEO: Topic Pages
 * 
 * URL format: /en/politics, /ta/economy, /si/sports
 * These pages rank for "[topic] news Sri Lanka" searches
 */

import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import NavigationWrapper from '@/components/NavigationWrapper';
import UnifiedTopicNavigation from '@/components/UnifiedTopicNavigation';
import NewsCard from '@/components/NewsCard';
import FilterMenu from '@/components/FilterMenu';
import { normalizeTopicSlug, getTopicLabel, VALID_TOPICS, isValidTopic } from '@/lib/topics';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

type Props = {
  params: Promise<{ lang: 'en' | 'si' | 'ta'; topic: string }>;
  searchParams: Promise<{ date?: string; city?: string; sort?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const { lang, topic: rawTopic } = resolvedParams;
  
  // Normalize topic slug
  const topic = normalizeTopicSlug(rawTopic);
  
  if (!topic || !isValidTopic(topic)) {
    return { title: 'Not Found' };
  }

  const topicLabel = getTopicLabel(topic, lang);
  const countryRef = lang === 'en' ? 'Sri Lanka' : lang === 'si' ? 'ශ්‍රී ලංකා' : 'இலங்கை';
  const newsLabel = lang === 'en' ? 'News' : lang === 'si' ? 'පුවත්' : 'செய்திகள்';
  
  const title = `${topicLabel} ${newsLabel} – ${countryRef} | Lanka News Room`;
  const description = lang === 'en' 
    ? `Latest ${topicLabel.toLowerCase()} news from Sri Lanka. Real-time updates from multiple verified sources.`
    : lang === 'si'
    ? `${countryRef} ${topicLabel} පුවත්. සත්‍යාපිත මූලාශ්‍ර කිහිපයකින් නවතම යාවත්කාලීන කිරීම්.`
    : `${countryRef} ${topicLabel} செய்திகள். சரிபார்க்கப்பட்ட பல ஆதாரங்களிலிருந்து நேரடி புதுப்பிப்புகள்.`;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lankanewsroom.xyz';
  const enUrl = `${baseUrl}/en/${topic}`;
  const siUrl = `${baseUrl}/si/${topic}`;
  const taUrl = `${baseUrl}/ta/${topic}`;
  const canonicalUrl = lang === 'si' ? siUrl : lang === 'ta' ? taUrl : enUrl;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en-LK': enUrl,
        'si-LK': siUrl,
        'ta-LK': taUrl,
        'x-default': enUrl
      }
    },
    openGraph: {
      title,
      description,
      type: 'website',
      locale: lang === 'si' ? 'si_LK' : lang === 'ta' ? 'ta_LK' : 'en_LK',
      url: canonicalUrl,
      siteName: 'Lanka News Room',
      images: [
        {
          url: `${baseUrl}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: `${topicLabel} News - Lanka News Room`
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${baseUrl}/og-image.jpg`]
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1
      }
    }
  };
}

export default async function TopicPage({ params, searchParams }: Props) {
  // #region agent log
  console.log('[DEBUG] TopicPage entry');
  // #endregion
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const { lang, topic: rawTopic } = resolvedParams;
  const { date, city, sort } = resolvedSearchParams;

  // Normalize topic slug
  const topic = normalizeTopicSlug(rawTopic);
  
  if (!topic || !isValidTopic(topic)) {
    notFound();
  }

  // Redirect if the URL topic doesn't match normalized topic (e.g., "Sri Lanka" -> "sri-lanka")
  if (rawTopic !== topic) {
    redirect(`/${lang}/${topic}`);
  }

  // Get latest articles for this topic with sources
  // Use case-insensitive matching with ilike for better compatibility
  // TypeScript: topic is guaranteed to be a string here due to validation above
  const topicString: string = topic;
  
  let clusters: any[] | null = null;
  try {
    // Check if Supabase is properly configured before making queries
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey || supabaseUrl.includes('placeholder')) {
      console.error('Supabase admin credentials not configured. Cannot fetch topic data.');
      clusters = [];
    } else {
      let query = supabaseAdmin
        .from('clusters')
        .select(`
          *,
          summaries (*),
          articles (
            sources (
              name,
              feed_url
            )
          )
        `)
        .eq('status', 'published');
    
      // Support both single topic (backward compatibility) and topics array
      // First match by single topic field (most common case)
      query = query.ilike('topic', topicString);
      
      // Note: For topics array matching, we'll filter in memory after fetching
      // This ensures backward compatibility while supporting the new topics array

      // Apply date filter
      if (date && date !== 'all') {
        const now = new Date();
        let dateFrom: Date;
        switch (date) {
          case 'today':
            dateFrom = new Date(now.setHours(0, 0, 0, 0));
            break;
          case 'week':
            dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          default:
            dateFrom = new Date(0);
        }
        query = query.gte('published_at', dateFrom.toISOString());
      }

      // Apply district filter (from articles)
      if (city) { // Note: city param is now used for district
        const { data: articlesWithDistrict } = await supabaseAdmin
          .from('articles')
          .select('cluster_id')
          .ilike('district', city);
        
        if (articlesWithDistrict && articlesWithDistrict.length > 0) {
          const clusterIds = articlesWithDistrict.map(a => a.cluster_id).filter((id): id is string => id !== null && id !== undefined);
          if (clusterIds.length > 0) {
            query = query.in('id', clusterIds);
          } else {
            // No clusters match, return empty result
            clusters = [];
          }
        } else {
          // No articles with this district, return empty result
          clusters = [];
        }
      }

      // Only proceed with query if we haven't already set clusters to empty
      if (clusters === null) {
        // Apply sorting
        const sortOption = sort || 'newest';
        switch (sortOption) {
          case 'oldest':
            query = query.order('published_at', { ascending: true });
            break;
          case 'sources':
            query = query.order('source_count', { ascending: false });
            break;
          case 'newest':
          default:
            query = query.order('published_at', { ascending: false });
            break;
        }

        const { data, error } = await query.limit(50); // Fetch more to filter by topics array
        
        if (error) {
          console.error('Error fetching clusters:', error);
          clusters = [];
        } else {
          // Filter by topics array if single topic didn't match
          // This supports multi-topic categorization
          clusters = (data || []).filter((cluster: any) => {
            // Check if topic matches single topic field
            if (cluster.topic && cluster.topic.toLowerCase() === topicString.toLowerCase()) {
              return true;
            }
            // Check if topic exists in topics array
            if (cluster.topics && Array.isArray(cluster.topics)) {
              return cluster.topics.some((t: string) => 
                t && t.toLowerCase() === topicString.toLowerCase()
              );
            }
            return false;
          }).slice(0, 20).map((cluster: any) => {
            // Deep clone to avoid mutating original
            const serializedCluster: any = {};
            
            // Helper function to safely serialize any value
            const serializeValue = (value: any): any => {
              if (value === null || value === undefined) return null;
              if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
              if (value instanceof Date) return value.toISOString();
              if (Array.isArray(value)) {
                return value.map(item => serializeValue(item)).filter(item => item !== undefined);
              }
              if (typeof value === 'object') {
                const serialized: any = {};
                for (const key in value) {
                  if (value.hasOwnProperty(key)) {
                    const serializedItem = serializeValue(value[key]);
                    if (serializedItem !== undefined) {
                      serialized[key] = serializedItem;
                    }
                  }
                }
                return serialized;
              }
              // Skip functions and other non-serializable types
              return null;
            };
            
            // Copy all properties with serialization
            for (const key in cluster) {
              if (cluster.hasOwnProperty(key)) {
                const value = serializeValue(cluster[key]);
                if (value !== undefined) {
                  serializedCluster[key] = value;
                }
              }
            }
            
            // Convert all date fields to ISO strings
            const dateFields = ['last_seen_at', 'first_seen_at', 'published_at', 'created_at', 'updated_at', 'last_checked_at'];
            for (const field of dateFields) {
              if (serializedCluster[field]) {
                if (serializedCluster[field] instanceof Date) {
                  serializedCluster[field] = serializedCluster[field].toISOString();
                } else if (typeof serializedCluster[field] === 'string') {
                  // Already a string, ensure it's valid
                  try {
                    new Date(serializedCluster[field]);
                  } catch {
                    serializedCluster[field] = null;
                  }
                }
              } else {
                serializedCluster[field] = null;
              }
            }
            
            // Ensure topics is always an array of strings
            if (!Array.isArray(serializedCluster.topics)) {
              serializedCluster.topics = serializedCluster.topic ? [serializedCluster.topic] : [];
            }
            serializedCluster.topics = serializedCluster.topics.filter((t: any) => typeof t === 'string');
            
            // Ensure summaries is an array
            if (serializedCluster.summaries && !Array.isArray(serializedCluster.summaries)) {
              serializedCluster.summaries = [serializedCluster.summaries];
            }
            if (!Array.isArray(serializedCluster.summaries)) {
              serializedCluster.summaries = [];
            }
            
            // Ensure articles is an array
            if (serializedCluster.articles && !Array.isArray(serializedCluster.articles)) {
              serializedCluster.articles = [serializedCluster.articles];
            }
            if (!Array.isArray(serializedCluster.articles)) {
              serializedCluster.articles = [];
            }
            
            // Serialize nested summaries
            serializedCluster.summaries = serializedCluster.summaries.map((summary: any) => {
              if (!summary || typeof summary !== 'object') return null;
              return {
                summary_en: summary.summary_en ? String(summary.summary_en) : null,
                summary_si: summary.summary_si ? String(summary.summary_si) : null,
                summary_ta: summary.summary_ta ? String(summary.summary_ta) : null,
                key_facts_en: Array.isArray(summary.key_facts_en) 
                  ? summary.key_facts_en.filter((item: any) => typeof item === 'string').map((item: any) => String(item))
                  : null,
                key_facts_si: Array.isArray(summary.key_facts_si) 
                  ? summary.key_facts_si.filter((item: any) => typeof item === 'string').map((item: any) => String(item))
                  : null,
                key_facts_ta: Array.isArray(summary.key_facts_ta) 
                  ? summary.key_facts_ta.filter((item: any) => typeof item === 'string').map((item: any) => String(item))
                  : null,
                confirmed_vs_differs_en: summary.confirmed_vs_differs_en ? String(summary.confirmed_vs_differs_en) : null,
                confirmed_vs_differs_si: summary.confirmed_vs_differs_si ? String(summary.confirmed_vs_differs_si) : null,
                confirmed_vs_differs_ta: summary.confirmed_vs_differs_ta ? String(summary.confirmed_vs_differs_ta) : null
              };
            }).filter(Boolean);
            
            // Serialize nested articles and sources
            serializedCluster.articles = serializedCluster.articles.map((article: any) => {
              if (!article || typeof article !== 'object') return null;
              
              // Helper to serialize article date fields
              const serializeArticleDate = (value: any): string | null => {
                if (!value) return null;
                if (value instanceof Date) return value.toISOString();
                if (typeof value === 'string') {
                  try {
                    const date = new Date(value);
                    if (!isNaN(date.getTime())) return date.toISOString();
                  } catch {}
                  return value;
                }
                return null;
              };
              
              const serializedArticle: any = {
                id: String(article.id || ''),
                cluster_id: article.cluster_id ? String(article.cluster_id) : null,
                source_id: article.source_id ? String(article.source_id) : null,
                image_url: article.image_url && typeof article.image_url === 'string' ? article.image_url : null,
                published_at: serializeArticleDate(article.published_at),
                fetched_at: serializeArticleDate(article.fetched_at),
                created_at: serializeArticleDate(article.created_at),
                title: article.title ? String(article.title) : null,
                url: article.url ? String(article.url) : null
              };
              
              // Serialize nested source
              if (article.sources && typeof article.sources === 'object' && !Array.isArray(article.sources)) {
                serializedArticle.sources = {
                  name: String(article.sources.name || ''),
                  feed_url: String(article.sources.feed_url || '')
                };
              } else {
                serializedArticle.sources = null;
              }
              
              return serializedArticle;
            }).filter(Boolean);
            
            // Ensure all string fields are strings
            serializedCluster.id = String(serializedCluster.id || '');
            serializedCluster.headline = String(serializedCluster.headline || '');
            serializedCluster.headline_si = serializedCluster.headline_si ? String(serializedCluster.headline_si) : null;
            serializedCluster.headline_ta = serializedCluster.headline_ta ? String(serializedCluster.headline_ta) : null;
            serializedCluster.slug = serializedCluster.slug ? String(serializedCluster.slug) : null;
            serializedCluster.status = String(serializedCluster.status || 'published');
            serializedCluster.topic = serializedCluster.topic ? String(serializedCluster.topic) : null;
            serializedCluster.category = serializedCluster.category ? String(serializedCluster.category) : null;
            serializedCluster.image_url = serializedCluster.image_url ? String(serializedCluster.image_url) : null;
            serializedCluster.source_count = typeof serializedCluster.source_count === 'number' ? serializedCluster.source_count : 0;
            
            // Serialize keywords array
            if (Array.isArray(serializedCluster.keywords)) {
              serializedCluster.keywords = serializedCluster.keywords.filter((k: any) => typeof k === 'string').map((k: any) => String(k));
            } else {
              serializedCluster.keywords = null;
            }
            
            // Serialize meta fields
            serializedCluster.meta_title_en = serializedCluster.meta_title_en ? String(serializedCluster.meta_title_en) : null;
            serializedCluster.meta_title_si = serializedCluster.meta_title_si ? String(serializedCluster.meta_title_si) : null;
            serializedCluster.meta_title_ta = serializedCluster.meta_title_ta ? String(serializedCluster.meta_title_ta) : null;
            serializedCluster.meta_description_en = serializedCluster.meta_description_en ? String(serializedCluster.meta_description_en) : null;
            serializedCluster.meta_description_si = serializedCluster.meta_description_si ? String(serializedCluster.meta_description_si) : null;
            serializedCluster.meta_description_ta = serializedCluster.meta_description_ta ? String(serializedCluster.meta_description_ta) : null;
            
            // Serialize other optional fields
            serializedCluster.city = serializedCluster.city ? String(serializedCluster.city) : null;
            serializedCluster.primary_entity = serializedCluster.primary_entity ? String(serializedCluster.primary_entity) : null;
            serializedCluster.event_type = serializedCluster.event_type ? String(serializedCluster.event_type) : null;
            serializedCluster.language = serializedCluster.language ? String(serializedCluster.language) : null;
            
            // Remove any undefined values and functions
            Object.keys(serializedCluster).forEach(key => {
              if (serializedCluster[key] === undefined || typeof serializedCluster[key] === 'function') {
                delete serializedCluster[key];
              }
            });
            
            // Final validation: ensure the entire cluster is JSON-serializable
            try {
              JSON.stringify(serializedCluster);
              return serializedCluster;
            } catch (error) {
              console.error(`[TopicPage] Cluster ${serializedCluster.id} is not serializable:`, error);
              // Return a minimal valid cluster to prevent breaking the page
              return {
                id: String(serializedCluster.id || ''),
                headline: String(serializedCluster.headline || ''),
                status: 'published',
                source_count: 0,
                summaries: [],
                articles: [],
                topics: [],
                last_seen_at: null,
                first_seen_at: null,
                published_at: null,
                created_at: null,
                updated_at: null,
                last_checked_at: null
              };
            }
          }); // Limit to 20 after filtering
        }
      }
    }
  } catch (error) {
    console.error('Error in topic page query:', error);
    // Ensure clusters is always an array, never null
    clusters = [];
  }
  
  // Ensure clusters is always an array (never null)
  if (!clusters || !Array.isArray(clusters)) {
    clusters = [];
  }

  // Final validation: ensure all clusters are serializable before rendering
  // Use JSON.parse(JSON.stringify()) to strip any non-serializable properties
  let validatedClusters: any[] = [];
  try {
    validatedClusters = clusters.map((cluster: any) => {
      try {
        // First test if cluster is serializable
        const jsonString = JSON.stringify(cluster);
        // Parse and stringify again to ensure it's truly serializable and strip any prototypes
        const cleaned = JSON.parse(jsonString);
        // Final check: ensure cleaned object is also serializable
        JSON.stringify(cleaned);
        return cleaned;
      } catch (error) {
        // #region agent log
        console.error('[DEBUG] Non-serializable cluster detected', {clusterId: cluster?.id, error: String(error)});
        // #endregion
        console.error('[TopicPage] Non-serializable cluster detected:', cluster?.id, error);
        // Return minimal valid cluster
        return {
          id: String(cluster?.id || ''),
          headline: String(cluster?.headline || ''),
          status: 'published',
          source_count: 0,
          summaries: [],
          articles: [],
          topics: [],
          last_seen_at: null,
          first_seen_at: null,
          published_at: null,
          created_at: null,
          updated_at: null,
          last_checked_at: null,
          slug: null,
          topic: null,
          headline_si: null,
          headline_ta: null,
          image_url: null
        };
      }
    }).filter((cluster: any) => cluster && cluster.id);
    
    // Final validation: ensure the entire array is serializable
    JSON.stringify(validatedClusters);
    // #region agent log
    console.log('[DEBUG] ValidatedClusters JSON test passed', {count: validatedClusters.length});
    // #endregion
  } catch (error) {
    // #region agent log
    console.error('[DEBUG] ValidatedClusters JSON test FAILED', {error: String(error)});
    // #endregion
    console.error('[TopicPage] Error validating clusters array:', error);
    validatedClusters = [];
  }

  const topicLabel = getTopicLabel(topic, lang);
  const countryRef = lang === 'en' ? 'Sri Lanka' : lang === 'si' ? 'ශ්‍රී ලංකා' : 'இலங்கை';
  const newsLabel = lang === 'en' ? 'News' : lang === 'si' ? 'පුවත්' : 'செய்திகள்';

  // Final safety check: ensure validatedClusters is serializable before rendering
  let safeClusters: any[] = [];
  try {
    const testSerialization = JSON.stringify(validatedClusters);
    safeClusters = JSON.parse(testSerialization);
  } catch (error) {
    console.error('[TopicPage] Final serialization check failed, using empty array:', error);
    safeClusters = [];
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <NavigationWrapper currentLanguage={lang} />
      <UnifiedTopicNavigation language={lang} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Topic Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-[#202124] mb-2">
                {topicLabel} {newsLabel}
              </h1>
              <p className="text-[#5F6368]">
                {lang === 'en' && `Latest ${topicLabel.toLowerCase()} news from ${countryRef}`}
                {lang === 'si' && `${countryRef} ${topicLabel} පුවත්`}
                {lang === 'ta' && `${countryRef} ${topicLabel} செய்திகள்`}
              </p>
            </div>

            {/* Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {safeClusters?.map((cluster: any) => {
                try {
                  const summary = Array.isArray(cluster.summaries) && cluster.summaries.length > 0 
                    ? cluster.summaries[0] 
                    : null;
                  
                  const summaryText =
                    lang === 'si' ? (summary?.summary_si || summary?.summary_en || '') :
                    lang === 'ta' ? (summary?.summary_ta || summary?.summary_en || '') :
                    (summary?.summary_en || '');

                  // Get language-specific headline
                  const headlineText =
                    lang === 'si' ? (cluster.headline_si || cluster.headline || '') :
                    lang === 'ta' ? (cluster.headline_ta || cluster.headline || '') :
                    (cluster.headline || '');

                  // Extract unique sources from articles
                  const sourcesMap = new Map<string, { name: string; feed_url: string }>();
                  if (Array.isArray(cluster.articles)) {
                    cluster.articles.forEach((article: any) => {
                      if (article && article.sources && typeof article.sources === 'object' && !Array.isArray(article.sources)) {
                        const source = article.sources;
                        const sourceName = String(source.name || '');
                        const sourceUrl = String(source.feed_url || '#');
                        if (sourceName && !sourcesMap.has(sourceName)) {
                          sourcesMap.set(sourceName, {
                            name: sourceName,
                            feed_url: sourceUrl
                          });
                        }
                      }
                    });
                  }
                  // Convert Map to array and ensure all values are serializable
                  const sources = Array.from(sourcesMap.values()).map(source => ({
                    name: String(source.name || ''),
                    feed_url: String(source.feed_url || '#')
                  }));

                  // Get topics array (prefer topics array, fallback to single topic)
                  const topicsArray = Array.isArray(cluster.topics) && cluster.topics.length > 0
                    ? cluster.topics.filter((t: any) => typeof t === 'string').map((t: any) => String(t))
                    : cluster.topic ? [String(cluster.topic)] : [];

                  // Ensure updatedAt is a string or null
                  let updatedAt: string | null = null;
                  if (cluster.last_seen_at) {
                    if (cluster.last_seen_at instanceof Date) {
                      updatedAt = cluster.last_seen_at.toISOString();
                    } else if (typeof cluster.last_seen_at === 'string') {
                      updatedAt = cluster.last_seen_at;
                    }
                  }
                  
                  // Get imageUrl from cluster or first article
                  let imageUrl: string | null = null;
                  if (cluster.image_url && typeof cluster.image_url === 'string' && cluster.image_url.trim().length > 0) {
                    imageUrl = cluster.image_url;
                  } else if (Array.isArray(cluster.articles) && cluster.articles.length > 0) {
                    const firstArticle = cluster.articles[0];
                    if (firstArticle && firstArticle.image_url && typeof firstArticle.image_url === 'string' && firstArticle.image_url.trim().length > 0) {
                      imageUrl = firstArticle.image_url;
                    }
                  }

                  return (
                    <NewsCard
                      key={String(cluster.id || '')}
                      id={String(cluster.id || '')}
                      headline={String(headlineText || '')}
                      summary={summaryText || null}
                      sourceCount={typeof cluster.source_count === 'number' ? cluster.source_count : 0}
                      updatedAt={updatedAt}
                      slug={cluster.slug ? String(cluster.slug) : null}
                      language={lang}
                      sources={sources.length > 0 ? sources : [{ name: 'Multiple Sources', feed_url: '#' }]}
                      category={cluster.topic ? String(cluster.topic) : null}
                      topics={topicsArray}
                      imageUrl={imageUrl}
                    />
                  );
                } catch (error) {
                  console.error('Error rendering cluster card:', error, cluster);
                  // Return null to skip this cluster
                  return null;
                }
              }).filter(Boolean)}
            </div>

            {(!safeClusters || safeClusters.length === 0) && (
              <div className="text-center py-12 text-[#5F6368]">
                {lang === 'en' && 'No articles found for this topic.'}
                {lang === 'si' && 'මෙම මාතෘකාව සඳහා ලිපි හමු නොවීය.'}
                {lang === 'ta' && 'இந்த தலைப்புக்கான கட்டுரைகள் எதுவும் இல்லை.'}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              {/* Filter Menu */}
              <FilterMenu
                currentTopic={topic}
                language={lang}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

