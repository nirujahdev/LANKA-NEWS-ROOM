import React from 'react';
import { Clock, Shield } from 'lucide-react';
import IncidentCard from './IncidentCard';

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
    <aside className="hidden lg:block w-80 space-y-6">
      {/* Latest Updates Section */}
      {latestUpdates.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-[#64748B]" />
            <h2 className="text-lg font-bold text-[#0F172A]">
              {getLabel('Latest Updates', 'මෑත යාවත්කාලීන කිරීම්', 'சமீபத்திய புதுப்பிப்புகள்')}
            </h2>
          </div>
          <div className="space-y-4">
            {latestUpdates.slice(0, 3).map((update) => (
              <div
                key={update.id}
                className="bg-[#F1F5F9] border border-[#E5E7EB] rounded-lg p-4 hover:bg-[#E2E8F0] transition-colors cursor-pointer"
              >
                <h3 className="text-sm font-bold text-[#0F172A] mb-2 line-clamp-2">
                  {update.headline}
                </h3>
                <p className="text-xs text-[#64748B] line-clamp-2 mb-2">
                  {update.summary}
                </p>
                <span className="text-xs text-[#64748B]">
                  {update.sourceCount} {update.sourceCount === 1 ? 'source' : 'sources'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trusted Sources Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-[#64748B]" />
          <h2 className="text-lg font-bold text-[#0F172A]">
            {getLabel('From Trusted Sources', 'විශ්වාසදායක මූලාශ්‍රවලින්', 'நம்பகமான ஆதாரங்களிலிருந்து')}
          </h2>
        </div>
        <div className="bg-[#F1F5F9] border border-[#E5E7EB] rounded-lg p-4">
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

