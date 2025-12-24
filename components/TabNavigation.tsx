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

  const formatDate = () => {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`;
  };

  return (
    <div className="bg-white border-b border-[#E8EAED] sticky top-14 md:top-16 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex overflow-x-auto scrollbar-hide -mb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative px-4 py-3 text-sm font-normal whitespace-nowrap
                border-b-2 transition-colors duration-150
                ${
                  activeTab === tab.id
                    ? 'border-[#1A73E8] text-[#1A73E8]'
                    : 'border-transparent text-[#5F6368] hover:text-[#202124]'
                }
              `}
            >
              {getLabel(tab)}
            </button>
          ))}
        </div>
        {/* Date Display - Google News Style */}
        <div className="py-2 text-sm text-[#5F6368]">
          {formatDate()}
        </div>
      </div>
    </div>
  );
};

export default TabNavigation;

