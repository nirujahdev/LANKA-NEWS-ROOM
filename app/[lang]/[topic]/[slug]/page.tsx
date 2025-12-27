import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import NavigationWrapper from '@/components/NavigationWrapper';
import TopicNavigation from '@/components/TopicNavigation';
import StoryDetail from '@/components/StoryDetail';
import NewsArticleSchema from '@/components/NewsArticleSchema';
import BreadcrumbSchema from '@/components/BreadcrumbSchema';
import { normalizeTopicSlug, isValidTopic } from '@/lib/topics';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // Revalidate every 5 minutes

type Props = {
  params: Promise<{ lang: 'en' | 'si' | 'ta'; topic: string; slug: string }>;
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
        topics?: string[] | null;
        headline_si?: string | null;
        headline_ta?: string | null;
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
    const { lang, topic: rawTopic, slug } = resolvedParams;
    
    // Normalize and validate topic
    const topic = normalizeTopicSlug(rawTopic);
    if (!topic || !isValidTopic(topic)) {
      return { title: 'Not Found' };
    }
    
    const data = await getClusterBySlug(slug);

    if (!data || !data.cluster) {
      return {
        title: 'News Not Found | Lanka News Room',
        description: 'The requested news article could not be found.'
      };
    }

    // Validate topic matches cluster topic
    const clusterTopic = normalizeTopicSlug(data.cluster.topic);
    if (clusterTopic && clusterTopic !== topic) {
      // Topic mismatch - will redirect in component
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

    // Build language URLs with new structure: /{lang}/{topic}/{slug}
    const enUrl = `${baseUrl}/en/${clusterTopic || 'other'}/${slug}`;
    const siUrl = `${baseUrl}/si/${clusterTopic || 'other'}/${slug}`;
    const taUrl = `${baseUrl}/ta/${clusterTopic || 'other'}/${slug}`;
    
    // Current language URL (canonical)
    const canonicalUrl = lang === 'si' ? siUrl : lang === 'ta' ? taUrl : enUrl;

    // Get first article image if cluster doesn't have one
    const firstArticle = data.articles?.[0] as { image_url?: string | null } | undefined;
    const imageUrl = cluster.image_url || firstArticle?.image_url || null;

    return {
      title: metaTitle,
      description: metaDescription || 'An AI system for srilankan news insights',
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
      description: 'An AI system for srilankan news insights'
    };
  }
}

