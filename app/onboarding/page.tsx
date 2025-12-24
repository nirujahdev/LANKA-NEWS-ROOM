'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabaseClient';
import Navigation from '@/components/Navigation';

export const dynamic = 'force-dynamic';

const SRI_LANKA_CITIES = [
  'Colombo',
  'Kandy',
  'Galle',
  'Jaffna',
  'Negombo',
  'Anuradhapura',
  'Polonnaruwa',
  'Kurunegala',
  'Ratnapura',
  'Badulla',
  'Matara',
  'Trincomalee',
  'Batticaloa',
  'Kalutara',
  'Gampaha',
  'Kegalle',
  'Monaragala',
  'Hambantota'
];

const AVAILABLE_TOPICS = [
  { id: 'home', label: 'Home', labelSi: 'මුල් පිටුව', labelTa: 'முகப்பு' },
  { id: 'recent', label: 'Recent', labelSi: 'මෑත', labelTa: 'சமீபத்திய' },
  { id: 'education', label: 'Education', labelSi: 'අධ්‍යාපනය', labelTa: 'கல்வி' },
  { id: 'politics', label: 'Politics', labelSi: 'දේශපාලනය', labelTa: 'அரசியல்' },
  { id: 'economy', label: 'Economy', labelSi: 'ආර්ථිකය', labelTa: 'பொருளாதாரம்' },
  { id: 'sports', label: 'Sports', labelSi: 'ක්‍රීඩා', labelTa: 'விளையாட்டு' },
  { id: 'technology', label: 'Technology', labelSi: 'තාක්ෂණය', labelTa: 'தொழில்நுட்பம்' },
  { id: 'health', label: 'Health', labelSi: 'සෞඛ්‍ය', labelTa: 'சுகாதாரம்' }
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'si' | 'ta'>('en');
  const [name, setName] = useState('');
  const [language, setLanguage] = useState<'en' | 'si' | 'ta'>('en');
  const [city, setCity] = useState('Colombo');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Check if we have valid Supabase credentials
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      router.push('/');
      return;
    }

    let supabase: ReturnType<typeof getSupabaseClient>;
    try {
      supabase = getSupabaseClient();
    } catch (error) {
      router.push('/');
      return;
    }

    // Check if user is signed in
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error || !user) {
        router.push('/');
      }
    });
  }, [router]);

  const handleTopicToggle = (topicId: string) => {
    if (selectedTopics.includes(topicId)) {
      setSelectedTopics(selectedTopics.filter(id => id !== topicId));
    } else {
      if (selectedTopics.length < 3) {
        setSelectedTopics([...selectedTopics, topicId]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (selectedTopics.length !== 3) {
      setError('Please select exactly 3 topics');
      setLoading(false);
      return;
    }

    try {
      const supabase = getSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name,
          language,
          city
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Upsert user preferences
      const { error: prefsError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          favourite_topics: selectedTopics,
          updated_at: new Date().toISOString()
        });

      if (prefsError) throw prefsError;

      router.push('/for-you');
    } catch (err: any) {
      setError(err.message || 'Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  const getLabel = (en: string, si?: string, ta?: string) => {
    if (currentLanguage === 'si' && si) return si;
    if (currentLanguage === 'ta' && ta) return ta;
    return en;
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <Navigation 
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
      />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-sm border border-[#E8EAED] p-8">
          <h1 className="text-3xl font-medium text-[#202124] mb-2">
            Welcome! Let's personalize your news
          </h1>
          <p className="text-sm text-[#5F6368] mb-8">
            Tell us a bit about yourself to get personalized news recommendations.
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[#202124] mb-2">
                Your Name <span className="text-[#D93025]">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-[#E8EAED] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent"
                placeholder="Enter your name"
              />
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-[#202124] mb-2">
                Preferred Language <span className="text-[#D93025]">*</span>
              </label>
              <div className="flex gap-3">
                {(['en', 'si', 'ta'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setLanguage(lang)}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                      language === lang
                        ? 'border-[#1A73E8] bg-[#E8F0FE] text-[#1A73E8]'
                        : 'border-[#E8EAED] bg-white text-[#202124] hover:border-[#DADCE0]'
                    }`}
                  >
                    {lang === 'en' ? 'English' : lang === 'si' ? 'සිංහල' : 'தமிழ்'}
                  </button>
                ))}
              </div>
            </div>

            {/* City */}
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-[#202124] mb-2">
                City <span className="text-[#D93025]">*</span>
              </label>
              <select
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                className="w-full px-4 py-3 border border-[#E8EAED] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A73E8] focus:border-transparent"
              >
                {SRI_LANKA_CITIES.map((cityName) => (
                  <option key={cityName} value={cityName}>
                    {cityName}
                  </option>
                ))}
              </select>
            </div>

            {/* Topics */}
            <div>
              <label className="block text-sm font-medium text-[#202124] mb-2">
                Select 3 Favorite Topics <span className="text-[#D93025]">*</span>
                <span className="ml-2 text-xs text-[#5F6368] font-normal">
                  ({selectedTopics.length}/3 selected)
                </span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {AVAILABLE_TOPICS.map((topic) => {
                  const isSelected = selectedTopics.includes(topic.id);
                  const isDisabled = !isSelected && selectedTopics.length >= 3;
                  
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => handleTopicToggle(topic.id)}
                      disabled={isDisabled}
                      className={`px-4 py-3 rounded-lg border-2 transition-colors text-sm font-medium ${
                        isSelected
                          ? 'border-[#1A73E8] bg-[#E8F0FE] text-[#1A73E8]'
                          : isDisabled
                          ? 'border-[#E8EAED] bg-[#F5F5F5] text-[#9AA0A6] cursor-not-allowed'
                          : 'border-[#E8EAED] bg-white text-[#202124] hover:border-[#DADCE0]'
                      }`}
                    >
                      {getLabel(topic.label, topic.labelSi, topic.labelTa)}
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="text-sm text-[#D93025] bg-[#FCE8E6] p-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || selectedTopics.length !== 3 || !name}
              className="w-full px-6 py-3 bg-[#1A73E8] text-white rounded-lg font-medium hover:bg-[#1557B0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Continue'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

