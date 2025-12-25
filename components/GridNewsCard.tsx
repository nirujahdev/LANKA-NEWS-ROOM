import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { NewsCardData, formatTimeAgo, getTopicTags, getTopicLabel, getImageUrl, getStoryUrl } from '@/lib/newsCardUtils';

interface GridNewsCardProps {
  data: NewsCardData;
}

export default function GridNewsCard({ data }: GridNewsCardProps) {
  const href = getStoryUrl(data.language || 'en', data.slug, data.id);
  const topicTags = getTopicTags(data);
  const imageUrl = getImageUrl(data);

  return (
    <Link href={href} className="block group h-full">
      <article className="bg-white rounded-[40%] border border-[#E8EAED] overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200 h-full flex flex-col">
        {/* Image - Top */}
        <div className="relative w-full aspect-[4/3] overflow-hidden">
          <Image 
            src={imageUrl} 
            alt={data.headline}
            fill
            className="object-cover group-hover:scale-[1.05] transition-transform duration-300"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80';
            }}
          />
        </div>
        
        {/* Content - Bottom */}
        <div className="p-4 flex flex-col flex-1">
          {/* Topic Tag */}
          {topicTags.length > 0 && (
            <div className="mb-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E8F0FE] text-[#1A73E8]">
                {getTopicLabel(topicTags[0], data.language || 'en')}
              </span>
            </div>
          )}

          {/* Headline */}
          <h3 className="text-base font-medium text-[#202124] mb-2 leading-snug line-clamp-3 group-hover:text-[#1A73E8] transition-colors duration-200">
            {data.headline}
          </h3>

          {/* Time */}
          <div className="text-xs text-[#5F6368] mt-auto">
            {formatTimeAgo(data.updatedAt)}
          </div>
        </div>
      </article>
    </Link>
  );
}

