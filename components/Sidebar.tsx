import React from 'react';
import { Clock, Shield } from 'lucide-react';
import Link from 'next/link';

interface SidebarProps {
  latestUpdates?: Array<{
    id: string;
    headline: string;
    summary: string;
    sources: Array<{ id: string; name: string; url: string }>;
    updatedAt: Date;
    sourceCount: number;
  }>;
  language?: 'en' | 'si' | 'ta';
}

const Sidebar: React.FC<SidebarProps> = ({ latestUpdates = [], language = 'en' }) => {
  const getLabel = (en: string, si?: string, ta?: string) => {
    if (language === 'si' && si) return si;
    if (language === 'ta' && ta) return ta;
    return en;
  };

  return (
    <aside className="hidden lg:block w-80 flex-shrink-0 space-y-8">
      {/* Latest Updates Section */}
      {latestUpdates.length > 0 && (
        <div>
          <div className="flex items-center gap-2.5 mb-5">
            <Clock className="w-4 h-4 text-[#64748B] flex-shrink-0" />
            <h2 className="text-lg font-bold text-[#1E293B] tracking-tight">
              {getLabel('Latest Updates', 'මෑත යාවත්කාලීන කිරීම්', 'சமீபத்திய புதுப்பிப்புகள்')}
            </h2>
          </div>
          <div className="space-y-3">
            {latestUpdates.slice(0, 3).map((update) => (
              <Link
                key={update.id}
                href={`/incident/${update.id}`}
                className="block bg-white border border-[#E2E8F0] rounded-lg p-4 
                         hover:border-[#CBD5E1] hover:shadow-sm transition-all duration-200 cursor-pointer group"
              >
                <h3 className="text-sm font-semibold text-[#1E293B] mb-2 line-clamp-2 leading-snug
                              transition-colors duration-200">
                  {update.headline}
                </h3>
                <p className="text-xs text-[#64748B] line-clamp-2 mb-3 leading-relaxed">
                  {update.summary}
                </p>
                <span className="text-xs text-[#64748B] font-medium">
                  {update.sourceCount} {update.sourceCount === 1 ? 'source' : 'sources'}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Trusted Sources Section */}
      <div>
        <div className="flex items-center gap-2.5 mb-5">
          <Shield className="w-4 h-4 text-[#64748B] flex-shrink-0" />
          <h2 className="text-lg font-bold text-[#1E293B] tracking-tight">
            {getLabel('From Trusted Sources', 'විශ්වාසදායක මූලාශ්‍රවලින්', 'நம்பகமான ஆதாரங்களிலிருந்து')}
          </h2>
        </div>
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-5">
          <p className="text-sm text-[#64748B] leading-relaxed">
            {getLabel(
              'All summaries are generated from verified news sources and cross-checked for accuracy.',
              'සියලුම සාරාංශ සත්‍යාපනය කරන ලද ප්‍රවෘත්ති මූලාශ්‍රවලින් ජනනය කරනු ලබන අතර නිරවද්‍යතාව සඳහා හරස් පරීක්ෂා කරනු ලැබේ.',
              'அனைத்து சுருக்கங்களும் சரிபார்க்கப்பட்ட செய்தி ஆதாரங்களிலிருந்து உருவாக்கப்பட்டு, துல்லியத்திற்காக குறுக்கு சரிபார்க்கப்படுகின்றன.'
            )}
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

