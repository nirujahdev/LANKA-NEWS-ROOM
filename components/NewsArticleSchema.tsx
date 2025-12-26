/**
 * NewsArticle JSON-LD Structured Data Component
 * 
 * Implements Google's NewsArticle schema for better visibility in Google News and Search.
 * Reference: https://developers.google.com/search/docs/appearance/structured-data/article
 */

type NewsArticleSchemaProps = {
  headline: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  imageUrl?: string;
  authorName?: string;
  category?: string;
  topic?: string | null;
  keywords?: string[] | null;
  url: string;
  language?: 'en' | 'si' | 'ta';
};

export default function NewsArticleSchema({
  headline,
  description,
  datePublished,
  dateModified,
  imageUrl,
  authorName = 'Lanka News Room Editorial Team',
  category,
  topic,
  keywords,
  url,
  language = 'en'
}: NewsArticleSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lankanewsroom.xyz';
  const logoUrl = `${baseUrl}/LANKA NEWS ROOM.svg`;
  
  // Ensure image is an array (Google requires array format)
  const images = imageUrl ? [imageUrl] : [`${baseUrl}/default-news-image.jpg`];

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: headline.slice(0, 110), // Google recommends max 110 chars
    description: description.slice(0, 200),
    datePublished,
    dateModified: dateModified || datePublished,
    image: images,
    author: [
      {
        '@type': 'Organization',
        name: authorName,
        url: baseUrl
      }
    ],
    publisher: {
      '@type': 'Organization',
      name: 'Lanka News Room',
      logo: {
        '@type': 'ImageObject',
        url: logoUrl,
        width: 600,
        height: 60
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url
    },
    inLanguage: language === 'si' ? 'si-LK' : language === 'ta' ? 'ta-LK' : 'en-LK',
    ...(category && {
      articleSection: category
    }),
    ...(topic && {
      about: {
        '@type': 'Thing',
        name: topic
      }
    }),
    ...(keywords && keywords.length > 0 && {
      keywords: keywords.join(', ')
    })
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

