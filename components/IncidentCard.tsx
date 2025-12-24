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

  // Get image based on headline keywords
  const getImageIcon = () => {
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

  // Get image background color based on category
  const getImageBgColor = () => {
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
        <div className={`w-20 h-20 md:w-28 md:h-28 flex-shrink-0 ${getImageBgColor()} rounded flex items-center justify-center`}>
          <span className="text-3xl md:text-4xl">{getImageIcon()}</span>
        </div>
      </article>
    </Link>
  );
};

export default IncidentCard;

