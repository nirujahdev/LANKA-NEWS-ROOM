'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabaseClient';
import Navigation from '@/components/Navigation';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

// All 25 Sri Lankan districts
const SRI_LANKA_DISTRICTS = [
  { value: 'colombo', label: 'Colombo', labelSi: 'කොළඹ', labelTa: 'கொழும்பு' },
  { value: 'gampaha', label: 'Gampaha', labelSi: 'ගම්පහ', labelTa: 'கம்பஹா' },
  { value: 'kalutara', label: 'Kalutara', labelSi: 'කළුතර', labelTa: 'களுத்துறை' },
  { value: 'kandy', label: 'Kandy', labelSi: 'මහනුවර', labelTa: 'கண்டி' },
  { value: 'matale', label: 'Matale', labelSi: 'මාතලේ', labelTa: 'மாத்தளை' },
  { value: 'nuwara-eliya', label: 'Nuwara Eliya', labelSi: 'නුවරඑළිය', labelTa: 'நுவரெலியா' },
  { value: 'galle', label: 'Galle', labelSi: 'ගාල්ල', labelTa: 'காலி' },
  { value: 'matara', label: 'Matara', labelSi: 'මාතර', labelTa: 'மாத்தறை' },
  { value: 'hambantota', label: 'Hambantota', labelSi: 'හම්බන්තොට', labelTa: 'அம்பாந்தோட்டை' },
  { value: 'jaffna', label: 'Jaffna', labelSi: 'යාපනය', labelTa: 'யாழ்ப்பாணம்' },
  { value: 'kilinochchi', label: 'Kilinochchi', labelSi: 'කිලිනොච්චි', labelTa: 'கிளிநொச்சி' },
  { value: 'mannar', label: 'Mannar', labelSi: 'මන්නාරම', labelTa: 'மன்னார்' },
  { value: 'vavuniya', label: 'Vavuniya', labelSi: 'වවුනියාව', labelTa: 'வவுனியா' },
  { value: 'mullaitivu', label: 'Mullaitivu', labelSi: 'මුල්ලයිටිව්', labelTa: 'முல்லைத்தீவு' },
  { value: 'batticaloa', label: 'Batticaloa', labelSi: 'මඩකලපුව', labelTa: 'மட்டக்களப்பு' },
  { value: 'ampara', label: 'Ampara', labelSi: 'අම්පාර', labelTa: 'அம்பாறை' },
  { value: 'trincomalee', label: 'Trincomalee', labelSi: 'ත්‍රිකුණාමලය', labelTa: 'திருகோணமலை' },
  { value: 'kurunegala', label: 'Kurunegala', labelSi: 'කුරුණෑගල', labelTa: 'குருநாகல்' },
  { value: 'puttalam', label: 'Puttalam', labelSi: 'පුත්තලම', labelTa: 'புத்தளம்' },
  { value: 'anuradhapura', label: 'Anuradhapura', labelSi: 'අනුරාධපුර', labelTa: 'அனுராதபுரம்' },
  { value: 'polonnaruwa', label: 'Polonnaruwa', labelSi: 'පොළොන්නරුව', labelTa: 'பொலன்னறுவை' },
  { value: 'badulla', label: 'Badulla', labelSi: 'බදුල්ල', labelTa: 'பதுளை' },
  { value: 'moneragala', label: 'Moneragala', labelSi: 'මොනරාගල', labelTa: 'மொனராகலை' },
  { value: 'ratnapura', label: 'Ratnapura', labelSi: 'රත්නපුර', labelTa: 'ரத்னபுரி' },
  { value: 'kegalle', label: 'Kegalle', labelSi: 'කෑගල්ල', labelTa: 'கேகாலை' }
];

