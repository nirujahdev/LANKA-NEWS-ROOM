import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import NavigationWrapper from '@/components/NavigationWrapper';
import IncidentDetail from '@/components/IncidentDetail';
import NewsArticleSchema from '@/components/NewsArticleSchema';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // Revalidate every 5 minutes

type Props = {
  params: { slug: string };
  searchParams: { lang?: 'en' | 'si' | 'ta' };
};

async function getClusterBySlug(slug: string) {
  try {
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
        source_count?: number | null;
        category?: string | null;
        image_url?: string | null;
        language?: string | null;
        summaries?: Array<{
          summary_en?: string | null;
          summary_si?: string | null;
          summary_ta?: string | null;
        }>;
      }>();

    if (error || !cluster) {
      console.error('Error fetching cluster:', error);
      return null;
    }

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
      console.error('Error fetching articles:', articlesError);
      // Continue with empty articles array
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
    const lang = searchParams.lang || 'en';
    const data = await getClusterBySlug(params.slug);

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

    const canonicalUrl = `${baseUrl}/news/${params.slug}`;
    const enUrl = `${baseUrl}/news/${params.slug}?lang=en`;
    const siUrl = `${baseUrl}/news/${params.slug}?lang=si`;
    const taUrl = `${baseUrl}/news/${params.slug}?lang=ta`;

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
    const lang = searchParams.lang || 'en';
    const data = await getClusterBySlug(params.slug);

    if (!data || !data.cluster) {
      notFound();
    }

    const { cluster, summary, articles } = data;
    
    // Allow page to render even without summary (cluster might be processing)
    // Summary will be empty string if not available

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lankanewsroom.xyz';
    const canonicalUrl = `${baseUrl}/news/${params.slug}`;
    
    // Get metadata for JSON-LD
    const metaDescription =
      lang === 'si' ? cluster.meta_description_si || summary?.summary_si :
      lang === 'ta' ? cluster.meta_description_ta || summary?.summary_ta :
      cluster.meta_description_en || summary?.summary_en;

    const firstArticle = articles?.[0] as { image_url?: string | null } | undefined;
    const imageUrl = cluster.image_url || firstArticle?.image_url || null;

    return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* JSON-LD Structured Data for Google News */}
      <NewsArticleSchema
        headline={cluster.headline}
        description={metaDescription || cluster.headline}
        datePublished={cluster.published_at || cluster.created_at || new Date().toISOString()}
        dateModified={cluster.updated_at || undefined}
        imageUrl={imageUrl || undefined}
        category={cluster.category || undefined}
        url={canonicalUrl}
        language={lang}
      />
      
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
                onLanguageChange={() => {}} // Server component
              />
            </div>
          </main>

          {/* Right Ad Space - Desktop only */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <div className="min-h-[600px]"></div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

