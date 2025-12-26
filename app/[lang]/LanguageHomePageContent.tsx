'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Navigation from '@/components/Navigation';
import TopicNavigation from '@/components/TopicNavigation';
import Sidebar from '@/components/Sidebar';
import MixedLayoutGrid from '@/components/MixedLayoutGrid';
import TopicNewsCard from '@/components/TopicNewsCard';
import { ClusterListItem, loadClusters, FeedType, CategoryType } from '@/lib/api';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useLanguage } from '@/lib/useLanguage';
import { assignLayout, LayoutAssignment } from '@/lib/layoutAssigner';
import { NewsCardData } from '@/lib/newsCardUtils';
import { normalizeTopicSlug } from '@/lib/topics';

export default function LanguageHomePageContent({ lang }: { lang: 'en' | 'si' | 'ta' }) {
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

  // Convert incidents to NewsCardData format and assign layouts
  // MUST be called before any early returns to follow React hooks rules
  const newsFeedContent = useMemo(() => {
    // Convert incidents to NewsCardData format
    const newsCards: NewsCardData[] = incidents.map(incident => ({
      id: incident.id,
      slug: incident.slug,
      headline: incident.headline,
      summary: incident.summary || null,
      sources: incident.sources,
      updatedAt: incident.last_updated,
      sourceCount: incident.source_count || 0,
      language: currentLanguage,
      imageUrl: incident.image_url || null,
      category: incident.topic || incident.category || null,
      topics: incident.topics && Array.isArray(incident.topics) && incident.topics.length > 0
        ? incident.topics
        : incident.topic ? [incident.topic] : []
    }));

    // Assign layouts dynamically
    const assignments: LayoutAssignment[] = newsCards.map((card, index) => {
      const isRecent = card.updatedAt ? 
        (Date.now() - new Date(card.updatedAt).getTime()) < 24 * 60 * 60 * 1000 : false;
      return assignLayout(index, card.sourceCount, isRecent);
    });

    return (
      <MixedLayoutGrid 
        articles={newsCards}
        assignments={assignments}
      />
    );
  }, [incidents, currentLanguage]);

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
              {newsFeedContent}
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

          {/* Topic Cards Section - Full Width (No Ads) */}
          {!topicLoading && Object.keys(topicData).length > 0 && (
            <div className="mt-16 mb-8 w-full">
              <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-2xl font-semibold text-[#202124] mb-6">
                  {currentLanguage === 'si' ? 'ඉහළ මාතෘකා' : currentLanguage === 'ta' ? 'முதன்மை தலைப்புகள்' : 'Top Topics'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Object.entries(topicData).slice(0, 8).map(([topic, articles]) => {
                    const normalizedTopic = normalizeTopicSlug(topic) || topic;
                    const topicLabel = normalizedTopic.charAt(0).toUpperCase() + normalizedTopic.slice(1).replace(/-/g, ' ');
                    return (
                      <TopicNewsCard
                        key={topic}
                        topic={topicLabel}
                        topicSlug={normalizedTopic}
                        topArticles={articles.slice(0, 3)}
                        language={currentLanguage}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

