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
import TopicNavigation from '@/components/TopicNavigation';
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
      // First try to match single topic field, then filter by topics array in memory if needed
      // For now, use single topic matching (topics array matching will be added via RPC if needed)
      query = query.ilike('topic', topicString);
      
      // Note: For topics array matching, we'll need to either:
      // 1. Create an RPC function that uses PostgreSQL array operators, or
      // 2. Fetch all and filter in memory (less efficient but works)
      // For initial implementation, single topic matching should work

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
          }).slice(0, 20); // Limit to 20 after filtering
        }
      }
    }
  } catch (error) {
    console.error('Error in topic page query:', error);
    clusters = [];
  }

  const topicLabel = getTopicLabel(topic, lang);
  const countryRef = lang === 'en' ? 'Sri Lanka' : lang === 'si' ? 'ශ්‍රී ලංකා' : 'இலங்கை';
  const newsLabel = lang === 'en' ? 'News' : lang === 'si' ? 'පුවත්' : 'செய்திகள்';

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <NavigationWrapper currentLanguage={lang} />
      <TopicNavigation language={lang} />
      
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
              {clusters?.map((cluster: any) => {
                const summary = cluster.summaries?.[0];
                const summaryText =
                  lang === 'si' ? summary?.summary_si || summary?.summary_en || '' :
                  lang === 'ta' ? summary?.summary_ta || summary?.summary_en || '' :
                  summary?.summary_en || '';

                // Get language-specific headline
                const headlineText =
                  lang === 'si' ? cluster.headline_si || cluster.headline :
                  lang === 'ta' ? cluster.headline_ta || cluster.headline :
                  cluster.headline;

                // Extract unique sources from articles
                const sourcesMap = new Map<string, { name: string; feed_url: string }>();
                cluster.articles?.forEach((article: any) => {
                  if (article.sources) {
                    const source = article.sources;
                    if (!sourcesMap.has(source.name)) {
                      sourcesMap.set(source.name, {
                        name: source.name,
                        feed_url: source.feed_url || '#'
                      });
                    }
                  }
                });
                const sources = Array.from(sourcesMap.values());

                // Get topics array (prefer topics array, fallback to single topic)
                const topicsArray = cluster.topics && Array.isArray(cluster.topics) && cluster.topics.length > 0
                  ? cluster.topics
                  : cluster.topic ? [cluster.topic] : [];

                return (
                  <NewsCard
                    key={cluster.id}
                    id={cluster.id}
                    headline={headlineText}
                    summary={summaryText}
                    sourceCount={cluster.source_count || 0}
                    updatedAt={cluster.last_seen_at}
                    slug={cluster.slug}
                    language={lang}
                    sources={sources.length > 0 ? sources : [{ name: 'Multiple Sources', feed_url: '#' }]}
                    category={cluster.topic || null}
                    topics={topicsArray}
                  />
                );
              })}
            </div>

            {(!clusters || clusters.length === 0) && (
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

