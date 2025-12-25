'use client';

import React, { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import TopicNavigation from '@/components/TopicNavigation';
import IncidentCard from '@/components/IncidentCard';
import Sidebar from '@/components/Sidebar';
import { ClusterListItem, loadClusters, FeedType, CategoryType } from '@/lib/api';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { setLanguage } from '@/lib/language';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ lang: 'en' | 'si' | 'ta' }>;
};

// Client component that receives resolved lang
function LanguageHomePageContent({ lang }: { lang: 'en' | 'si' | 'ta' }) {
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'si' | 'ta'>(lang);
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

    // Set language immediately
    setLanguage(lang);
    setCurrentLanguage(lang);

    let supabase: ReturnType<typeof getSupabaseClient>;
    try {
      supabase = getSupabaseClient();
    } catch (error) {
      console.error('Failed to get Supabase client:', error);
      setError(true);
      setLoading(false);
      return;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables');
      setError(true);
      setLoading(false);
      return;
    }

    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    }).catch(err => {
      console.error('Auth check failed:', err);
    });

    // Load clusters
    loadClusters(lang, null, null)
      .then(data => {
        setIncidents(data);
        setLatestUpdates(data.slice(0, 10));
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading clusters:', err);
        setError(true);
        setLoading(false);
      });

    // Load topic data
    const topics = ['politics', 'economy', 'sports', 'crime', 'education', 'health'];
    Promise.all(
      topics.map(topic =>
        loadClusters(lang, null, topic as CategoryType)
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
  }, [lang]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5]">
        <Navigation currentLanguage={currentLanguage} onLanguageChange={setCurrentLanguage} />
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
        <Navigation currentLanguage={currentLanguage} onLanguageChange={setCurrentLanguage} />
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
      <Navigation currentLanguage={currentLanguage} onLanguageChange={setCurrentLanguage} />
      <TopicNavigation language={currentLanguage} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Main Feed */}
          <div className="flex-1 min-w-0">
            <div className="space-y-4">
              {incidents.map((incident) => (
                <IncidentCard
                  key={incident.id}
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
              ))}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="hidden lg:block w-80 flex-shrink-0 space-y-6">
            <Sidebar 
              latestUpdates={latestUpdates}
              language={currentLanguage}
            />
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

