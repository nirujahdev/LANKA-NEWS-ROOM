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
    <nav className="sticky top-0 z-50 bg-white border-b border-[#E5E7EB] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Navigation Bar */}
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <div className="flex-shrink-0">
            <Logo size="md" />
          </div>

          {/* Center: Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#64748B] w-5 h-5" />
              <input
                type="text"
                placeholder="Search for topics, locations & sources"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-[#E5E7EB] rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent
                         text-sm placeholder-[#64748B] bg-white text-[#0F172A]"
              />
            </div>
          </div>

          {/* Right: Language Switcher & Mobile Menu */}
          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <div className="hidden sm:flex items-center gap-1 bg-[#F1F5F9] rounded-lg p-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => onLanguageChange?.(lang.code)}
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

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-[#64748B] hover:text-[#0F172A]"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-[#E5E7EB] pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#64748B] w-5 h-5" />
              <input
                type="text"
                placeholder="Search for topics, locations & sources"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-[#E5E7EB] rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent
                         text-sm placeholder-[#64748B] bg-white text-[#0F172A]"
              />
            </div>
            
            {/* Mobile Language Switcher */}
            <div className="flex items-center gap-1 mt-4 bg-[#F1F5F9] rounded-lg p-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    onLanguageChange?.(lang.code);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all
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

