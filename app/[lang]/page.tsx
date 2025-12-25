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

export default function LanguageHomePage({ params }: { params: Promise<{ lang: 'en' | 'si' | 'ta' }> }) {
  const [resolvedParams, setResolvedParams] = useState<{ lang: 'en' | 'si' | 'ta' } | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'si' | 'ta'>('en');
  const [paramsError, setParamsError] = useState(false);
  const [incidents, setIncidents] = useState<ClusterListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [latestUpdates, setLatestUpdates] = useState<any[]>([]);
  const [userCity, setUserCity] = useState('Colombo');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [topicData, setTopicData] = useState<Record<string, ClusterListItem[]>>({});
  const [topicLoading, setTopicLoading] = useState(true);

  // Resolve params
  useEffect(() => {
    let cancelled = false;
    
    params
      .then(p => {
        if (cancelled) return;
        setResolvedParams(p);
        setCurrentLanguage(p.lang);
        setLanguage(p.lang);
        setParamsError(false);
      })
      .catch(err => {
        if (cancelled) return;
        console.error('Error resolving params:', err);
        setParamsError(true);
        // Fallback to 'en' if params resolution fails
        const fallbackLang = { lang: 'en' as const };
        setResolvedParams(fallbackLang);
        setCurrentLanguage('en');
        setLanguage('en');
      });
    
    return () => {
      cancelled = true;
    };
  }, [params]);

  useEffect(() => {
    if (!resolvedParams) return;
    
    // Only run on client side
    if (typeof window === 'undefined') return;

    let supabase: ReturnType<typeof getSupabaseClient>;
    try {
      supabase = getSupabaseClient();
    } catch (error) {
      return;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      return;
    }

    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    // Load clusters
    loadClusters(resolvedParams.lang, null, null)
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
        loadClusters(resolvedParams.lang, null, topic as CategoryType)
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
  }, [resolvedParams]);

  // Always render something - don't wait indefinitely
  if (!resolvedParams) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="text-[#5F6368]">Loading...</div>
      </div>
    );
  }

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
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="text-[#5F6368]">Error loading news</div>
      </div>
    );
  }

  // Ensure we have a valid language before rendering
  const displayLanguage = resolvedParams?.lang || currentLanguage;

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <Navigation currentLanguage={displayLanguage} onLanguageChange={setCurrentLanguage} />
      <TopicNavigation language={displayLanguage} />

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

