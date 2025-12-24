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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
      {/* Back Button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-[#64748B] hover:text-[#111827] mb-6 md:mb-8 transition-colors duration-200 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
        <span className="text-sm font-medium">Back to feed</span>
      </Link>

      {/* Language Switcher */}
      {onLanguageChange && (summarySi || summaryTa) && (
        <div className="mb-6 md:mb-8 flex items-center gap-3">
          <span className="text-sm text-[#64748B]">Language:</span>
          <div className="flex items-center gap-0.5 bg-[#F1F5F9] rounded-lg p-0.5">
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
                      ? 'bg-white text-[#2563EB] shadow-sm'
                      : 'text-[#64748B] hover:text-[#111827] hover:bg-white/50'
                  }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Headline */}
      <h1 className="text-3xl md:text-4xl lg:text-[42px] font-bold text-[#1E293B] mb-4 md:mb-6 leading-tight tracking-tight">
        {headline}
      </h1>

      {/* Meta Information */}
      <div className="flex flex-wrap items-center gap-4 md:gap-6 mb-6 md:mb-8 text-sm text-[#64748B] pb-6 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            {isUpdated ? `Updated ${formatTimeAgo(updatedAt)}` : `Published ${formatTimeAgo(firstSeen)}`}
          </span>
        </div>
        {isUpdated && (
          <span className="px-2.5 py-1 bg-[#EFF6FF] text-[#2563EB] rounded-md font-medium text-xs">
            Updated
          </span>
        )}
        <span className="font-medium">
          {sourceCount} {sourceCount === 1 ? 'source' : 'sources'}
        </span>
      </div>

      {/* Summary */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-6 md:p-8 mb-8 md:mb-10">
        <p className="text-base md:text-lg text-[#1E293B] leading-relaxed whitespace-pre-line font-normal">
          {getSummary()}
        </p>
      </div>

      {/* Sources Section */}
      <div className="border-t border-[#E2E8F0] pt-8 md:pt-10">
        <h2 className="text-xl md:text-2xl font-bold text-[#1E293B] mb-3 md:mb-4 tracking-tight">Sources</h2>
        <p className="text-sm md:text-base text-[#64748B] mb-4 md:mb-6">
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
                p-4 md:p-5 bg-white border border-[#E2E8F0] rounded-lg
                hover:border-[#CBD5E1] hover:shadow-sm transition-all duration-200
                group
              "
            >
              <div className="flex items-center gap-3 md:gap-4">
                <span className="text-sm font-medium text-[#64748B] flex-shrink-0">
                  {index + 1}
                </span>
                <span className="text-base md:text-lg font-semibold text-[#1E293B] transition-colors duration-200">
                  {source.name}
                </span>
              </div>
              <ExternalLink className="w-4 h-4 md:w-5 md:h-5 text-[#64748B] transition-colors duration-200 flex-shrink-0" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IncidentDetail;

