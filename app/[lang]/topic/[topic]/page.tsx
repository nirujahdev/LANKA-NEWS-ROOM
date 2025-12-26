/**
 * Programmatic SEO: Topic Pages
 * 
 * URL format: /en/topic/politics, /ta/topic/economy, /si/topic/sports
 * These pages rank for "[topic] news Sri Lanka" searches
 */

import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import NavigationWrapper from '@/components/NavigationWrapper';
import NewsCard from '@/components/NewsCard';
import TopicCard from '@/components/TopicCard';
import RelatedTopics from '@/components/RelatedTopics';
import { normalizeTopicSlug, getTopicLabel, VALID_TOPICS, isValidTopic } from '@/lib/topics';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

type Props = {
  params: Promise<{ lang: 'en' | 'si' | 'ta'; topic: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const { lang, topic: rawTopic } = resolvedParams;
  
  // Normalize topic slug
  const topic = normalizeTopicSlug(rawTopic);
  
  if (!topic || !isValidTopic(topic)) {
    return { title: 'Not Found' };
  }

  const topicLabel = getTopicLabel(topic, lang);
  const countryRef = lang === 'en' ? 'Sri Lanka' : lang === 'si' ? 'ශ්‍රී ලංකා' : 'இலங்கை';
  const newsLabel = lang === 'en' ? 'News' : lang === 'si' ? 'පුවත්' : 'செய்திகள்';
  
  const title = `${topicLabel} ${newsLabel} – ${countryRef} | Lanka News Room`;
  const description = lang === 'en' 
    ? `Latest ${topicLabel.toLowerCase()} news from Sri Lanka. Real-time updates from multiple verified sources.`
    : lang === 'si'
    ? `${countryRef} ${topicLabel} පුවත්. සත්‍යාපිත මූලාශ්‍ර කිහිපයකින් නවතම යාවත්කාලීන කිරීම්.`
    : `${countryRef} ${topicLabel} செய்திகள். சரிபார்க்கப்பட்ட பல ஆதாரங்களிலிருந்து நேரடி புதுப்பிப்புகள்.`;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lankanewsroom.xyz';
  const enUrl = `${baseUrl}/en/topic/${topic}`;
  const siUrl = `${baseUrl}/si/topic/${topic}`;
  const taUrl = `${baseUrl}/ta/topic/${topic}`;
  const canonicalUrl = lang === 'si' ? siUrl : lang === 'ta' ? taUrl : enUrl;

  return {
    title,
    description,
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
      title,
      description,
      type: 'website',
      locale: lang === 'si' ? 'si_LK' : lang === 'ta' ? 'ta_LK' : 'en_LK',
      url: canonicalUrl,
      siteName: 'Lanka News Room',
      images: [
        {
          url: `${baseUrl}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: `${topicLabel} News - Lanka News Room`
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
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

export default async function TopicPage({ params }: Props) {
  const resolvedParams = await params;
  const { lang, topic: rawTopic } = resolvedParams;

  // Normalize topic slug
  const topic = normalizeTopicSlug(rawTopic);
  
  if (!topic || !isValidTopic(topic)) {
    notFound();
  }

  // Redirect to new URL format: /{lang}/{topic} (removed /topic/ segment)
  redirect(`/${lang}/${topic}`);
}

