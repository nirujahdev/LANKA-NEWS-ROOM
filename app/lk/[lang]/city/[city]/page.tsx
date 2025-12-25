/**
 * Programmatic SEO: City Pages
 * 
 * URL format: /lk/en/city/colombo, /lk/ta/city/jaffna, /lk/si/city/kandy
 * These pages rank for "Colombo news Tamil", "Jaffna news Sinhala" searches
 */

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import NavigationWrapper from '@/components/NavigationWrapper';
import IncidentCard from '@/components/IncidentCard';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

type Props = {
  params: { lang: 'en' | 'si' | 'ta'; city: string };
};

const VALID_CITIES = ['colombo', 'kandy', 'galle', 'jaffna', 'trincomalee', 'batticaloa', 'matara', 'negombo', 'anuradhapura'];

const CITY_LABELS = {
  en: {
    colombo: 'Colombo',
    kandy: 'Kandy',
    galle: 'Galle',
    jaffna: 'Jaffna',
    trincomalee: 'Trincomalee',
    batticaloa: 'Batticaloa',
    matara: 'Matara',
    negombo: 'Negombo',
    anuradhapura: 'Anuradhapura'
  },
  si: {
    colombo: 'කොළඹ',
    kandy: 'මහනුවර',
    galle: 'ගාල්ල',
    jaffna: 'යාපනය',
    trincomalee: 'ත්‍රිකුණාමලය',
    batticaloa: 'මඩකලපුව',
    matara: 'මාතර',
    negombo: 'මීගමුව',
    anuradhapura: 'අනුරාධපුරය'
  },
  ta: {
    colombo: 'கொழும்பு',
    kandy: 'கண்டி',
    galle: 'காலி',
    jaffna: 'யாழ்ப்பாணம்',
    trincomalee: 'திருகோணமலை',
    batticaloa: 'மட்டக்களப்பு',
    matara: 'மாத்தறை',
    negombo: 'நீர்கொழும்பு',
    anuradhapura: 'அனுராதபுரம்'
  }
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, city } = params;
  
  if (!VALID_CITIES.includes(city)) {
    return { title: 'Not Found' };
  }

  const cityLabel = CITY_LABELS[lang][city as keyof typeof CITY_LABELS.en];
  const newsLabel = lang === 'en' ? 'News' : lang === 'si' ? 'පුවත්' : 'செய்திகள்';
  const countryRef = lang === 'en' ? 'Sri Lanka' : lang === 'si' ? 'ශ්‍රී ලංකා' : 'இலங்கை';
  
  const title = `${cityLabel} ${newsLabel} – ${countryRef} | Lanka News Room`;
  const description = lang === 'en' 
    ? `Latest news from ${cityLabel}, Sri Lanka. Real-time local updates from verified sources.`
    : lang === 'si'
    ? `${cityLabel}, ${countryRef} පුවත්. සත්‍යාපිත මූලාශ්‍රවලින් ප්‍රාදේශීය යාවත්කාලීන කිරීම්.`
    : `${cityLabel}, ${countryRef} செய்திகள். சரிபார்க்கப்பட்ட ஆதாரங்களிலிருந்து உள்ளூர் புதுப்பிப்புகள்.`;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lankanewsroom.xyz';
  const canonicalUrl = `${baseUrl}/lk/${lang}/city/${city}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en-LK': `${baseUrl}/lk/en/city/${city}`,
        'si-LK': `${baseUrl}/lk/si/city/${city}`,
        'ta-LK': `${baseUrl}/lk/ta/city/${city}`,
        'x-default': `${baseUrl}/lk/en/city/${city}`
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

export default async function CityPage({ params }: Props) {
  const { lang, city } = params;

  if (!VALID_CITIES.includes(city)) {
    notFound();
  }

  // Get latest articles for this city
  const { data: clusters } = await supabaseAdmin
    .from('clusters')
    .select(`
      *,
      summaries (*)
    `)
    .eq('status', 'published')
    .eq('city', city)
    .order('last_seen_at', { ascending: false })
    .limit(20);

  const cityLabel = CITY_LABELS[lang][city as keyof typeof CITY_LABELS.en];
  const newsLabel = lang === 'en' ? 'News' : lang === 'si' ? 'පුවත්' : 'செய்திகள்';
  const countryRef = lang === 'en' ? 'Sri Lanka' : lang === 'si' ? 'ශ්‍රී ලංකා' : 'இலங்கை';

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <NavigationWrapper currentLanguage={lang} />
      
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* City Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#202124] mb-2">
            {cityLabel} {newsLabel}
          </h1>
          <p className="text-[#5F6368]">
            {lang === 'en' && `Latest local news from ${cityLabel}, ${countryRef}`}
            {lang === 'si' && `${cityLabel}, ${countryRef} ප්‍රාදේශීය පුවත්`}
            {lang === 'ta' && `${cityLabel}, ${countryRef} உள்ளூர் செய்திகள்`}
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
            {lang === 'en' && `No recent news from ${cityLabel}.`}
            {lang === 'si' && `${cityLabel} සිට මෑත පුවත් නොමැත.`}
            {lang === 'ta' && `${cityLabel} இலிருந்து சமீபத்திய செய்திகள் இல்லை.`}
          </div>
        )}
      </div>
    </div>
  );
}

