'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Filter, Calendar, MapPin, Tag, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { normalizeTopicSlug } from '@/lib/topics';

interface SearchResult {
  id: string;
  slug: string;
  headline: string;
  summary: string;
  sourceCount: number;
  publishedAt: string;
  topic?: string;
  city?: string;
  eventType?: string;
  imageUrl?: string;
  sources?: Array<{ name: string; feed_url: string }>;
}

interface FilterOptions {
  topics: string[];
  cities: string[];
  eventTypes: string[];
  dateMin: string;
  dateMax: string;
}

interface SearchBarProps {
  language?: 'en' | 'si' | 'ta';
}

export default function SearchBar({ language = 'en' }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  // Filter state
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedEventType, setSelectedEventType] = useState<string>('');
  
  // Available filter options
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    topics: [],
    cities: [],
    eventTypes: [],
    dateMin: '',
    dateMax: ''
  });
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Load filter options on mount
  useEffect(() => {
    fetch('/api/search/filters')
      .then(res => res.json())
      .then(data => {
        setFilterOptions({
          topics: data.topics || ['politics', 'economy', 'education', 'health', 'sports', 'technology', 'society', 'sri-lanka', 'world'],
          cities: data.cities || ['colombo', 'kandy', 'galle', 'jaffna', 'trincomalee', 'batticaloa', 'matara', 'negombo', 'anuradhapura'],
          eventTypes: data.eventTypes || ['election', 'court', 'accident', 'protest', 'announcement', 'budget', 'policy', 'crime', 'disaster', 'sports_event', 'other'],
          dateMin: data.dateMin || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          dateMax: data.dateMax || new Date().toISOString().split('T')[0]
        });
      })
      .catch(err => console.error('Failed to load filter options:', err));
  }, []);
  
  // Perform search with filters
  useEffect(() => {
    const hasQuery = query.length >= 2;
    const hasFilters = selectedTopics.length > 0 || dateFrom || dateTo || selectedCity || selectedEventType;
    
    if (!hasQuery && !hasFilters) {
      setResults([]);
      setShowResults(false);
      return;
    }
    
    const debounce = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (query) params.append('q', query);
        params.append('lang', language);
        if (selectedTopics.length > 0) params.append('topic', selectedTopics.join(','));
        if (dateFrom) params.append('dateFrom', dateFrom);
        if (dateTo) params.append('dateTo', dateTo);
        if (selectedCity) params.append('city', selectedCity);
        if (selectedEventType) params.append('eventType', selectedEventType);
        
        const response = await fetch(`/api/search?${params.toString()}`);
        const data = await response.json();
        setResults(data.results || []);
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);
    
    return () => clearTimeout(debounce);
  }, [query, language, selectedTopics, dateFrom, dateTo, selectedCity, selectedEventType]);
  
  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev => 
      prev.includes(topic) 
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };
  
  const clearAllFilters = () => {
    setSelectedTopics([]);
    setDateFrom('');
    setDateTo('');
    setSelectedCity('');
    setSelectedEventType('');
  };
  
  const hasActiveFilters = selectedTopics.length > 0 || dateFrom || dateTo || selectedCity || selectedEventType;
  
  const getLabel = (en: string, si?: string, ta?: string) => {
    if (language === 'si' && si) return si;
    if (language === 'ta' && ta) return ta;
    return en;
  };

  const formatTime = (dateString: string) => {
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
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#5F6368]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={getLabel('Search news...', 'පුවත් සොයන්න...', 'செய்திகளைத் தேடுங்கள்...')}
          className="w-full pl-10 pr-20 py-2 border border-[#E8EAED] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="p-1 text-[#5F6368] hover:text-[#202124]"
              title={getLabel('Clear filters', 'පෙරහන් ඉවත් කරන්න', 'வடிகட்டிகளை அழிக்கவும்')}
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1 rounded ${hasActiveFilters ? 'text-[#1A73E8]' : 'text-[#5F6368]'} hover:text-[#202124]`}
            title={getLabel('Filters', 'පෙරහන්', 'வடிகட்டிகள்')}
          >
            <Filter className="w-4 h-4" />
          </button>
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setResults([]);
                setShowResults(false);
              }}
              className="p-1 text-[#5F6368] hover:text-[#202124]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      {/* Filter Panel */}
      {showFilters && (
        <div className="absolute top-full mt-2 w-full bg-white border border-[#E8EAED] rounded-lg shadow-lg z-50 p-4">
          {/* Topics */}
          <div className="mb-4">
            <label className="text-sm font-medium text-[#202124] mb-2 block">
              {getLabel('Topics', 'මාතෘකා', 'தலைப்புகள்')}
            </label>
            <div className="flex flex-wrap gap-2">
              {filterOptions.topics.map(topic => (
                <button
                  key={topic}
                  onClick={() => toggleTopic(topic)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedTopics.includes(topic)
                      ? 'bg-[#1A73E8] text-white'
                      : 'bg-[#F1F3F4] text-[#5F6368] hover:bg-[#E8EAED]'
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
          
          {/* Date Range */}
          <div className="mb-4">
            <label className="text-sm font-medium text-[#202124] mb-2 block">
              {getLabel('Date Range', 'දින පරාසය', 'தேதி வரம்பு')}
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                max={dateTo || filterOptions.dateMax}
                min={filterOptions.dateMin}
                className="flex-1 px-3 py-2 border border-[#E8EAED] rounded-lg text-sm"
                placeholder={getLabel('From', 'සිට', 'இருந்து')}
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                max={filterOptions.dateMax}
                min={dateFrom || filterOptions.dateMin}
                className="flex-1 px-3 py-2 border border-[#E8EAED] rounded-lg text-sm"
                placeholder={getLabel('To', 'දක්වා', 'வரை')}
              />
            </div>
          </div>
          
          {/* City */}
          <div className="mb-4">
            <label className="text-sm font-medium text-[#202124] mb-2 block">
              {getLabel('City', 'නගරය', 'நகரம்')}
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-3 py-2 border border-[#E8EAED] rounded-lg text-sm"
            >
              <option value="">{getLabel('All cities', 'සියලුම නගර', 'அனைத்து நகரங்களும்')}</option>
              {filterOptions.cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          
          {/* Event Type */}
          <div className="mb-2">
            <label className="text-sm font-medium text-[#202124] mb-2 block">
              {getLabel('Event Type', 'සිදුවීම් වර්ගය', 'நிகழ்வு வகை')}
            </label>
            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="w-full px-3 py-2 border border-[#E8EAED] rounded-lg text-sm"
            >
              <option value="">{getLabel('All types', 'සියලුම වර්ග', 'அனைத்து வகைகளும்')}</option>
              {filterOptions.eventTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      )}
      
      {/* Filter Chips */}
      {hasActiveFilters && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedTopics.map(topic => (
            <button
              key={topic}
              onClick={() => toggleTopic(topic)}
              className="flex items-center gap-1 px-2 py-1 bg-[#E8F0FE] text-[#1A73E8] rounded-full text-xs"
            >
              <Tag className="w-3 h-3" />
              {topic}
              <X className="w-3 h-3" />
            </button>
          ))}
          {dateFrom && (
            <button
              onClick={() => setDateFrom('')}
              className="flex items-center gap-1 px-2 py-1 bg-[#E8F0FE] text-[#1A73E8] rounded-full text-xs"
            >
              <Calendar className="w-3 h-3" />
              {getLabel('From', 'සිට', 'இருந்து')} {dateFrom}
              <X className="w-3 h-3" />
            </button>
          )}
          {dateTo && (
            <button
              onClick={() => setDateTo('')}
              className="flex items-center gap-1 px-2 py-1 bg-[#E8F0FE] text-[#1A73E8] rounded-full text-xs"
            >
              <Calendar className="w-3 h-3" />
              {getLabel('To', 'දක්වා', 'வரை')} {dateTo}
              <X className="w-3 h-3" />
            </button>
          )}
          {selectedCity && (
            <button
              onClick={() => setSelectedCity('')}
              className="flex items-center gap-1 px-2 py-1 bg-[#E8F0FE] text-[#1A73E8] rounded-full text-xs"
            >
              <MapPin className="w-3 h-3" />
              {selectedCity}
              <X className="w-3 h-3" />
            </button>
          )}
          {selectedEventType && (
            <button
              onClick={() => setSelectedEventType('')}
              className="flex items-center gap-1 px-2 py-1 bg-[#E8F0FE] text-[#1A73E8] rounded-full text-xs"
            >
              <Tag className="w-3 h-3" />
              {selectedEventType}
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
      
      {/* Search Results */}
      {showResults && (
        <div className="absolute top-full mt-2 w-full bg-white border border-[#E8EAED] rounded-lg shadow-lg z-50 max-h-[600px] overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-[#5F6368]">{getLabel('Searching...', 'සොයමින්...', 'தேடுகிறது...')}</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-[#5F6368]">{getLabel('No results found', 'ප්‍රතිඵල හමු නොවීය', 'முடிவுகள் இல்லை')}</div>
          ) : (
            <div>
              {/* Group Header */}
              <div className="px-4 py-3 border-b border-[#E8EAED] bg-[#F8F9FA]">
                <h3 className="text-sm font-medium text-[#202124]">
                  {getLabel('News about', 'පුවත්', 'செய்திகள்')} {query}
                </h3>
              </div>
              
              {/* Results List */}
              <div className="py-2">
                {results.map((result, index) => (
                  <React.Fragment key={result.id}>
                    {index > 0 && <hr className="border-t border-[#E8EAED] mx-4" />}
                    <Link
                      href={result.topic 
                        ? `/${language}/${normalizeTopicSlug(result.topic) || 'other'}/${result.slug}`
                        : `/${language}/other/${result.slug}`
                      }
                      className="block px-4 py-3 hover:bg-[#F8F9FA] transition-colors group"
                      onClick={() => setShowResults(false)}
                    >
                      <div className="flex gap-3">
                        {/* Thumbnail */}
                        {result.imageUrl && (
                          <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-[#F1F3F4]">
                            <img
                              src={result.imageUrl}
                              alt={result.headline}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {/* Source */}
                          {result.sources && result.sources.length > 0 && (
                            <div className="text-xs text-[#5F6368] mb-1">
                              {result.sources[0].name}
                            </div>
                          )}
                          
                          {/* Headline */}
                          <h3 className="font-medium text-[#202124] mb-1 line-clamp-2 group-hover:text-[#1A73E8] transition-colors">
                            {result.headline}
                          </h3>
                          
                          {/* Meta Info */}
                          <div className="flex items-center gap-2 text-xs text-[#9AA0A6] mt-1">
                            <span>{formatTime(result.publishedAt)}</span>
                            {result.sourceCount > 1 && (
                              <>
                                <span>•</span>
                                <span>{result.sourceCount} {getLabel('sources', 'මූලාශ්‍ර', 'ஆதாரங்கள்')}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </React.Fragment>
                ))}
              </div>
              
              {/* View All Link */}
              {results.length > 0 && (
                <div className="px-4 py-3 border-t border-[#E8EAED]">
                  <Link
                    href={`/search?q=${encodeURIComponent(query)}`}
                    className="text-sm font-medium text-[#1A73E8] hover:underline"
                    onClick={() => setShowResults(false)}
                  >
                    {getLabel('View all results', 'සියලුම ප්‍රතිඵල', 'அனைத்து முடிவுகளும்')} →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
