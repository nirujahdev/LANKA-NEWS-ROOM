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

  // Use first source name, or combine if multiple
  const sourceLabel = sources.length > 0 
    ? sources.length === 1 
      ? sources[0].name 
      : `${sources[0].name} and ${sourceCount - 1} other${sourceCount - 1 > 1 ? 's' : ''}`
    : `${sourceCount} source${sourceCount !== 1 ? 's' : ''}`;

  return (
    <Link href={`/incident/${id}`}>
      <article className="py-4 border-b border-[#E8EAED] last:border-b-0 cursor-pointer">
        {/* Source Name */}
        <div className="mb-1.5">
          <span className="text-xs font-bold text-[#202124] uppercase tracking-wide">
            {sourceLabel}
          </span>
        </div>

        {/* Headline */}
        <h2 className="
          text-base md:text-lg font-normal text-[#202124] mb-2
          leading-snug
        ">
          {headline}
        </h2>

        {/* Meta Information - Time */}
        <div className="flex items-center gap-3 text-xs text-[#5F6368] mb-2">
          <span>{formatTimeAgo(updatedAt)}</span>
          {sourceCount > 1 && (
            <>
              <span>·</span>
              <span>{sourceCount} sources</span>
            </>
          )}
        </div>

        {/* Summary - optional, can be hidden or shown */}
        {summary && (
          <p className="text-sm text-[#5F6368] leading-relaxed line-clamp-2 mt-1">
            {summary}
          </p>
        )}
      </article>
    </Link>
  );
};

export default IncidentCard;

