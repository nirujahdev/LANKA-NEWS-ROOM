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
        bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl p-6
        hover:bg-[#E2E8F0] transition-colors duration-200
        cursor-pointer group
      ">
        {/* Headline */}
        <h2 className="
          text-xl font-bold text-[#0F172A] mb-3
          group-hover:text-[#2563EB] transition-colors
          line-clamp-2
        ">
          {headline}
        </h2>

        {/* Summary */}
        <p className="
          text-[#64748B] text-base leading-relaxed mb-4
          line-clamp-3
        ">
          {summary}
        </p>

        {/* Meta Information */}
        <div className="flex items-center justify-between text-sm text-[#64748B]">
          <div className="flex items-center gap-4">
            {/* Source Count */}
            <div className="flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              <span>
                Reported by {sourceCount} {sourceCount === 1 ? 'source' : 'sources'}
              </span>
            </div>

            {/* Updated Time */}
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>Updated {formatTimeAgo(updatedAt)}</span>
            </div>
          </div>

          {/* Read More Indicator */}
          <span className="text-[#2563EB] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Read more →
          </span>
        </div>
      </article>
    </Link>
  );
};

export default IncidentCard;

