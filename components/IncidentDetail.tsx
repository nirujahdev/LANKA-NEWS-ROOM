'use client';

import React from 'react';
import { Clock, ExternalLink, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Source {
  id: string;
  name: string;
  url: string;
}

interface IncidentDetailProps {
  id: string;
  headline: string;
  summary: string;
  summarySi?: string;
  summaryTa?: string;
  sources: Source[];
  updatedAt: Date;
  firstSeen: Date;
  sourceCount: number;
  currentLanguage?: 'en' | 'si' | 'ta';
  onLanguageChange?: (lang: 'en' | 'si' | 'ta') => void;
}

const IncidentDetail: React.FC<IncidentDetailProps> = ({
  headline,
  summary,
  summarySi,
  summaryTa,
  sources,
  updatedAt,
  firstSeen,
  sourceCount,
  currentLanguage = 'en',
  onLanguageChange
}) => {
  const getSummary = () => {
    if (currentLanguage === 'si' && summarySi) return summarySi;
    if (currentLanguage === 'ta' && summaryTa) return summaryTa;
    return summary;
  };

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

  const isUpdated = updatedAt.getTime() !== firstSeen.getTime();

  return (
    <div className="py-6 md:py-8">
      {/* Back Button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-[#5F6368] hover:text-[#202124] mb-6 transition-colors duration-200 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
        <span className="text-sm font-medium">Back to feed</span>
      </Link>

      {/* Language Switcher */}
      {onLanguageChange && (summarySi || summaryTa) && (
        <div className="mb-6 flex items-center gap-3">
          <span className="text-sm text-[#5F6368]">Language:</span>
          <div className="flex items-center gap-0.5 bg-[#F1F3F4] rounded-lg p-0.5">
            {[
              { code: 'en' as const, label: 'EN' },
              { code: 'si' as const, label: 'සිං' },
              { code: 'ta' as const, label: 'தமிழ்' }
            ].map((lang) => (
              <button
                key={lang.code}
                onClick={() => onLanguageChange(lang.code)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200
                  ${
                    currentLanguage === lang.code
                      ? 'bg-white text-[#1A73E8] shadow-sm'
                      : 'text-[#5F6368] hover:text-[#202124] hover:bg-white/50'
                  }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Headline - Large, readable, Google News style */}
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-normal text-[#202124] mb-4 leading-[1.3] tracking-tight">
        {headline}
      </h1>

      {/* Meta Information - Clean, minimal */}
      <div className="flex flex-wrap items-center gap-4 mb-8 text-sm text-[#5F6368] pb-4 border-b border-[#E8EAED]">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 flex-shrink-0" />
          <span>
            {isUpdated ? `Updated ${formatTimeAgo(updatedAt)}` : `${formatTimeAgo(firstSeen)}`}
          </span>
        </div>
        {isUpdated && (
          <span className="px-2 py-0.5 bg-[#E8F0FE] text-[#1A73E8] rounded text-xs font-medium">
            Updated
          </span>
        )}
        <span>
          {sourceCount} {sourceCount === 1 ? 'source' : 'sources'}
        </span>
      </div>

      {/* Summary - Easy to read, optimal line length */}
      <div className="mb-10">
        <div className="prose prose-lg max-w-none">
          <p className="text-base md:text-lg text-[#202124] leading-[1.75] font-normal">
            {getSummary()}
          </p>
        </div>
      </div>

      {/* Sources Section - Clean, organized */}
      <div className="border-t border-[#E8EAED] pt-8">
        <h2 className="text-xl font-normal text-[#202124] mb-4">Sources</h2>
        <p className="text-sm text-[#5F6368] mb-6">
          This summary is based on information from the following sources:
        </p>
        <div className="space-y-3">
          {sources.map((source, index) => (
            <a
              key={source.id}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="
                flex items-center justify-between
                p-4 bg-white border border-[#E8EAED] rounded-lg
                hover:shadow-sm transition-shadow duration-200
                group
              "
            >
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-[#5F6368] w-6">
                  {index + 1}.
                </span>
                <span className="text-base font-normal text-[#1A73E8] group-hover:underline">
                  {source.name}
                </span>
              </div>
              <ExternalLink className="w-4 h-4 text-[#9AA0A6] flex-shrink-0" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IncidentDetail;

