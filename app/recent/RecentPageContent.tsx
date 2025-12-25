'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import TopicNavigation from '@/components/TopicNavigation';
import MixedLayoutGrid from '@/components/MixedLayoutGrid';
import { ClusterListItem, loadClusters, FeedType } from '@/lib/api';
import { useLanguage } from '@/lib/useLanguage';
import { assignLayout, LayoutAssignment } from '@/lib/layoutAssigner';
import { NewsCardData } from '@/lib/newsCardUtils';

export default function RecentPageContent() {
  const { language: currentLanguage, setLanguage } = useLanguage();
  const [incidents, setIncidents] = useState<ClusterListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(false);
      try {
        const data = await loadClusters(currentLanguage, 'recent' as FeedType, null);
        if (!cancelled) {
          setIncidents(data);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error loading clusters:', err);
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [currentLanguage]);

  // Convert incidents to NewsCardData format and assign layouts
  const newsFeedContent = useMemo(() => {
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
      topics: incident.topic ? [incident.topic] : []
    }));

    const assignments: LayoutAssignment[] = newsCards.map((card, index) => {
      const isRecent = true; // All items on recent page are recent
      return assignLayout(index, card.sourceCount, isRecent);
    });

    return (
      <MixedLayoutGrid 
        articles={newsCards}
        assignments={assignments}
      />
    );
  }, [incidents, currentLanguage]);

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <Navigation 
        currentLanguage={currentLanguage}
        onLanguageChange={setLanguage}
      />
      
      <TopicNavigation 
        language={currentLanguage}
        showWeather={true}
      />

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 justify-center">
          
          {/* Main Content Area */}
          <div className="flex-1 min-w-0 max-w-3xl">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-normal text-[#202124]">
                {currentLanguage === 'si' ? 'මෑත පුවත්' : currentLanguage === 'ta' ? 'சமீபத்திய செய்திகள்' : 'Recent News'}
              </h1>
            </div>

            {loading && (
              <div className="bg-white rounded-xl p-8 text-center text-[#5F6368] shadow-sm border border-[#E8EAED]">
                Loading recent news...
              </div>
            )}
            
            {error && (
              <div className="bg-white rounded-xl p-8 text-center text-[#D93025] shadow-sm border border-[#E8EAED]">
                Unable to load the news. Please try again later.
              </div>
            )}

            {!loading && !error && incidents.length > 0 && newsFeedContent}
            
            {!loading && !error && incidents.length === 0 && (
              <div className="bg-white rounded-xl p-12 text-center text-[#5F6368] shadow-sm border border-[#E8EAED]">
                No recent news available right now.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

