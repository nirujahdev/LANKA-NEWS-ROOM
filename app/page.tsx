'use client';

import React, { useState } from 'react';
import Navigation from '@/components/Navigation';
import TabNavigation from '@/components/TabNavigation';
import IncidentCard from '@/components/IncidentCard';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import Image from 'next/image';

// Mock data - replace with actual data fetching
const mockIncidents = [
  {
    id: '1',
    headline: 'Major Power Outage Affects Colombo Suburbs',
    summary: 'A widespread power outage affected several areas in Colombo suburbs yesterday evening, causing disruptions to businesses and households. The Ceylon Electricity Board reported that the issue was caused by a technical fault at a main substation. Power was restored within three hours.',
    sources: [
      { id: '1', name: 'Daily Mirror', url: '#' },
      { id: '2', name: 'Ada Derana', url: '#' },
      { id: '3', name: 'BBC Sinhala', url: '#' }
    ],
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    sourceCount: 3
  },
  {
    id: '2',
    headline: 'New Economic Policy Announced by Government',
    summary: 'The government announced a new economic policy framework aimed at boosting foreign investment and stabilizing the currency. The policy includes tax incentives for technology companies and infrastructure development projects. Economic analysts have welcomed the move.',
    sources: [
      { id: '4', name: 'The Island', url: '#' },
      { id: '5', name: 'Sunday Times', url: '#' }
    ],
    updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    sourceCount: 2
  },
  {
    id: '3',
    headline: 'Dengue Outbreak Reported in Western Province',
    summary: 'Health authorities have reported a significant increase in dengue cases in the Western Province, with over 500 cases recorded this month. The Ministry of Health has launched a public awareness campaign and intensified mosquito control measures.',
    sources: [
      { id: '6', name: 'NewsFirst', url: '#' },
      { id: '7', name: 'Hiru News', url: '#' },
      { id: '8', name: 'Colombo Page', url: '#' }
    ],
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    sourceCount: 3
  }
];

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

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <Navigation 
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
      />
      
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        language={currentLanguage}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-8">
          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {/* Articles List - Vertical list format with rounded corners */}
            <div className="bg-white rounded-xl overflow-hidden">
              {/* Section Header inside white container */}
              <div className="px-5 py-4 border-b border-[#E8EAED]">
                <h1 className="text-base font-normal text-[#202124]">
                  {currentLanguage === 'si' ? 'මුල් පිටුව' : currentLanguage === 'ta' ? 'முகப்பு' : 'Latest News'}
                </h1>
              </div>
              
              {mockIncidents.map((incident) => (
                <IncidentCard
                  key={incident.id}
                  {...incident}
                  language={currentLanguage}
                />
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <Sidebar latestUpdates={mockIncidents} language={currentLanguage} />
        </div>

        {/* Your Topics Section - Multi-column layout */}
        <div className="mt-12">
          <div className="flex flex-col items-center mb-6">
            <h2 className="text-xl font-normal text-[#202124] mb-1">Your topics</h2>
            <p className="text-sm text-[#5F6368] flex items-center gap-1">
              Recommended based on your interests
              <button className="w-4 h-4 rounded-full bg-[#F1F3F4] flex items-center justify-center text-[#5F6368] hover:bg-[#E8EAED] transition-colors">
                <span className="text-xs">?</span>
              </button>
            </p>
          </div>

          {/* Topics Grid - Multiple columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* U.S. Category */}
            <div className="bg-white rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E8EAED] flex items-center justify-between">
                <h3 className="text-base font-normal text-[#202124] flex items-center gap-2">
                  U.S.
                  <span className="text-[#5F6368]">›</span>
                </h3>
                <span className="text-xs text-[#5F6368]">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
              <div>
                {mockIncidents.slice(0, 3).map((incident, index) => {
                  const sourceLabel = incident.sources.length > 0 
                    ? incident.sources[0].name 
                    : `${incident.sourceCount} source${incident.sourceCount !== 1 ? 's' : ''}`;
                  
                  return (
                    <Link
                      key={incident.id}
                      href={`/incident/${incident.id}`}
                      className="block py-4 px-5 border-b border-[#E8EAED] last:border-b-0 hover:bg-[#FAFAFA] transition-colors group"
                    >
                      <div className="flex gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="mb-1.5">
                            <span className="text-xs font-bold text-[#202124] uppercase tracking-wide">
                              {sourceLabel}
                            </span>
                          </div>
                          <h3 className="text-sm font-normal text-[#202124] mb-2 leading-snug line-clamp-2 group-hover:text-[#1A73E8] transition-colors">
                            {incident.headline}
                          </h3>
                          <div className="text-xs text-[#5F6368]">
                            <span>{formatTimeAgo(incident.updatedAt)}</span>
                          </div>
                        </div>
                        {/* Thumbnail */}
                        <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden relative">
                          <Image 
                            src="https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=100&h=100&fit=crop" 
                            alt={incident.headline}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Technology Category */}
            <div className="bg-white rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E8EAED] flex items-center justify-between">
                <h3 className="text-base font-normal text-[#202124] flex items-center gap-2">
                  Technology
                  <span className="text-[#5F6368]">›</span>
                </h3>
                <span className="text-xs text-[#5F6368]">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
              <div>
                {mockIncidents.slice(0, 2).map((incident, index) => {
                  const sourceLabel = incident.sources.length > 0 
                    ? incident.sources[0].name 
                    : `${incident.sourceCount} source${incident.sourceCount !== 1 ? 's' : ''}`;
                  
                  return (
                    <Link
                      key={`tech-${incident.id}`}
                      href={`/incident/${incident.id}`}
                      className="block py-4 px-5 border-b border-[#E8EAED] last:border-b-0 hover:bg-[#FAFAFA] transition-colors group"
                    >
                      <div className="flex gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="mb-1.5">
                            <span className="text-xs font-bold text-[#202124] uppercase tracking-wide">
                              {sourceLabel}
                            </span>
                          </div>
                          <h3 className="text-sm font-normal text-[#202124] mb-2 leading-snug line-clamp-2 group-hover:text-[#1A73E8] transition-colors">
                            {incident.headline}
                          </h3>
                          <div className="text-xs text-[#5F6368]">
                            <span>{formatTimeAgo(incident.updatedAt)}</span>
                          </div>
                        </div>
                        <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden relative">
                          <Image 
                            src="https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&h=100&fit=crop" 
                            alt={incident.headline}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Business Category */}
            <div className="bg-white rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E8EAED] flex items-center justify-between">
                <h3 className="text-base font-normal text-[#202124] flex items-center gap-2">
                  Business
                  <span className="text-[#5F6368]">›</span>
                </h3>
                <span className="text-xs text-[#5F6368]">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
              <div>
                {mockIncidents.slice(1, 3).map((incident, index) => {
                  const sourceLabel = incident.sources.length > 0 
                    ? incident.sources[0].name 
                    : `${incident.sourceCount} source${incident.sourceCount !== 1 ? 's' : ''}`;
                  
                  return (
                    <Link
                      key={`biz-${incident.id}`}
                      href={`/incident/${incident.id}`}
                      className="block py-4 px-5 border-b border-[#E8EAED] last:border-b-0 hover:bg-[#FAFAFA] transition-colors group"
                    >
                      <div className="flex gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="mb-1.5">
                            <span className="text-xs font-bold text-[#202124] uppercase tracking-wide">
                              {sourceLabel}
                            </span>
                          </div>
                          <h3 className="text-sm font-normal text-[#202124] mb-2 leading-snug line-clamp-2 group-hover:text-[#1A73E8] transition-colors">
                            {incident.headline}
                          </h3>
                          <div className="text-xs text-[#5F6368]">
                            <span>{formatTimeAgo(incident.updatedAt)}</span>
                          </div>
                        </div>
                        <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden relative">
                          <Image 
                            src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=100&h=100&fit=crop" 
                            alt={incident.headline}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-[#E8EAED] bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-[#5F6368] space-y-2">
            <p>© 2024 Lanka News Room. All summaries are based on content from cited sources.</p>
            <p>
              Original articles are copyright their respective owners; summaries are provided for informational purposes.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

