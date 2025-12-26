/**
 * Programmatic SEO: Topic Pages
 * 
 * URL format: /en/topic/politics, /ta/topic/economy, /si/topic/sports
 * These pages rank for "[topic] news Sri Lanka" searches
 */

import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { normalizeTopicSlug, isValidTopic } from '@/lib/topics';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

type Props = {
  params: Promise<{ lang: 'en' | 'si' | 'ta'; topic: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Simplified metadata for redirect route - redirect happens in page component
  return {
    title: 'Redirecting... | Lanka News Room',
    robots: {
      index: false,
      follow: false
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

