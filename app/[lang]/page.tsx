import { Metadata } from 'next';
import LanguageHomePageContent from './LanguageHomePageContent';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ lang: 'en' | 'si' | 'ta' }>;
};

// Generate metadata for homepage
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const { lang } = resolvedParams;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lankanewsroom.xyz';

  const titles = {
    en: 'Latest Sri Lanka News | Lanka News Room',
    si: 'ශ්‍රී ලංකාවේ නවතම පුවත් | Lanka News Room',
    ta: 'இலங்கையின் சமீபத்திய செய்திகள் | Lanka News Room'
  };

  const descriptions = {
    en: 'Get the latest news from Sri Lanka. Trusted, neutral news summaries from multiple verified sources in English, Sinhala, and Tamil. Breaking news, politics, economy, sports, and more.',
    si: 'ශ්‍රී ලංකාවේ නවතම පුවත් ලබා ගන්න. ඉංග්‍රීසි, සිංහල සහ දමිළ භාෂාවලින් සත්‍යාපිත මූලාශ්‍ර කිහිපයකින් විශ්වාසදායක, උදාසීන පුවත් සාරාංශ.',
    ta: 'இலங்கையின் சமீபத்திய செய்திகளைப் பெறுங்கள். ஆங்கிலம், சிங்களம் மற்றும் தமிழ் மொழிகளில் சரிபார்க்கப்பட்ட பல ஆதாரங்களிலிருந்து நம்பகமான, நடுநிலை செய்தி சுருக்கங்கள்.'
  };

  const enUrl = `${baseUrl}/en`;
  const siUrl = `${baseUrl}/si`;
  const taUrl = `${baseUrl}/ta`;
  const canonicalUrl = lang === 'si' ? siUrl : lang === 'ta' ? taUrl : enUrl;

  return {
    title: titles[lang],
    description: descriptions[lang],
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
      title: titles[lang],
      description: descriptions[lang],
      type: 'website',
      locale: lang === 'si' ? 'si_LK' : lang === 'ta' ? 'ta_LK' : 'en_LK',
      url: canonicalUrl,
      siteName: 'Lanka News Room',
      images: [
        {
          url: `${baseUrl}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: 'Lanka News Room - Sri Lanka News Aggregator'
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: titles[lang],
      description: descriptions[lang],
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

// Server component wrapper that resolves params
export default async function LanguageHomePage({ params }: Props) {
  try {
    const resolvedParams = await params;
    const lang = resolvedParams.lang;

    // Validate lang is a valid language
    if (!lang || !['en', 'si', 'ta'].includes(lang)) {
      // Default to 'en' if invalid
      return <LanguageHomePageContent lang="en" />;
    }

    return <LanguageHomePageContent lang={lang} />;
  } catch (error) {
    console.error('Error in LanguageHomePage:', error);
    // Return default language page on error
    return <LanguageHomePageContent lang="en" />;
  }
}

