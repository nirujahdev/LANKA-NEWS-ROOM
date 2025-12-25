import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import IncidentCard from './IncidentCard';

type SidebarUpdate = {
  id: string;
  slug?: string | null; // SEO-friendly URL slug
  headline: string;
  sources: Array<{ name: string; feed_url: string }>;
  updatedAt?: string | null;
  sourceCount: number;
  summary?: string; // Optional if not used
};

interface SidebarProps {
  latestUpdates?: SidebarUpdate[];
  language?: 'en' | 'si' | 'ta';
}

const Sidebar: React.FC<SidebarProps> = ({ latestUpdates = [], language = 'en' }) => {
  const getLabel = (en: string, si?: string, ta?: string) => {
    if (language === 'si' && si) return si;
    if (language === 'ta' && ta) return ta;
    return en;
  };

  if (latestUpdates.length === 0) return null;

  return (
    <aside className="w-full">
      {/* Sidebar Section - Personalized Picks */}
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
        
        <div className="divide-y divide-[#E8EAED]">
          {latestUpdates.slice(0, 5).map((update) => (
            <div key={update.id} className="px-5 py-3">
              <IncidentCard
                id={update.id}
                slug={update.slug}
                headline={update.headline}
                summary={update.summary || ''}
                sources={update.sources}
                updatedAt={update.updatedAt}
                sourceCount={update.sourceCount}
                language={language}
                variant="compact"
              />
            </div>
          ))}
        </div>
        
        <div className="px-5 py-3 border-t border-[#E8EAED]">
          <Link href="/recent" className="text-sm font-medium text-[#1A73E8] hover:underline">
             See more
          </Link>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
