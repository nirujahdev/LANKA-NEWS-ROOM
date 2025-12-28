'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import WeatherWidget from './WeatherWidget';
import { normalizeTopicSlug } from '@/lib/topics';

interface Topic {
  id: string;
  label: string;
  labelSi?: string;
  labelTa?: string;
  href: string;
}

interface UnifiedTopicNavigationProps {
  language?: 'en' | 'si' | 'ta';
  showWeather?: boolean;
}

const topics: Topic[] = [
  { id: 'home', label: 'Home', labelSi: 'මුල් පිටුව', labelTa: 'முகப்பு', href: 'home' },
  { id: 'for-you', label: 'For you', labelSi: 'ඔබ වෙනුවෙන්', labelTa: 'உங்களுக்காக', href: 'for-you' },
  { id: 'sri-lanka', label: 'Sri Lanka', labelSi: 'ශ්‍රී ලංකාව', labelTa: 'இலங்கை', href: 'sri-lanka' },
  { id: 'world', label: 'Global', labelSi: 'ලෝකය', labelTa: 'உலகம்', href: 'world' },
  { id: 'politics', label: 'Politics', labelSi: 'දේශපාලනය', labelTa: 'அரசியல்', href: 'politics' },
  { id: 'economy', label: 'Economy', labelSi: 'ආර්ථිකය', labelTa: 'பொருளாதாரம்', href: 'economy' },
  { id: 'education', label: 'Education', labelSi: 'අධ්‍යාපනය', labelTa: 'கல்வி', href: 'education' },
  { id: 'health', label: 'Health', labelSi: 'සෞඛ්‍ය', labelTa: 'சுகாதாரம்', href: 'health' },
  { id: 'sports', label: 'Sports', labelSi: 'ක්‍රීඩා', labelTa: 'விளையாட்டு', href: 'sports' },
  { id: 'technology', label: 'Technology', labelSi: 'තාක්ෂණය', labelTa: 'தொழில்நுட்பம்', href: 'technology' },
  { id: 'society', label: 'Society', labelSi: 'සමාජය', labelTa: 'சமூகம்', href: 'society' }
];

const UnifiedTopicNavigationContent: React.FC<UnifiedTopicNavigationProps> = ({ 
  language = 'en',
  showWeather = true 
}) => {
  const pathname = usePathname();

  const getLabel = (topic: Topic) => {
    if (language === 'si' && topic.labelSi) return topic.labelSi;
    if (language === 'ta' && topic.labelTa) return topic.labelTa;
    return topic.label;
  };

  // Extract current language from path (e.g., /en/topic/politics -> 'en')
  const getCurrentLang = (): 'en' | 'si' | 'ta' => {
    const match = pathname.match(/^\/(en|si|ta)/);
    return (match ? match[1] : language) as 'en' | 'si' | 'ta';
  };

  const currentLang = getCurrentLang();

  // Build href with path-based language structure
  const getHref = (topicHref: string) => {
    // Special cases for home and for-you
    if (topicHref === 'home') {
      return `/${currentLang}`;
    }
    if (topicHref === 'for-you') {
      return '/for-you'; // For-you doesn't use language prefix
    }
    // For topic pages, normalize and use /lang/topic/topicname
    const normalized = normalizeTopicSlug(topicHref) || topicHref.toLowerCase().replace(/\s+/g, '-');
    return `/${currentLang}/${normalized}`;
  };

  const isActive = (topicHref: string) => {
    if (topicHref === 'home') {
      return pathname === `/${currentLang}` || pathname === '/';
    }
    if (topicHref === 'for-you') {
      return pathname.startsWith('/for-you');
    }
    // Check if path matches /lang/topic/topicname (normalize for comparison)
    const normalized = normalizeTopicSlug(topicHref) || topicHref.toLowerCase().replace(/\s+/g, '-');
    return pathname === `/${currentLang}/${normalized}` || 
           pathname.startsWith(`/${currentLang}/${normalized}/`);
  };

  return (
    <div className="bg-white border-b border-[#E8EAED]">
      {/* Topic Tabs - Identical on all screen sizes */}
      <div>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex overflow-x-auto scrollbar-hide touch-scroll -mb-px justify-center">
            <div className="flex min-w-max gap-0">
              {topics.map((topic) => {
                const active = isActive(topic.href);
                return (
                  <Link
                    key={topic.id}
                    href={getHref(topic.href)}
                    className={`
                      relative px-4 py-3 text-sm font-normal whitespace-nowrap
                      border-b-[3px] transition-colors duration-150
                      ${active
                        ? 'border-[#1A73E8] text-[#1A73E8]'
                        : 'border-transparent text-[#5F6368] hover:text-[#202124]'
                      }
                    `}
                  >
                    {getLabel(topic)}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Weather Section - Identical on all screen sizes */}
      {showWeather && (
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex justify-end">
            <WeatherWidget />
          </div>
        </div>
      )}
    </div>
  );
};

const UnifiedTopicNavigation: React.FC<UnifiedTopicNavigationProps> = (props) => {
  return (
    <Suspense fallback={
      <div className="bg-white border-b border-[#E8EAED]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex overflow-x-auto scrollbar-hide touch-scroll -mb-px justify-center">
            <div className="flex min-w-max">
              {topics.map((topic) => (
                <div
                  key={topic.id}
                  className="relative px-4 py-3 text-sm font-normal whitespace-nowrap border-b-[3px] border-transparent text-[#5F6368]"
                >
                  {props.language === 'si' && topic.labelSi ? topic.labelSi : props.language === 'ta' && topic.labelTa ? topic.labelTa : topic.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    }>
      <UnifiedTopicNavigationContent {...props} />
    </Suspense>
  );
};

export default UnifiedTopicNavigation;

