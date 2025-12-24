'use client';

import React, { useState } from 'react';
import Navigation from '@/components/Navigation';
import TabNavigation from '@/components/TabNavigation';
import IncidentCard from '@/components/IncidentCard';
import Sidebar from '@/components/Sidebar';

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

  return (
    <div className="min-h-screen bg-white">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Page Header */}
            <div className="mb-8 md:mb-10">
              <h1 className="text-2xl md:text-3xl lg:text-[32px] font-bold text-[#1E293B] mb-2 md:mb-3 tracking-tight leading-tight">
                {currentLanguage === 'si' ? 'මුල් පිටුව' : currentLanguage === 'ta' ? 'முகப்பு' : 'Latest News'}
              </h1>
              <p className="text-[#64748B] text-sm md:text-base">
                {currentLanguage === 'si' 
                  ? 'විශ්වාසදායක, උදාසීන ප්‍රවෘත්ති සාරාංශ' 
                  : currentLanguage === 'ta' 
                  ? 'நம்பகமான, நடுநிலை செய்தி சுருக்கங்கள்'
                  : 'Trusted, neutral news summaries'}
              </p>
            </div>

            {/* News Feed */}
            <div className="space-y-6 md:space-y-8">
              {mockIncidents.map((incident) => (
                <IncidentCard
                  key={incident.id}
                  {...incident}
                  language={currentLanguage}
                />
              ))}
            </div>
          </div>

          {/* Sidebar (Desktop Only) */}
          <Sidebar latestUpdates={mockIncidents} language={currentLanguage} />
        </div>

        {/* Load More Button */}
        <div className="mt-10 md:mt-12 text-center">
          <button className="
            glass-button px-6 md:px-8 py-3 md:py-3.5 rounded-lg
            text-[#1E293B] font-medium text-sm md:text-base
            transition-all duration-200
          ">
            Load More Stories
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 md:mt-20 border-t border-[#E2E8F0] py-8 md:py-12 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-[#64748B] space-y-2">
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

