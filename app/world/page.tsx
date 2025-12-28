'use client';

import React, { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import UnifiedTopicNavigation from '@/components/UnifiedTopicNavigation';
import NewsCard from '@/components/NewsCard';
import Sidebar from '@/components/Sidebar';
import { ClusterListItem, loadClusters, FeedType } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default function WorldPage() {
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'si' | 'ta'>('en');
  const [incidents, setIncidents] = useState<ClusterListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [latestUpdates, setLatestUpdates] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(false);
      try {
        const data = await loadClusters(currentLanguage, 'home' as FeedType, null);
        if (!cancelled) {
          setIncidents(data);
          const updates = data.slice(0, 5).map(item => ({
            id: item.id,
            slug: item.slug,
            headline: item.headline,
            sources: item.sources,
            updatedAt: item.last_updated,
            sourceCount: item.source_count || 0
          }));
          setLatestUpdates(updates);
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

  const featuredIncident = incidents[0];
  const topStories = incidents.slice(1, 4);
  const otherStories = incidents.slice(4);

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <Navigation 
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
      />
      
      <UnifiedTopicNavigation 
        language={currentLanguage}
        showWeather={true}
      />

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 justify-center">
          
          <div className="hidden xl:block w-48 flex-shrink-0"></div>

          <div className="flex-1 min-w-0 max-w-3xl">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-normal text-[#202124]">World</h1>
            </div>

            {loading && (
              <div className="bg-white rounded-xl p-8 text-center text-[#5F6368] shadow-sm border border-[#E8EAED]">
                Loading news...
              </div>
            )}
            
            {error && (
              <div className="bg-white rounded-xl p-8 text-center text-[#D93025] shadow-sm border border-[#E8EAED]">
                Unable to load the news. Please try again later.
              </div>
            )}

            {!loading && !error && incidents.length > 0 && (
              <>
                <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-[#E8EAED] p-4 sm:p-6 mb-6">
                  {featuredIncident && (
                    <NewsCard
                      id={featuredIncident.id}
                      slug={featuredIncident.slug}
                      headline={featuredIncident.headline}
                      summary={featuredIncident.summary || ''}
                      sources={featuredIncident.sources}
                      updatedAt={featuredIncident.last_updated}
                      sourceCount={featuredIncident.source_count || 0}
                      language={currentLanguage}
                      variant="featured"
                      imageUrl={featuredIncident.image_url || undefined}
                    />
                  )}

                  {topStories.length > 0 && (
                    <div className="border-t border-[#E8EAED] pt-2">
                      {topStories.map((incident) => (
                        <NewsCard
                          key={incident.id}
                          id={incident.id}
                          slug={incident.slug}
                          headline={incident.headline}
                          summary={incident.summary || ''}
                          sources={incident.sources}
                          updatedAt={incident.last_updated}
                          sourceCount={incident.source_count || 0}
                          language={currentLanguage}
                          variant="default"
                          imageUrl={incident.image_url || undefined}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {otherStories.length > 0 && (
                  <div className="space-y-4">
                    {otherStories.map((incident) => (
                      <NewsCard
                        key={incident.id}
                        id={incident.id}
                        slug={incident.slug}
                        headline={incident.headline}
                        summary={incident.summary || ''}
                        sources={incident.sources}
                        updatedAt={incident.last_updated}
                        sourceCount={incident.source_count || 0}
                        language={currentLanguage}
                        variant="default"
                        imageUrl={incident.image_url || undefined}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
            
            {!loading && !error && incidents.length === 0 && (
              <div className="bg-white rounded-xl p-12 text-center text-[#5F6368] shadow-sm border border-[#E8EAED]">
                No world news available right now.
              </div>
            )}
          </div>

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

