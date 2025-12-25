'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { normalizeTopicSlug } from '@/lib/topics';
import { getTopicUrl } from '@/lib/urls';

interface RelatedTopicsProps {
  currentTopic?: string;
  language?: 'en' | 'si' | 'ta';
  limit?: number;
}

interface Topic {
  topic: string;
  count: number;
}

export default function RelatedTopics({
  currentTopic,
  language = 'en',
  limit = 12
}: RelatedTopicsProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTopics() {
      try {
        const response = await fetch('/api/topics');
        const data = await response.json();
        // Filter out current topic and limit results
        const filtered = (data.topics || [])
          .filter((t: Topic) => t.topic !== currentTopic)
          .slice(0, limit);
        setTopics(filtered);
      } catch (error) {
        console.error('Error fetching topics:', error);
        // Fallback to default topics
        setTopics([
          { topic: 'politics', count: 0 },
          { topic: 'economy', count: 0 },
          { topic: 'sports', count: 0 },
          { topic: 'technology', count: 0 },
          { topic: 'health', count: 0 },
          { topic: 'education', count: 0 }
        ].slice(0, limit));
      } finally {
        setLoading(false);
      }
    }

    fetchTopics();
  }, [currentTopic, limit]);

  const getLabel = (en: string, si?: string, ta?: string) => {
    if (language === 'si' && si) return si;
    if (language === 'ta' && ta) return ta;
    return en;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-[#E8EAED] p-4">
        <h3 className="text-lg font-semibold text-[#202124] mb-4">
          {getLabel('Topics', 'මාතෘකා', 'தலைப்புகள்')}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-10 bg-[#F1F3F4] rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (topics.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E8EAED] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#E8EAED]">
        <h3 className="text-lg font-semibold text-[#202124]">
          {getLabel('Topics', 'මාතෘකා', 'தலைப்புகள்')}
        </h3>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {topics.map((item) => {
            const normalizedTopic = normalizeTopicSlug(item.topic) || item.topic;
            return (
              <Link
                key={item.topic}
                href={getTopicUrl(language, normalizedTopic)}
                className="px-3 py-2 rounded-lg bg-[#F1F3F4] text-[#5F6368] hover:bg-[#E8EAED] hover:text-[#202124] transition-colors text-sm font-medium text-center capitalize"
              >
                {item.topic}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

