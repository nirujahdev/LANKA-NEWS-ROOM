import { Metadata } from 'next';
import ForYouPageContent from './ForYouPageContent';

export const dynamic = 'force-dynamic';

// Generate metadata for For You page
export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lankanewsroom.xyz';
  const canonicalUrl = `${baseUrl}/for-you`;

  return {
    title: 'For You | Lanka News Room',
    description: 'Your personalized news feed from Sri Lanka. Get news tailored to your interests, favorite topics, and preferred locations. Sign in to customize your feed.',
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      title: 'For You | Lanka News Room',
      description: 'Your personalized news feed from Sri Lanka. Get news tailored to your interests.',
      type: 'website',
      locale: 'en_LK',
      url: canonicalUrl,
      siteName: 'Lanka News Room',
      images: [
        {
          url: `${baseUrl}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: 'Lanka News Room - For You'
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: 'For You | Lanka News Room',
      description: 'Your personalized news feed from Sri Lanka.',
      images: [`${baseUrl}/og-image.jpg`]
    },
    robots: {
      index: false, // Personalized content, don't index
      follow: true
    }
  };
}

export default function ForYouPage() {
  return <ForYouPageContent />;
}

