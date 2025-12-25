'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import NavigationWrapper from '@/components/NavigationWrapper';
import SearchBar from '@/components/SearchBar';
import TopicCard from '@/components/TopicCard';
import RelatedTopics from '@/components/RelatedTopics';
import Sidebar from '@/components/Sidebar';
import IncidentCard from '@/components/IncidentCard';
import { loadClusters, ClusterListItem } from '@/lib/api';

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const lang = (searchParams.get('lang') as 'en' | 'si' | 'ta') || 'en';
  const topicFilter = searchParams.get('topic');
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');
  const cityFilter = searchParams.get('city');
  const eventTypeFilter = searchParams.get('eventType');

  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'si' | 'ta'>(lang);
  const [results, setResults] = useState<ClusterListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setCurrentLanguage(lang);
  }, [lang]);

  useEffect(() => {
    if (!query && !topicFilter && !dateFrom && !dateTo && !cityFilter && !eventTypeFilter) {
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
        if (dateFrom) params.append('dateFrom', dateFrom);
        if (dateTo) params.append('dateTo', dateTo);
        if (cityFilter) params.append('city', cityFilter);
        if (eventTypeFilter) params.append('eventType', eventTypeFilter);

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
  }, [query, currentLanguage, topicFilter, dateFrom, dateTo, cityFilter, eventTypeFilter]);

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

  // Check if query is a topic
  const isTopic = results.length > 0 && results[0]?.topic === query.toLowerCase();
  const topicSlug = isTopic ? query.toLowerCase() : '';

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <NavigationWrapper
        currentLanguage={currentLanguage}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Search Bar */}
            <div className="mb-6">
              <SearchBar language={currentLanguage} />
            </div>

            {/* Results Header */}
            {query && (
              <div className="mb-4">
                <h1 className="text-2xl font-semibold text-[#202124] mb-2">
                  {getLabel('News about', 'පුවත්', 'செய்திகள்')} {query}
                </h1>
                {results.length > 0 && (
                  <p className="text-sm text-[#5F6368]">
                    {results.length} {getLabel('results found', 'ප්‍රතිඵල හමු විය', 'முடிவுகள் கிடைத்தன')}
                  </p>
                )}
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="bg-white rounded-xl p-12 text-center text-[#5F6368] shadow-sm border border-[#E8EAED]">
                {getLabel('Searching...', 'සොයමින්...', 'தேடுகிறது...')}
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-white rounded-xl p-12 text-center text-[#5F6368] shadow-sm border border-[#E8EAED]">
                {getLabel('Error loading results. Please try again.', 'ප්‍රතිඵල පූරණය කිරීමේ දෝෂයකි. නැවත උත්සාහ කරන්න.', 'முடிவுகளை ஏற்றுவதில் பிழை. மீண்டும் முயற்சிக்கவும்.')}
              </div>
            )}

            {/* Results */}
            {!loading && !error && results.length > 0 && (
              <div className="space-y-4">
                {results.map((result) => (
                  <div key={result.id} className="bg-white rounded-xl shadow-sm border border-[#E8EAED] overflow-hidden">
                    <IncidentCard
                      id={result.id}
                      slug={result.slug}
                      headline={result.headline}
                      summary={result.summary || ''}
                      sources={result.sources}
                      updatedAt={result.last_updated}
                      sourceCount={result.source_count || 0}
                      language={currentLanguage}
                      category={result.topic || result.category}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* No Results */}
            {!loading && !error && results.length === 0 && query && (
              <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-[#E8EAED]">
                <p className="text-[#5F6368] mb-4">
                  {getLabel('No results found for', 'සඳහා ප්‍රතිඵල හමු නොවීය', 'முடிவுகள் இல்லை')} "{query}"
                </p>
                <p className="text-sm text-[#9AA0A6]">
                  {getLabel('Try different keywords or check your filters', 'වෙනස් යතුරු වචන උත්සාහ කරන්න හෝ ඔබේ පෙරහන් පරීක්ෂා කරන්න', 'வேறு முக்கிய வார்த்தைகளை முயற்சிக்கவும் அல்லது உங்கள் வடிகட்டிகளை சரிபார்க்கவும்')}
                </p>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && !query && (
              <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-[#E8EAED]">
                <p className="text-[#5F6368]">
                  {getLabel('Enter a search query to find news', 'පුවත් සොයා ගැනීමට සෙවුම් විමසුමක් ඇතුළත් කරන්න', 'செய்திகளைக் கண்டுபிடிக்க தேடல் வினவலை உள்ளிடவும்')}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block w-80 flex-shrink-0 space-y-6">
            {/* Topic Card (if query is a topic) */}
            {isTopic && topicSlug && (
              <TopicCard
                topic={query}
                topicSlug={topicSlug}
                language={currentLanguage}
              />
            )}

            {/* Related Topics */}
            <RelatedTopics
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

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="text-[#5F6368]">Loading...</div>
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  );
}

