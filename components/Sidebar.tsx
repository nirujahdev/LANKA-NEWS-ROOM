import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface SidebarProps {
  latestUpdates?: Array<{
    id: string;
    headline: string;
    summary: string;
    sources: Array<{ id: string; name: string; url: string }>;
    updatedAt: Date;
    sourceCount: number;
  }>;
  language?: 'en' | 'si' | 'ta';
}

const Sidebar: React.FC<SidebarProps> = ({ latestUpdates = [], language = 'en' }) => {
  const getLabel = (en: string, si?: string, ta?: string) => {
    if (language === 'si' && si) return si;
    if (language === 'ta' && ta) return ta;
    return en;
  };

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
    <aside className="hidden lg:block w-80 flex-shrink-0">
      {/* Sidebar Section - Personalized Picks */}
      {latestUpdates.length > 0 && (
        <div className="bg-white rounded-xl overflow-hidden">
          {/* Header inside white container */}
          <div className="px-5 py-4 border-b border-[#E8EAED] flex items-center justify-between">
            <h2 className="text-base font-normal text-[#202124]">
              {getLabel('Picks for you', 'මෑත යාවත්කාලීන කිරීම්', 'சமீபத்திய புதுப்பிப்புகள்')}
            </h2>
            <button className="w-5 h-5 rounded-full bg-[#F1F3F4] flex items-center justify-center text-[#5F6368] hover:bg-[#E8EAED] transition-colors">
              <span className="text-xs">?</span>
            </button>
          </div>
          
          {latestUpdates.slice(0, 3).map((update, index) => {
              const sourceLabel = update.sources.length > 0 
                ? update.sources[0].name 
                : `${update.sourceCount} source${update.sourceCount !== 1 ? 's' : ''}`;
              
              // Get image URL for sidebar thumbnail
              const getSidebarImageUrl = (headline: string) => {
                const lowerHeadline = headline.toLowerCase();
                if (lowerHeadline.includes('power') || lowerHeadline.includes('electricity') || lowerHeadline.includes('outage')) {
                  return 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=100&h=100&fit=crop';
                } else if (lowerHeadline.includes('economic') || lowerHeadline.includes('policy') || lowerHeadline.includes('government')) {
                  return 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=100&h=100&fit=crop';
                } else if (lowerHeadline.includes('dengue') || lowerHeadline.includes('health') || lowerHeadline.includes('outbreak')) {
                  return 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=100&h=100&fit=crop';
                } else if (lowerHeadline.includes('sports') || lowerHeadline.includes('match')) {
                  return 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=100&h=100&fit=crop';
                } else if (lowerHeadline.includes('technology') || lowerHeadline.includes('tech')) {
                  return 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&h=100&fit=crop';
                }
                return 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=100&h=100&fit=crop';
              };

              return (
                <Link
                  key={update.id}
                  href={`/incident/${update.id}`}
                  className="block py-4 px-5 border-b border-[#E8EAED] last:border-b-0 cursor-pointer hover:bg-[#FAFAFA] transition-colors duration-150 group"
                >
                  <div className="flex gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Source Name */}
                      <div className="mb-1.5">
                        <span className="text-xs font-bold text-[#202124] uppercase tracking-wide">
                          {sourceLabel}
                        </span>
                      </div>

                      {/* Headline */}
                      <h3 className="text-sm font-normal text-[#202124] mb-2 leading-snug group-hover:text-[#1A73E8] transition-colors duration-150">
                        {update.headline}
                      </h3>

                      {/* Meta Information - Time */}
                      <div className="text-xs text-[#5F6368]">
                        <span>{formatTimeAgo(update.updatedAt)}</span>
                      </div>
                    </div>

                    {/* Small thumbnail */}
                    <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden relative">
                      <Image 
                        src={getSidebarImageUrl(update.headline)} 
                        alt={update.headline}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
        </div>
      )}
    </aside>
  );
};

export default Sidebar;

