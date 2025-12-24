'use client';

import React, { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import IncidentDetail from '@/components/IncidentDetail';
import { ClusterDetail, loadClusterDetail } from '@/lib/api';

export default function IncidentDetailPage({ params }: { params: { id: string } }) {
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'si' | 'ta'>('en');
  const [detail, setDetail] = useState<ClusterDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await loadClusterDetail(params.id);
        if (!cancelled) setDetail(data);
      } catch (err) {
        if (!cancelled) setError('Not found');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchDetail();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <Navigation 
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
      />
      
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-6 lg:gap-8 pt-6">
          {/* Left Ad Space */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <div className="min-h-[600px]"></div>
            </div>
          </aside>

          {/* Center Content with White Background */}
          <main className="flex-1 min-w-0 max-w-3xl mx-auto">
            <div className="bg-white rounded-xl p-6 md:p-8 lg:p-10">
              {loading && <p className="text-sm text-[#5F6368]">Loading incident…</p>}
              {error && <p className="text-sm text-[#D93025]">Incident not found.</p>}
              {!loading && !error && detail && (
                <IncidentDetail
                  id={detail.cluster.id}
                  headline={detail.cluster.headline}
                  summary={
                    currentLanguage === 'si'
                      ? detail.summary?.summary_si || detail.summary?.summary_en || ''
                      : currentLanguage === 'ta'
                      ? detail.summary?.summary_ta || detail.summary?.summary_en || ''
                      : detail.summary?.summary_en || ''
                  }
                  summarySi={detail.summary?.summary_si}
                  summaryTa={detail.summary?.summary_ta}
                  sources={detail.articles.map((article) => article.source || { name: 'Unknown', feed_url: '#' })}
                  updatedAt={detail.cluster.last_updated}
                  firstSeen={detail.cluster.first_seen}
                  sourceCount={detail.cluster.source_count || 0}
                  currentLanguage={currentLanguage}
                  onLanguageChange={setCurrentLanguage}
                />
              )}
            </div>
          </main>

          {/* Right Ad Space */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <div className="min-h-[600px]"></div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

