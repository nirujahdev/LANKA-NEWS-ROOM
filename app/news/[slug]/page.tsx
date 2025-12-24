import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import NavigationWrapper from '@/components/NavigationWrapper';
import IncidentDetail from '@/components/IncidentDetail';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // Revalidate every 5 minutes

type Props = {
  params: { slug: string };
  searchParams: { lang?: 'en' | 'si' | 'ta' };
};

async function getClusterBySlug(slug: string) {
  const { data: cluster, error } = await supabaseAdmin
    .from('clusters')
    .select(`
      *,
      summaries (*)
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !cluster) return null;

  // Get articles for this cluster
  const { data: articles } = await supabaseAdmin
    .from('articles')
    .select(`
      *,
      sources (name, feed_url)
    `)
    .eq('cluster_id', cluster.id)
    .order('published_at', { ascending: false });

  return {
    cluster,
    summary: cluster.summaries?.[0] || null,
    articles: articles || []
  };
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const lang = searchParams.lang || 'en';
  const data = await getClusterBySlug(params.slug);

  if (!data) {
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

  return {
    title: metaTitle,
    description: metaDescription || 'Latest news from Sri Lanka',
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en': enUrl,
        'si': siUrl,
        'ta': taUrl
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
      section: cluster.category || undefined
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
}

export default async function NewsDetailPage({ params, searchParams }: Props) {
  const lang = searchParams.lang || 'en';
  const data = await getClusterBySlug(params.slug);

  if (!data || !data.cluster || !data.summary) {
    notFound();
  }

  const { cluster, summary, articles } = data;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lankanewsroom.xyz';
  const enUrl = `${baseUrl}/news/${params.slug}`;
  const siUrl = `${baseUrl}/news/${params.slug}?lang=si`;
  const taUrl = `${baseUrl}/news/${params.slug}?lang=ta`;

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
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

