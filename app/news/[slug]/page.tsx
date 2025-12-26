import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import NavigationWrapper from '@/components/NavigationWrapper';
import TopicNavigation from '@/components/TopicNavigation';
import StoryDetail from '@/components/StoryDetail';
import NewsArticleSchema from '@/components/NewsArticleSchema';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // Revalidate every 5 minutes

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: 'en' | 'si' | 'ta' }>;
};

async function getClusterBySlug(slug: string) {
  try {
    // Check if Supabase is configured
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Supabase credentials not configured');
      console.error('   SUPABASE_URL:', process.env.SUPABASE_URL ? '✓' : '✗');
      console.error('   SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓' : '✗');
      return null;
    }

    console.log(`🔍 Fetching cluster with slug: "${slug}"`);
    const { data: cluster, error } = await supabaseAdmin
      .from('clusters')
      .select(`
        *,
        summaries (*)
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single<{
        id: string;
        headline: string;
        status: string;
        meta_title_en?: string | null;
        meta_description_en?: string | null;
        meta_title_si?: string | null;
        meta_description_si?: string | null;
        meta_title_ta?: string | null;
        meta_description_ta?: string | null;
        slug?: string | null;
        published_at?: string | null;
        updated_at?: string | null;
        created_at?: string | null;
        first_seen_at?: string | null;
        last_checked_at?: string | null;
        source_count?: number | null;
        category?: string | null;
        topic?: string | null;
        topics?: string[] | null;
        keywords?: string[] | null;
        headline_si?: string | null;
        headline_ta?: string | null;
        image_url?: string | null;
        language?: string | null;
        summaries?: Array<{
          summary_en?: string | null;
          summary_si?: string | null;
          summary_ta?: string | null;
          key_facts_en?: string[] | null;
          key_facts_si?: string[] | null;
          key_facts_ta?: string[] | null;
          confirmed_vs_differs_en?: string | null;
          confirmed_vs_differs_si?: string | null;
          confirmed_vs_differs_ta?: string | null;
        }>;
      }>();

    if (error) {
      console.error('❌ Error fetching cluster:', error);
      console.error('   Error code:', error.code);
      console.error('   Error message:', error.message);
      console.error('   Error details:', error.details);
      return null;
    }

    if (!cluster) {
      console.warn(`⚠️  No cluster found with slug: "${slug}"`);
      return null;
    }

    console.log(`✅ Found cluster: ${cluster.id} - "${cluster.headline}"`);

    // Get articles for this cluster
    const { data: articles, error: articlesError } = await supabaseAdmin
      .from('articles')
      .select(`
        *,
        sources (name, feed_url)
      `)
      .eq('cluster_id', cluster.id)
      .order('published_at', { ascending: false })
      .returns<Array<{
        id: string;
        image_url: string | null;
        [key: string]: any;
      }>>();

    if (articlesError) {
      console.error('⚠️  Error fetching articles:', articlesError);
      // Continue with empty articles array
    } else {
      console.log(`✅ Found ${articles?.length || 0} articles for cluster`);
    }

    return {
      cluster,
      summary: cluster.summaries?.[0] || null,
      articles: articles || []
    };
  } catch (error) {
    console.error('Error in getClusterBySlug:', error);
    return null;
  }
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const resolvedSearchParams = await searchParams;
    const lang = resolvedSearchParams.lang || 'en';
    const data = await getClusterBySlug(resolvedParams.slug);

    if (!data || !data.cluster) {
      return {
        title: 'News Not Found | Lanka News Room',
        description: 'The requested news article could not be found.'
      };
    }

    const { cluster, summary } = data;
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lankanewsroom.xyz';

    // Get language-specific metadata
    const metaTitle = 
      lang === 'si' ? cluster.meta_title_si || cluster.headline :
      lang === 'ta' ? cluster.meta_title_ta || cluster.headline :
      cluster.meta_title_en || cluster.headline;

    const metaDescription =
      lang === 'si' ? cluster.meta_description_si || summary?.summary_si :
      lang === 'ta' ? cluster.meta_description_ta || summary?.summary_ta :
      cluster.meta_description_en || summary?.summary_en;

    const canonicalUrl = `${baseUrl}/news/${resolvedParams.slug}`;
    const enUrl = `${baseUrl}/news/${resolvedParams.slug}?lang=en`;
    const siUrl = `${baseUrl}/news/${resolvedParams.slug}?lang=si`;
    const taUrl = `${baseUrl}/news/${resolvedParams.slug}?lang=ta`;

    // Get first article image if cluster doesn't have one
    const firstArticle = data.articles?.[0] as { image_url?: string | null } | undefined;
    const imageUrl = cluster.image_url || firstArticle?.image_url || null;

    return {
      title: metaTitle,
      description: metaDescription || 'Latest news from Sri Lanka',
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
        title: metaTitle,
        description: metaDescription || '',
        type: 'article',
        locale: lang === 'si' ? 'si_LK' : lang === 'ta' ? 'ta_LK' : 'en_LK',
        url: canonicalUrl,
        siteName: 'Lanka News Room',
        publishedTime: cluster.published_at || cluster.created_at || undefined,
        modifiedTime: cluster.updated_at || undefined,
        section: cluster.category || undefined,
        ...(imageUrl && {
          images: [
            {
              url: imageUrl,
              width: 1200,
              height: 630,
              alt: metaTitle
            }
          ]
        })
      },
      twitter: {
        card: 'summary_large_image',
        title: metaTitle,
        description: metaDescription || ''
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
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'News | Lanka News Room',
      description: 'Latest news from Sri Lanka'
    };
  }
}

export default async function NewsDetailPage({ params, searchParams }: Props) {
  try {
    const resolvedParams = await params;
    const resolvedSearchParams = await searchParams;
    const lang = resolvedSearchParams.lang || 'en';
    const data = await getClusterBySlug(resolvedParams.slug);

    if (!data || !data.cluster) {
      notFound();
    }

    const { cluster, summary, articles } = data;
    
    // Serialize cluster data to ensure all dates are strings and all values are serializable
    // Helper function to safely convert date values to ISO strings
    const toISOString = (value: any): string | null => {
      if (!value) return null;
      if (value instanceof Date) {
        return value.toISOString();
      }
      if (typeof value === 'string') {
        // Try to parse and validate the date string
        try {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            return date.toISOString();
          }
        } catch {
          // If parsing fails, return the original string
        }
        return value;
      }
      return String(value);
    };

    const serializedCluster = {
      ...cluster,
      // Convert all date fields to ISO strings
      published_at: toISOString(cluster.published_at),
      updated_at: toISOString(cluster.updated_at),
      created_at: toISOString(cluster.created_at),
      first_seen_at: toISOString(cluster.first_seen_at),
      last_checked_at: toISOString(cluster.last_checked_at),
      // Ensure all string fields are strings
      id: String(cluster.id || ''),
      headline: String(cluster.headline || ''),
      headline_si: cluster.headline_si ? String(cluster.headline_si) : null,
      headline_ta: cluster.headline_ta ? String(cluster.headline_ta) : null,
      slug: cluster.slug ? String(cluster.slug) : null,
      status: String(cluster.status || 'published'),
      topic: cluster.topic ? String(cluster.topic) : null,
      category: cluster.category ? String(cluster.category) : null,
      image_url: cluster.image_url ? String(cluster.image_url) : null,
      source_count: typeof cluster.source_count === 'number' ? cluster.source_count : 0,
      topics: Array.isArray(cluster.topics) ? cluster.topics.filter((t: any) => typeof t === 'string') : [],
      keywords: Array.isArray(cluster.keywords) ? cluster.keywords.filter((k: any) => typeof k === 'string') : null,
      meta_title_en: cluster.meta_title_en ? String(cluster.meta_title_en) : null,
      meta_description_en: cluster.meta_description_en ? String(cluster.meta_description_en) : null,
      meta_title_si: cluster.meta_title_si ? String(cluster.meta_title_si) : null,
      meta_description_si: cluster.meta_description_si ? String(cluster.meta_description_si) : null,
      meta_title_ta: cluster.meta_title_ta ? String(cluster.meta_title_ta) : null,
      meta_description_ta: cluster.meta_description_ta ? String(cluster.meta_description_ta) : null
    };
    
    // Serialize articles
    const serializedArticles = (articles || []).map((article: any) => {
      if (!article || typeof article !== 'object') return null;
      return {
        id: String(article.id || ''),
        image_url: article.image_url && typeof article.image_url === 'string' ? article.image_url : null,
        sources: article.sources && typeof article.sources === 'object' 
          ? {
              name: String(article.sources.name || 'Unknown'),
              feed_url: String(article.sources.feed_url || '#')
            }
          : { name: 'Unknown', feed_url: '#' }
      };
    }).filter(Boolean);
    
    // Serialize summary object to ensure all values are JSON-serializable
    const serializedSummary = summary ? {
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
    } : null;

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lankanewsroom.xyz';
    const canonicalUrl = `${baseUrl}/news/${resolvedParams.slug}`;
    
    // Get language-specific headline
    const headlineText =
      lang === 'si' ? serializedCluster.headline_si || serializedCluster.headline :
      lang === 'ta' ? serializedCluster.headline_ta || serializedCluster.headline :
      serializedCluster.headline;
    
    // Get metadata for JSON-LD
    const metaDescription =
      lang === 'si' ? serializedCluster.meta_description_si || serializedSummary?.summary_si :
      lang === 'ta' ? serializedCluster.meta_description_ta || serializedSummary?.summary_ta :
      serializedCluster.meta_description_en || serializedSummary?.summary_en;

    const firstArticle = serializedArticles?.[0] as { image_url?: string | null } | undefined;
    const imageUrl = serializedCluster.image_url || firstArticle?.image_url || null;

    return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* JSON-LD Structured Data for Google News */}
      <NewsArticleSchema
        headline={headlineText}
        description={metaDescription || headlineText}
        datePublished={serializedCluster.published_at || serializedCluster.created_at || new Date().toISOString()}
        dateModified={serializedCluster.updated_at || null}
        imageUrl={imageUrl || null}
        category={serializedCluster.category || null}
        url={canonicalUrl}
        language={lang}
      />
      
      <NavigationWrapper currentLanguage={lang} />
      <TopicNavigation language={lang} />
      
      {/* Mobile-first responsive container */}
      <div className="max-w-[1600px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8 pt-3 sm:pt-4 md:pt-6">
          {/* Left Ad Space - Desktop only */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <div className="min-h-[600px]"></div>
            </div>
          </aside>

          {/* Center Content - Full width on mobile, constrained on desktop */}
          <main className="flex-1 min-w-0 w-full lg:max-w-3xl lg:mx-auto">
            <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 lg:p-10">
              <StoryDetail
                id={serializedCluster.id}
                slug={serializedCluster.slug}
                headline={headlineText}
                summary={
                  lang === 'si'
                    ? serializedSummary?.summary_si || serializedSummary?.summary_en || ''
                    : lang === 'ta'
                    ? serializedSummary?.summary_ta || serializedSummary?.summary_en || ''
                    : serializedSummary?.summary_en || ''
                }
                summarySi={serializedSummary?.summary_si || null}
                summaryTa={serializedSummary?.summary_ta || null}
                sources={serializedArticles.map((article: any) => article.sources || { name: 'Unknown', feed_url: '#' })}
                updatedAt={serializedCluster.updated_at || null}
                firstSeen={serializedCluster.first_seen_at || null}
                sourceCount={serializedCluster.source_count || 0}
                currentLanguage={lang}
              />
            </div>
          </main>

          {/* Right Sidebar - Widgets */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              {/* Ad Placeholder */}
              <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-[#E8EAED] p-4 h-48 flex items-center justify-center bg-gray-50">
                <span className="text-sm text-[#5F6368]">Advertisement</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
  } catch (error) {
    console.error('Error rendering NewsDetailPage:', error);
    notFound();
  }
}

