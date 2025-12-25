import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { NewsCardData, formatTimeAgo, getTopicTags, getTopicLabel, getImageUrl, getStoryUrl } from '@/lib/newsCardUtils';

interface CompactNewsCardProps {
  data: NewsCardData;
}

export default function CompactNewsCard({ data }: CompactNewsCardProps) {
  const href = getStoryUrl(data.language || 'en', data.slug, data.id);
  const topicTags = getTopicTags(data);
  const imageUrl = getImageUrl(data);

  return (
    <Link href={href} className="block group">
      <article className="relative flex gap-3 cursor-pointer transition-colors py-2">
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Topic Tag (optional, very small) */}
          {topicTags.length > 0 && (
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-[#E8F0FE] text-[#1A73E8]">
                {getTopicLabel(topicTags[0], data.language || 'en')}
              </span>
            </div>
          )}
          
          {/* Headline */}
          <h3 className="text-xs font-medium text-[#202124] leading-snug line-clamp-2 group-hover:text-[#1A73E8] transition-colors duration-200 mb-1">
            {data.headline}
          </h3>
          
          {/* Time */}
          <div className="text-[10px] text-[#5F6368]">
            {formatTimeAgo(data.updatedAt)}
          </div>
        </div>
        
        {/* Tiny Image */}
        <div className="w-16 h-16 flex-shrink-0 rounded-[40%] overflow-hidden relative bg-[#F1F3F4]">
          <Image 
            src={imageUrl} 
            alt={data.headline}
            fill
            className="object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80';
            }}
          />
        </div>
      </article>
    </Link>
  );
}

