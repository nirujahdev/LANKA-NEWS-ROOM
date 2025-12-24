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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-[#64748B] hover:text-[#0F172A] mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-medium">Back to feed</span>
      </Link>

      {/* Language Switcher */}
      {onLanguageChange && (summarySi || summaryTa) && (
        <div className="mb-6 flex items-center gap-2">
          <span className="text-sm text-[#64748B]">Language:</span>
          <div className="flex items-center gap-1 bg-[#F1F5F9] rounded-lg p-1">
            {[
              { code: 'en' as const, label: 'EN' },
              { code: 'si' as const, label: 'සිං' },
              { code: 'ta' as const, label: 'தமிழ்' }
            ].map((lang) => (
              <button
                key={lang.code}
                onClick={() => onLanguageChange(lang.code)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all
                  ${
                    currentLanguage === lang.code
                      ? 'bg-white text-[#2563EB] shadow-sm'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Headline */}
      <h1 className="text-3xl sm:text-4xl font-bold text-[#0F172A] mb-4 leading-tight">
        {headline}
      </h1>

      {/* Meta Information */}
      <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-[#64748B]">
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" />
          <span>
            {isUpdated ? `Updated ${formatTimeAgo(updatedAt)}` : `Published ${formatTimeAgo(firstSeen)}`}
          </span>
        </div>
        {isUpdated && (
          <span className="px-2 py-1 bg-[#EFF6FF] text-[#2563EB] rounded-md font-medium">
            Updated
          </span>
        )}
        <span>
          {sourceCount} {sourceCount === 1 ? 'source' : 'sources'}
        </span>
      </div>

      {/* Summary */}
      <div className="bg-[#F1F5F9] border border-[#E5E7EB] rounded-xl p-6 mb-8">
        <p className="text-lg text-[#0F172A] leading-relaxed whitespace-pre-line">
          {getSummary()}
        </p>
      </div>

      {/* Sources Section */}
      <div className="border-t border-[#E5E7EB] pt-8">
        <h2 className="text-xl font-bold text-[#0F172A] mb-4">Sources</h2>
        <p className="text-sm text-[#64748B] mb-4">
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
                p-4 bg-[#F1F5F9] border border-[#E5E7EB] rounded-lg
                hover:bg-[#E2E8F0] hover:border-[#3B82F6] transition-all
                group
              "
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-[#64748B]">
                  {index + 1}
                </span>
                <span className="text-base font-medium text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                  {source.name}
                </span>
              </div>
              <ExternalLink className="w-5 h-5 text-[#64748B] group-hover:text-[#2563EB] transition-colors" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IncidentDetail;

