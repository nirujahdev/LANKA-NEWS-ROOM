import { Metadata } from 'next';
import RecentPageContent from './RecentPageContent';

export const dynamic = 'force-dynamic';

// Generate metadata for recent page
export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lankanewsroom.xyz';
  const canonicalUrl = `${baseUrl}/recent`;

  return {
    title: 'Recent News | Lanka News Room',
    description: 'Browse the most recent news articles from Sri Lanka. Stay updated with the latest breaking news, politics, economy, sports, and more from trusted sources.',
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      title: 'Recent News | Lanka News Room',
      description: 'Browse the most recent news articles from Sri Lanka. Stay updated with the latest breaking news.',
      type: 'website',
      locale: 'en_LK',
      url: canonicalUrl,
      siteName: 'Lanka News Room',
      images: [
        {
          url: `${baseUrl}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: 'Lanka News Room - Recent News'
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Recent News | Lanka News Room',
      description: 'Browse the most recent news articles from Sri Lanka.',
      images: [`${baseUrl}/og-image.jpg`]
    },
    robots: {
      index: true,
      follow: true
    }
  };
}

export default function RecentPage() {
  return <RecentPageContent />;
}

