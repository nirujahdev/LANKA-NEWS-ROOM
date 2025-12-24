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
              
              return (
                <Link
                  key={update.id}
                  href={`/incident/${update.id}`}
                  className="block py-4 border-b border-[#E8EAED] last:border-b-0 cursor-pointer"
                >
                  {/* Source Name */}
                  <div className="mb-1.5">
                    <span className="text-xs font-bold text-[#202124] uppercase tracking-wide">
                      {sourceLabel}
                    </span>
                  </div>

                  {/* Headline */}
                  <h3 className="text-sm font-normal text-[#202124] mb-2 leading-snug">
                    {update.headline}
                  </h3>

                  {/* Meta Information - Time */}
                  <div className="text-xs text-[#5F6368]">
                    <span>{formatTimeAgo(update.updatedAt)}</span>
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

