'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import TabNavigation from '@/components/TabNavigation';
import IncidentCard from '@/components/IncidentCard';
import Sidebar from '@/components/Sidebar';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { ClusterListItem, loadClusters } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default function ForYouPage() {
  const router = useRouter();
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'si' | 'ta'>('en');
  const [incidents, setIncidents] = useState<ClusterListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [latestUpdates, setLatestUpdates] = useState<any[]>([]);
  const [favouriteTopics, setFavouriteTopics] = useState<string[]>([]);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    let supabase: ReturnType<typeof getSupabaseClient>;
    try {
      supabase = getSupabaseClient();
    } catch (error) {
      router.push('/');
      return;
    }

    async function fetchUserData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }

      // Get user preferences
      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('favourite_topics')
        .eq('user_id', user.id)
        .single();

      if (!prefs || !prefs.favourite_topics || prefs.favourite_topics.length !== 3) {
        router.push('/onboarding');
        return;
      }

      setFavouriteTopics(prefs.favourite_topics);

      // Get user profile for language
      const { data: profile } = await supabase
        .from('profiles')
        .select('language')
        .eq('id', user.id)
        .single();

      if (profile?.language) {
        setCurrentLanguage(profile.language as 'en' | 'si' | 'ta');
      }

      // Fetch news for favourite topics
      try {
        const allNews: ClusterListItem[] = [];
        
        // Fetch news for each favourite topic
        for (const topic of prefs.favourite_topics) {
          if (topic === 'home' || topic === 'recent') continue;
          
          const data = await loadClusters(
            profile?.language as 'en' | 'si' | 'ta' || 'en',
            null,
            topic as any
          );
          allNews.push(...data);
        }

        // Sort by last_updated desc and limit to 50
        const sortedNews = allNews
          .sort((a, b) => {
            const dateA = new Date(a.last_updated || 0).getTime();
            const dateB = new Date(b.last_updated || 0).getTime();
            return dateB - dateA;
          })
          .slice(0, 50);

        // If we have less than 50, fill with recent news
        if (sortedNews.length < 50) {
          const recentData = await loadClusters(
            profile?.language as 'en' | 'si' | 'ta' || 'en',
            'recent',
            null
          );
          const additionalNews = recentData
            .filter(item => !sortedNews.find(existing => existing.id === item.id))
            .slice(0, 50 - sortedNews.length);
          sortedNews.push(...additionalNews);
        }

        setIncidents(sortedNews);

        // Use recent items for sidebar
        const updates = sortedNews.slice(0, 5).map(item => ({
          id: item.id,
          headline: item.headline,
          sources: item.sources,
          updatedAt: item.last_updated,
          sourceCount: item.source_count || 0
        }));
        setLatestUpdates(updates);
      } catch (err) {
        console.error('Error loading clusters:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [router]);

  const featuredIncident = incidents[0];
  const topStories = incidents.slice(1, 4);
  const otherStories = incidents.slice(4);

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <Navigation 
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
      />

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 justify-center">
          
          {/* Left Ad Space */}
          <div className="hidden xl:block w-48 flex-shrink-0">
            {/* Ad Space Content */}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0 max-w-3xl">
            
            <div className="flex items-center justify-between mb-4">
               <h1 className="text-xl font-normal text-[#202124]">
                 For you
               </h1>
            </div>

            {loading && (
               <div className="bg-white rounded-xl p-8 text-center text-[#5F6368] shadow-sm border border-[#E8EAED]">
                 Loading personalized news for you...
               </div>
            )}
            
            {error && (
               <div className="bg-white rounded-xl p-8 text-center text-[#D93025] shadow-sm border border-[#E8EAED]">
                 Unable to load your personalized news. Please try again later.
               </div>
            )}

            {!loading && !error && incidents.length > 0 && (
              <>
                {/* Main News Section */}
                <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-[#E8EAED] p-4 sm:p-6 mb-6">
                  {/* Featured Story */}
                  {featuredIncident && (
                    <IncidentCard
                      id={featuredIncident.id}
                      headline={featuredIncident.headline}
                      summary={featuredIncident.summary || ''}
                      sources={featuredIncident.sources}
                      updatedAt={featuredIncident.last_updated}
                      sourceCount={featuredIncident.source_count || 0}
                      language={currentLanguage}
                      variant="featured"
                    />
                  )}

                  {/* Top Stories List */}
                  {topStories.length > 0 && (
                    <div className="border-t border-[#E8EAED] pt-2">
                      {topStories.map((incident) => (
                        <IncidentCard
                          key={incident.id}
                          id={incident.id}
                          headline={incident.headline}
                          summary={incident.summary || ''}
                          sources={incident.sources}
                          updatedAt={incident.last_updated}
                          sourceCount={incident.source_count || 0}
                          language={currentLanguage}
                          variant="default"
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* More News */}
                {otherStories.length > 0 && (
                  <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-[#E8EAED] p-4 sm:p-6">
                     <h2 className="text-lg font-normal text-[#202124] mb-4">
                       More for you
                     </h2>
                     {otherStories.map((incident) => (
                        <IncidentCard
                          key={incident.id}
                          id={incident.id}
                          headline={incident.headline}
                          summary={incident.summary || ''}
                          sources={incident.sources}
                          updatedAt={incident.last_updated}
                          sourceCount={incident.source_count || 0}
                          language={currentLanguage}
                          variant="default"
                        />
                     ))}
                  </div>
                )}
              </>
            )}
            
            {!loading && !error && incidents.length === 0 && (
               <div className="bg-white rounded-xl p-12 text-center text-[#5F6368] shadow-sm border border-[#E8EAED]">
                 No personalized news available right now. Try adjusting your preferences.
               </div>
            )}
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

