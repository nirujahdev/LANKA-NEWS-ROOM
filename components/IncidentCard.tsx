import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

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

  // Get image URL based on headline keywords
  const getImageUrl = () => {
    const lowerHeadline = headline.toLowerCase();
    if (lowerHeadline.includes('power') || lowerHeadline.includes('electricity') || lowerHeadline.includes('outage')) {
      return 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=150&h=150&fit=crop';
    } else if (lowerHeadline.includes('economic') || lowerHeadline.includes('policy') || lowerHeadline.includes('government')) {
      return 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=150&h=150&fit=crop';
    } else if (lowerHeadline.includes('dengue') || lowerHeadline.includes('health') || lowerHeadline.includes('outbreak')) {
      return 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=150&h=150&fit=crop';
    } else if (lowerHeadline.includes('sports') || lowerHeadline.includes('match')) {
      return 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=150&h=150&fit=crop';
    } else if (lowerHeadline.includes('technology') || lowerHeadline.includes('tech')) {
      return 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=150&h=150&fit=crop';
    }
    return 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=150&h=150&fit=crop';
  };

  return (
    <Link href={`/incident/${id}`}>
      <article className="bg-white border-b border-[#E8EAED] last:border-b-0 py-4 px-4 md:px-5 hover:bg-[#FAFAFA] transition-colors duration-150 cursor-pointer group flex gap-4">
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Source Name */}
          <div className="mb-1.5">
            <span className="text-xs font-bold text-[#202124] uppercase tracking-wide">
              {sourceLabel}
            </span>
          </div>

          {/* Headline */}
          <h2 className="
            text-base md:text-lg font-normal text-[#202124] mb-2
            leading-[1.3] line-clamp-2
            group-hover:text-[#1A73E8] transition-colors duration-150
          ">
            {headline}
          </h2>

          {/* Meta Information - Time */}
          <div className="flex items-center gap-3 text-xs text-[#5F6368]">
            <span>{formatTimeAgo(updatedAt)}</span>
            {sourceCount > 1 && (
              <>
                <span>·</span>
                <span>{sourceCount} sources</span>
              </>
            )}
          </div>
        </div>

        {/* Image - Moved to right side */}
        <div className="w-20 h-20 md:w-28 md:h-28 flex-shrink-0 rounded overflow-hidden relative">
          <Image 
            src={getImageUrl()} 
            alt={headline}
            fill
            className="object-cover"
          />
        </div>
      </article>
    </Link>
  );
};

export default IncidentCard;

