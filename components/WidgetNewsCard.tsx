import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { NewsCardData, formatTimeAgo, getTopicTags, getTopicLabel, getImageUrl, getStoryUrl } from '@/lib/newsCardUtils';

interface WidgetNewsCardProps {
  data: NewsCardData;
}

export default function WidgetNewsCard({ data }: WidgetNewsCardProps) {
  const href = getStoryUrl(data.language || 'en', data.slug, data.id);
  const topicTags = getTopicTags(data);
  const imageUrl = getImageUrl(data);

  return (
    <Link href={href} className="block group">
      <article className="bg-white rounded-[40%] border border-[#E8EAED] overflow-hidden cursor-pointer hover:shadow-sm transition-all duration-200">
        {/* Image - Top (smaller) */}
        <div className="relative w-full aspect-[16/9] overflow-hidden">
          <Image 
            src={imageUrl} 
            alt={data.headline}
            fill
            className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80';
            }}
          />
        </div>
        
        {/* Content - Bottom */}
        <div className="p-3">
          {/* Source (first source name) */}
          {data.sources.length > 0 && (
            <div className="text-[10px] text-[#9AA0A6] uppercase tracking-wide mb-1">
              {data.sources[0].name}
            </div>
          )}

          {/* Headline */}
          <h3 className="text-sm font-medium text-[#202124] mb-1.5 leading-snug line-clamp-2 group-hover:text-[#1A73E8] transition-colors duration-200">
            {data.headline}
          </h3>

          {/* Time */}
          <div className="text-[10px] text-[#5F6368]">
            {formatTimeAgo(data.updatedAt)}
          </div>
        </div>
      </article>
    </Link>
  );
}

