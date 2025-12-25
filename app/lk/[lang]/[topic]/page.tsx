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
import IncidentCard from '@/components/IncidentCard';

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

  // Get latest articles for this topic
  const { data: clusters } = await supabaseAdmin
    .from('clusters')
    .select(`
      *,
      summaries (*)
    `)
    .eq('status', 'published')
    .eq('topic', topic)
    .order('last_seen_at', { ascending: false })
    .limit(20);

  const topicLabel = TOPIC_LABELS[lang][topic as keyof typeof TOPIC_LABELS.en];
  const countryRef = lang === 'en' ? 'Sri Lanka' : lang === 'si' ? 'ශ්‍රී ලංකා' : 'இலங்கை';
  const newsLabel = lang === 'en' ? 'News' : lang === 'si' ? 'පුවත්' : 'செய்திகள்';

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <NavigationWrapper currentLanguage={lang} />
      
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clusters?.map((cluster: any) => {
            const summary = cluster.summaries?.[0];
            const summaryText =
              lang === 'si' ? summary?.summary_si || summary?.summary_en :
              lang === 'ta' ? summary?.summary_ta || summary?.summary_en :
              summary?.summary_en;

            return (
              <IncidentCard
                key={cluster.id}
                id={cluster.id}
                headline={cluster.headline}
                summary={summaryText || ''}
                sourceCount={cluster.source_count || 0}
                updatedAt={cluster.last_seen_at}
                category={cluster.category}
                slug={cluster.slug}
                currentLanguage={lang}
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
    </div>
  );
}

