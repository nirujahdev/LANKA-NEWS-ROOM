'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import NavigationWrapper from '@/components/NavigationWrapper';
import SearchBar from '@/components/SearchBar';
import FilterMenu from '@/components/FilterMenu';
import Sidebar from '@/components/Sidebar';
import MixedLayoutGrid from '@/components/MixedLayoutGrid';
import { loadClusters, ClusterListItem } from '@/lib/api';
import { assignLayout, LayoutAssignment } from '@/lib/layoutAssigner';
import { NewsCardData } from '@/lib/newsCardUtils';

export default function SearchResultsContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const lang = (searchParams.get('lang') as 'en' | 'si' | 'ta') || 'en';
  const topicFilter = searchParams.get('topic');
  const dateFilter = searchParams.get('date'); // From FilterMenu: 'all', 'today', 'week', 'month'
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  const districtFilter = searchParams.get('district');
  const eventTypeFilter = searchParams.get('eventType');
  const sortFilter = searchParams.get('sort'); // From FilterMenu: 'newest', 'oldest', 'sources'

  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'si' | 'ta'>(lang);
  const [results, setResults] = useState<ClusterListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setCurrentLanguage(lang);
  }, [lang]);

  useEffect(() => {
    if (!query && !topicFilter && !dateFilter && !dateFrom && !dateTo && !districtFilter && !eventTypeFilter) {
      setResults([]);
      setLoading(false);
      return;
    }

    async function fetchResults() {
      setLoading(true);
      setError(false);
      try {
        const params = new URLSearchParams();
        if (query) params.append('q', query);
        params.append('lang', currentLanguage);
        if (topicFilter) params.append('topic', topicFilter);
        
        // Convert FilterMenu date filter to dateFrom/dateTo
        if (dateFilter && dateFilter !== 'all') {
          const now = new Date();
          let fromDate: Date;
          switch (dateFilter) {
            case 'today':
              fromDate = new Date(now.setHours(0, 0, 0, 0));
              break;
            case 'week':
              fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              break;
            case 'month':
              fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
              break;
            default:
              fromDate = new Date(0);
          }
          params.append('dateFrom', fromDate.toISOString());
        } else if (dateFrom) {
          params.append('dateFrom', dateFrom);
        }
        
        if (dateTo) params.append('dateTo', dateTo);
        if (districtFilter) params.append('district', districtFilter);
        if (eventTypeFilter) params.append('eventType', eventTypeFilter);
        if (sortFilter) params.append('sort', sortFilter);

        const response = await fetch(`/api/search?${params.toString()}`);
        const data = await response.json();
        setResults(data.results || []);
      } catch (err) {
        console.error('Search error:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [query, currentLanguage, topicFilter, dateFilter, dateFrom, dateTo, districtFilter, eventTypeFilter, sortFilter]);

  const getLabel = (en: string, si?: string, ta?: string) => {
    if (currentLanguage === 'si' && si) return si;
    if (currentLanguage === 'ta' && ta) return ta;
    return en;
  };

  const formatTime = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return getLabel('Just now', 'මේ දැන්', 'இப்போது');
    } else if (diffHours < 24) {
      return `${diffHours} ${getLabel('hours ago', 'පැයකට පෙර', 'மணி நேரத்திற்கு முன்பு')}`;
    } else if (diffDays === 1) {
      return getLabel('Yesterday', 'ඊයේ', 'நேற்று');
    } else if (diffDays < 7) {
      return `${diffDays} ${getLabel('days ago', 'දිනකට පෙර', 'நாட்களுக்கு முன்பு')}`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <NavigationWrapper
        currentLanguage={currentLanguage}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Search Bar */}
            <div className="mb-4 md:mb-6">
              <SearchBar language={currentLanguage} />
            </div>

            {/* Results Header */}
            {query && (
              <div className="mb-4">
                <h1 className="text-xl md:text-2xl font-semibold text-[#202124] mb-2 break-words">
                  {getLabel('News about', 'පුවත්', 'செய்திகள்')} {query}
                </h1>
                {results.length > 0 && (
                  <p className="text-xs md:text-sm text-[#5F6368]">
                    {results.length} {getLabel('results found', 'ප්‍රතිඵල හමු විය', 'முடிவுகள் கிடைத்தன')}
                  </p>
                )}
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="bg-white rounded-xl p-8 md:p-12 text-center text-[#5F6368] shadow-sm border border-[#E8EAED]">
                {getLabel('Searching...', 'සොයමින්...', 'தேடுகிறது...')}
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-white rounded-xl p-8 md:p-12 text-center text-[#5F6368] shadow-sm border border-[#E8EAED]">
                <p className="text-sm md:text-base">
                  {getLabel('Error loading results. Please try again.', 'ප්‍රතිඵල පූරණය කිරීමේ දෝෂයකි. නැවත උත්සාහ කරන්න.', 'முடிவுகளை ஏற்றுவதில் பிழை. மீண்டும் முயற்சிக்கவும்.')}
                </p>
              </div>
            )}

            {/* Results */}
            {!loading && !error && results.length > 0 && (() => {
              // Convert results to NewsCardData format
              const newsCards: NewsCardData[] = results.map(result => ({
                id: result.id,
                slug: result.slug,
                headline: result.headline,
                summary: result.summary || null,
                sources: result.sources,
                updatedAt: result.last_updated,
                sourceCount: result.source_count || 0,
                language: currentLanguage,
                imageUrl: result.image_url || null,
                category: result.topic || result.category || null,
                topics: result.topic ? [result.topic] : []
              }));

              // Assign layouts dynamically - first result gets featured if high relevance
              const assignments: LayoutAssignment[] = newsCards.map((card, index) => {
                // First result with high source count gets featured
                if (index === 0 && card.sourceCount >= 3) {
                  return { layout: 'featured' };
                }
                // Next 2-3 get grid
                if (index >= 1 && index <= 3) {
                  return { layout: 'grid', span: 1 };
                }
                // Rest get list
                return assignLayout(index, card.sourceCount, false);
              });

              return (
                <MixedLayoutGrid 
                  articles={newsCards}
                  assignments={assignments}
                />
              );
            })()}

            {/* No Results */}
            {!loading && !error && results.length === 0 && query && (
              <div className="bg-white rounded-xl p-8 md:p-12 text-center shadow-sm border border-[#E8EAED]">
                <p className="text-sm md:text-base text-[#5F6368] mb-4 break-words">
                  {getLabel('No results found for', 'සඳහා ප්‍රතිඵල හමු නොවීය', 'முடிவுகள் இல்லை')} "{query}"
                </p>
                <p className="text-xs md:text-sm text-[#9AA0A6]">
                  {getLabel('Try different keywords or check your filters', 'වෙනස් යතුරු වචන උත්සාහ කරන්න හෝ ඔබේ පෙරහන් පරීක්ෂා කරන්න', 'வேறு முக்கிய வார்த்தைகளை முயற்சிக்கவும் அல்லது உங்கள் வடிகட்டிகளை சரிபார்க்கவும்')}
                </p>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && !query && (
              <div className="bg-white rounded-xl p-8 md:p-12 text-center shadow-sm border border-[#E8EAED]">
                <p className="text-sm md:text-base text-[#5F6368]">
                  {getLabel('Enter a search query to find news', 'පුවත් සොයා ගැනීමට සෙවුම් විමසුමක් ඇතුළත් කරන්න', 'செய்திகளைக் கண்டுபிடிக்க தேடல் வினவலை உள்ளிடவும்')}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block w-80 flex-shrink-0 space-y-6">
            {/* Filter Menu */}
            <FilterMenu
              currentTopic={topicFilter || undefined}
              language={currentLanguage}
            />

            {/* Picks for You */}
            {results.length > 0 && (
              <Sidebar
                latestUpdates={results.slice(0, 5).map(r => ({
                  id: r.id,
                  slug: r.slug,
                  headline: r.headline,
                  sources: r.sources,
                  updatedAt: r.last_updated,
                  sourceCount: r.source_count || 0,
                  summary: r.summary ?? undefined,
                  category: r.category,
                  topic: r.topic
                }))}
                language={currentLanguage}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

