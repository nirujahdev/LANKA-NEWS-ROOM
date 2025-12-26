'use client';

import React from 'react';
import { Clock, ExternalLink, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import FeedbackButtons from './FeedbackButtons';
import SocialShare from './SocialShare';

type Source = {
  name: string;
  feed_url: string;
};

type StoryDetailProps = {
  id: string;
  slug?: string | null;
  headline: string;
  summary: string;
  summarySi?: string | null;
  summaryTa?: string | null;
  sources: Source[];
  updatedAt?: string | null;
  firstSeen?: string | null;
  sourceCount: number;
  currentLanguage?: 'en' | 'si' | 'ta';
  onLanguageChange?: (lang: 'en' | 'si' | 'ta') => void;
  needsReview?: boolean;
  keyFacts?: string[];
  confirmedVsDiffers?: string;
  lastCheckedAt?: string | null;
  imageUrl?: string | null;
};

const StoryDetail: React.FC<StoryDetailProps> = ({
  id,
  slug,
  headline,
  summary,
  summarySi,
  summaryTa,
  sources,
  updatedAt,
  firstSeen,
  sourceCount,
  currentLanguage = 'en',
  onLanguageChange,
  needsReview = false,
  keyFacts,
  confirmedVsDiffers,
  lastCheckedAt,
  imageUrl
}) => {
  const getSummary = () => {
    if (currentLanguage === 'si' && summarySi) return summarySi;
    if (currentLanguage === 'ta' && summaryTa) return summaryTa;
    return summary;
  };

  const formatTimeAgo = (iso?: string | null): string => {
    if (!iso) return 'Just now';
    const date = new Date(iso);
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

  const isUpdated =
    updatedAt && firstSeen ? new Date(updatedAt).getTime() !== new Date(firstSeen).getTime() : false;

  return (
    <div className="py-4 sm:py-6 md:py-8" data-story-content="true">
      {/* Back Button - Mobile optimized */}
      <Link
        href={`/${currentLanguage}`}
        className="inline-flex items-center gap-2 text-[#5F6368] hover:text-[#202124] mb-4 sm:mb-6 transition-colors duration-200 group touch-target"
      >
        <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-0.5 transition-transform duration-200" />
        <span className="text-sm sm:text-base font-medium">Back to feed</span>
      </Link>

      {/* Language Switcher - Mobile responsive */}
      {onLanguageChange && (summarySi || summaryTa) && (
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <span className="text-xs sm:text-sm text-[#5F6368]">Language:</span>
          <div className="flex items-center gap-0.5 bg-[#F1F3F4] rounded-lg p-0.5 w-fit">
            {[
              { code: 'en' as const, label: 'EN' },
              { code: 'si' as const, label: 'සිං' },
              { code: 'ta' as const, label: 'தமிழ்' }
            ].map((lang) => (
              <button
                key={lang.code}
                onClick={() => onLanguageChange(lang.code)}
                className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 touch-target
                  ${
                    currentLanguage === lang.code
                      ? 'bg-white text-[#1A73E8] shadow-sm'
                      : 'text-[#5F6368] hover:text-[#202124] hover:bg-white/50 active:bg-white/70'
                  }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Headline - Mobile-first responsive sizing */}
      <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-normal text-[#202124] mb-3 sm:mb-4 leading-[1.2] sm:leading-[1.3] tracking-tight">
        {headline}
      </h1>

      {/* Featured Image - Moved to top of summary area */}
      {imageUrl && (
        <div className="mb-6 sm:mb-8">
          <div className="relative w-full aspect-video rounded-lg sm:rounded-xl overflow-hidden bg-[#F1F3F4]">
            <Image
              src={imageUrl}
              alt={headline}
              fill
              className="object-cover"
              priority
              unoptimized
              onError={(e) => {
                console.error('Image failed to load:', imageUrl);
                const target = e.target as HTMLImageElement;
                const parent = target.closest('div');
                if (parent) {
                  parent.style.display = 'none';
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Key Facts Section */}
      {keyFacts && keyFacts.length > 0 && (
        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-[#202124] mb-3 sm:mb-4">Key Facts</h2>
          <ul className="list-disc list-inside space-y-2 sm:space-y-3">
            {keyFacts.map((fact, i) => (
              <li key={i} className="text-sm sm:text-base text-[#202124] leading-relaxed">
                {fact}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Meta Information - Mobile optimized layout */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 mb-6 sm:mb-8 text-xs sm:text-sm text-[#5F6368] pb-3 sm:pb-4 border-b border-[#E8EAED]">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
          <span className="whitespace-nowrap">
            {isUpdated ? `Updated ${formatTimeAgo(updatedAt)}` : `${formatTimeAgo(firstSeen)}`}
          </span>
        </div>
        {isUpdated && (
          <span className="px-2 py-0.5 bg-[#E8F0FE] text-[#1A73E8] rounded text-xs font-medium whitespace-nowrap">
            Updated
          </span>
        )}
        <span className="whitespace-nowrap">
          {sourceCount} {sourceCount === 1 ? 'source' : 'sources'}
        </span>
        {lastCheckedAt && (
          <span className="text-xs text-[#9AA0A6] whitespace-nowrap">
            • Last checked: {formatTimeAgo(lastCheckedAt)}
          </span>
        )}
      </div>

      {/* Summary - Mobile-optimized typography */}
      <div className="mb-8 sm:mb-10 pb-20 sm:pb-24 md:pb-28">
        <div className="prose prose-sm sm:prose-base md:prose-lg max-w-none">
          <p className="text-sm sm:text-base md:text-lg text-[#202124] leading-[1.6] sm:leading-[1.7] md:leading-[1.75] font-normal">
            {getSummary()}
          </p>
          {needsReview && (
            <p className="mt-2 text-xs sm:text-sm text-[#D93025]">
              Quality check flagged this summary. Please verify numbers and entities.
            </p>
          )}
        </div>
      </div>

      {/* Confirmed vs Differs Section */}
      {confirmedVsDiffers && (
        <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-[#F8F9FA] rounded-lg border border-[#E8EAED]">
          <h2 className="text-lg sm:text-xl font-semibold text-[#202124] mb-2 sm:mb-3">
            What's Confirmed vs What Differs
          </h2>
          <p className="text-sm sm:text-base text-[#5F6368] leading-relaxed whitespace-pre-line">
            {confirmedVsDiffers}
          </p>
        </div>
      )}

      {/* Sources Section - Mobile-friendly cards */}
      <div className="border-t border-[#E8EAED] pt-6 sm:pt-8">
        <h2 className="text-lg sm:text-xl font-normal text-[#202124] mb-3 sm:mb-4">Sources</h2>
        <p className="text-xs sm:text-sm text-[#5F6368] mb-4 sm:mb-6">
          This summary is based on information from the following sources:
        </p>
        <div className="space-y-2 sm:space-y-3">
          {sources.map((source, index) => (
            <a
              key={`${source.name}-${index}`}
              href={source.feed_url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="
                flex items-center justify-between
                p-3 sm:p-4 bg-white border border-[#E8EAED] rounded-lg
                hover:shadow-sm active:shadow-md transition-shadow duration-200
                group touch-target
              "
            >
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                <span className="text-xs sm:text-sm font-medium text-[#5F6368] w-5 sm:w-6 flex-shrink-0">
                  {index + 1}.
                </span>
                <span className="text-sm sm:text-base font-normal text-[#1A73E8] group-hover:underline truncate">
                  {source.name}
                </span>
              </div>
              <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 text-[#9AA0A6] flex-shrink-0 ml-2" />
            </a>
          ))}
        </div>
      </div>

      {/* Social Share Section */}
      <div className="border-t border-[#E8EAED] pt-6 sm:pt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-normal text-[#202124]">Share this article</h2>
          <SocialShare
            url={`/${currentLanguage}/${slug || id}`}
            title={headline}
            description={getSummary()}
            imageUrl={imageUrl || undefined}
            language={currentLanguage}
          />
        </div>
      </div>

      {/* Feedback Buttons */}
      <FeedbackButtons
        clusterId={id}
        slug={slug || id}
        headline={headline}
        language={currentLanguage}
      />
    </div>
  );
};

export default StoryDetail;

