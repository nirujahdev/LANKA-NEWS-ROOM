'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Calendar, MapPin, ArrowUpDown, X } from 'lucide-react';

interface FilterMenuProps {
  language?: 'en' | 'si' | 'ta';
  currentTopic?: string;
}

type DateFilter = 'all' | 'today' | 'week' | 'month';
type SortOption = 'newest' | 'oldest' | 'sources';

interface FilterState {
  date: DateFilter;
  district: string | null;
  sort: SortOption;
}

// All 25 districts of Sri Lanka
const SRI_LANKA_DISTRICTS = [
  'colombo',
  'kandy',
  'galle',
  'jaffna',
  'anuradhapura',
  'kurunegala',
  'batticaloa',
  'badulla',
  'hambantota',
  'gampaha',
  'kalutara',
  'matale',
  'nuwara-eliya',
  'matara',
  'kilinochchi',
  'mannar',
  'vavuniya',
  'mullaitivu',
  'ampara',
  'trincomalee',
  'puttalam',
  'polonnaruwa',
  'moneragala',
  'ratnapura',
  'kegalle'
];

export default function FilterMenu({
  language = 'en',
  currentTopic
}: FilterMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [filters, setFilters] = useState<FilterState>({
    date: (searchParams.get('date') as DateFilter) || 'all',
    district: searchParams.get('district') || null,
    sort: (searchParams.get('sort') as SortOption) || 'newest'
  });

  const getLabel = useCallback((en: string, si?: string, ta?: string) => {
    if (language === 'si' && si) return si;
    if (language === 'ta' && ta) return ta;
    return en;
  }, [language]);

  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    
    // Update URL with new filters, preserving existing query parameters
    const params = new URLSearchParams(searchParams.toString());
    
    // Update filter params
    if (updated.date !== 'all') {
      params.set('date', updated.date);
    } else {
      params.delete('date');
    }
    
    if (updated.district) {
      params.set('district', updated.district);
    } else {
      params.delete('district');
    }
    
    if (updated.sort !== 'newest') {
      params.set('sort', updated.sort);
    } else {
      params.delete('sort');
    }
    
    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.push(newUrl, { scroll: false });
  }, [filters, pathname, router, searchParams]);

  const clearFilters = useCallback(() => {
    setFilters({ date: 'all', district: null, sort: 'newest' });
    
    // Preserve existing query parameters (like q, lang) when clearing filters
    const params = new URLSearchParams(searchParams.toString());
    params.delete('date');
    params.delete('district');
    params.delete('sort');
    
    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.push(newUrl, { scroll: false });
  }, [pathname, router, searchParams]);

  const hasActiveFilters = filters.date !== 'all' || filters.district !== null || filters.sort !== 'newest';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E8EAED] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#E8EAED]">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#202124]">
            {getLabel('Filters', 'පෙරහන', 'வடிகட்டிகள்')}
          </h3>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-[#1A73E8] hover:text-[#1557B0] flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              {getLabel('Clear', 'මකන්න', 'அழிக்க')}
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Date Filter */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-[#5F6368] mb-2">
            <Calendar className="w-4 h-4" />
            {getLabel('Date', 'දිනය', 'தேதி')}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {([
              { value: 'all', label: getLabel('All Time', 'සියලු කාලය', 'அனைத்து நேரம்') },
              { value: 'today', label: getLabel('Today', 'අද', 'இன்று') },
              { value: 'week', label: getLabel('This Week', 'මෙම සතිය', 'இந்த வாரம்') },
              { value: 'month', label: getLabel('This Month', 'මෙම මාසය', 'இந்த மாதம்') }
            ] as const).map((option) => (
              <button
                key={option.value}
                onClick={() => updateFilters({ date: option.value as DateFilter })}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filters.date === option.value
                    ? 'bg-[#1A73E8] text-white'
                    : 'bg-[#F1F3F4] text-[#5F6368] hover:bg-[#E8EAED] hover:text-[#202124]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* District Filter */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-[#5F6368] mb-2">
            <MapPin className="w-4 h-4" />
            {getLabel('District', 'දිස්ත්‍රික්කය', 'மாவட்டம்')}
          </label>
          <select
            value={filters.district || ''}
            onChange={(e) => updateFilters({ district: e.target.value || null })}
            className="w-full px-3 py-2 rounded-lg border border-[#E8EAED] bg-white text-[#202124] text-sm focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent"
          >
            <option value="">{getLabel('All Districts', 'සියලු දිස්ත්‍රික්ක', 'அனைத்து மாவட்டங்கள்')}</option>
            {SRI_LANKA_DISTRICTS.map((district) => (
              <option key={district} value={district}>
                {district.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Options */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-[#5F6368] mb-2">
            <ArrowUpDown className="w-4 h-4" />
            {getLabel('Sort By', 'වර්ගීකරණය', 'வரிசைப்படுத்து')}
          </label>
          <div className="space-y-2">
            {([
              { value: 'newest', label: getLabel('Newest First', 'නවතම පළමුව', 'புதியவை முதலில்') },
              { value: 'oldest', label: getLabel('Oldest First', 'පැරණිතම පළමුව', 'பழையவை முதலில்') },
              { value: 'sources', label: getLabel('Most Sources', 'වැඩිම මූලාශ්‍ර', 'அதிக ஆதாரங்கள்') }
            ] as const).map((option) => (
              <button
                key={option.value}
                onClick={() => updateFilters({ sort: option.value as SortOption })}
                className={`w-full px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors ${
                  filters.sort === option.value
                    ? 'bg-[#1A73E8] text-white'
                    : 'bg-[#F1F3F4] text-[#5F6368] hover:bg-[#E8EAED] hover:text-[#202124]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

