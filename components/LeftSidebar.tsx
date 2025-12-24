import React from 'react';
import Link from 'next/link';
import { 
  Home, 
  Compass, 
  Star, 
  Newspaper, 
  Globe, 
  MapPin, 
  Briefcase, 
  Monitor, 
  Film, 
  Trophy, 
  FlaskConical, 
  Heart 
} from 'lucide-react';

interface LeftSidebarProps {
  currentLanguage: 'en' | 'si' | 'ta';
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ 
  currentLanguage = 'en',
  activeTab,
  onTabChange
}) => {
  const getLabel = (en: string, si: string, ta: string) => {
    if (currentLanguage === 'si') return si;
    if (currentLanguage === 'ta') return ta;
    return en;
  };

  const navItems = [
    { id: 'home', icon: Home, label: getLabel('Home', 'මුල් පිටුව', 'முகப்பு') },
    { id: 'for-you', icon: Compass, label: getLabel('For you', 'ඔබ වෙනුවෙන්', 'உங்களுக்காக') },
    { id: 'following', icon: Star, label: getLabel('Following', 'අනුගමනය කරන', 'பின்வருபவை') },
  ];

  const topics = [
    { id: 'sri-lanka', icon: MapPin, label: getLabel('Sri Lanka', 'ශ්‍රී ලංකාව', 'இலங்கை') },
    { id: 'world', icon: Globe, label: getLabel('World', 'ලෝකය', 'உலகம்') },
    { id: 'local', icon: MapPin, label: getLabel('Local', 'ප්‍රාදේශීය', 'உள்ளூர்') },
    { id: 'business', icon: Briefcase, label: getLabel('Business', 'ව්‍යාපාර', 'வணிகம்') },
    { id: 'technology', icon: Monitor, label: getLabel('Technology', 'තාක්ෂණය', 'தொழில்நுட்பம்') },
    { id: 'entertainment', icon: Film, label: getLabel('Entertainment', 'විනෝදාස්වාදය', 'பொழுதுபோக்கு') },
    { id: 'sports', icon: Trophy, label: getLabel('Sports', 'ක්‍රීඩා', 'விளையாட்டு') },
    { id: 'science', icon: FlaskConical, label: getLabel('Science', 'විද්‍යාව', 'அறிவியல்') },
    { id: 'health', icon: Heart, label: getLabel('Health', 'සෞඛ්‍ය', 'சுகாதாரம்') },
  ];

  const NavItem = ({ item, isTopic = false }: { item: any, isTopic?: boolean }) => {
    const isActive = activeTab === item.id;
    const Icon = item.icon;
    
    return (
      <button
        onClick={() => onTabChange(item.id)}
        className={`
          w-full flex items-center gap-4 px-6 py-0.5 rounded-r-full mb-1 text-sm font-medium transition-colors duration-150
          ${isActive 
            ? 'bg-[#E8F0FE] text-[#1A73E8]' 
            : 'text-[#202124] hover:bg-[#F5F5F5]'
          }
          ${isTopic ? 'h-10' : 'h-11'}
        `}
      >
        <Icon className={`w-5 h-5 ${isActive ? 'text-[#1A73E8]' : 'text-[#5F6368]'}`} />
        <span>{item.label}</span>
      </button>
    );
  };

  return (
    <aside className="hidden lg:block w-64 py-4 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto scrollbar-hide">
      <div className="mb-4">
        {navItems.map((item) => (
          <NavItem key={item.id} item={item} />
        ))}
      </div>
      
      <div className="border-t border-[#E8EAED] my-3 mx-4"></div>
      
      <div className="mb-4">
        {topics.map((item) => (
          <NavItem key={item.id} item={item} isTopic />
        ))}
      </div>
      
      <div className="border-t border-[#E8EAED] my-3 mx-4"></div>
      
      <div className="px-6 py-2">
         <div className="text-xs text-[#5F6368] leading-5">
           <a href="#" className="hover:underline mr-2">About</a>
           <a href="#" className="hover:underline mr-2">Privacy</a>
           <a href="#" className="hover:underline mr-2">Terms</a>
           <br />
           <span className="mt-2 block">© 2024 Lanka News</span>
         </div>
      </div>
    </aside>
  );
};

export default LeftSidebar;