export default async function StoryPage({ params }: Props) {
  // #region agent log
  console.log('[DEBUG] StoryPage entry');
  // #endregion
  try {
    const resolvedParams = await params;
    const { lang, topic: rawTopic, slug } = resolvedParams;
    
    // #region agent log
    console.log('[DEBUG] Params resolved', {lang, topic: rawTopic, slug});
    // #endregion
    
    // Normalize and validate topic
    const topic = normalizeTopicSlug(rawTopic);
    if (!topic || !isValidTopic(topic)) {
      notFound();
    }
    
    const data = await getClusterBySlug(slug);
    
    // #region agent log
    console.log('[DEBUG] Data fetched', {hasData: !!data, hasCluster: !!data?.cluster, clusterId: data?.cluster?.id});
    // #endregion

    if (!data || !data.cluster) {
      notFound();
    }

    // Get cluster topics array and find first non-"other" topic for URL
    const clusterTopics = data.cluster.topics && Array.isArray(data.cluster.topics) 
      ? data.cluster.topics.map((t: string) => normalizeTopicSlug(t)).filter(Boolean)
      : [];
    const clusterTopic = normalizeTopicSlug(data.cluster.topic);
    
    // Find first non-"other" topic from topics array, then fallback to single topic
    const primaryTopic = clusterTopics.find(t => t && t !== 'other') 
      || (clusterTopic && clusterTopic !== 'other' ? clusterTopic : null)
      || clusterTopics[0] 
      || clusterTopic 
      || 'other';
    
    // #region agent log
    console.log('[DEBUG] PrimaryTopic calculated', {primaryTopic, primaryTopicType: typeof primaryTopic, currentTopic: topic});
    // #endregion
    
    // Check if current topic is in cluster's topics (single topic or topics array)
    const allClusterTopics = clusterTopics.length > 0 ? clusterTopics : (clusterTopic ? [clusterTopic] : []);
    const topicMatches = allClusterTopics.includes(topic);
    
    if (!topicMatches && primaryTopic && primaryTopic !== 'other') {
      // #region agent log
      console.log('[DEBUG] Redirecting', {lang, primaryTopic, slug, redirectUrl: `/${lang}/${primaryTopic}/${slug}`});
      // #endregion
      // Redirect to primary topic if current topic doesn't match
      redirect(`/${lang}/${primaryTopic}/${slug}`);
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

    // #region agent log
    console.log('[DEBUG] Before serialization', {clusterKeys: Object.keys(cluster || {}), hasSummary: !!summary, articlesCount: articles?.length});
    // #endregion
    
    // Deep serialize cluster - don't use spread operator as it might copy non-serializable properties
    const serializedCluster: any = {
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
      topics: Array.isArray(cluster.topics) ? cluster.topics.filter((t: any) => typeof t === 'string').map((t: any) => String(t)) : [],
      keywords: Array.isArray(cluster.keywords) ? cluster.keywords.filter((k: any) => typeof k === 'string').map((k: any) => String(k)) : null,
      meta_title_en: cluster.meta_title_en ? String(cluster.meta_title_en) : null,
      meta_description_en: cluster.meta_description_en ? String(cluster.meta_description_en) : null,
      meta_title_si: cluster.meta_title_si ? String(cluster.meta_title_si) : null,
      meta_description_si: cluster.meta_description_si ? String(cluster.meta_description_si) : null,
      meta_title_ta: cluster.meta_title_ta ? String(cluster.meta_title_ta) : null,
      meta_description_ta: cluster.meta_description_ta ? String(cluster.meta_description_ta) : null,
      language: cluster.language ? String(cluster.language) : null
    };
    
    // Remove any undefined values
    Object.keys(serializedCluster).forEach(key => {
      if (serializedCluster[key] === undefined) {
        delete serializedCluster[key];
      }
    });
    
    // #region agent log
    try{
      JSON.stringify(serializedCluster);
      console.log('[DEBUG] SerializedCluster JSON test passed');
    }catch(e){
      console.error('[DEBUG] SerializedCluster JSON test FAILED:', e);
      // Don't throw - log the error for debugging but continue
    }
    // #endregion
    
    // Serialize articles - ensure ALL properties are serializable
    const serializedArticles = (articles || []).map((article: any) => {
      if (!article || typeof article !== 'object') return null;
      
      // Helper to serialize any value
      const serializeValue = (value: any): any => {
        if (value === null || value === undefined) return null;
        if (value instanceof Date) return value.toISOString();
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
        if (Array.isArray(value)) return value.map(serializeValue);
        if (typeof value === 'object') {
          const serialized: any = {};
          for (const key in value) {
            if (value.hasOwnProperty(key) && typeof key === 'string') {
              try {
                serialized[key] = serializeValue(value[key]);
              } catch {
                // Skip non-serializable properties
              }
            }
          }
          return serialized;
        }
        return null; // Skip functions and other non-serializable types
      };
      
      // Serialize sources object
      let serializedSources = { name: 'Unknown', feed_url: '#' };
      if (article.sources && typeof article.sources === 'object') {
        try {
          serializedSources = {
            name: String(article.sources.name || 'Unknown'),
            feed_url: String(article.sources.feed_url || '#')
          };
        } catch {
          // Use defaults if serialization fails
        }
      }
      
      const serialized = {
        id: String(article.id || ''),
        image_url: article.image_url && typeof article.image_url === 'string' ? article.image_url : null,
        sources: serializedSources
      };
      
      // #region agent log
      try{
        JSON.stringify(serialized);
      }catch(e){
        console.error('[DEBUG] Article serialization FAILED:', e, {articleId: article.id});
      }
      // #endregion
      return serialized;
    }).filter(Boolean);
    
    // #region agent log
    try{
      JSON.stringify(serializedArticles);
      console.log('[DEBUG] SerializedArticles JSON test passed', {count: serializedArticles.length});
    }catch(e){
      console.error('[DEBUG] SerializedArticles JSON test FAILED:', e);
    }
    // #endregion
    
    // Serialize summary object to ensure all values are JSON-serializable
    const serializedSummary = summary && typeof summary === 'object' ? {
      summary_en: summary.summary_en && typeof summary.summary_en === 'string' ? String(summary.summary_en) : null,
      summary_si: summary.summary_si && typeof summary.summary_si === 'string' ? String(summary.summary_si) : null,
      summary_ta: summary.summary_ta && typeof summary.summary_ta === 'string' ? String(summary.summary_ta) : null,
      key_facts_en: Array.isArray(summary.key_facts_en) 
        ? summary.key_facts_en.filter((item: any) => item != null && typeof item === 'string').map((item: any) => String(item))
        : null,
      key_facts_si: Array.isArray(summary.key_facts_si) 
        ? summary.key_facts_si.filter((item: any) => item != null && typeof item === 'string').map((item: any) => String(item))
        : null,
      key_facts_ta: Array.isArray(summary.key_facts_ta) 
        ? summary.key_facts_ta.filter((item: any) => item != null && typeof item === 'string').map((item: any) => String(item))
        : null,
      confirmed_vs_differs_en: summary.confirmed_vs_differs_en && typeof summary.confirmed_vs_differs_en === 'string' ? String(summary.confirmed_vs_differs_en) : null,
      confirmed_vs_differs_si: summary.confirmed_vs_differs_si && typeof summary.confirmed_vs_differs_si === 'string' ? String(summary.confirmed_vs_differs_si) : null,
      confirmed_vs_differs_ta: summary.confirmed_vs_differs_ta && typeof summary.confirmed_vs_differs_ta === 'string' ? String(summary.confirmed_vs_differs_ta) : null
    } : null;
    
    // #region agent log
    try{
      JSON.stringify(serializedSummary);
      console.log('[DEBUG] SerializedSummary JSON test passed');
    }catch(e){
      console.error('[DEBUG] SerializedSummary JSON test FAILED:', e);
    }
    // #endregion
    
    const baseUrl = String(process.env.NEXT_PUBLIC_SITE_URL || 'https://lankanewsroom.xyz');
    const canonicalUrl = `${baseUrl}/${String(lang)}/${String(primaryTopic)}/${String(slug)}`;

    // Get language-specific headline - ensure it's a string
    const headlineText = String(
      lang === 'si' ? (serializedCluster.headline_si || serializedCluster.headline || '') :
      lang === 'ta' ? (serializedCluster.headline_ta || serializedCluster.headline || '') :
      (serializedCluster.headline || '')
    );

    // Get metadata for JSON-LD - ensure it's a string
    const metaDescription = String(
      lang === 'si' ? (serializedCluster.meta_description_si || serializedSummary?.summary_si || headlineText) :
      lang === 'ta' ? (serializedCluster.meta_description_ta || serializedSummary?.summary_ta || headlineText) :
      (serializedCluster.meta_description_en || serializedSummary?.summary_en || headlineText)
    );

    const firstArticle = serializedArticles?.[0] as { image_url?: string | null } | undefined;
    const imageUrl = serializedCluster.image_url || firstArticle?.image_url || null;
    
    // Ensure imageUrl is a string or null
    const safeImageUrl = imageUrl && typeof imageUrl === 'string' ? String(imageUrl) : null;
    
    // Ensure datePublished is always a string
    const datePublished = String(
      serializedCluster.published_at || 
      serializedCluster.created_at || 
      new Date().toISOString()
    );
    
    // Ensure dateModified is a string or null
    const dateModified = serializedCluster.last_checked_at || serializedCluster.updated_at 
      ? String(serializedCluster.last_checked_at || serializedCluster.updated_at)
      : null;

    // Get language-specific key facts and confirmed vs differs (from serialized summary)
    // Ensure arrays are properly serialized
    const keyFactsRaw = 
      lang === 'si' ? serializedSummary?.key_facts_si :
      lang === 'ta' ? serializedSummary?.key_facts_ta :
      serializedSummary?.key_facts_en;
    const keyFacts = Array.isArray(keyFactsRaw) 
      ? keyFactsRaw.filter((item: any) => typeof item === 'string').map((item: any) => String(item))
      : null;

    const confirmedVsDiffersRaw =
      lang === 'si' ? serializedSummary?.confirmed_vs_differs_si :
      lang === 'ta' ? serializedSummary?.confirmed_vs_differs_ta :
      serializedSummary?.confirmed_vs_differs_en;
    const confirmedVsDiffers = confirmedVsDiffersRaw && typeof confirmedVsDiffersRaw === 'string'
      ? String(confirmedVsDiffersRaw)
      : null;

    // Build breadcrumb items with new URL format - ensure all values are strings
    const breadcrumbItems = [
      { name: lang === 'si' ? 'මුල් පිටුව' : lang === 'ta' ? 'முகப்பு' : 'Home', url: `/${lang}` },
      {
        name: primaryTopic && primaryTopic !== 'other'
          ? String(primaryTopic)
          : (lang === 'si' ? 'පුවත්' : lang === 'ta' ? 'செய்திகள்' : 'News'),
        url: primaryTopic && primaryTopic !== 'other' ? `/${lang}/${String(primaryTopic)}` : `/${lang}`
      },
      { name: String(headlineText || ''), url: `/${lang}/${String(primaryTopic || topic)}/${String(slug || '')}` }
    ];
    
    // #region agent log
    try{
      JSON.stringify(breadcrumbItems);
      console.log('[DEBUG] BreadcrumbItems JSON test passed');
    }catch(e){
      console.error('[DEBUG] BreadcrumbItems JSON test FAILED:', e);
    }
    // #endregion

    // #region agent log
    try{
      const testData = {serializedCluster,serializedSummary,serializedArticles};
      JSON.stringify(testData);
      console.log('[DEBUG] Final data JSON test passed');
    }catch(e){
      console.error('[DEBUG] Final data JSON test FAILED:', e);
      console.error('[DEBUG] Error details:', {message: e instanceof Error ? e.message : String(e), stack: e instanceof Error ? e.stack : undefined});
    }
    // #endregion
    
    // Validate all props before passing to StoryDetail
    const storyDetailSources = serializedArticles.map((article: any) => {
      const source = article.sources || { name: 'Unknown', feed_url: '#' };
      return {
        name: String(source.name || 'Unknown'),
        feed_url: String(source.feed_url || '#')
      };
    });
    
    // Validate all StoryDetail props before rendering
    const storyDetailProps = {
      id: String(serializedCluster.id),
      slug: serializedCluster.slug ? String(serializedCluster.slug) : null,
      headline: String(headlineText),
      summary: String(
        lang === 'si'
          ? (serializedSummary?.summary_si || serializedSummary?.summary_en || '')
          : lang === 'ta'
          ? (serializedSummary?.summary_ta || serializedSummary?.summary_en || '')
          : (serializedSummary?.summary_en || '')
      ),
      summarySi: serializedSummary?.summary_si ? String(serializedSummary.summary_si) : null,
      summaryTa: serializedSummary?.summary_ta ? String(serializedSummary.summary_ta) : null,
      sources: storyDetailSources,
      updatedAt: serializedCluster.updated_at ? String(serializedCluster.updated_at) : null,
      firstSeen: serializedCluster.first_seen_at ? String(serializedCluster.first_seen_at) : null,
      sourceCount: typeof serializedCluster.source_count === 'number' ? serializedCluster.source_count : 0,
      currentLanguage: lang,
      keyFacts: keyFacts || null,
      confirmedVsDiffers: confirmedVsDiffers || null,
      lastCheckedAt: serializedCluster.last_checked_at ? String(serializedCluster.last_checked_at) : null,
      imageUrl: safeImageUrl
    };
    
    // #region agent log
    try{
      JSON.stringify(storyDetailProps);
      console.log('[DEBUG] StoryDetail props JSON test passed');
    }catch(e){
      console.error('[DEBUG] StoryDetail props JSON test FAILED:', e);
      console.error('[DEBUG] Failed props keys:', Object.keys(storyDetailProps));
    }
    // #endregion
    
    return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* JSON-LD Structured Data for Google News */}
      <NewsArticleSchema
        headline={String(headlineText)}
        description={String(metaDescription)}
        datePublished={String(datePublished)}
        dateModified={dateModified ? String(dateModified) : null}
        imageUrl={safeImageUrl}
        category={serializedCluster.category ? String(serializedCluster.category) : null}
        topic={serializedCluster.topic ? String(serializedCluster.topic) : null}
        keywords={serializedCluster.keywords && Array.isArray(serializedCluster.keywords) && serializedCluster.keywords.length > 0 
          ? serializedCluster.keywords.filter((k: any) => typeof k === 'string').map((k: any) => String(k))
          : null}
        url={String(canonicalUrl)}
        language={lang}
      />
      
      {/* Breadcrumb Schema */}
      <BreadcrumbSchema items={breadcrumbItems} />
      
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
          <main className="flex-1 min-w-0 w-full lg:max-w-3xl lg:mx-auto mb-12 sm:mb-16 md:mb-20">
            <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 lg:p-10">
              <StoryDetail {...storyDetailProps} />
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
    // #region agent log
    console.error('[DEBUG] StoryPage error caught:', error);
    console.error('[DEBUG] Error details:', {
      errorName: error instanceof Error ? error.name : 'unknown',
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined
    });
    // #endregion
    console.error('Error rendering StoryPage:', error);
    notFound();
  }
}

