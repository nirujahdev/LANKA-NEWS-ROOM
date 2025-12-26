import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { NewsCardData, formatTimeAgo, getTopicTags, getTopicLabel, getImageUrl, getStoryUrl } from '@/lib/newsCardUtils';

interface ListNewsCardProps {
  data: NewsCardData;
}

export default function ListNewsCard({ data }: ListNewsCardProps) {
  const topic = data.category || data.topics?.[0] || 'other';
  const href = getStoryUrl(data.language || 'en', data.slug, data.id, topic);
  const topicTags = getTopicTags(data);
  const imageUrl = getImageUrl(data);

  return (
    <Link href={href} className="block group">
      <article className="relative bg-white rounded-xl border border-[#E8EAED] p-4 sm:p-5 cursor-pointer hover:shadow-sm transition-all duration-200">
        <div className="flex gap-4">
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              {/* Topic Tags */}
              <div className="mb-2 flex items-center gap-2 flex-wrap">
                {topicTags.map((topic, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#1A73E8] text-white"
                  >
                    {getTopicLabel(topic, data.language || 'en')}
                  </span>
                ))}
              </div>

              {/* Headline */}
              <h2 className="text-base font-medium text-[#202124] mb-2 leading-snug group-hover:text-[#1A73E8] transition-colors duration-200 flex items-center gap-2">
                <span className="group-hover:underline decoration-1 underline-offset-2">{data.headline}</span>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[#1A73E8]">➝</span>
              </h2>
            </div>

            {/* Meta Information - Time */}
            <div className="flex items-center gap-2 text-xs text-[#5F6368] mt-2">
              <span>{formatTimeAgo(data.updatedAt)}</span>
            </div>
          </div>

          {/* Image - Right side */}
          <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden relative bg-[#F1F3F4]">
            <Image 
              src={imageUrl} 
              alt={data.headline}
              fill
              className="object-cover group-hover:brightness-[1.02] transition-all duration-200"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80';
              }}
            />
          </div>
        </div>
      </article>
    </Link>
  );
}

