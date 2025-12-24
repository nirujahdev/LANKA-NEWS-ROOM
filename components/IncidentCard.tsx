import React from 'react';
import Link from 'next/link';

interface Source {
  id: string;
  name: string;
  url: string;
}

interface IncidentCardProps {
  id: string;
  headline: string;
  summary: string;
  sources: Source[];
  updatedAt: Date;
  sourceCount: number;
  language?: 'en' | 'si' | 'ta';
}

const IncidentCard: React.FC<IncidentCardProps> = ({
  id,
  headline,
  summary,
  sources,
  updatedAt,
  sourceCount,
  language = 'en'
}) => {
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

  // Use first source name
  const sourceLabel = sources.length > 0 ? sources[0].name : `${sourceCount} source${sourceCount !== 1 ? 's' : ''}`;

  return (
    <Link href={`/incident/${id}`}>
      <article className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer group h-full flex flex-col">
        {/* Image Placeholder */}
        <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
          <div className="text-4xl text-blue-400 opacity-50">📰</div>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col">
          {/* Source Name */}
          <div className="mb-2">
            <span className="text-xs font-bold text-[#5F6368] uppercase tracking-wide">
              {sourceLabel}
            </span>
          </div>

          {/* Headline - Dark Blue */}
          <h2 className="
            text-lg font-semibold text-[#1A73E8] mb-3
            leading-tight line-clamp-2
            group-hover:text-[#1557B0] transition-colors
          ">
            {headline}
          </h2>

          {/* Description */}
          {summary && (
            <p className="text-sm text-[#5F6368] leading-relaxed line-clamp-3 mb-4 flex-1">
              {summary}
            </p>
          )}

          {/* Time */}
          <div className="text-xs text-[#9AA0A6] pt-3 border-t border-[#F1F3F4]">
            {formatTimeAgo(updatedAt)}
          </div>
        </div>
      </article>
    </Link>
  );
};

export default IncidentCard;

