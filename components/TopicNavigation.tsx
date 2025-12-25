'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import WeatherWidget from './WeatherWidget';

interface Topic {
  id: string;
  label: string;
  labelSi?: string;
  labelTa?: string;
  href: string;
}

interface TopicNavigationProps {
  language?: 'en' | 'si' | 'ta';
  showWeather?: boolean;
}

const topics: Topic[] = [
  { id: 'home', label: 'Home', labelSi: 'මුල් පිටුව', labelTa: 'முகப்பு', href: 'home' },
  { id: 'for-you', label: 'For you', labelSi: 'ඔබ වෙනුවෙන්', labelTa: 'உங்களுக்காக', href: 'for-you' },
  { id: 'sri-lanka', label: 'Sri Lanka', labelSi: 'ශ්‍රී ලංකාව', labelTa: 'இலங்கை', href: 'sri-lanka' },
  { id: 'world', label: 'World', labelSi: 'ලෝකය', labelTa: 'உலகம்', href: 'world' },
  { id: 'politics', label: 'Politics', labelSi: 'දේශපාලනය', labelTa: 'அரசியல்', href: 'politics' },
  { id: 'business', label: 'Business', labelSi: 'ව්‍යාපාර', labelTa: 'வணிகம்', href: 'business' },
  { id: 'technology', label: 'Technology', labelSi: 'තාක්ෂණය', labelTa: 'தொழில்நுட்பம்', href: 'technology' },
  { id: 'entertainment', label: 'Entertainment', labelSi: 'විනෝදාස්වාදය', labelTa: 'பொழுதுபோக்கு', href: 'entertainment' },
  { id: 'sports', label: 'Sports', labelSi: 'ක්‍රීඩා', labelTa: 'விளையாட்டு', href: 'sports' },
  { id: 'science', label: 'Science', labelSi: 'විද්‍යාව', labelTa: 'அறிவியல்', href: 'science' },
  { id: 'health', label: 'Health', labelSi: 'සෞඛ්‍ය', labelTa: 'சுகாதாரம்', href: 'health' }
];

const TopicNavigationContent: React.FC<TopicNavigationProps> = ({ 
  language = 'en',
  showWeather = true 
}) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
    return `/${currentLang}/topic/${normalized}`;
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
    return pathname === `/${currentLang}/topic/${normalized}` || 
           pathname.startsWith(`/${currentLang}/topic/${normalized}/`);
  };

  return (
    <div className="bg-white border-b border-[#E8EAED]">
      {/* Topic Tabs - Centered and Scrollable on Mobile */}
      <div>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex overflow-x-auto scrollbar-hide -mb-px justify-center md:justify-center">
            <div className="flex min-w-max gap-0">
              {topics.map((topic) => {
                const active = isActive(topic.href);
                return (
                  <Link
                    key={topic.id}
                    href={getHref(topic.href)}
                    className={`
                      relative px-3 sm:px-4 py-3 text-sm font-normal whitespace-nowrap
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

      {/* Weather Section - Only render if active (removed extra borders/padding) */}
      {showWeather && (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-2">
          <div className="flex justify-end">
            <WeatherWidget />
          </div>
        </div>
      )}
    </div>
  );
};

const TopicNavigation: React.FC<TopicNavigationProps> = (props) => {
  return (
    <Suspense fallback={
      <div className="bg-white border-b border-[#E8EAED]">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex overflow-x-auto scrollbar-hide -mb-px justify-center">
            <div className="flex min-w-max">
              {topics.map((topic) => (
                <div
                  key={topic.id}
                  className="relative px-3 sm:px-4 py-3 text-sm font-normal whitespace-nowrap border-b-[3px] border-transparent text-[#5F6368]"
                >
                  {props.language === 'si' && topic.labelSi ? topic.labelSi : props.language === 'ta' && topic.labelTa ? topic.labelTa : topic.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    }>
      <TopicNavigationContent {...props} />
    </Suspense>
  );
};

export default TopicNavigation;

