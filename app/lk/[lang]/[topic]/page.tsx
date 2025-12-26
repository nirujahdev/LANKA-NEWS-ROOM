/**
 * Programmatic SEO: Topic Pages
 * 
 * URL format: /lk/en/politics, /lk/ta/economy, /lk/si/sports
 * These pages rank for "[topic] news Sri Lanka" searches
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import NavigationWrapper from '@/components/NavigationWrapper';
import NewsCard from '@/components/NewsCard';
import FilterMenu from '@/components/FilterMenu';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

type Props = {
  params: { lang: 'en' | 'si' | 'ta'; topic: string };
};

const VALID_TOPICS = ['politics', 'economy', 'sports', 'crime', 'education', 'health', 'environment', 'technology', 'culture'];

const TOPIC_LABELS = {
  en: {
    politics: 'Politics',
    economy: 'Economy',
    sports: 'Sports',
    crime: 'Crime',
    education: 'Education',
    health: 'Health',
    environment: 'Environment',
    technology: 'Technology',
    culture: 'Culture'
  },
  si: {
    politics: 'දේශපාලනය',
    economy: 'ආර්ථිකය',
    sports: 'ක්‍රීඩා',
    crime: 'අපරාධ',
    education: 'අධ්‍යාපනය',
    health: 'සෞඛ්‍යය',
    environment: 'පරිසරය',
    technology: 'තාක්ෂණය',
    culture: 'සංස්කෘතිය'
  },
  ta: {
    politics: 'அரசியல்',
    economy: 'பொருளாதாரம்',
    sports: 'விளையாட்டு',
    crime: 'குற்றம்',
    education: 'கல்வி',
    health: 'சுகாதாரம்',
    environment: 'சுற்றுச்சூழல்',
    technology: 'தொழில்நுட்பம்',
    culture: 'கலாச்சாரம்'
  }
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, topic } = params;
  
  if (!VALID_TOPICS.includes(topic)) {
    return { title: 'Not Found' };
  }

  const topicLabel = TOPIC_LABELS[lang][topic as keyof typeof TOPIC_LABELS.en];
  const countryRef = lang === 'en' ? 'Sri Lanka' : lang === 'si' ? 'ශ්‍රී ලංකා' : 'இலங்கை';
  const newsLabel = lang === 'en' ? 'News' : lang === 'si' ? 'පුවත්' : 'செய்திகள்';
  
  const title = `${topicLabel} ${newsLabel} – ${countryRef} | Lanka News Room`;
  const description = lang === 'en' 
    ? `Latest ${topicLabel.toLowerCase()} news from Sri Lanka. Real-time updates from multiple verified sources.`
    : lang === 'si'
    ? `${countryRef} ${topicLabel} පුවත්. සත්‍යාපිත මූලාශ්‍ර කිහිපයකින් නවතම යාවත්කාලීන කිරීම්.`
    : `${countryRef} ${topicLabel} செய்திகள். சரிபார்க்கப்பட்ட பல ஆதாரங்களிலிருந்து நேரடி புதுப்பிப்புகள்.`;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lankanewsroom.xyz';
  const canonicalUrl = `${baseUrl}/lk/${lang}/${topic}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en-LK': `${baseUrl}/lk/en/${topic}`,
        'si-LK': `${baseUrl}/lk/si/${topic}`,
        'ta-LK': `${baseUrl}/lk/ta/${topic}`,
        'x-default': `${baseUrl}/lk/en/${topic}`
      }
    },
    openGraph: {
      title,
      description,
      type: 'website',
      locale: lang === 'si' ? 'si_LK' : lang === 'ta' ? 'ta_LK' : 'en_LK',
      url: canonicalUrl,
      siteName: 'Lanka News Room'
    },
    robots: {
      index: true,
      follow: true
    }
  };
}

export default async function TopicPage({ params }: Props) {
  const { lang, topic } = params;

  if (!VALID_TOPICS.includes(topic)) {
    notFound();
  }

  // Get latest articles for this topic with sources
  const { data: clustersData, error: clustersError } = await supabaseAdmin
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
    .eq('status', 'published')
    .eq('topic', topic)
    .order('last_seen_at', { ascending: false })
    .limit(20);

    // Serialize clusters data to ensure all dates are strings and all values are serializable
    const clusters = (clustersData || []).map((cluster: any) => {
      const serializedCluster = { ...cluster };
      
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
      
      // Ensure all string fields are strings
      serializedCluster.id = String(serializedCluster.id || '');
      serializedCluster.headline = String(serializedCluster.headline || '');
      serializedCluster.slug = serializedCluster.slug ? String(serializedCluster.slug) : null;
      serializedCluster.status = String(serializedCluster.status || 'published');
      serializedCluster.topic = serializedCluster.topic ? String(serializedCluster.topic) : null;
      serializedCluster.source_count = typeof serializedCluster.source_count === 'number' ? serializedCluster.source_count : 0;
      
      // Ensure summaries is an array
      if (serializedCluster.summaries && !Array.isArray(serializedCluster.summaries)) {
        serializedCluster.summaries = [serializedCluster.summaries];
      }
      if (!Array.isArray(serializedCluster.summaries)) {
        serializedCluster.summaries = [];
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
      
      // Ensure articles is an array
      if (serializedCluster.articles && !Array.isArray(serializedCluster.articles)) {
        serializedCluster.articles = [serializedCluster.articles];
      }
      if (!Array.isArray(serializedCluster.articles)) {
        serializedCluster.articles = [];
      }
      
      // Serialize nested articles and sources
      serializedCluster.articles = serializedCluster.articles.map((article: any) => {
        if (!article || typeof article !== 'object') return null;
        const serializedArticle: any = {
          id: String(article.id || ''),
          cluster_id: article.cluster_id ? String(article.cluster_id) : null,
          source_id: article.source_id ? String(article.source_id) : null
        };
        
        // Serialize nested source
        if (article.sources && typeof article.sources === 'object') {
          serializedArticle.sources = {
            name: String(article.sources.name || ''),
            feed_url: String(article.sources.feed_url || '')
          };
        } else {
          serializedArticle.sources = null;
        }
        
        return serializedArticle;
      }).filter(Boolean);
      
      return serializedCluster;
    });

  const topicLabel = TOPIC_LABELS[lang][topic as keyof typeof TOPIC_LABELS.en];
  const countryRef = lang === 'en' ? 'Sri Lanka' : lang === 'si' ? 'ශ්‍රී ලංකා' : 'இலங்கை';
  const newsLabel = lang === 'en' ? 'News' : lang === 'si' ? 'පුවත්' : 'செய்திகள்';

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <NavigationWrapper currentLanguage={lang} />
      
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
            // Use serialized summary from cluster (already serialized above)
            const summary = Array.isArray(cluster.summaries) && cluster.summaries.length > 0 
              ? cluster.summaries[0] 
              : null;
            
            // Summary is already serialized, so all fields are strings or null
            const summaryText =
              lang === 'si' ? (summary?.summary_si || summary?.summary_en || '') :
              lang === 'ta' ? (summary?.summary_ta || summary?.summary_en || '') :
              (summary?.summary_en || '');

            // Extract unique sources from articles
            const sourcesMap = new Map<string, { name: string; feed_url: string }>();
            if (Array.isArray(cluster.articles)) {
              cluster.articles.forEach((article: any) => {
                if (article && article.sources && typeof article.sources === 'object') {
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
            const sources = Array.from(sourcesMap.values());
            
            // Ensure updatedAt is a string or null
            let updatedAt: string | null = null;
            if (cluster.last_seen_at) {
              if (cluster.last_seen_at instanceof Date) {
                updatedAt = cluster.last_seen_at.toISOString();
              } else if (typeof cluster.last_seen_at === 'string') {
                updatedAt = cluster.last_seen_at;
              }
            }

            return (
              <NewsCard
                key={String(cluster.id || '')}
                id={String(cluster.id || '')}
                headline={String(cluster.headline || '')}
                summary={summaryText || null}
                sourceCount={typeof cluster.source_count === 'number' ? cluster.source_count : 0}
                updatedAt={updatedAt}
                slug={cluster.slug ? String(cluster.slug) : null}
                language={lang}
                sources={sources.length > 0 ? sources : [{ name: 'Multiple Sources', feed_url: '#' }]}
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

