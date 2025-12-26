'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { User, Mail, Calendar, Globe, ArrowLeft, LogOut } from 'lucide-react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

interface UserData {
  name: string;
  email: string;
  joinedDate: Date;
  preferredLanguage: 'en' | 'si' | 'ta';
  avatarUrl?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'si' | 'ta'>('en');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savedArticles, setSavedArticles] = useState(0);
  const [readingHistory, setReadingHistory] = useState(0);

  useEffect(() => {
    async function fetchUserData() {
      try {
        const supabase = getSupabaseClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          router.push('/');
          return;
        }

        // Fetch profile data
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('name, language, created_at, email, avatar_url, district')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          router.push('/');
          return;
        }

        // Get user avatar - prefer database avatar_url, fallback to Google metadata
        const avatarUrl = profile.avatar_url || 
                         user.user_metadata?.avatar_url || 
                         user.user_metadata?.picture ||
                         null;

        // If profile doesn't have avatar but Google metadata does, update it
        if (!profile.avatar_url && (user.user_metadata?.picture || user.user_metadata?.avatar_url)) {
          try {
            await supabase
              .from('profiles')
              .update({ avatar_url: user.user_metadata?.picture || user.user_metadata?.avatar_url })
              .eq('id', user.id);
          } catch (updateError) {
            console.warn('Failed to update profile avatar:', updateError);
            // Non-critical, continue
          }
        }

        setUserData({
          name: profile.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          email: profile.email || user.email || '',
          joinedDate: profile.created_at ? new Date(profile.created_at) : new Date(user.created_at || Date.now()),
          preferredLanguage: (profile.language as 'en' | 'si' | 'ta') || 'en',
          avatarUrl
        });

        setCurrentLanguage((profile.language as 'en' | 'si' | 'ta') || 'en');

        // TODO: Fetch saved articles and reading history counts
        // For now, keeping as 0 until those features are implemented
        setSavedArticles(0);
        setReadingHistory(0);
      } catch (error) {
        console.error('Error loading user data:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [router]);

  const handleSignOut = async () => {
    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/');
        return;
      }

      // Delete user account (this will cascade delete profile and preferences due to ON DELETE CASCADE)
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      
      if (error) {
        // If admin API not available, try to delete profile data manually
        await supabase.from('user_preferences').delete().eq('user_id', user.id);
        await supabase.from('profiles').delete().eq('id', user.id);
        await supabase.auth.signOut();
      } else {
        await supabase.auth.signOut();
      }

      router.push('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please contact support.');
    }
  };

  const handleLanguageChange = async (newLang: 'en' | 'si' | 'ta') => {
    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase
          .from('profiles')
          .update({ language: newLang })
          .eq('id', user.id);
        
        setCurrentLanguage(newLang);
        if (userData) {
          setUserData({ ...userData, preferredLanguage: newLang });
        }
      }
    } catch (error) {
      console.error('Error updating language:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="text-[#5F6368]">Loading...</div>
      </div>
    );
  }

  if (!userData) {
    return null;
  }

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
              {userData.avatarUrl ? (
                <img
                  src={userData.avatarUrl}
                  alt={userData.name}
                  className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 md:w-24 md:h-24 bg-[#FF9800] text-white rounded-full flex items-center justify-center font-semibold text-2xl md:text-3xl">
                  {userData.name.charAt(0).toUpperCase()}
                </div>
              )}
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
            <p className="text-3xl font-bold text-[#202124]">{savedArticles}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-sm font-medium text-[#5F6368] mb-2">Reading History</h3>
            <p className="text-3xl font-bold text-[#202124]">{readingHistory}</p>
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
              <select 
                value={currentLanguage}
                onChange={(e) => handleLanguageChange(e.target.value as 'en' | 'si' | 'ta')}
                className="px-4 py-2 border border-[#E8EAED] rounded-lg text-sm text-[#202124] bg-white focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent"
              >
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

            <div className="flex items-center justify-between py-4 border-b border-[#E8EAED]">
              <div>
                <h3 className="text-sm font-medium text-[#202124] mb-1">Sign Out</h3>
                <p className="text-sm text-[#5F6368]">Sign out of your account</p>
              </div>
              <button 
                onClick={handleSignOut}
                className="px-4 py-2 bg-[#1A73E8] text-white rounded-lg text-sm font-medium hover:bg-[#1557B0] transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>

            <div className="flex items-center justify-between py-4">
              <div>
                <h3 className="text-sm font-medium text-[#202124] mb-1">Delete Account</h3>
                <p className="text-sm text-[#5F6368]">Permanently delete your account</p>
              </div>
              <button 
                onClick={handleDeleteAccount}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

