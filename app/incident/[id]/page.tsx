import { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import IncidentDetailPageContent from './IncidentDetailContent';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    const { data: cluster, error } = await supabaseAdmin
      .from('clusters')
      .select(`
        *,
        summaries (summary_en, summary_si, summary_ta)
      `)
      .eq('id', id)
      .eq('status', 'published')
      .single<{
        headline: string;
        meta_title_en?: string | null;
        meta_description_en?: string | null;
        meta_title_si?: string | null;
        meta_description_si?: string | null;
        meta_title_ta?: string | null;
        meta_description_ta?: string | null;
        slug?: string | null;
        image_url?: string | null;
        published_at?: string | null;
        updated_at?: string | null;
        summaries?: Array<{
          summary_en?: string | null;
          summary_si?: string | null;
          summary_ta?: string | null;
        }>;
      }>();

    if (error || !cluster) {
      return {
        title: 'News Not Found | Lanka News Room',
        description: 'The requested news article could not be found.'
      };
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lankanewsroom.xyz';
    const metaTitle = cluster.meta_title_en || cluster.headline;
    const metaDescription = cluster.meta_description_en || cluster.summaries?.[0]?.summary_en || 'Latest news from Sri Lanka';
    const canonicalUrl = cluster.slug ? `${baseUrl}/en/story/${cluster.slug}` : `${baseUrl}/incident/${id}`;
    const imageUrl = cluster.image_url;

    return {
      title: metaTitle,
      description: metaDescription,
      alternates: {
        canonical: canonicalUrl
      },
      openGraph: {
        title: metaTitle,
        description: metaDescription,
        type: 'article',
        locale: 'en_LK',
        url: canonicalUrl,
        siteName: 'Lanka News Room',
        publishedTime: cluster.published_at || undefined,
        modifiedTime: cluster.updated_at || undefined,
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
        description: metaDescription,
        ...(imageUrl && { images: [imageUrl] })
      },
      robots: {
        index: true,
        follow: true
      }
    };
  } catch (error) {
    return {
      title: 'News | Lanka News Room',
      description: 'Latest news from Sri Lanka'
    };
  }
}

export default async function IncidentDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  
  return <IncidentDetailPageContent id={id} />;
}
