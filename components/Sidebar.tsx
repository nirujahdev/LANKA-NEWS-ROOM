import React from 'react';
import Link from 'next/link';

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
      {/* Sidebar Section */}
      {latestUpdates.length > 0 && (
        <div>
          <h2 className="text-base font-normal text-[#202124] mb-4">
            {getLabel('Picks for you', 'මෑත යාවත්කාලීන කිරීම්', 'சமீபத்திய புதுப்பிப்புகள்')}
          </h2>
          <div className="space-y-0">
            {latestUpdates.slice(0, 3).map((update, index) => {
              const sourceLabel = update.sources.length > 0 
                ? update.sources[0].name 
                : `${update.sourceCount} source${update.sourceCount !== 1 ? 's' : ''}`;
              
              // Get icon for sidebar thumbnail
              const getSidebarIcon = (headline: string) => {
                const lowerHeadline = headline.toLowerCase();
                if (lowerHeadline.includes('power') || lowerHeadline.includes('electricity') || lowerHeadline.includes('outage')) {
                  return '⚡';
                } else if (lowerHeadline.includes('economic') || lowerHeadline.includes('policy') || lowerHeadline.includes('government')) {
                  return '📊';
                } else if (lowerHeadline.includes('dengue') || lowerHeadline.includes('health') || lowerHeadline.includes('outbreak')) {
                  return '🏥';
                } else if (lowerHeadline.includes('sports') || lowerHeadline.includes('match')) {
                  return '⚽';
                } else if (lowerHeadline.includes('technology') || lowerHeadline.includes('tech')) {
                  return '💻';
                }
                return '📰';
              };

              const getSidebarBgColor = (headline: string) => {
                const lowerHeadline = headline.toLowerCase();
                if (lowerHeadline.includes('power') || lowerHeadline.includes('electricity')) {
                  return 'bg-gradient-to-br from-yellow-100 to-orange-200';
                } else if (lowerHeadline.includes('economic') || lowerHeadline.includes('policy')) {
                  return 'bg-gradient-to-br from-blue-100 to-indigo-200';
                } else if (lowerHeadline.includes('dengue') || lowerHeadline.includes('health')) {
                  return 'bg-gradient-to-br from-red-100 to-pink-200';
                }
                return 'bg-gradient-to-br from-gray-100 to-gray-200';
              };

              return (
                <Link
                  key={update.id}
                  href={`/incident/${update.id}`}
                  className="block py-4 border-b border-[#E8EAED] last:border-b-0 cursor-pointer hover:bg-[#FAFAFA] transition-colors duration-150 group"
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
                    <div className={`w-16 h-16 flex-shrink-0 ${getSidebarBgColor(update.headline)} rounded flex items-center justify-center`}>
                      <span className="text-2xl">{getSidebarIcon(update.headline)}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;

