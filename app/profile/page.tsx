'use client';

import React, { useState } from 'react';
import Navigation from '@/components/Navigation';
import { User, Mail, Calendar, Globe, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function ProfilePage() {
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'si' | 'ta'>('en');

  // Mock user data - replace with actual user data fetching
  const userData = {
    name: 'John Doe',
    email: 'john.doe@example.com',
    joinedDate: new Date('2024-01-15'),
    preferredLanguage: 'en',
    savedArticles: 12,
    readingHistory: 45
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <Navigation 
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#5F6368] hover:text-[#202124] mb-6 transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to feed</span>
        </Link>

        {/* Profile Header Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Profile Avatar */}
            <div className="flex-shrink-0">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-[#FF9800] text-white rounded-full flex items-center justify-center font-semibold text-2xl md:text-3xl">
                {userData.name.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-[#202124] mb-2">
                {userData.name}
              </h1>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[#5F6368]">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{userData.email}</span>
                </div>
                
                <div className="flex items-center gap-2 text-[#5F6368]">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Joined {formatDate(userData.joinedDate)}</span>
                </div>

                <div className="flex items-center gap-2 text-[#5F6368]">
                  <Globe className="w-4 h-4" />
                  <span className="text-sm">Preferred Language: {userData.preferredLanguage.toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-sm font-medium text-[#5F6368] mb-2">Saved Articles</h3>
            <p className="text-3xl font-bold text-[#202124]">{userData.savedArticles}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-sm font-medium text-[#5F6368] mb-2">Reading History</h3>
            <p className="text-3xl font-bold text-[#202124]">{userData.readingHistory}</p>
          </div>
        </div>

        {/* Settings Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
          <h2 className="text-xl font-bold text-[#202124] mb-6">Settings</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-4 border-b border-[#E8EAED]">
              <div>
                <h3 className="text-sm font-medium text-[#202124] mb-1">Language Preference</h3>
                <p className="text-sm text-[#5F6368]">Choose your preferred language</p>
              </div>
              <select className="px-4 py-2 border border-[#E8EAED] rounded-lg text-sm text-[#202124] bg-white focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent">
                <option value="en">English</option>
                <option value="si">සිංහල</option>
                <option value="ta">தமிழ்</option>
              </select>
            </div>

            <div className="flex items-center justify-between py-4 border-b border-[#E8EAED]">
              <div>
                <h3 className="text-sm font-medium text-[#202124] mb-1">Email Notifications</h3>
                <p className="text-sm text-[#5F6368]">Receive updates via email</p>
              </div>
              <button className="px-4 py-2 bg-[#1A73E8] text-white rounded-lg text-sm font-medium hover:bg-[#1557B0] transition-colors">
                Enable
              </button>
            </div>

            <div className="flex items-center justify-between py-4">
              <div>
                <h3 className="text-sm font-medium text-[#202124] mb-1">Delete Account</h3>
                <p className="text-sm text-[#5F6368]">Permanently delete your account</p>
              </div>
              <button className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

