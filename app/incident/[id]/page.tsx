'use client';

import React, { useState } from 'react';
import Navigation from '@/components/Navigation';
import IncidentDetail from '@/components/IncidentDetail';

// Mock data - replace with actual data fetching based on ID
const mockIncident = {
  id: '1',
  headline: 'Major Power Outage Affects Colombo Suburbs',
  summary: 'A widespread power outage affected several areas in Colombo suburbs yesterday evening, causing disruptions to businesses and households. The Ceylon Electricity Board reported that the issue was caused by a technical fault at a main substation. Power was restored within three hours.',
  summarySi: 'කොළඹ උපනගරවල කිහිපයක ප්‍රදේශවලට ඊයේ සවස විශාල විදුලි බිඳවැටීමක් බලපෑවේය. ව්‍යාපාර සහ ගෘහවලට බාධා ඇති විය. ශ්‍රී ලංකා විදුලිබල මණ්ඩලය වාර්තා කළේ ප්‍රධාන උපස්ථානයක තාක්ෂණික දෝෂයක් නිසා ගැටළුව ඇති වූ බවය. විදුලිය පැය තුනක් ඇතුළත නැවත ස්ථාපිත කරන ලදී.',
  summaryTa: 'நேற்று மாலை கொழும்பு புறநகர்ப் பகுதிகளில் பல பகுதிகளை பரவலான மின்சார இடைநிறுத்தம் பாதித்தது, வணிகங்கள் மற்றும் வீடுகளுக்கு இடையூறுகளை ஏற்படுத்தியது. இலங்கை மின்சார வாரியம், முக்கிய துணை நிலையத்தில் தொழில்நுட்ப கோளாறு காரணமாக சிக்கல் ஏற்பட்டதாக தெரிவித்தது. மின்சாரம் மூன்று மணி நேரத்திற்குள் மீட்டெடுக்கப்பட்டது.',
  sources: [
    { id: '1', name: 'Daily Mirror', url: 'https://www.dailymirror.lk/article/12345' },
    { id: '2', name: 'Ada Derana', url: 'https://www.adaderana.lk/news/67890' },
    { id: '3', name: 'BBC Sinhala', url: 'https://www.bbc.com/sinhala/articles/abc123' }
  ],
  updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  firstSeen: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
  sourceCount: 3
};

export default function IncidentDetailPage({ params }: { params: { id: string } }) {
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'si' | 'ta'>('en');

  return (
    <div className="min-h-screen bg-white">
      <Navigation 
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
      />
      
      <IncidentDetail
        {...mockIncident}
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
      />
    </div>
  );
}

