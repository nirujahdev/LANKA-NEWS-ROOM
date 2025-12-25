import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import NavigationWrapper from '@/components/NavigationWrapper';
import IncidentDetail from '@/components/IncidentDetail';
import NewsArticleSchema from '@/components/NewsArticleSchema';
import BreadcrumbSchema from '@/components/BreadcrumbSchema';
import TopicCard from '@/components/TopicCard';
import RelatedTopics from '@/components/RelatedTopics';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // Revalidate every 5 minutes

type Props = {
  params: Promise<{ lang: 'en' | 'si' | 'ta'; slug: string }>;
};

async function getClusterBySlug(slug: string) {
  try {
    // Check if Supabase is configured
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Supabase credentials not configured');
      return null;
    }

    console.log(`🔍 Fetching cluster with slug: "${slug}"`);
    const { data: cluster, error } = await supabaseAdmin
      .from('clusters')
      .select(`
        *,
        summaries (
          summary_en,
          summary_si,
          summary_ta,
          key_facts_en,
          key_facts_si,
          key_facts_ta,
          confirmed_vs_differs_en,
          confirmed_vs_differs_si,
          confirmed_vs_differs_ta
        )
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
        source_count?: number | null;
        category?: string | null;
        topic?: string | null;
        image_url?: string | null;
        language?: string | null;
        keywords?: string[] | null;
        last_checked_at?: string | null;
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const { lang, slug } = resolvedParams;
    const data = await getClusterBySlug(slug);

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

    // Build language URLs with new structure
    const enUrl = `${baseUrl}/en/story/${slug}`;
    const siUrl = `${baseUrl}/si/story/${slug}`;
    const taUrl = `${baseUrl}/ta/story/${slug}`;
    
    // Current language URL (canonical)
    const canonicalUrl = lang === 'si' ? siUrl : lang === 'ta' ? taUrl : enUrl;

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
        modifiedTime: cluster.last_checked_at || cluster.updated_at || undefined,
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
        description: metaDescription || '',
        ...(imageUrl && { images: [imageUrl] })
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

export default async function StoryPage({ params }: Props) {
  try {
    const resolvedParams = await params;
    const { lang, slug } = resolvedParams;
    const data = await getClusterBySlug(slug);

    if (!data || !data.cluster) {
      notFound();
    }

    const { cluster, summary, articles } = data;
    
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lankanewsroom.xyz';
    const canonicalUrl = `${baseUrl}/${lang}/story/${slug}`;
    
    // Get metadata for JSON-LD
    const metaDescription =
      lang === 'si' ? cluster.meta_description_si || summary?.summary_si :
      lang === 'ta' ? cluster.meta_description_ta || summary?.summary_ta :
      cluster.meta_description_en || summary?.summary_en;

    const firstArticle = articles?.[0] as { image_url?: string | null } | undefined;
    const imageUrl = cluster.image_url || firstArticle?.image_url || null;

    // Get language-specific key facts and confirmed vs differs
    const keyFacts = 
      lang === 'si' ? summary?.key_facts_si || null :
      lang === 'ta' ? summary?.key_facts_ta || null :
      summary?.key_facts_en || null;

    const confirmedVsDiffers =
      lang === 'si' ? summary?.confirmed_vs_differs_si || null :
      lang === 'ta' ? summary?.confirmed_vs_differs_ta || null :
      summary?.confirmed_vs_differs_en || null;

    // Build breadcrumb items
    const breadcrumbItems = [
      { name: lang === 'si' ? 'මුල් පිටුව' : lang === 'ta' ? 'முகப்பு' : 'Home', url: `/${lang}` },
      {
        name: cluster.topic 
          ? (lang === 'si' ? cluster.topic : lang === 'ta' ? cluster.topic : cluster.topic)
          : (lang === 'si' ? 'පුවත්' : lang === 'ta' ? 'செய்திகள்' : 'News'),
        url: cluster.topic ? `/${lang}/topic/${cluster.topic}` : `/${lang}`
      },
      { name: cluster.headline, url: `/${lang}/story/${slug}` }
    ];

    return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* JSON-LD Structured Data for Google News */}
      <NewsArticleSchema
        headline={cluster.headline}
        description={metaDescription || cluster.headline}
        datePublished={cluster.published_at || cluster.created_at || new Date().toISOString()}
        dateModified={cluster.last_checked_at || cluster.updated_at || undefined}
        imageUrl={imageUrl || undefined}
        category={cluster.category || undefined}
        topic={cluster.topic || undefined}
        keywords={cluster.keywords || undefined}
        url={canonicalUrl}
        language={lang}
      />
      
      {/* Breadcrumb Schema */}
      <BreadcrumbSchema items={breadcrumbItems} />
      
      <NavigationWrapper currentLanguage={lang} />
      
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
              <IncidentDetail
                id={cluster.id}
                slug={cluster.slug}
                headline={cluster.headline}
                summary={
                  lang === 'si'
                    ? summary?.summary_si || summary?.summary_en || ''
                    : lang === 'ta'
                    ? summary?.summary_ta || summary?.summary_en || ''
                    : summary?.summary_en || ''
                }
                summarySi={summary?.summary_si}
                summaryTa={summary?.summary_ta}
                sources={(articles || []).map((article: any) => article.sources || { name: 'Unknown', feed_url: '#' })}
                updatedAt={cluster.updated_at}
                firstSeen={cluster.first_seen_at}
                sourceCount={cluster.source_count || 0}
                currentLanguage={lang}
                keyFacts={keyFacts || undefined}
                confirmedVsDiffers={confirmedVsDiffers || undefined}
                lastCheckedAt={cluster.last_checked_at}
              />
            </div>
          </main>

          {/* Right Sidebar - Widgets */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              {/* Topic Card (if article has a topic) */}
              {cluster.topic && (
                <TopicCard
                  topic={cluster.topic}
                  topicSlug={cluster.topic}
                  imageUrl={cluster.image_url}
                  language={lang}
                  articleCount={cluster.source_count || undefined}
                />
              )}

              {/* Related Topics */}
              <RelatedTopics
                currentTopic={cluster.topic || undefined}
                language={lang}
              />

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
    console.error('Error rendering StoryPage:', error);
    notFound();
  }
}

