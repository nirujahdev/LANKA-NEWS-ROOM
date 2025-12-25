import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface IncidentCardProps {
  id: string;
  slug?: string | null; // SEO-friendly URL slug
  headline: string;
  summary?: string | null;
  sources: Array<{ name: string; feed_url: string }>;
  updatedAt?: string | null;
  sourceCount: number;
  language?: 'en' | 'si' | 'ta';
  variant?: 'default' | 'featured' | 'compact';
  imageUrl?: string | null; // Article image URL from RSS feed
  category?: string | null; // Topic/category for tags
  topics?: string[]; // Array of topics from OpenAI
}

const IncidentCard: React.FC<IncidentCardProps> = ({
  id,
  slug,
  headline,
  summary,
  sources,
  updatedAt,
  sourceCount,
  language = 'en',
  variant = 'default',
  imageUrl,
  category,
  topics = []
}) => {
  // Use slug for SEO-friendly URLs, fallback to ID for backward compatibility
  const href = slug ? `/${language}/story/${slug}` : `/incident/${id}`;
  const getLabel = (en: string, si?: string, ta?: string) => {
    if (language === 'si' && si) return si;
    if (language === 'ta' && ta) return ta;
    return en;
  };

  const formatTimeAgo = (iso?: string | null): string => {
    if (!iso) return 'Just now';
    const date = new Date(iso);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} min ago`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    }
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} days ago`;
  };

  // Get topic tags - use topics array first, then category, then fallback
  const getTopicTags = (): string[] => {
    if (topics && topics.length > 0) {
      return topics.slice(0, 2); // Show max 2 topics
    }
    if (category) {
      return [category];
    }
    return []; // No fallback - don't show tag if no topic
  };

  const topicTags = getTopicTags();

  // Topic label translations
  const getTopicLabel = (topic: string): string => {
    const topicMap: Record<string, { en: string; si: string; ta: string }> = {
      'politics': { en: 'Politics', si: 'දේශපාලනය', ta: 'அரசியல்' },
      'economy': { en: 'Economy', si: 'ආර්ථිකය', ta: 'பொருளாதாரம்' },
      'sports': { en: 'Sports', si: 'ක්‍රීඩා', ta: 'விளையாட்டு' },
      'technology': { en: 'Technology', si: 'තාක්ෂණය', ta: 'தொழில்நுட்பம்' },
      'health': { en: 'Health', si: 'සෞඛ්‍ය', ta: 'சுகாதாரம்' },
      'education': { en: 'Education', si: 'අධ්‍යාපනය', ta: 'கல்வி' },
      'crime': { en: 'Crime', si: 'අපරාධ', ta: 'குற்றம்' },
      'environment': { en: 'Environment', si: 'පරිසරය', ta: 'சுற்றுச்சூழல்' },
      'culture': { en: 'Culture', si: 'සංස්කෘතිය', ta: 'கலாச்சாரம்' },
      'other': { en: 'Other', si: 'වෙනත්', ta: 'மற்ற' }
    };

    const topicLower = topic.toLowerCase();
    const mapped = topicMap[topicLower] || { en: topic, si: topic, ta: topic };
    
    if (language === 'si') return mapped.si;
    if (language === 'ta') return mapped.ta;
    return mapped.en;
  };

  const getImageUrl = () => {
    // Use article image if available and valid, otherwise fallback to category-based images
    if (imageUrl && imageUrl.startsWith('http')) {
      try {
        // Validate URL
        new URL(imageUrl);
        return imageUrl;
      } catch {
        // Invalid URL, use fallback
      }
    }
    const lowerHeadline = headline.toLowerCase();
    if (lowerHeadline.includes('power') || lowerHeadline.includes('electricity') || lowerHeadline.includes('outage')) {
      return 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800&q=80';
    } else if (lowerHeadline.includes('economic') || lowerHeadline.includes('policy') || lowerHeadline.includes('government')) {
      return 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80';
    } else if (lowerHeadline.includes('dengue') || lowerHeadline.includes('health') || lowerHeadline.includes('outbreak')) {
      return 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&q=80';
    } else if (lowerHeadline.includes('sports') || lowerHeadline.includes('match')) {
      return 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80';
    } else if (lowerHeadline.includes('technology') || lowerHeadline.includes('tech')) {
      return 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80';
    }
    return 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80';
  };

  if (variant === 'featured') {
    return (
      <Link href={href} className="block group mb-6">
        <article className="flex flex-col md:flex-row gap-6">
          {/* Image - Left Side for Featured (Desktop) / Top (Mobile) */}
          <div className="relative w-full md:w-2/3 aspect-video md:aspect-[16/9] rounded-2xl overflow-hidden mb-1 md:mb-0 order-first">
            <Image 
              src={getImageUrl()} 
              alt={headline}
              fill
              className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
            />
          </div>
          
          <div className="flex flex-col gap-2 w-full md:w-1/3 py-1">
             {/* Topic Tags */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {topicTags.map((topic, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#E8F0FE] text-[#1A73E8]"
                >
                  {getTopicLabel(topic)}
                </span>
              ))}
            </div>

            {/* Headline */}
            <h2 className="text-xl md:text-2xl font-normal text-[#1F1F1F] leading-tight group-hover:text-[#1A73E8] transition-colors duration-200 mb-1 flex items-center gap-2">
              <span className="group-hover:underline decoration-1 underline-offset-2">{headline}</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[#1A73E8]">➝</span>
            </h2>

             {/* Time */}
             <div className="text-xs text-[#5F6368] mt-auto">
               {formatTimeAgo(updatedAt)}
             </div>
             
             {/* Related Coverage Link (Mock) */}
             <div className="hidden md:flex mt-4 items-center text-sm font-medium text-[#1A73E8] hover:underline cursor-pointer">
                <span className="mr-1">Full Coverage</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
             </div>
          </div>
        </article>
      </Link>
    );
  }

  // Compact variant for "Your topics" and Sidebars
  if (variant === 'compact') {
     return (
       <Link href={href} className="block group">
         <article className="relative flex gap-3 cursor-pointer transition-colors">
            <div className="flex-1 min-w-0 flex flex-col">
               {/* Topic Tags */}
               {topicTags.length > 0 && (
                 <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                    {topicTags.slice(0, 1).map((topic, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#E8F0FE] text-[#1A73E8]"
                      >
                        {getTopicLabel(topic)}
                      </span>
                    ))}
                 </div>
               )}
               <h3 className="text-sm font-medium text-[#202124] leading-snug line-clamp-2 group-hover:text-[#1A73E8] transition-colors duration-200 flex items-start gap-1.5 mb-1">
                  <span className="flex-1 group-hover:underline decoration-1 underline-offset-2">{headline}</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[#1A73E8] text-xs flex-shrink-0 mt-0.5">➝</span>
               </h3>
               <div className="text-[11px] text-[#5F6368]">
                  {formatTimeAgo(updatedAt)}
               </div>
            </div>
            
            <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden relative bg-[#F1F3F4]">
               <Image 
                  src={getImageUrl()} 
                  alt={headline}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    // Fallback to default image on error
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80';
                  }}
               />
            </div>
         </article>
       </Link>
     );
  }

  // Default List Variant (Top Stories list below featured)
  return (
    <Link href={href} className="block group">
      <article className="relative py-4 flex gap-4 cursor-pointer hover:bg-[#F8F9FA] -mx-4 px-4 transition-colors rounded-2xl">
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            {/* Topic Tags */}
            <div className="mb-1.5 flex items-center gap-2 flex-wrap">
              {topicTags.map((topic, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#E8F0FE] text-[#1A73E8]"
                >
                  {getTopicLabel(topic)}
                </span>
              ))}
            </div>

            {/* Headline */}
            <h2 className="text-base font-medium text-[#202124] mb-1 leading-snug group-hover:text-[#1A73E8] transition-colors duration-200 flex items-center gap-2">
              <span className="group-hover:underline decoration-1 underline-offset-2">{headline}</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[#1A73E8]">➝</span>
            </h2>
          </div>

          {/* Meta Information - Time */}
          <div className="flex items-center gap-2 text-xs text-[#5F6368] mt-1">
            <span>{formatTimeAgo(updatedAt)}</span>
          </div>
        </div>

        {/* Image - Right side */}
        <div className="w-24 h-24 flex-shrink-0 rounded-2xl overflow-hidden relative bg-[#F1F3F4]">
          <Image 
            src={getImageUrl()} 
            alt={headline}
            fill
            className="object-cover group-hover:brightness-[1.02] transition-all duration-200"
            onError={(e) => {
              // Fallback to default image on error
              const target = e.target as HTMLImageElement;
              target.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80';
            }}
          />
        </div>
      </article>
    </Link>
  );
};

export default IncidentCard;