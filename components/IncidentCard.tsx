import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface IncidentCardProps {
  id: string;
  headline: string;
  summary?: string | null;
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
        <article className="flex flex-col md:flex-row gap-6">
          {/* Image - Left Side for Featured (Desktop) / Top (Mobile) */}
          <div className="relative w-full md:w-2/3 aspect-video md:aspect-[16/9] rounded-xl overflow-hidden mb-1 md:mb-0 order-first">
            <Image 
              src={getImageUrl()} 
              alt={headline}
              fill
              className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
            />
          </div>
          
          <div className="flex flex-col gap-2 w-full md:w-1/3 py-1">
             {/* Source */}
            <div className="flex items-center gap-2 mb-1">
               <Image 
                  src={`https://www.google.com/s2/favicons?domain=${sources[0]?.feed_url || 'google.com'}&sz=128`}
                  alt=""
                  width={16}
                  height={16}
                  className="rounded-sm"
               />
              <span className="text-xs font-bold text-[#202124] uppercase">
                {sourceLabel}
              </span>
            </div>

            {/* Headline */}
            <h2 className="text-xl md:text-2xl font-normal text-[#1F1F1F] leading-tight group-hover:text-[#1A73E8] group-hover:underline decoration-1 underline-offset-2 mb-1">
              {headline}
            </h2>

             {/* Time */}
             <div className="text-xs text-[#5F6368] mt-auto">
               {formatTimeAgo(updatedAt)}
             </div>
             
             {/* Related Coverage Link (Mock) */}
             <div className="hidden md:flex mt-4 items-center text-sm font-medium text-[#1A73E8] hover:underline cursor-pointer">
                <span className="mr-1">Full Coverage</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
             </div>
          </div>
        </article>
      </Link>
    );
  }

  // Compact variant for "Your topics" and Sidebars
  if (variant === 'compact') {
     return (
       <Link href={`/incident/${id}`}>
         <article className="group relative py-3 flex gap-4 cursor-pointer hover:bg-[#F8F9FA] rounded-lg -mx-2 px-2 transition-colors">
            <div className="flex-1 min-w-0 flex flex-col">
               <div className="flex items-center gap-2 mb-1">
                  <Image 
                     src={`https://www.google.com/s2/favicons?domain=${sources[0]?.feed_url || 'google.com'}&sz=128`}
                     alt=""
                     width={12}
                     height={12}
                     className="rounded-sm opacity-80"
                  />
                  <span className="text-[11px] font-bold text-[#5F6368] uppercase truncate max-w-[120px]">
                     {sourceLabel}
                  </span>
               </div>
               <h3 className="text-sm font-medium text-[#202124] leading-snug line-clamp-2 group-hover:text-[#1A73E8] group-hover:underline decoration-1 underline-offset-2">
                  {headline}
               </h3>
               <div className="text-[11px] text-[#5F6368] mt-1">
                  {formatTimeAgo(updatedAt)}
               </div>
            </div>
            
            <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden relative bg-[#F1F3F4]">
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
  }

  // Default List Variant (Top Stories list below featured)
  return (
    <Link href={`/incident/${id}`}>
      <article className="group relative py-4 flex gap-4 cursor-pointer border-b border-[#E8EAED] last:border-b-0 hover:bg-[#F8F9FA] -mx-4 px-4 transition-colors">
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            {/* Source */}
            <div className="mb-1.5 flex items-center gap-2">
               <Image 
                  src={`https://www.google.com/s2/favicons?domain=${sources[0]?.feed_url || 'google.com'}&sz=128`}
                  alt=""
                  width={14}
                  height={14}
                  className="rounded-sm"
               />
              <span className="text-xs font-bold text-[#202124] uppercase">
                {sourceLabel}
              </span>
            </div>

            {/* Headline */}
            <h2 className="text-base font-medium text-[#202124] mb-1 leading-snug group-hover:text-[#1A73E8] group-hover:underline decoration-1 underline-offset-2">
              {headline}
            </h2>
          </div>

          {/* Meta Information - Time */}
          <div className="flex items-center gap-2 text-xs text-[#5F6368] mt-1">
            <span>{formatTimeAgo(updatedAt)}</span>
          </div>
        </div>

        {/* Image - Right side */}
        <div className="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden relative bg-[#F1F3F4]">
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