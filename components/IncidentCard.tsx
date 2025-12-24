import React from 'react';
import { Clock, FileText } from 'lucide-react';
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

  return (
    <Link href={`/incident/${id}`}>
      <article className="
        bg-white border border-[#E2E8F0] rounded-lg p-6 md:p-8
        hover:border-[#CBD5E1] hover:shadow-sm
        transition-all duration-200 cursor-pointer group
      ">
        {/* Headline */}
        <h2 className="
          text-xl md:text-2xl font-bold text-[#1E293B] mb-3 md:mb-4
          transition-colors duration-200
          leading-[1.3] tracking-tight
        ">
          {headline}
        </h2>

        {/* Summary */}
        <p className="
          text-[#475569] text-[15px] md:text-base leading-relaxed mb-5 md:mb-6
          line-clamp-3 font-normal
        ">
          {summary}
        </p>

        {/* Meta Information */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-[#F1F5F9]">
          <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm text-[#64748B]">
            {/* Source Count */}
            <div className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="font-medium">
                Reported by {sourceCount} {sourceCount === 1 ? 'source' : 'sources'}
              </span>
            </div>

            {/* Updated Time */}
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Updated {formatTimeAgo(updatedAt)}</span>
            </div>
          </div>

          {/* Read More Indicator */}
          <span className="text-[#1E293B] font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 inline-flex items-center gap-1">
            Read more
            <span className="inline-block group-hover:translate-x-0.5 transition-transform duration-200">→</span>
          </span>
        </div>
      </article>
    </Link>
  );
};

export default IncidentCard;

