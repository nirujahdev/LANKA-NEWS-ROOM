'use client';

import React, { useState } from 'react';
import Logo from './Logo';
import SearchBar from './SearchBar';
import { Search, Menu, X, HelpCircle, Settings, User } from 'lucide-react';
import Link from 'next/link';

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
    <nav className="sticky top-0 z-50 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Navigation Bar */}
        <div className="flex items-center justify-between h-14 md:h-16">
          {/* Left: Logo and Name */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center">
              <Logo size="md" className="hidden sm:flex" />
              <Logo size="sm" className="sm:hidden" />
            </Link>
          </div>

          {/* Center: Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-6 lg:mx-12">
            <SearchBar language={currentLanguage} />
          </div>

          {/* Right: Utility Icons & Profile */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Language Switcher (Desktop) */}
            <div className="hidden lg:flex items-center gap-0.5 bg-[#F1F3F4] rounded-lg p-0.5">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => onLanguageChange?.(lang.code)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200
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

            {/* Help Icon */}
            <button
              className="hidden md:flex p-2 text-[#5F6368] hover:bg-[#F1F3F4] rounded-full transition-colors duration-200"
              aria-label="Help"
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            {/* Settings Icon */}
            <button
              className="hidden md:flex p-2 text-[#5F6368] hover:bg-[#F1F3F4] rounded-full transition-colors duration-200"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Profile Icon */}
            <Link
              href="/profile"
              className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 bg-[#FF9800] text-white rounded-full font-semibold text-sm md:text-base hover:shadow-md transition-shadow duration-200"
              aria-label="Profile"
            >
              <User className="w-4 h-4 md:w-5 md:h-5" />
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 -mr-2 text-[#5F6368] hover:bg-[#F1F3F4] rounded-full transition-colors duration-200"
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
          <div className="md:hidden pb-4 border-t border-[#E8EAED] pt-4">
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#9AA0A6] w-4 h-4 pointer-events-none" />
              <input
                type="text"
                placeholder="Search for topics, locations & sources"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-[#F1F3F4] rounded-full 
                         focus:outline-none focus:bg-white focus:shadow-md
                         text-sm placeholder-[#80868B] text-[#202124]
                         transition-all duration-200 border border-transparent focus:border-[#E8EAED]"
              />
            </div>
            
            {/* Mobile Language Switcher */}
            <div className="flex items-center gap-0.5 bg-[#F1F3F4] rounded-lg p-0.5 mb-4">
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
                        ? 'bg-white text-[#1A73E8] shadow-sm'
                        : 'text-[#5F6368]'
                    }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            {/* Mobile Menu Items */}
            <div className="flex flex-col gap-2">
              <Link
                href="/profile"
                className="flex items-center gap-3 px-3 py-2 text-[#202124] hover:bg-[#F1F3F4] rounded-lg transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <User className="w-5 h-5" />
                <span className="text-sm font-medium">Profile</span>
              </Link>
              <button className="flex items-center gap-3 px-3 py-2 text-[#202124] hover:bg-[#F1F3F4] rounded-lg transition-colors text-left">
                <HelpCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Help</span>
              </button>
              <button className="flex items-center gap-3 px-3 py-2 text-[#202124] hover:bg-[#F1F3F4] rounded-lg transition-colors text-left">
                <Settings className="w-5 h-5" />
                <span className="text-sm font-medium">Settings</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;

