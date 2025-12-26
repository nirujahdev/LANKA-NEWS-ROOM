import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { NewsCardData, formatTimeAgo, getTopicTags, getTopicLabel, getImageUrl, getStoryUrl } from '@/lib/newsCardUtils';

interface MixedNewsCardProps {
  mainArticle: NewsCardData;
  relatedArticles: NewsCardData[]; // 2-3 related articles
}

export default function MixedNewsCard({ mainArticle, relatedArticles }: MixedNewsCardProps) {
  const mainTopic = mainArticle.category || mainArticle.topics?.[0] || 'other';
  const mainHref = getStoryUrl(mainArticle.language || 'en', mainArticle.slug, mainArticle.id, mainTopic);
  const mainTopicTags = getTopicTags(mainArticle);
  const mainImageUrl = getImageUrl(mainArticle);

  return (
    <div className="bg-white rounded-xl border border-[#E8EAED] overflow-hidden">
      {/* Main Article - Top */}
      <Link href={mainHref} className="block group">
        <div className="flex flex-col md:flex-row gap-4 p-4 border-b border-[#E8EAED] hover:bg-[#F8F9FA] transition-colors">
          {/* Main Image */}
          <div className="relative w-full md:w-1/3 aspect-video md:aspect-square rounded-xl overflow-hidden flex-shrink-0">
            <Image 
              src={mainImageUrl} 
              alt={mainArticle.headline}
              fill
              className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80';
              }}
            />
          </div>
          
          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {mainTopicTags.length > 0 && (
              <div className="mb-2 flex items-center gap-2 flex-wrap">
                {mainTopicTags.map((topic, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E8F0FE] text-[#1A73E8]"
                  >
                    {getTopicLabel(topic, mainArticle.language || 'en')}
                  </span>
                ))}
              </div>
            )}
            
            <h2 className="text-lg font-semibold text-[#202124] mb-2 leading-tight group-hover:text-[#1A73E8] transition-colors">
              {mainArticle.headline}
            </h2>
            
            <div className="text-xs text-[#5F6368] mt-auto">
              {formatTimeAgo(mainArticle.updatedAt)}
            </div>
          </div>
        </div>
      </Link>

      {/* Related Articles - Bottom */}
      <div className="p-4">
        <div className="text-xs font-medium text-[#5F6368] mb-3 uppercase tracking-wide">
          Related Coverage
        </div>
        <div className="space-y-3">
          {relatedArticles.slice(0, 3).map((article) => {
            const articleTopic = article.category || article.topics?.[0] || 'other';
            const articleHref = getStoryUrl(article.language || 'en', article.slug, article.id, articleTopic);
            const articleImageUrl = getImageUrl(article);
            
            return (
              <Link key={article.id} href={articleHref} className="block group">
                <div className="flex gap-3 hover:bg-[#F8F9FA] p-2 rounded-lg transition-colors">
                  {/* Small Image */}
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
                    <h3 className="text-sm font-medium text-[#202124] line-clamp-2 group-hover:text-[#1A73E8] transition-colors">
                      {article.headline}
                    </h3>
                    <div className="text-[10px] text-[#5F6368] mt-1">
                      {formatTimeAgo(article.updatedAt)}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

