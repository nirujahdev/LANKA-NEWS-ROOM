import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface IncidentCardProps {
  id: string;
  headline: string;
  summary: string;
  sources: Array<{ name: string; feed_url: string }>;
  updatedAt?: string | null;
  sourceCount: number;
  language?: 'en' | 'si' | 'ta';
  variant?: 'default' | 'featured' | 'compact';
}

const IncidentCard: React.FC<IncidentCardProps> = ({
  id,
  headline,
  summary,
  sources,
  updatedAt,
  sourceCount,
  language = 'en',
  variant = 'default'
}) => {
  const getLabel = (en: string, si?: string, ta?: string) => {
    if (language === 'si' && si) return si;
    if (language === 'ta' && ta) return ta;
    return en;
  };

  const formatTimeAgo = (iso?: string | null): string => {
    if (!iso) return 'Just now';
    const date = new Date(iso);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} min ago`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    }
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} days ago`;
  };

  const sourceLabel = sources.length > 0 
    ? sources[0].name 
    : `${sourceCount} source${sourceCount !== 1 ? 's' : ''}`;

  const getImageUrl = () => {
    const lowerHeadline = headline.toLowerCase();
    if (lowerHeadline.includes('power') || lowerHeadline.includes('electricity') || lowerHeadline.includes('outage')) {
      return 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800&q=80';
    } else if (lowerHeadline.includes('economic') || lowerHeadline.includes('policy') || lowerHeadline.includes('government')) {
      return 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80';
    } else if (lowerHeadline.includes('dengue') || lowerHeadline.includes('health') || lowerHeadline.includes('outbreak')) {
      return 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80';
    } else if (lowerHeadline.includes('sports') || lowerHeadline.includes('match')) {
      return 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80';
    } else if (lowerHeadline.includes('technology') || lowerHeadline.includes('tech')) {
      return 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80';
    }
    return 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80';
  };

  if (variant === 'featured') {
    return (
      <Link href={`/incident/${id}`} className="block group mb-6">
        <article className="flex flex-col gap-3">
          {/* Large Image */}
          <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-1">
            <Image 
              src={getImageUrl()} 
              alt={headline}
              fill
              className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
            />
          </div>
          
          <div className="flex flex-col gap-1">
             {/* Source & Time */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-[#202124]">
                {sourceLabel}
              </span>
              <span className="text-[10px] text-[#5F6368]">•</span>
              <span className="text-xs text-[#5F6368]">{formatTimeAgo(updatedAt)}</span>
            </div>

            {/* Headline */}
            <h2 className="text-2xl font-normal text-[#202124] leading-snug group-hover:text-[#1A73E8] transition-colors duration-150 group-hover:underline decoration-1 underline-offset-2">
              {headline}
            </h2>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link href={`/incident/${id}`}>
      <article className={`
        group relative py-4 flex gap-4 cursor-pointer
        ${variant !== 'compact' ? 'border-b border-[#E8EAED] last:border-b-0' : ''}
      `}>
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            {/* Source */}
            <div className="mb-2 flex items-center gap-2">
              {/* Optional: Add favicon logic here if available */}
              <span className="text-xs font-bold text-[#202124] group-hover:text-[#202124]">
                {sourceLabel}
              </span>
            </div>

            {/* Headline */}
            <h2 className={`
              font-medium text-[#202124] mb-1.5 leading-[1.4]
              ${variant === 'compact' ? 'text-sm line-clamp-2' : 'text-base md:text-lg line-clamp-3'}
              group-hover:text-[#1A73E8] transition-colors duration-150 group-hover:underline decoration-1 underline-offset-2
            `}>
              {headline}
            </h2>
          </div>

          {/* Meta Information - Time */}
          <div className="flex items-center gap-2 text-xs text-[#5F6368] mt-1">
            <span>{formatTimeAgo(updatedAt)}</span>
            {sourceCount > 1 && (
              <>
                <span>·</span>
                <span>{sourceCount} sources</span>
              </>
            )}
          </div>
        </div>

        {/* Image - Right side */}
        <div className={`
          flex-shrink-0 rounded-lg overflow-hidden relative bg-[#F1F3F4]
          ${variant === 'compact' ? 'w-20 h-20' : 'w-24 h-24 md:w-32 md:h-32'}
        `}>
          <Image 
            src={getImageUrl()} 
            alt={headline}
            fill
            className="object-cover group-hover:brightness-[1.02] transition-all duration-200"
          />
        </div>
      </article>
    </Link>
  );
};

export default IncidentCard;