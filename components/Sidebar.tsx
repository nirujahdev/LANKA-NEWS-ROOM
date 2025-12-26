import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import NewsCard from './NewsCard';

type SidebarUpdate = {
  id: string;
  slug?: string | null; // SEO-friendly URL slug
  headline: string;
  sources: Array<{ name: string; feed_url: string }>;
  updatedAt?: string | null;
  sourceCount: number;
  summary?: string; // Optional if not used
  category?: string | null;
  topic?: string | null;
};

interface SidebarProps {
  latestUpdates?: SidebarUpdate[];
  language?: 'en' | 'si' | 'ta';
  currentTopic?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  latestUpdates = [], 
  language = 'en',
  currentTopic
}) => {
  const getLabel = (en: string, si?: string, ta?: string) => {
    if (language === 'si' && si) return si;
    if (language === 'ta' && ta) return ta;
    return en;
  };

  return (
    <aside className="w-full space-y-6">
      {/* Sidebar Section - Personalized Picks */}
      {latestUpdates.length > 0 && (
        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-[#E8EAED]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E8EAED] flex items-center justify-between">
          <h2 className="text-lg font-normal text-[#1A73E8]">
            {getLabel('Picks for you', 'මෑත යාවත්කාලීන කිරීම්', 'சமீபத்திய புதுப்பிப்புகள்')}
          </h2>
          <button className="w-6 h-6 rounded-full hover:bg-[#F1F3F4] flex items-center justify-center text-[#5F6368] transition-colors">
            <span className="sr-only">Customize</span>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
               <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
          </button>
        </div>
        
        <div>
          {latestUpdates.slice(0, 5).map((update, index) => (
            <div key={update.id}>
              {index > 0 && <hr className="border-t border-[#E8EAED] mx-5" />}
              <div className="px-5 py-3">
                <NewsCard
                  id={update.id}
                  slug={update.slug}
                  headline={update.headline}
                  summary={update.summary || ''}
                  sources={update.sources}
                  updatedAt={update.updatedAt}
                  sourceCount={update.sourceCount}
                  language={language}
                  variant="compact"
                  category={update.topic || update.category}
                />
              </div>
            </div>
          ))}
        </div>
        
        <div className="px-5 py-3 border-t border-[#E8EAED]">
          <Link href="/recent" className="text-sm font-medium text-[#1A73E8] hover:underline">
             {getLabel('See more recent news', 'තවත් මෑත පුවත්', 'மேலும் சமீபத்திய செய்திகள்')}
          </Link>
        </div>
      </div>
      )}
    </aside>
  );
};

export default Sidebar;
