import { Metadata } from 'next';
import { Suspense } from 'react';
import SearchResultsContent from './SearchResultsContent';

// Generate metadata for search page
export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lankanewsroom.xyz';
  const canonicalUrl = `${baseUrl}/search`;

  return {
    title: 'Search News | Lanka News Room',
    description: 'Search for news articles from Sri Lanka. Find articles by topic, date, city, or keywords. Browse politics, economy, sports, crime, health, and more.',
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      title: 'Search News | Lanka News Room',
      description: 'Search for news articles from Sri Lanka. Find articles by topic, date, city, or keywords.',
      type: 'website',
      locale: 'en_LK',
      url: canonicalUrl,
      siteName: 'Lanka News Room',
      images: [
        {
          url: `${baseUrl}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: 'Lanka News Room - Search News'
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Search News | Lanka News Room',
      description: 'Search for news articles from Sri Lanka.',
      images: [`${baseUrl}/og-image.jpg`]
    },
    robots: {
      index: true,
      follow: true
    }
  };
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="text-[#5F6368]">Loading...</div>
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  );
}