const AVAILABLE_TOPICS = [
  { id: 'sri-lanka', label: 'Sri Lanka', labelSi: 'ශ්‍රී ලංකාව', labelTa: 'இலங்கை' },
  { id: 'world', label: 'Global', labelSi: 'ලෝකය', labelTa: 'உலகம்' },
  { id: 'politics', label: 'Politics', labelSi: 'දේශපාලනය', labelTa: 'அரசியல்' },
  { id: 'economy', label: 'Economy', labelSi: 'ආර්ථිකය', labelTa: 'பொருளாதாரம்' },
  { id: 'education', label: 'Education', labelSi: 'අධ්‍යාපනය', labelTa: 'கல்வி' },
  { id: 'health', label: 'Health', labelSi: 'සෞඛ්‍ය', labelTa: 'சுகாதாரம்' },
  { id: 'sports', label: 'Sports', labelSi: 'ක්‍රීඩා', labelTa: 'விளையாட்டு' },
  { id: 'technology', label: 'Technology', labelSi: 'තාක්ෂණය', labelTa: 'தொழில்நுட்பம்' },
  { id: 'society', label: 'Society', labelSi: 'සමාජය', labelTa: 'சமூகம்' }
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'si' | 'ta'>('en');
  const [name, setName] = useState('');
  const [language, setLanguage] = useState<'en' | 'si' | 'ta'>('en');
  const [district, setDistrict] = useState('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Calculate progress (0-100)
  const progress = Math.round(
    ((name ? 1 : 0) + 
     (language ? 1 : 0) + 
     (district ? 1 : 0) + 
     (selectedTopics.length === 3 ? 1 : 0) + 
     (agreedToTerms ? 1 : 0)) / 5 * 100
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

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

    supabase.auth.getUser().then(async ({ data: { user }, error }) => {
      if (error || !user) {
        router.push('/');
        return;
      }

      // Pre-fill from Google
      if (user.user_metadata) {
        const googleName = user.user_metadata.full_name || user.user_metadata.name;
        if (googleName && !name) {
          setName(googleName);
        }
      }

      // Pre-fill from existing profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('name, language, city, district')
        .eq('id', user.id)
        .single();

      if (profile && !profileError) {
        if (profile.name && !name) setName(profile.name);
        if (profile.language) {
          setLanguage(profile.language as 'en' | 'si' | 'ta');
          setCurrentLanguage(profile.language as 'en' | 'si' | 'ta');
        }
        if (profile.district) setDistrict(profile.district);
        else if (profile.city) {
          // Try to map city to district
          const cityToDistrict: Record<string, string> = {
            'Colombo': 'colombo',
            'Kandy': 'kandy',
            'Galle': 'galle',
            'Jaffna': 'jaffna',
            'Negombo': 'gampaha',
            'Anuradhapura': 'anuradhapura',
            'Polonnaruwa': 'polonnaruwa',
            'Kurunegala': 'kurunegala',
            'Ratnapura': 'ratnapura',
            'Badulla': 'badulla',
            'Matara': 'matara',
            'Trincomalee': 'trincomalee',
            'Batticaloa': 'batticaloa',
            'Kalutara': 'kalutara',
            'Gampaha': 'gampaha',
            'Kegalle': 'kegalle',
            'Monaragala': 'moneragala',
            'Hambantota': 'hambantota'
          };
          const mappedDistrict = cityToDistrict[profile.city];
          if (mappedDistrict) setDistrict(mappedDistrict);
        }
      }
    });
  }, [router]);

  const validateField = (field: string, value: any): string | null => {
    switch (field) {
      case 'name':
        if (!value || value.trim().length < 2) {
          return 'Name must be at least 2 characters';
        }
        if (value.trim().length > 50) {
          return 'Name must be less than 50 characters';
        }
        return null;
      case 'district':
        if (!value) {
          return 'Please select your district';
        }
        return null;
      case 'topics':
        if (selectedTopics.length !== 3) {
          return 'Please select exactly 3 topics';
        }
        return null;
      case 'terms':
        if (!agreedToTerms) {
          return 'You must agree to the Terms & Conditions and Privacy Policy';
        }
        return null;
      default:
        return null;
    }
  };

  const handleBlur = (field: string, value: any) => {
    const error = validateField(field, value);
    if (error) {
      setFieldErrors(prev => ({ ...prev, [field]: error }));
    } else {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleTopicToggle = (topicId: string) => {
    if (selectedTopics.includes(topicId)) {
      setSelectedTopics(selectedTopics.filter(id => id !== topicId));
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.topics;
        return newErrors;
      });
    } else {
      if (selectedTopics.length < 3) {
        setSelectedTopics([...selectedTopics, topicId]);
        if (selectedTopics.length === 2) {
          setFieldErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.topics;
            return newErrors;
          });
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Validate all fields
    const nameError = validateField('name', name);
    const districtError = validateField('district', district);
    const topicsError = validateField('topics', selectedTopics);
    const termsError = validateField('terms', agreedToTerms);

    if (nameError || districtError || topicsError || termsError) {
      setFieldErrors({
        ...(nameError && { name: nameError }),
        ...(districtError && { district: districtError }),
        ...(topicsError && { topics: topicsError }),
        ...(termsError && { terms: termsError })
      });
      return;
    }

    setLoading(true);

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
          name: name.trim(),
          language,
          district
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
      setError(err.message || 'Failed to save preferences. Please try again.');
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

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="bg-white rounded-xl shadow-sm border border-[#E8EAED] p-6 sm:p-8">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[#5F6368]">
                {getLabel('Setup Progress', 'සැකසීමේ ප්‍රගතිය', 'அமைப்பு முன்னேற்றம்')}
              </span>
              <span className="text-sm font-medium text-[#1A73E8]">{progress}%</span>
            </div>
            <div className="w-full bg-[#E8EAED] rounded-full h-2">
              <div 
                className="bg-[#1A73E8] h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-medium text-[#202124] mb-2">
            {getLabel('Welcome! Let\'s personalize your news', 'සාදරයෙන් පිළිගනිමු! ඔබේ පුවත් පුද්ගලීකරණය කරමු', 'வரவேற்கிறோம்! உங்கள் செய்திகளை தனிப்பயனாக்குவோம்')}
          </h1>
          <p className="text-sm text-[#5F6368] mb-8">
            {getLabel(
              'Tell us a bit about yourself to get personalized news recommendations.',
              'පුද්ගලීකරණය කළ පුවත් නිර්දේශ ලබා ගැනීමට ඔබ ගැන ටිකක් කියන්න.',
              'தனிப்பயனாக்கப்பட்ட செய்தி பரிந்துரைகளைப் பெற சிறிது தகவல் தரவும்.'
            )}
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[#202124] mb-2">
                {getLabel('Your Name', 'ඔබේ නම', 'உங்கள் பெயர்')} <span className="text-[#D93025]">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) {
                    handleBlur('name', e.target.value);
                  }
                }}
                onBlur={(e) => handleBlur('name', e.target.value)}
                required
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  fieldErrors.name
                    ? 'border-[#D93025] focus:ring-[#D93025] focus:border-[#D93025]'
                    : 'border-[#E8EAED] focus:ring-[#1A73E8] focus:border-transparent'
                }`}
                placeholder={getLabel('Enter your name', 'ඔබේ නම ඇතුළත් කරන්න', 'உங்கள் பெயரை உள்ளிடவும்')}
              />
              {fieldErrors.name && (
                <p className="mt-1 text-xs text-[#D93025] flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {fieldErrors.name}
                </p>
              )}
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium text-[#202124] mb-2">
                {getLabel('Preferred Language', 'වඩාත් කැමති භාෂාව', 'விருப்பமான மொழி')} <span className="text-[#D93025]">*</span>
              </label>
              <div className="flex gap-3">
                {(['en', 'si', 'ta'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => {
                      setLanguage(lang);
                      setCurrentLanguage(lang);
                    }}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors font-medium ${
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

            {/* District */}
            <div>
              <label htmlFor="district" className="block text-sm font-medium text-[#202124] mb-2">
                {getLabel('District', 'දිස්ත්‍රික්කය', 'மாவட்டம்')} <span className="text-[#D93025]">*</span>
              </label>
              <select
                id="district"
                value={district}
                onChange={(e) => {
                  setDistrict(e.target.value);
                  if (fieldErrors.district) {
                    handleBlur('district', e.target.value);
                  }
                }}
                onBlur={(e) => handleBlur('district', e.target.value)}
                required
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  fieldErrors.district
                    ? 'border-[#D93025] focus:ring-[#D93025] focus:border-[#D93025]'
                    : 'border-[#E8EAED] focus:ring-[#1A73E8] focus:border-transparent'
                }`}
              >
                <option value="">{getLabel('Select your district', 'ඔබේ දිස්ත්‍රික්කය තෝරන්න', 'உங்கள் மாவட்டத்தைத் தேர்ந்தெடுக்கவும்')}</option>
                {SRI_LANKA_DISTRICTS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {getLabel(d.label, d.labelSi, d.labelTa)}
                  </option>
                ))}
              </select>
              {fieldErrors.district && (
                <p className="mt-1 text-xs text-[#D93025] flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {fieldErrors.district}
                </p>
              )}
            </div>

            {/* Topics */}
            <div>
              <label className="block text-sm font-medium text-[#202124] mb-2">
                {getLabel('Select 3 Favorite Topics', 'කැමතිම මාතෘකා 3 ක් තෝරන්න', '3 விருப்பமான தலைப்புகளைத் தேர்ந்தெடுக்கவும்')} <span className="text-[#D93025]">*</span>
                <span className="ml-2 text-xs text-[#5F6368] font-normal">
                  ({selectedTopics.length}/3 {getLabel('selected', 'තෝරාගත්', 'தேர்ந்தெடுக்கப்பட்ட')})
                </span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {AVAILABLE_TOPICS.map((topic) => {
                  const isSelected = selectedTopics.includes(topic.id);
                  const isDisabled = !isSelected && selectedTopics.length >= 3;
                  
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => handleTopicToggle(topic.id)}
                      disabled={isDisabled}
                      className={`px-4 py-3 rounded-lg border-2 transition-colors text-sm font-medium flex items-center justify-center gap-2 ${
                        isSelected
                          ? 'border-[#1A73E8] bg-[#E8F0FE] text-[#1A73E8]'
                          : isDisabled
                          ? 'border-[#E8EAED] bg-[#F5F5F5] text-[#9AA0A6] cursor-not-allowed'
                          : 'border-[#E8EAED] bg-white text-[#202124] hover:border-[#DADCE0]'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-4 h-4" />}
                      {getLabel(topic.label, topic.labelSi, topic.labelTa)}
                    </button>
                  );
                })}
              </div>
              {fieldErrors.topics && (
                <p className="mt-1 text-xs text-[#D93025] flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {fieldErrors.topics}
                </p>
              )}
            </div>

            {/* Terms & Privacy */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => {
                    setAgreedToTerms(e.target.checked);
                    if (fieldErrors.terms) {
                      handleBlur('terms', e.target.checked);
                    }
                  }}
                  onBlur={(e) => handleBlur('terms', e.target.checked)}
                  className="mt-1 w-4 h-4 text-[#1A73E8] border-[#E8EAED] rounded focus:ring-[#1A73E8]"
                />
                <span className="text-sm text-[#202124]">
                  {getLabel(
                    'I agree to the ',
                    'මම එකඟ වෙමි ',
                    'நான் ஒப்புக்கொள்கிறேன் '
                  )}
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#1A73E8] hover:underline font-medium"
                  >
                    {getLabel('Terms & Conditions', 'කොන්දේසි', 'விதிமுறைகள்')}
                  </a>
                  {getLabel(' and ', ' සහ ', ' மற்றும் ')}
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#1A73E8] hover:underline font-medium"
                  >
                    {getLabel('Privacy Policy', 'රහස්‍යතා ප්‍රතිපත්තිය', 'தனியுரிமை கொள்கை')}
                  </a>
                  <span className="text-[#D93025]">*</span>
                </span>
              </label>
              {fieldErrors.terms && (
                <p className="mt-1 ml-7 text-xs text-[#D93025] flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {fieldErrors.terms}
                </p>
              )}
            </div>

            {error && (
              <div className="text-sm text-[#D93025] bg-[#FCE8E6] p-3 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || progress < 100}
              className="w-full px-6 py-3 bg-[#1A73E8] text-white rounded-lg font-medium hover:bg-[#1557B0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {getLabel('Saving...', 'සුරැකෙමින්...', 'சேமிக்கிறது...')}
                </>
              ) : (
                getLabel('Continue', 'ඉදිරියට', 'தொடரவும்')
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
