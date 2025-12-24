'use client';

import React from 'react';

interface Tab {
  id: string;
  label: string;
  labelSi?: string;
  labelTa?: string;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  language?: 'en' | 'si' | 'ta';
}

const TabNavigation: React.FC<TabNavigationProps> = ({
  tabs,
  activeTab,
  onTabChange,
  language = 'en'
}) => {
  const getLabel = (tab: Tab) => {
    if (language === 'si' && tab.labelSi) return tab.labelSi;
    if (language === 'ta' && tab.labelTa) return tab.labelTa;
    return tab.label;
  };

  return (
    <div className="bg-white border-b border-[#E5E7EB] sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex overflow-x-auto scrollbar-hide -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
                className={`
                px-4 py-3 text-sm font-medium whitespace-nowrap
                border-b-2 transition-colors
                ${
                  activeTab === tab.id
                    ? 'border-[#2563EB] text-[#2563EB]'
                    : 'border-transparent text-[#64748B] hover:text-[#0F172A] hover:border-[#E5E7EB]'
                }
              `}
            >
              {getLabel(tab)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TabNavigation;

