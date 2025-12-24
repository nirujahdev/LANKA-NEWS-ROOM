'use client';

import React, { useState } from 'react';
import Logo from './Logo';
import { Search, Menu, X } from 'lucide-react';

interface NavigationProps {
  currentLanguage?: 'en' | 'si' | 'ta';
  onLanguageChange?: (lang: 'en' | 'si' | 'ta') => void;
}

const Navigation: React.FC<NavigationProps> = ({ 
  currentLanguage = 'en',
  onLanguageChange 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const languages = [
    { code: 'en' as const, label: 'EN' },
    { code: 'si' as const, label: 'සිං' },
    { code: 'ta' as const, label: 'தமிழ்' }
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Navigation Bar */}
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Left: Logo */}
          <div className="flex-shrink-0">
            <Logo size="sm" className="md:hidden" />
            <Logo size="md" className="hidden md:block" />
          </div>

          {/* Center: Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-6 lg:mx-12">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#94A3B8] w-4 h-4 pointer-events-none" />
              <input
                type="text"
                placeholder="Search for topics, locations & sources"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 border border-[#E2E8F0] rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]
                         text-sm placeholder-[#94A3B8] bg-[#F8FAFC] hover:bg-white
                         text-[#1E293B] transition-all duration-200"
              />
            </div>
          </div>

          {/* Right: Language Switcher & Mobile Menu */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Language Switcher */}
            <div className="hidden sm:flex items-center gap-0.5 bg-[#F1F5F9] rounded-lg p-0.5">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => onLanguageChange?.(lang.code)}
                  className={`px-3 py-1.5 rounded-md text-xs md:text-sm font-medium transition-all duration-200
                    ${
                      currentLanguage === lang.code
                        ? 'bg-white text-[#2563EB] shadow-sm'
                        : 'text-[#64748B] hover:text-[#1E293B] hover:bg-white/50'
                    }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 -mr-2 text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8FAFC] rounded-lg transition-colors duration-200"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-[#E2E8F0] pt-4">
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#94A3B8] w-4 h-4 pointer-events-none" />
              <input
                type="text"
                placeholder="Search for topics, locations & sources"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-[#E2E8F0] rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]
                         text-sm placeholder-[#94A3B8] bg-[#F8FAFC] text-[#1E293B]
                         transition-all duration-200"
              />
            </div>
            
            {/* Mobile Language Switcher */}
            <div className="flex items-center gap-0.5 bg-[#F1F5F9] rounded-lg p-0.5">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    onLanguageChange?.(lang.code);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex-1 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200
                    ${
                      currentLanguage === lang.code
                        ? 'bg-white text-[#2563EB] shadow-sm'
                        : 'text-[#64748B]'
                    }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;

