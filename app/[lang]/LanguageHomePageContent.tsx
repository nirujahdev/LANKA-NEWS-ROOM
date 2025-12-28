'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Navigation from '@/components/Navigation';
import UnifiedTopicNavigation from '@/components/UnifiedTopicNavigation';
import Sidebar from '@/components/Sidebar';
import MixedLayoutGrid from '@/components/MixedLayoutGrid';
import { ClusterListItem, loadClusters, FeedType, CategoryType } from '@/lib/api';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { useLanguage } from '@/lib/useLanguage';
import { assignLayout, LayoutAssignment } from '@/lib/layoutAssigner';
import { NewsCardData } from '@/lib/newsCardUtils';

export default function LanguageHomePageContent({ lang }: { lang: 'en' | 'si' | 'ta' }) {
  // Use language hook for persistence
  const { language: currentLanguage, setLanguage } = useLanguage(lang);
  const [incidents, setIncidents] = useState<ClusterListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [latestUpdates, setLatestUpdates] = useState<any[]>([]);
  const [userCity, setUserCity] = useState('Colombo');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Check if Supabase is properly configured (but don't block if not)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      // Only log in development to reduce console noise in production
      if (process.env.NODE_ENV === 'development') {
        console.warn('Missing Supabase environment variables - some features may not work');
      }
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
        // Ensure data is always an array
        const clusters = Array.isArray(data) ? data : [];
        setIncidents(clusters);
        setLatestUpdates(clusters.slice(0, 10));
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
        if (err && err.message && !err.message.includes('Failed to fetch')) {
          setError(true);
        }
      });

    // Topic data loading removed - no topic selection widget
  }, [currentLanguage]);

  // Convert incidents to NewsCardData format and assign layouts
  // MUST be called before any early returns to follow React hooks rules
  const newsFeedContent = useMemo(() => {
    // Ensure incidents is always an array
    if (!Array.isArray(incidents)) {
      return <div data-news-content="true">No articles available.</div>;
    }
    
    // Convert incidents to NewsCardData format with error handling
    const newsCards: NewsCardData[] = incidents
      .filter(incident => incident && incident.id) // Filter out invalid incidents
      .map(incident => {
        try {
          return {
            id: incident.id || '',
            slug: incident.slug || null,
            headline: incident.headline || '',
            summary: incident.summary || null,
            sources: Array.isArray(incident.sources) ? incident.sources : [],
            updatedAt: incident.last_updated || null,
            sourceCount: typeof incident.source_count === 'number' ? incident.source_count : 0,
            language: currentLanguage,
            imageUrl: incident.image_url || null,
            category: incident.topic || incident.category || null,
            topics: incident.topics && Array.isArray(incident.topics) && incident.topics.length > 0
              ? incident.topics
              : incident.topic ? [incident.topic] : []
          };
        } catch (error) {
          console.error('Error processing incident:', error, incident);
          // Return a minimal valid card
          return {
            id: incident.id || '',
            slug: null,
            headline: incident.headline || '',
            summary: null,
            sources: [],
            updatedAt: null,
            sourceCount: 0,
            language: currentLanguage,
            imageUrl: null,
            category: null,
            topics: []
          };
        }
      });

    // Assign layouts dynamically
    const assignments: LayoutAssignment[] = newsCards.map((card, index) => {
      let isRecent = false;
      if (card.updatedAt) {
        try {
          const updatedDate = new Date(card.updatedAt);
          // Check if date is valid
          if (!isNaN(updatedDate.getTime())) {
            isRecent = (Date.now() - updatedDate.getTime()) < 24 * 60 * 60 * 1000;
          }
        } catch (error) {
          // If date parsing fails, default to false
          console.warn('Invalid date in card.updatedAt:', card.updatedAt, error);
        }
      }
      return assignLayout(index, card.sourceCount, isRecent);
    });

    return (
      <div data-news-content="true">
        <MixedLayoutGrid 
          articles={newsCards}
          assignments={assignments}
        />
      </div>
    );
  }, [incidents, currentLanguage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5]" data-loading="true">
        <Navigation currentLanguage={currentLanguage} onLanguageChange={setLanguage} />
        <UnifiedTopicNavigation language={currentLanguage} />
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
      <div className="min-h-screen bg-[#F5F5F5]" data-error="true">
        <Navigation currentLanguage={currentLanguage} onLanguageChange={setLanguage} />
        <UnifiedTopicNavigation language={currentLanguage} />
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

        </div>
      </main>
    </div>
  );
}

