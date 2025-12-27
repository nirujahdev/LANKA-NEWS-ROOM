'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Share2, ArrowUpDown, TrendingUp, Calendar, Tag } from 'lucide-react';
import { ClusterListItem } from '@/lib/api';
import { formatTimeAgo, getImageUrl, getStoryUrl } from '@/lib/newsCardUtils';
import { normalizeTopicSlug } from '@/lib/topics';
import { getTopicUrl } from '@/lib/urls';

type SortOption = 'trending' | 'date' | 'topic';

interface TopicNewsCardProps {
  topic: string;
  topicSlug: string;
  topArticles: ClusterListItem[]; // Top 3 articles for this topic
  language?: 'en' | 'si' | 'ta';
  imageUrl?: string | null;
  isFollowing?: boolean;
  onFollow?: (topic: string, follow: boolean) => void;
}

export default function TopicNewsCard({
  topic,
  topicSlug,
  topArticles,
  language = 'en',
  imageUrl,
  isFollowing = false,
  onFollow
}: TopicNewsCardProps) {
  const [following, setFollowing] = useState(isFollowing);
  const [sharing, setSharing] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('trending');

  const handleFollow = async () => {
    const newState = !following;
    setFollowing(newState);
    
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
      setFollowing(!newState);
    }
    
    onFollow?.(topic, newState);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/${language}/topic/${topicSlug}`;
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

  // Sort articles based on selected option
  const sortedArticles = useMemo(() => {
    const articles = [...topArticles];
    
    switch (sortBy) {
      case 'date':
        return articles.sort((a, b) => {
          const dateA = a.last_updated ? new Date(a.last_updated).getTime() : 0;
          const dateB = b.last_updated ? new Date(b.last_updated).getTime() : 0;
          return dateB - dateA; // Newest first
        });
      
      case 'topic':
        return articles.sort((a, b) => {
          const topicA = a.topic || '';
          const topicB = b.topic || '';
          return topicA.localeCompare(topicB);
        });
      
      case 'trending':
      default:
        // Sort by source count (more sources = more trending) and recency
        return articles.sort((a, b) => {
          const sourceDiff = (b.source_count || 0) - (a.source_count || 0);
          if (sourceDiff !== 0) return sourceDiff;
          const dateA = a.last_updated ? new Date(a.last_updated).getTime() : 0;
          const dateB = b.last_updated ? new Date(b.last_updated).getTime() : 0;
          return dateB - dateA;
        });
    }
  }, [topArticles, sortBy]);

  const displayImage = imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(topic)}&background=1A73E8&color=fff&size=128`;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E8EAED] overflow-hidden">
      <div className="p-4">
        {/* Topic Header */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#F1F3F4] flex items-center justify-center flex-shrink-0">
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
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-4">
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

        {/* Sort Settings */}
        {topArticles.length > 0 && (
          <div className="border-t border-[#E8EAED] pt-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-[#202124]">
                {getLabel('Top stories', 'ඉහළ කතා', 'முதன்மை செய்திகள்')}
              </h4>
              <div className="flex items-center gap-1 bg-[#F1F3F4] rounded-lg p-1">
                <button
                  onClick={() => setSortBy('trending')}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                    sortBy === 'trending'
                      ? 'bg-white text-[#1A73E8] shadow-sm'
                      : 'text-[#5F6368] hover:text-[#202124]'
                  }`}
                  title={getLabel('Trending', 'ප්‍රවණතා', 'பிரபலமான')}
                >
                  <TrendingUp className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setSortBy('date')}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                    sortBy === 'date'
                      ? 'bg-white text-[#1A73E8] shadow-sm'
                      : 'text-[#5F6368] hover:text-[#202124]'
                  }`}
                  title={getLabel('Sort by date', 'දිනය අනුව', 'தேதி வாரியாக')}
                >
                  <Calendar className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setSortBy('topic')}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                    sortBy === 'topic'
                      ? 'bg-white text-[#1A73E8] shadow-sm'
                      : 'text-[#5F6368] hover:text-[#202124]'
                  }`}
                  title={getLabel('Sort by topic', 'මාතෘකාව අනුව', 'தலைப்பு வாரியாக')}
                >
                  <Tag className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Top 3 News Articles */}
        {sortedArticles.length > 0 && (
          <div className="space-y-3">
            {sortedArticles.slice(0, 3).map((article) => {
              const articleTopic = article.topic || topicSlug || 'other';
              const articleHref = getStoryUrl(language, article.slug, article.id, articleTopic, article.topics);
              const articleImageUrl = getImageUrl({
                id: article.id,
                slug: article.slug,
                headline: article.headline,
                sources: article.sources,
                updatedAt: article.last_updated,
                sourceCount: article.source_count || 0,
                language,
                imageUrl: article.image_url || null
              });

              return (
                <Link key={article.id} href={articleHref} className="block group">
                  <div className="flex gap-3 hover:bg-[#F8F9FA] p-2 rounded-lg transition-colors">
                    {/* Small Thumbnail */}
                    <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden relative bg-[#F1F3F4]">
                      <Image 
                        src={articleImageUrl} 
                        alt={article.headline}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80';
                        }}
                      />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-[#202124] line-clamp-2 group-hover:text-[#1A73E8] transition-colors mb-1">
                        {article.headline}
                      </h3>
                      <div className="text-[10px] text-[#5F6368]">
                        {formatTimeAgo(article.last_updated)}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* View All Link */}
        <Link
          href={getTopicUrl(language, topicSlug)}
          className="block mt-4 text-center text-sm text-[#1A73E8] hover:underline"
        >
          {getLabel('View all news', 'සියලුම පුවත්', 'அனைத்து செய்திகளும்')} →
        </Link>
      </div>
    </div>
  );
}

