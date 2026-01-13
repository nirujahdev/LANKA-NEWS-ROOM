import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import SignInPromptManager from '@/components/SignInPromptManager';
import GoogleCMP from '@/components/GoogleCMP';
import ConditionalAdSense from '@/components/ConditionalAdSense';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import Footer from '@/components/Footer';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-montserrat',
});

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lankanewsroom.xyz';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Sri Lankan News | Lanka News Room – An AI System for News Insights',
    template: '%s | Lanka News Room'
  },
  description: 'Discover the latest Sri Lankan news with Lanka News Room. An AI-powered system delivering clear, multi-source news insights for Sri Lanka.',
  keywords: ['Sri Lanka news', 'Lanka news', 'Sri Lankan news', 'news aggregator', 'Sinhala news', 'Tamil news', 'English news Sri Lanka', 'breaking news Sri Lanka', 'Colombo news', 'Kandy news'],
  authors: [{ name: 'Lanka News Room Editorial Team' }],
  creator: 'Lanka News Room',
  publisher: 'Lanka News Room',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: baseUrl,
    languages: {
      'en-LK': `${baseUrl}/en`,
      'si-LK': `${baseUrl}/si`,
      'ta-LK': `${baseUrl}/ta`,
      'x-default': `${baseUrl}/en`,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_LK',
    url: baseUrl,
    siteName: 'Lanka News Room',
    title: 'Sri Lankan News | Lanka News Room – An AI System for News Insights',
    description: 'Discover the latest Sri Lankan news with Lanka News Room. An AI-powered system delivering clear, multi-source news insights for Sri Lanka.',
    images: [
      {
        url: `${baseUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Sri Lankan News | Lanka News Room – An AI System for News Insights',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sri Lankan News | Lanka News Room – An AI System for News Insights',
    description: 'Discover the latest Sri Lankan news with Lanka News Room. An AI-powered system delivering clear, multi-source news insights for Sri Lanka.',
    images: [`${baseUrl}/og-image.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lankanewsroom.xyz';
  
  // JSON-LD structured data for homepage
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    name: 'Lanka News Room',
    url: baseUrl,
    logo: `${baseUrl}/LANKA NEWS ROOM.svg`,
    description: 'Discover the latest Sri Lankan news with Lanka News Room. An AI-powered system delivering clear, multi-source news insights for Sri Lanka.',
    foundingLocation: {
      '@type': 'Country',
      name: 'Sri Lanka'
    },
    areaServed: {
      '@type': 'Country',
      name: 'Sri Lanka'
    },
    inLanguage: ['en-LK', 'si-LK', 'ta-LK'],
    sameAs: [
      // Add social media links if available
    ]
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Lanka News Room',
    url: baseUrl,
    description: 'Discover the latest Sri Lankan news with Lanka News Room. An AI-powered system delivering clear, multi-source news insights for Sri Lanka.',
    inLanguage: ['en-LK', 'si-LK', 'ta-LK'],
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };

  return (
    <html lang="en" className={montserrat.variable}>
      <head>
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        {/* Additional meta tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#1A73E8" />
        <meta name="google-adsense-account" content="ca-pub-8312977389353751" />
        <link rel="icon" href="/LANKA NEWS ROOM.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/LANKA NEWS ROOM.svg" />
        {/* Preconnect hints for performance */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
      </head>
      <body className="font-montserrat antialiased bg-white text-[#1E293B] flex flex-col min-h-screen">
        {/* Google Analytics - Loads with consent mode support */}
        <GoogleAnalytics />
        
        {/* Google CMP - Must load before ads */}
        <GoogleCMP />
        
        {/* Google AdSense - Conditionally loaded after consent for EEA/UK/CH users */}
        <ConditionalAdSense />
        
        <ErrorBoundary>
          <SignInPromptManager>
            <div className="flex-1">
              {children}
            </div>
            <Footer />
          </SignInPromptManager>
        </ErrorBoundary>
        
        {/* Vercel Web Analytics */}
        <Analytics />
      </body>
    </html>
  );
}

