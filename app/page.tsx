'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import TopicNavigation from '@/components/TopicNavigation';
import IncidentCard from '@/components/IncidentCard';
import Sidebar from '@/components/Sidebar';
import { ClusterListItem, loadClusters, FeedType, CategoryType } from '@/lib/api';
import { getSupabaseClient } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';


export default function HomePage() {
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'si' | 'ta'>('en');
  const [incidents, setIncidents] = useState<ClusterListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [latestUpdates, setLatestUpdates] = useState<any[]>([]);
  const [userCity, setUserCity] = useState('Colombo');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Build tabs with "For You" if authenticated
  const tabs = isAuthenticated 
    ? [{ id: 'for-you', label: 'For you', labelSi: 'ඔබ වෙනුවෙන්', labelTa: 'உங்களுக்காக' }, ...baseTabs]
    : baseTabs;

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    let supabase: ReturnType<typeof getSupabaseClient>;
    try {
      supabase = getSupabaseClient();
    } catch (error) {
      // Silently fail if Supabase is not configured
      return;
    }

    // Check if we have valid Supabase credentials
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      // Skip Supabase operations if env vars are missing
      return;
    }

    // Get user city if signed in
    async function getUserCity() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setIsAuthenticated(!!user);
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('city')
            .eq('id', user.id)
            .single();
          if (profile?.city) {
            setUserCity(profile.city);
          }
        }
      } catch (error) {
        // Silently fail during build or if Supabase is not configured
        console.error('Error getting user city:', error);
      }
    }
    getUserCity();

    // Listen for auth changes
    let subscription: { unsubscribe: () => void } | null = null;
    try {
      const { data: { subscription: sub } } = supabase.auth.onAuthStateChange((_event, session) => {
        setIsAuthenticated(!!session?.user);
        if (session?.user) {
          getUserCity();
        }
      });
      subscription = sub;
    } catch (error) {
      // Silently fail if auth state change listener fails
      console.error('Error setting up auth listener:', error);
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(false);
      try {
        // Determine feed/category based on current pathname
        const pathname = window.location.pathname;
        let feed: FeedType = null;
        let category: CategoryType = null;

        if (pathname === '/' || pathname === '') {
          feed = 'home';
        } else if (pathname === '/recent') {
          feed = 'recent';
        } else if (pathname.startsWith('/politics')) {
          category = 'politics';
        } else if (pathname.startsWith('/economy') || pathname.startsWith('/business')) {
          category = 'economy';
        } else if (pathname.startsWith('/sports')) {
          category = 'sports';
        } else if (pathname.startsWith('/technology')) {
          category = 'technology';
        } else if (pathname.startsWith('/health')) {
          category = 'health';
        } else if (pathname.startsWith('/sri-lanka')) {
          // Sri Lanka specific feed
          feed = 'home';
        }
        
        const data = await loadClusters(currentLanguage, feed, category);
        if (!cancelled) {
          setIncidents(data);
          
          // Use recent items for sidebar
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

  const formatDate = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    return now.toLocaleDateString('en-US', options);
  };

  const featuredIncident = incidents[0];
  const topStories = incidents.slice(1, 4);
  const otherStories = incidents.slice(4);

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <Navigation 
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
      />
      
      {/* Google News Style Topic Navigation */}
      <TopicNavigation 
        language={currentLanguage}
        showWeather={true}
      />

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 justify-center">
          
          {/* Left Ad Space / Placeholder */}
          <div className="hidden xl:block w-48 flex-shrink-0">
             {/* Ad Space Content */}
          </div>

          {/* Main Content Area (Centered) */}
          <div className="flex-1 min-w-0 max-w-3xl">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
               <h1 className="text-xl font-normal text-[#202124]">
                 {currentLanguage === 'si' ? 'ඔබගේ කෙටි සටහන' : currentLanguage === 'ta' ? 'உங்கள் சுருக்கம்' : 'Top stories'}
               </h1>
                <Link href="/recent" className="text-sm font-medium text-[#1A73E8] hover:underline hidden sm:block">
                  More top stories
                </Link>
            </div>

            {loading && (
               <div className="bg-white rounded-xl p-8 text-center text-[#5F6368] shadow-sm border border-[#E8EAED]">
                 Loading news for you...
               </div>
            )}
            
            {error && (
               <div className="bg-white rounded-xl p-8 text-center text-[#D93025] shadow-sm border border-[#E8EAED]">
                 Unable to load the news. Please try again later.
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

                  {/* Top Stories List */}
                  {topStories.length > 0 && (
                    <div className="border-t border-[#E8EAED] pt-2">
                      {topStories.map((incident) => (
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
                          variant="default"
                          imageUrl={incident.image_url || undefined}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* "Your topics" Section */}
                <div className="mb-6">
                   <h2 className="text-xl font-normal text-[#202124] mb-4">Your topics</h2>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Example Topic: Sri Lanka */}
                      <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-[#E8EAED] p-4">
                         <div className="flex items-center justify-between mb-3">
                            <h3 className="font-medium text-[#202124]">Sri Lanka</h3>
                            <span className="text-xs text-[#1A73E8] font-medium cursor-pointer hover:underline">More</span>
                         </div>
                         <div className="space-y-4">
                            {incidents.slice(4, 7).map(incident => (
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
                                 variant="compact"
                               />
                            ))}
                         </div>
                      </div>

                       {/* Example Topic: Technology */}
                       <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-[#E8EAED] p-4">
                         <div className="flex items-center justify-between mb-3">
                            <h3 className="font-medium text-[#202124]">Technology</h3>
                            <span className="text-xs text-[#1A73E8] font-medium cursor-pointer hover:underline">More</span>
                         </div>
                         <div className="space-y-4">
                            {incidents.slice(7, 10).map(incident => (
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
                                 variant="compact"
                               />
                            ))}
                         </div>
                      </div>
                   </div>
                </div>

              </>
            )}
            
            {!loading && !error && incidents.length === 0 && (
               <div className="bg-white rounded-xl p-12 text-center text-[#5F6368] shadow-sm border border-[#E8EAED]">
                 No updates available for this section right now.
               </div>
            )}
          </div>

          {/* Right Sidebar (Widgets/Picks) */}
          <div className="hidden lg:block w-80 flex-shrink-0 space-y-6">
            <Sidebar 
              latestUpdates={latestUpdates}
              language={currentLanguage}
            />
            

            {/* Fact Check / Ad Placeholder */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-[#E8EAED] p-4 h-48 flex items-center justify-center bg-gray-50">
               <span className="text-sm text-[#5F6368]">Advertisement / Widget</span>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
