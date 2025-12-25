'use client';

import React, { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import TopicNavigation from '@/components/TopicNavigation';
import IncidentCard from '@/components/IncidentCard';
import Sidebar from '@/components/Sidebar';
import { ClusterListItem, loadClusters, FeedType, CategoryType } from '@/lib/api';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useLanguage } from '@/lib/useLanguage';
import { Metadata } from 'next';

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

// Client component that receives resolved lang
function LanguageHomePageContent({ lang }: { lang: 'en' | 'si' | 'ta' }) {
  // Use language hook for persistence
  const { language: currentLanguage, setLanguage } = useLanguage(lang);
  const [incidents, setIncidents] = useState<ClusterListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [latestUpdates, setLatestUpdates] = useState<any[]>([]);
  const [userCity, setUserCity] = useState('Colombo');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [topicData, setTopicData] = useState<Record<string, ClusterListItem[]>>({});
  const [topicLoading, setTopicLoading] = useState(true);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Check if Supabase is properly configured (but don't block if not)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Missing Supabase environment variables - some features may not work');
      // Continue loading - getSupabaseClient returns a placeholder client
    }

    // Get Supabase client (handles missing env vars gracefully)
    let supabase: ReturnType<typeof getSupabaseClient> | undefined;
    try {
      supabase = getSupabaseClient();
    } catch (error) {
      console.error('Failed to get Supabase client:', error);
      // Don't block page loading - getSupabaseClient handles missing env vars gracefully
    }

    // Check authentication (only if Supabase is properly configured and client exists)
    if (supabaseUrl && supabaseAnonKey && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setIsAuthenticated(!!session);
      }).catch(err => {
        console.error('Auth check failed:', err);
      });
    }

    // Load clusters using current language (from hook, which respects user preference)
    loadClusters(currentLanguage, null, null)
      .then(data => {
        setIncidents(data || []);
        setLatestUpdates((data || []).slice(0, 10));
        setLoading(false);
        setError(false);
      })
      .catch(err => {
        console.error('Error loading clusters:', err);
        // Don't set error immediately - try to show empty state instead
        setIncidents([]);
        setLatestUpdates([]);
        setLoading(false);
        // Only set error if it's a real failure, not just empty results
        if (err.message && !err.message.includes('Failed to fetch')) {
          setError(true);
        }
      });

    // Load topic data
    const topics = ['politics', 'economy', 'sports', 'crime', 'education', 'health'];
    Promise.all(
      topics.map(topic =>
        loadClusters(currentLanguage, null, topic as CategoryType)
          .then(data => ({ topic, data }))
          .catch(() => ({ topic, data: [] }))
      )
    ).then(results => {
      const topicMap: Record<string, ClusterListItem[]> = {};
      results.forEach(({ topic, data }) => {
        topicMap[topic] = data;
      });
      setTopicData(topicMap);
      setTopicLoading(false);
    });
  }, [currentLanguage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5]">
        <Navigation currentLanguage={currentLanguage} onLanguageChange={setLanguage} />
        <TopicNavigation language={currentLanguage} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-[#5F6368]">Loading news...</div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F5F5F5]">
        <Navigation currentLanguage={currentLanguage} onLanguageChange={setLanguage} />
        <TopicNavigation language={currentLanguage} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-[#5F6368]">Error loading news. Please try refreshing the page.</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <Navigation currentLanguage={currentLanguage} onLanguageChange={setLanguage} />
      <TopicNavigation language={currentLanguage} />

      <main className="w-full py-6">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-4 lg:gap-6">
            {/* Left Ad Space - Desktop only */}
            <aside className="hidden xl:block w-64 flex-shrink-0">
              <div className="sticky top-24">
                <div className="min-h-[600px] bg-[#F8F9FA] rounded-lg border border-[#E8EAED] flex items-center justify-center">
                  <span className="text-xs text-[#9AA0A6]">Ad Space</span>
                </div>
              </div>
            </aside>

            {/* Main Feed - Centered */}
            <div className="flex-1 min-w-0 max-w-3xl mx-auto">
              <div className="space-y-0">
                {incidents.map((incident, index) => (
                  <div key={incident.id} className="relative pb-4">
                    <IncidentCard
                      id={incident.id}
                      slug={incident.slug}
                      headline={incident.headline}
                      summary={incident.summary || ''}
                      sources={incident.sources}
                      updatedAt={incident.last_updated}
                      sourceCount={incident.source_count || 0}
                      language={currentLanguage}
                      category={incident.topic || incident.category}
                    />
                    {/* Divider line - 3/4 width, centered, only if not last item */}
                    {index < incidents.length - 1 && (
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3/4 h-px bg-[#E8EAED]"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Sidebar + Ad Space */}
            <aside className="hidden lg:block w-80 flex-shrink-0 space-y-6">
              <Sidebar 
                latestUpdates={latestUpdates}
                language={currentLanguage}
              />
              {/* Ad Space */}
              <div className="min-h-[600px] bg-[#F8F9FA] rounded-lg border border-[#E8EAED] flex items-center justify-center">
                <span className="text-xs text-[#9AA0A6]">Ad Space</span>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

// Server component wrapper that resolves params
export default async function LanguageHomePage({ params }: Props) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang;

  return <LanguageHomePageContent lang={lang} />;
}

