'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Star, Share2 } from 'lucide-react';
import Image from 'next/image';

interface TopicCardProps {
  topic: string;
  topicSlug: string;
  imageUrl?: string | null;
  isFollowing?: boolean;
  language?: 'en' | 'si' | 'ta';
  onFollow?: (topic: string, follow: boolean) => void;
  articleCount?: number;
}

export default function TopicCard({
  topic,
  topicSlug,
  imageUrl,
  isFollowing = false,
  language = 'en',
  onFollow,
  articleCount
}: TopicCardProps) {
  const [following, setFollowing] = useState(isFollowing);
  const [sharing, setSharing] = useState(false);

  const handleFollow = async () => {
    const newState = !following;
    setFollowing(newState);
    
    // Call API if user is authenticated
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const method = newState ? 'POST' : 'DELETE';
        const url = newState 
          ? '/api/topics/follow'
          : `/api/topics/follow?topic=${encodeURIComponent(topic)}`;
        
        await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          ...(newState && { body: JSON.stringify({ topic }) })
        });
      }
    } catch (error) {
      console.error('Error following topic:', error);
      // Revert state on error
      setFollowing(!newState);
    }
    
    onFollow?.(topic, newState);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/lk/${language}/${topicSlug}`;
    const text = `News about ${topic} - Lanka News Room`;

    if (navigator.share) {
      try {
        await navigator.share({ title: topic, text, url });
      } catch (error) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      setSharing(true);
      setTimeout(() => setSharing(false), 2000);
    }
  };

  const getLabel = (en: string, si?: string, ta?: string) => {
    if (language === 'si' && si) return si;
    if (language === 'ta' && ta) return ta;
    return en;
  };

  // Get topic image placeholder or use provided image
  const displayImage = imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(topic)}&background=1A73E8&color=fff&size=128`;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E8EAED] overflow-hidden">
      <div className="p-4">
        {/* Topic Image/Icon */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#F1F3F4] flex items-center justify-center flex-shrink-0">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={topic}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#1A73E8] to-[#1557B0] flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {topic.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-semibold text-[#202124] truncate">{topic}</h3>
            <p className="text-sm text-[#5F6368]">{getLabel('Topic', 'මාතෘකාව', 'தலைப்பு')}</p>
            {articleCount !== undefined && (
              <p className="text-xs text-[#9AA0A6] mt-1">
                {articleCount} {getLabel('articles', 'ලිපි', 'கட்டுரைகள்')}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleFollow}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              following
                ? 'bg-[#E8F0FE] text-[#1A73E8]'
                : 'bg-[#F1F3F4] text-[#5F6368] hover:bg-[#E8EAED]'
            }`}
          >
            <Star className={`w-4 h-4 ${following ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">
              {following ? getLabel('Following', 'අනුගමනය', 'பின்தொடர்கிறது') : getLabel('Follow', 'අනුගමනය', 'பின்தொடர்')}
            </span>
          </button>
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#F1F3F4] text-[#5F6368] hover:bg-[#E8EAED] transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-sm font-medium">
              {sharing ? getLabel('Copied!', 'පිටපත්!', 'நகலெடுக்கப்பட்டது!') : getLabel('Share', 'බෙදාගන්න', 'பகிர்')}
            </span>
          </button>
        </div>

        {/* View Topic Link */}
        <Link
          href={`/${language}/topic/${topicSlug}`}
          className="block mt-3 text-center text-sm text-[#1A73E8] hover:underline"
        >
          {getLabel('View all news', 'සියලුම පුවත්', 'அனைத்து செய்திகளும்')}
        </Link>
      </div>
    </div>
  );
}

