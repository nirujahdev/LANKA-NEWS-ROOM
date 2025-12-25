import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { NewsCardData, formatTimeAgo, getTopicTags, getTopicLabel, getImageUrl, getStoryUrl } from '@/lib/newsCardUtils';

interface FeaturedNewsCardProps {
  data: NewsCardData;
}

export default function FeaturedNewsCard({ data }: FeaturedNewsCardProps) {
  const href = getStoryUrl(data.language || 'en', data.slug, data.id);
  const topicTags = getTopicTags(data);
  const imageUrl = getImageUrl(data);

  return (
    <Link href={href} className="block group mb-6">
      <article className="flex flex-col md:flex-row gap-6">
        {/* Image - Left Side (2/3 width on desktop) */}
        <div className="relative w-full md:w-2/3 aspect-video md:aspect-[16/9] rounded-[40%] overflow-hidden mb-1 md:mb-0 order-first">
          <Image 
            src={imageUrl} 
            alt={data.headline}
            fill
            className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80';
            }}
          />
        </div>
        
        {/* Content - Right Side (1/3 width on desktop) */}
        <div className="flex flex-col gap-2 w-full md:w-1/3 py-1">
          {/* Topic Tags */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {topicTags.map((topic, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E8F0FE] text-[#1A73E8]"
              >
                {getTopicLabel(topic, data.language || 'en')}
              </span>
            ))}
          </div>

          {/* Headline */}
          <h2 className="text-xl md:text-2xl font-normal text-[#1F1F1F] leading-tight group-hover:text-[#1A73E8] transition-colors duration-200 mb-1 flex items-center gap-2">
            <span className="group-hover:underline decoration-1 underline-offset-2">{data.headline}</span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[#1A73E8]">➝</span>
          </h2>

          {/* Time */}
          <div className="text-xs text-[#5F6368] mt-auto">
            {formatTimeAgo(data.updatedAt)}
          </div>
          
          {/* Full Coverage Link */}
          <div className="hidden md:flex mt-4 items-center text-sm font-medium text-[#1A73E8] hover:underline cursor-pointer">
            <span className="mr-1">Full Coverage</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
          </div>
        </div>
      </article>
    </Link>
  );
}

