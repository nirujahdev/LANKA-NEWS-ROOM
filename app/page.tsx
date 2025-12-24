'use client';

import React, { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import TabNavigation from '@/components/TabNavigation';
import IncidentCard from '@/components/IncidentCard';
import Sidebar from '@/components/Sidebar';
import { ClusterListItem, loadClusters, FeedType, CategoryType } from '@/lib/api';

const tabs = [
  { id: 'home', label: 'Home', labelSi: 'මුල් පිටුව', labelTa: 'முகப்பு' },
  { id: 'recent', label: 'Recent', labelSi: 'මෑත', labelTa: 'சமீபத்திய' },
  { id: 'sri-lanka', label: 'Sri Lanka', labelSi: 'ශ්‍රී ලංකාව', labelTa: 'இலங்கை' },
  { id: 'politics', label: 'Politics', labelSi: 'දේශපාලනය', labelTa: 'அரசியல்' },
  { id: 'economy', label: 'Economy', labelSi: 'ආර්ථිකය', labelTa: 'பொருளாதாரம்' },
  { id: 'sports', label: 'Sports', labelSi: 'ක්‍රීඩා', labelTa: 'விளையாட்டு' },
  { id: 'technology', label: 'Technology', labelSi: 'තාක්ෂණය', labelTa: 'தொழில்நுட்பம்' },
  { id: 'health', label: 'Health', labelSi: 'සෞඛ්‍ය', labelTa: 'சுகாதாரம்' }
];

export default function HomePage() {
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'si' | 'ta'>('en');
  const [activeTab, setActiveTab] = useState('home');
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
        // Map activeTab to feed or category
        const feed: FeedType = activeTab === 'home' ? 'home' : activeTab === 'recent' ? 'recent' : null;
        const category: CategoryType = ['politics', 'economy', 'sports', 'technology', 'health'].includes(activeTab)
          ? (activeTab as 'politics' | 'economy' | 'sports' | 'technology' | 'health')
          : null;
        
        const data = await loadClusters(currentLanguage, feed, category);
        if (!cancelled) {
          setIncidents(data);
          
          // Use recent items for sidebar
          const updates = data.slice(0, 5).map(item => ({
            id: item.id,
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
  }, [activeTab, currentLanguage]);

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
      
      {/* Top Tab Navigation (Sticky) */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        language={currentLanguage}
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
                 {activeTab === 'home' 
                    ? (currentLanguage === 'si' ? 'ඔබගේ කෙටි සටහන' : currentLanguage === 'ta' ? 'உங்கள் சுருக்கம்' : 'Top stories')
                    : tabs.find(t => t.id === activeTab)?.label || 'News'
                 }
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
            
            {/* Weather Widget Placeholder */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-[#E8EAED] p-4">
              <div className="flex items-center justify-between mb-2">
                 <span className="text-xs text-[#5F6368]">Colombo</span>
                 <span className="text-xs text-[#5F6368]">Precipitation: 10%</span>
              </div>
              <div className="flex items-center gap-4">
                 <div className="text-4xl font-normal text-[#202124]">30°C</div>
                 <div className="text-sm text-[#202124]">Partly Cloudy</div>
              </div>
            </div>

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
